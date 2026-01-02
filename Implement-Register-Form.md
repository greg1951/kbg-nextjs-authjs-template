1. [Overview](#overview)
2. [Installations](#installations)
   1. [shdcn](#shdcn)
   2. [Drizzle and PostgreSql](#drizzle-and-postgresql)
   3. [Zod](#zod)
   4. [Cryptography](#cryptography)
3. [Register Form Implementation](#register-form-implementation)
   1. [Password Schema Validation](#password-schema-validation)
      1. [passwordSchema.ts](#passwordschemats)
      2. [passwordMatchSchema.ts](#passwordmatchschemats)
      3. [Update page.tsx File](#update-pagetsx-file)
   2. [Server Action Form Data](#server-action-form-data)
      1. [The registerUser Function](#the-registeruser-function)
      2. [The handleSubmit Function](#the-handlesubmit-function)
4. [Saving User Data](#saving-user-data)
   1. [Install and Configure](#install-and-configure)
   2. [Create Users Table](#create-users-table)
   3. [Create Schema in Neon PostgreSql](#create-schema-in-neon-postgresql)
   4. [Confirm Table in Neon](#confirm-table-in-neon)
   5. [Adding Registered User with Hashed Password](#adding-registered-user-with-hashed-password)


---
# Overview
This markdown file will document setting up a form to register new users and add them to a users table that resides in a PostgreSql database on the Neon platform.

# Installations
There are a ton of libraries used in the project. Having the installations defined in one place is good.

## shdcn
The shadcn UI component library was used extensively throughout. The installs below were done. 

```bash
npx shadcn@latest init
npx shadcn@latest add form
npx shadcn@latest add card
npx shadcn@latest add card
npx shadcn@latest add input
```

**Note**: The shadcn installations will create the components in the `@/components/ui` project directory. This means you own them and can modify them as needed (it was not required).

## Drizzle and PostgreSql
Drizzle was used to create database schema and queries. The following installations were done for drizzle and PostgreSql.

```bash
npm i drizzle-orm @neondatabase/serverless
npm i -D drizzle-kit
npm install drizzle-kit@latest
npm i pg
npm i @types/pg
```

## Zod
The Zod library provides useful way to create javascript and typescript schema. It also has a very useful collection of validations available for various types. Zod is running Javascript under the covers so Zod validations will require the file to be rendered (run) client side.

```bash
npm i zod
```

## Cryptography
For hashing of the password the `bcryptjs` library was used.

```bash
npm i bcryptjs
npm i --save-dev @types/bcryptjs
```
# Register Form Implementation
The form that resides in `@/app/register/page.tsx` is built from the shadcn Form component but Form relies on other components to implement it. (The form below is a smaller portion of the form that will be implemented.)

```javascript
'use client';
...
import { z } from 'zod';
const formSchema = z.object({
  email: z.email(),
  password: z.string().min(5),
  passwordConfirm: z.string(),
});

export default function Register() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: ""
    }
  });
  return (
    <main className="flex justify-center items-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Register for a new account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form { ...form }>
            <form onSubmit={ form.handleSubmit(handleSubmit) }>
              <FormField 
                control={ form.control } 
                name="email" 
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input { ...field } type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
```
**Notes:**

- Given the javascript validation performed by Zod, and the `useForm` React hook in use, a `use client` directive is needed at the top of the file.

- The `<main>` element references Tailwind CSS classes. 

  - **Note**: Be sure to install the **Tailwind CSS Intellisense** extension.

  - When the project was initially created and Tailwind CSS was selected, a `@/app/global.css` was created. 

  - The referenced classes will center the form in the vertical and horizontal center.

- The form is wrapped in a `Card` component, consisting of `CardHeader` and `CardContent` child components.

- A spread operator is used on the `<Form>` to reference a form type define earlier in the file that consists of the following.

- Zod is used to define and validate the `formSchema` typescript schema. 

- A `form` constant is defined for the useForm hook but which makes use of generics to specify the typescript schema to be used.

- A spread operator (`...form`) indicates the object that `<Form>` implements inside `<CardContent>`.

- The control attribute defined in `<FormField control={ form.control } name={email}` is optional but it allow the `name` attribute that follows to identify type properties.

## Password Schema Validation
The previous form example performed simple validations on string input. The requirement however is to validate the entered passwords are both the same. 

To do this, two new validations will be created in `@/validation/passwordSchema.tx` and `@/validation/passwordMatchSchema`. The latter builds on the former so let's show it first.

### passwordSchema.ts

```javascript
import {z} from 'zod';

export const passwordSchema = z
  .string()
  .min(5, "Password should constain at least 5 characters");
```
The `page.tsx` was updated to reference this validation.

### passwordMatchSchema.ts

The previous validation was imported and then a custom validation object is exported for the passwordConfirm validation. 

```javascript
import { z } from 'zod';
import { passwordSchema } from './passwordSchema';

export const passwordMatchSchema = z
  .object( {
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .superRefine((data,  ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passwordConfirm"],
        message: "Passwords do not match"
      })
    }
  })
  ```
**Notes:**

- The exported object references password and passwordConfirm, which do not need to be defined in the `formSchema` variable in the `page.tsx` file.

- The exported Zod validation object will utilize a Zod validation library (e.g. method `superRefine()`) that provides a means to do complex, cross-field validation. 
  
- The `superRefine` method takes two arguments, one for the data and the second for the validation context.

### Update page.tsx File
The formSchema variable must be modified to use the above schema validations. Since the `passwordMatchSchema.ts` incorporates the `passwordSchema.ts` validation, only the former needs to be mentioned in the updated formSchema statement.

```javascript
import { passwordMatchSchema } from "@/validation/passwordMatchSchema";
const formSchema = z.object({
  email: z.email()
}).and(passwordMatchSchema);
```

## Server Action Form Data
As the form and associated validations are operational, what remains now is to post the form as a part of a server action. 

### The registerUser Function

There are numerous ways to organize server actions but one way used here is to create the `actions.ts` file in the same directory where the form exists, i.e. `@/app/register/page.tsx`.

It is **important to review the notes** after the code below, as there were some challenges implementing the function.

```javascript
'use server';

import db from "@/db/drizzle";
import { users } from "@/db/usersSchema";
import { passwordMatchSchema } from "@/validation/passwordMatchSchema";
import z from "zod";
import { hashUserPassword, splitHashedPassword } from "@/lib/hash";
import { isUserRegistered } from "@/db/userQueries";

export const registerUser = async({
  email, 
  password, 
  passwordConfirm}: {
    email: string,
    password: string, 
    passwordConfirm: string
    }
  ) => {
    try {
      const newUserSchema = z.object({
        email: z.email()
      }).and(passwordMatchSchema);
      
      const newUserValidation = newUserSchema.safeParse({email, password, passwordConfirm});
      if (!newUserValidation.success) {
        return {
          error: true,
          message: newUserValidation.error.issues[0]?.message ?? "An error occurred",
        };
      };

      const isRegistered = await isUserRegistered(email);
      if (isRegistered) {
        return {
          error: true,
          message: `An account is already registered for this email.`
        }
      }

      const result = await insertRegisteredUser(email, password);

    } catch (e: unknown) {
      if (e instanceof Error && e.code === "23505") {
        return {
          error: true,
          message: "An accound is already registered with that emaill"
        };
      }
      return {
        error: true,
        message: "An unknown error occured."
      }
    }    
  };
```

**Notes:**

- The `registerUser` function expects three arguments. As shown below, the server function will *eventually* implement logic to insert the registered user in a database.

- The server function runs only the server-side and is asynchronous.

- There are three input parameters they are defined with types to ensure type safety.

- In the callback, Zod `safeParse` method is used rather than `parse`. 
  - The latter will throw an error if invalid while safeParse will return a boolean if invalid. 
  - Using `parse` would require a try-catch block which is more code to deal with.

- Normally a `try-catch` block could wrap the insert functionality that would catch the *23505* constraint error when a duplicate email is detected, but that functionality did not work using drizzle. Instead, a query is run to check for the email in the users table.
  - Created `@/db/userQueries.ts` file to run select on the email address.
  - Added logic to run the function (`isUserRegistered(email)`) and return an error on the duplicate email as a form validation error. 

### The handleSubmit Function

Shown below is the handleSubmit function run on the form submission in the `page.tsx` file. 

It is important to review the notes after the code snippet for handleSubmit shown below as there were some challenges implementing it.

```tsx
...
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const response = await registerUser({
      email: data.email,
      password: data.password,
      passwordConfirm: data.passwordConfirm
    });

    if (response?.error) {
      setSubmitted(false);
      form.setError("email", {
        message: response?.message,
      });
    }
    else {
      setSubmitted(true);
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen">
      { submitted ? (...)})
...
```
**Notes**:

- It was necessary to implement a state (submitted) variable as the `form.formState.isSubmitSuccessful` did not work. Rather than use the formState tertiary operation in the return statement, the `submitted` state variable was used instead.

- The `submitted` state variable default is false, such that if the email is already registered then [an Email error can be reported in the UI as shown here.](./docs/account-already-exists-message.png)

- If the form was submitted then a `Card` component is used to provide a button to take them to the login page. Otherwise, if not submitted then the `registration Card` is rendered. 

# Saving User Data

The `registerUser` server function will be updated to insert the registered user in a **PostgreSql** (v17) database table hosted in **[Neon](https://neon.tech)**. 

## Install and Configure

1. Sign up for an account on Neon. 
2. Set the development branch and create a database in that branch.
3. Save the database connection info (creds hidden below).

```bash
psql 'postgresql://neondb_owner:**********@ep-red-brook-ad6z3qmu-pooler.c-2.us-east-1.aws.neon.tech/next-credentials-db?sslmode=require&channel_binding=require'
```
4. Go to the [Drizzle ORM site](https://orm.drizzle.team/docs/connect-neon) and locate and review the Neon PostgreSql installation commands. ([All of the requisite commands can be found here](./Implementation-Notes.md#drizzle-and-postgresql))

5. Create `@/.env.local` file (development mode) and paste in the database URL parameter (password obfuscated) as an environment variable.

```jsx
NEON_DATABASE_URL="postgresql://neondb_owner:*************@ep-red-brook-ad6z3qmu-pooler.c-2.us-east-1.aws.neon.tech/next-credentials-db?sslmode=require&channel_binding=require"
```
6. Create new folder and file (`@/db/drizzle.ts`) file to export the drizzle database connection to neon. 

```jsx
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.NEON_DATABASE_URL!);
const db = drizzle(sql);

export default db;
```
7. Test the connection by adding this to the end of the registerUser function.

```jsx
  ...
    const result = db.execute('select 1');
    console.log('action->registerUser->result: ', result);
```
8. Build and run the app again and verify the results in the Terminal.

## Create Users Table
The `@/db/usersSchema.ts` file contains the PostgreSql schema for the users table to be used in the app. After writing the statement to create the table then use the [drizzle push function](https://orm.drizzle.team/docs/tutorials/drizzle-with-neon) to create the schema on the remote database.

```jsx
import { serial, pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  twoFactorSecret: text("2fa_secret"),
  twoFactorActivated: boolean("2fa_activated").default(false)
});
```
The drizzle push command is a useful feature when needing to test new schema creation without worrying about migration. 

1. Create `@/drizzle-dev.drizzle.config.ts` file which defines the dialect and the location of the schema creation file.
   
2. The example below is an example of a simple config. More elaboration is required for [production pushes](https://orm.drizzle.team/docs/kit-overview#prototyping-with-db-push).

```jsx
import "dotenv/config";
import * as dotenv from "dotenv";
import { defineConfig } from 'drizzle-kit';

dotenv.config({
  path: ".env.local",
});

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL!
  }
});
```

**Notes:**

- The `import "dotenv/config";`  statement loads environment variables into Node.js `process.env` at runtime.

- The `import * as dotenv from "dotenv"` allows the variables to be loaded from the `dotenv.config()` operation. There the path reference to **.env.local** is loaded into process.env.

- Call `dotenv.config()` as the first line in your entry file (before any other code that uses environment variables) to ensure they are loaded.

## Create Schema in Neon PostgreSql 
1. After the `drizzle-config.ts` file is saved then run the following command to push the change to the remote Neon database server. **Note**: `push` is typically used for *prototyping* schema.

```bash
npx drizzle-kit push
```

2. Confirm the schema changes were performed.

```bash
PS C:\Users\ghughlett\Projects\udemy\next-auth-course\my-app> npx drizzle-kit push 
No config path provided, using default 'drizzle.config.ts'
Reading config file 'C:\Users\ghughlett\Projects\udemy\next-auth-course\my-app\drizzle.config.ts'
[dotenv@17.2.3] injecting env (1) from .env.local -- tip: 🔑 add access controls to secrets: https://dotenvx.com/ops
Using '@neondatabase/serverless' driver for database querying
 Warning  '@neondatabase/serverless' can only connect to remote Neon/Vercel Postgres/Supabase instances through a websocket
[✓] Pulling schema from database...
[✓] Changes applied
```

## Confirm Table in Neon
Verify in Neon the `users` table has been created.

![](./docs/users-table-in-neon.png)

## Adding Registered User with Hashed Password
The password will be encrypted in the users table entry inserted for new users. 

1. Install the encryption library: `npm i bcryptjs`
2. Install the typescript types for bcryptjs: `npm i --save-dev @types/bcryptjs`
3. Create `@/lib/hash.ts` file to contain various functions for hashing password.

```tsx
import crypto from 'node:crypto';

export function hashUserPassword(password:string) {
  const salt = crypto.randomBytes(16).toString('hex');

  const hashedPassword = crypto.scryptSync(password, salt, 64);
  return hashedPassword.toString('hex') + ':' + salt;
}
export function verifyPassword(storedPassword:string, suppliedPassword:string) {
  const [hashedPassword, salt] = storedPassword.split(':');
  const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
  const suppliedPasswordBuf = crypto.scryptSync(suppliedPassword, salt, 64);
  return crypto.timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}
```
4. The `hashUserPassword` function will create a base64 encoded password string that includes the unique salt used to hash the password. 

5. The password and salt are separated by a colon (`:`). Both are needed when confirming the password of an already registered user.