1. [Overview](#overview)
2. [Step 1: Create Next.js Project](#step-1-create-nextjs-project)
3. [Step 2: Install Components](#step-2-install-components)
   1. [shdcn](#shdcn)
   2. [Drizzle and PostgreSql](#drizzle-and-postgresql)
   3. [Zod](#zod)
   4. [Cryptography](#cryptography)
4. [Step 3: Set Up PostgreSql Neon Database](#step-3-set-up-postgresql-neon-database)
   1. [Install and Configure](#install-and-configure)
   2. [Create Users Table](#create-users-table)
   3. [Create Schema in Neon PostgreSql](#create-schema-in-neon-postgresql)
   4. [Confirm Table in Neon](#confirm-table-in-neon)
   5. [Adding Registered User with Hashed Password](#adding-registered-user-with-hashed-password)
5. [Step 4: Register Account Implementation](#step-4-register-account-implementation)
   1. [App Router Overview](#app-router-overview)
   2. [Register Account Page](#register-account-page)
   3. [Register Account Form](#register-account-form)
   4. [Server Action Form Data](#server-action-form-data)

---
# Overview
This How-To markdown file will document setting up a form to register account new users form and then add the new user to a `users` table that resides in a PostgreSql database on the Neon platform. (See the [markdown index](../README-HowToGuides.md) for a list of all the How-To documents.)

Here are the development steps this How-To guide will follow.
1. Create a Next.js project.
2. Install many libraries in use by the project referenced here.
3. Create an account for a PostgreSql database on the Neon platform.
4. Create Register Account form.

# Step 1: Create Next.js Project
1. Run the `npx` command to create the project: `npx create-next-app@latest`. You will be prompted:
   1. To enter the app name. 
   2. whether you want to use a source "src" directory. Create a "src" directory!
   3. You will be prompted about Typescript and Tailwindcss: Both are strongly recommended.

- Good Tailwindcss resources:
  - Refer to the [Tailwind CSS](https://tailwindcss.com/) for installation and docs on the classes. 
  - Install the VS Code **Tailwind CSS Intellisense extension** which is amazing.
- Get comfortable with **Typescript** as it really does help to tighten up the code you write.

2. Run `npm install` and get some coffee.

# Step 2: Install Components
There's a long list of components. Be vigilant as changes are introduced that may not work the same depending on what's in the latest version. Consult the `@/package.json` for the versions in this GitHub branch.

## shdcn
The shadcn UI component library was used extensively throughout. The installs below were done. 

```bash
npx shadcn@latest init
npx shadcn@latest add form
npx shadcn@latest add card
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add input-otp
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
The Zod library provides useful way to create javascript and typescript schema. It also has a very useful collection of validations available for various types. 

```bash
npm i zod
```
## Cryptography
For password hashing the `bcryptjs` library was used. Run both commands below.

```bash
npm i bcryptjs
npm i --save-dev @types/bcryptjs
```
# Step 3: Set Up PostgreSql Neon Database

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

```tsx
NEON_DATABASE_URL="postgresql://neondb_owner:*************@ep-red-brook-ad6z3qmu-pooler.c-2.us-east-1.aws.neon.tech/next-credentials-db?sslmode=require&channel_binding=require"
```
6. Reference this (`@/features/auth/components/db/drizzle.ts`) file which exports the drizzle database (`db`) connection to the Neon platform. 

```tsx
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.NEON_DATABASE_URL!);
const db = drizzle(sql);

export default db;
```
7. Test the connection by adding this to the end of the `registerUser` function.

```tsx
  ...
    const result = db.execute('select 1');
    console.log('action->registerUser->result: ', result);
```
8. Build and run the app again and verify the results in the Terminal.

## Create Users Table
The `@/db/schema-users.ts` file contains the PostgreSql schema for the `users` table to store registered user credentials. After writing the statement to create the table then use the [drizzle push function](https://orm.drizzle.team/docs/tutorials/drizzle-with-neon) to create the schema on the remote database.

```tsx
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

1. Create `@/drizzle.config.ts` file which defines the dialect and the location of the schema creation file.
   
2. The example below is an example of a simple config. More elaboration is required for [production pushes](https://orm.drizzle.team/docs/kit-overview#prototyping-with-db-push).

```tsx
import "dotenv/config";
import * as dotenv from "dotenv";
import { defineConfig } from 'drizzle-kit';

dotenv.config({
  path: ".env.local",
});

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/features/auth/components/db/schema.ts",
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL!
  }
});

```

**Notes:**

- The `import "dotenv/config";`  statement loads environment variables into Node.js `process.env` at runtime.

- The `import * as dotenv from "dotenv"` allows the variables to be loaded from the `dotenv.config()` operation. There the path reference to **.env.local** is loaded into process.env when the app is started.

- Call `dotenv.config()` as the first line in your entry file (before any other code that uses environment variables) to ensure they are loaded.

- The `schema` location in `defineConfig` references the file in the auth feature folders. 
  - *If other domains need to create database tables then perhaps this file should be moved up to the `@/components/db` directory.*

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


# Step 4: Register Account Implementation

## App Router Overview
As the Next.js app router relies on how the application pages are structured, review the diagram below.
- In an application, there are pages you have access to (`(logged-in)`) and pages you do not (`(logged-out)`). 
  - In this application, pages are provided for user who are not logged in yet: to login, or to register for an account, or to reset your password.
  - Once you are logged in, then you have access to other pages where you can change your password or enable Two-Factor Authentication (2FA).
- This authentication app has many forms to accomplish the above. 
  - The client pages that are rendered for a function are contained in `page.tsx` files.
  - The client forms used by the above pages are implemented in form folders as `index.tsx` files.
  - The forms need access to server-side components and functions and they are contained in `actions.ts` files.
- Interspersed are `layout.tsx` file which provide a common layout but also serve to enforce page protection via session authentication. (More on this later!) 

  ![](./folder-file-structure.png)

## Register Account Page
The page that renders the account registration is built using the `shadcn` components installed earlier. The form however, is located in the `index.tsx` file, as mentioned in the oveview. 

**source file**: *`@/app/(auth)/(logged-out)/register/page.tsx`* 

```tsx
  'use client';

  import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter }
    from "@/components/ui/card";
  import Link from "next/link";
  import RegisterAccountForm from "./register-form";

  export default function Register() {
    return (
      <main className="flex justify-center items-center min-h-screen">
        <Card className="w-[350]">
          <CardHeader>
            <CardTitle>Register Account</CardTitle>
            <CardDescription>Register for a new account.</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterAccountForm />
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <div className="text-muted-foreground text-sm">
              Already have an account?{ " " }
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    );
  }
```
**Notes**: 

- *Here at the outset we are structuring the project so the client side components are lightweight, delegating server-side functionality to the `actions.ts` components.* 
- *Although the `RegisterAccountForm` is client-side and it is contained in the `index.tsx` file associated with the `actions.ts` file in the same form directory.*



## Register Account Form
In the **code snippet** below only the more interesting aspects of the form are covered. Reference the notes after the code block.

**source file**: *`@/app/(auth)/(logged-out)/register/register-form/index.tsx`* <<< reference the full file for the entire form

```tsx
  ...
  /* NOTE 1 */
  const formSchema = z
    .object({
      email: z.email()
    })
    .and(passwordMatchSchema);

  export default function RegisterAccountForm() {
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        email: "",
        password: "",
        passwordConfirm: ""
      },
    });
    /* NOTE 2 */
    const handleSubmit = async (data: z.infer<typeof formSchema>) => {
      const response = await registerUser({
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm
      });

      if (response?.error) {
        form.setError("email", {
          message: response?.message,
        });
      }
      else {
        router.push(`/login${ form.getValues("email") ? `?email=${ encodeURIComponent(form.getValues("email")) }` : "" }`)
      }
    }
  ...
```
**Notes**:

  - **Note 1**: *Zod is used to validate the content in the form.*
  - **Note 2**: *The `registerUser` function in the associated server actions component will add the register the user email and password in the `users` table.*

## Server Action Form Data
As the form and associated validations are operational, what remains now is to post the form as a part of a server action. 

**source file**: *`@/app/(auth)/(logged-out)/register/register-form/actions.ts`*

```tsx
  'use server';

import { passwordMatchSchema } from "@/features/auth/components/validation/passwordMatchSchema";
import z from "zod";
import { insertRegisteredUser, isUserRegistered } from "@/features/auth/components/db/queries-users";

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

      const insertResult = await insertRegisteredUser(email, password);
      if (!insertResult) {
        return {
          error: true,
          message: "Registered user insert failed"
        }
      }
      
      } catch (e: unknown) {
        if (e instanceof Error && e.code === "23505") {
          return {
            error: true,
            message: "An accound is already registered with that email"
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
  - Created `@/db/queries-users.ts` file to run select on the email address.
  - Added logic to run the function (`isUserRegistered(email)`) and return an error on the duplicate email as a form validation error. 
