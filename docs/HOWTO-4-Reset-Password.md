1. [Overview](#overview)
2. [Step 1: Create App Route Directories](#step-1-create-app-route-directories)
3. [Step 2: Pass Login Email](#step-2-pass-login-email)
4. [Step 3: Define page.tsx and index.tsx Content](#step-3-define-pagetsx-and-indextsx-content)
   1. [The ResetPassword Component](#the-resetpassword-component)
   2. [The ResetPasswordForm Component](#the-resetpasswordform-component)
5. [Step 4: Create the Password Reset Tokens Table](#step-4-create-the-password-reset-tokens-table)
6. [Step 5: Create Insert into passwordResetTokens Table](#step-5-create-insert-into-passwordresettokens-table)
7. [Step 6: Creat Server Actions Component](#step-6-creat-server-actions-component)
8. [Step 7: Implement the Server Action Component](#step-7-implement-the-server-action-component)
9. [Step 8: Test the Password Reset Request](#step-8-test-the-password-reset-request)

# Overview
Create a form to send a password reset URL to the user and provide the form to reset it. (The functionality here does NOT include sending the email.) This functionality will be implemented inside the `@/app/(logged-out)/password-reset` route.

![](./docs/reset-password-form.png)

The steps to be followed to implement the above form, send email and create the reset password are summarized below. More detail will follow for each.

1. Create app route directories.
2. Pass login form email address to reset form email address.
3. Define content for `page.tsx` and `index.tsx` files. 
4. Create the password_reset_tokens table.
5. Create logic to insert into `passwordResetTokens` table.
6. Create server actions component (`actions.ts`) to validate Password Reset.
7. Implement the server action component.
8. Test the password reset form.

# Step 1: Create App Route Directories

![](./docs/reset-password-folders.png)

1. Create folder `@/app/(logged-out)/password-reset` 
2. In the above folder add minimal page.tsx file with function name `ResetPassword`.
3. Inside the above folder, create folder `@/app/(logged-out)/password-reset/reset-password-form`
4. In this folder add minimal `index.tsx` file with function name `ResetPasswordForm`.
5. In the same folder add a server side file (`'use server;` directive) named `actions.ts`.
   
# Step 2: Pass Login Email
If the user is on the login page and tried to login but failed, they but they can click on the reset password link on the form. The email address they entered should be carried over to the password reset form.

1. Open `@/app/(logged-out)/login/page.tsx` file.
2. Scroll down to the form and update the `<Link>` for the reset password to the following fairly tricky string literal.

    ```tsx
    ...
      <div className="text-muted-foreground text-sm">
        Forgot password?{ "   " }
        <Link 
          href={`/password-reset${
            email ? `?email=${encodeURIComponent(email)}` 
                  : ""
          }`} 
          className="underline">
          Reset my password
        </Link>
      </div>
    ...
    ```

**Note**: After making the aforementioned changes entering a value in the email form field was not captured, the email variable was an empty string. The issue is there was no content being rendered by simply entering an email. The solution then is to use the React state hook to capture the email.

3. Enter the following `useState` hook At the top of the `Login` component.

    ```tsx
      export default function Login() {
        const [emailValue, setEmailValue] = useState("");
    ```

5. Add an event handler function to capture the email form input value and to set the state variable.

    ```tsx
      function handleEmailChange(e) {
        setEmailValue(e.target.value);
      }
    ```

6. Scroll down and modify the `<Input>` for the email form field to that shown below.

    ```tsx
    ...
      <FormControl>
        <Input { ...field } type="email" onChange={ handleEmailChange } value={ emailValue } />
      </FormControl>
    ...
    ```
# Step 3: Define page.tsx and index.tsx Content
These two files represent the client components to render the `ResetPassword` and `ResetPasswordForm` components.

## The ResetPassword Component
As shown below, when rendered this page will include the reset password form. 

**Note**: The form could have been included in this page (inside the `<CardContent>` element) but to keep things simpler, the form is instead contained in the `index.tsx` file.

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ResetPasswordForm from "./reset-password-form";

export default function ResetPassword() {
  return (
    <main className="flex justify-center items-center min-h-screen">
      <Card className="w-[350]">
        <CardHeader>
          <CardTitle className="text-center font-bold size-1.2">Reset Password</CardTitle>
          <CardDescription>Enter your email address to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </main>
  )
}
```
## The ResetPasswordForm Component
The `index.tsx` file implements a client form component, the associated (Zod) validation and the form submission, implemented in the `actions.ts` file.

```tsx
'use client';

import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const formSchema = z.object({
  email: z.email()
});

export default function ResetPasswordForm() {
  /* Note 1 */
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    /* Note 1 */
    defaultValues: {
      email: decodeURIComponent(searchParams.get("email") ?? ""),
    }
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    /* Note 2 */
  };

  return (
    <Form { ...form }>
      <form onSubmit={ form.handleSubmit(handleSubmit) }>
        <fieldset disabled={ form.formState.isSubmitting } className="flex flex-col gap-2">
          <FormField
            control={ form.control }
            name="email"
            render={ ({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input { ...field } type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            ) }
          />
          { !!form.formState.errors.root?.message &&
            <FormMessage>
              { form.formState.errors.root.message }
            </FormMessage>
          }
          <Button type="submit">Submit Password Reset</Button>
        </fieldset>
        <CardFooter className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">
            Remember your password? { " " } <Link href="/login" className="underline">Login</Link>
          </div>
          <div className="text-muted-foreground text-sm">
            Register new account? { " " } <Link href="/register" className="underline">Register</Link>
          </div>
        </CardFooter>
      </form>
    </Form>
  )
}
```
**Notes**:

   - **Note 1**: The email default value provided to the Zod Javascript validation sets the email value to whatever was passed from the Login page, as discussed previously. If none passed the value is an empty string.

   - **Note 2**: The `handleSubmit` is left empty currently, to faciliate testing the login->reset form flow. When filled in, it will reference the `actions.ts` server component.

# Step 4: Create the Password Reset Tokens Table
The new `passwordResetTokens` table will now be defined and pushed to the Neon PostgreSql platform.

1. Create `@/db/schema-passwordResetTokens.ts` file with the following code to create the `passwordResetTokens` table.

    ```tsx
    import { serial, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
    import {users} from "./usersSchema";

    export const passwordResetTokens = pgTable("password_reset_tokens", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, {
        onDelete: "cascade"
      }).unique(),
      token: text("token").notNull(),
      tokenExpiry: timestamp("token_expiry"),
    });
    ```

2. Update the `@/db/schema.ts` file to export the `passwordResetTokens` table. This file defines the two tables currently in use. 

    ```tsx
    ...
    export { passwordResetTokens } from './schema-passwordResetTokens';
    ```
3. The above `schema.ts` file is referenced in the `@/drizzle.config.ts` file which is used by the `npx push` command to be run in terminal window: `npx drizzle-kit push`

    ```bash
    PS C:\Users\ghughlett\Projects\udemy\next-auth-course\my-app> npx drizzle-kit push        
    No config path provided, using default 'drizzle.config.ts'
    Reading config file 'C:\Users\ghughlett\Projects\udemy\next-auth-course\my-app\drizzle.config.ts'
    [dotenv@17.2.3] injecting env (2) from .env.local -- tip: 🗂️ backup and recover secrets: https://dotenvx.com/ops
    Using 'pg' driver for database querying
    [✓] Pulling schema from database...
    [✓] Changes applied
    ```  
4. Go to the Neon website and confirm the new table's existence.

    ![](./docs/new-neon-table.png)

# Step 5: Create Insert into passwordResetTokens Table
An amazing PostgreSql insert function (INSERT ON CONFLICT UPDATE) logic is done here to handle the situation where the user makes multiple reset password requests. Since the entry in the `passwordResetTokens` table is unique per user, rather than failing, the newly minted token and expiry and updated in the record.

Shown below is the `@/db/queries-passwordResetTokens.ts` file that performs the insert. (This function is called by the `actions.ts` server component.)

```tsx
"use server";

import { passwordResetTokens } from './schema';
import db from './drizzle';

/* Note 1 */
export type InsertRecordType = {
  userId: number;
  token: string;
  tokenExpiry: Date;
}

type InsertReturnType = {
  error: boolean,
  message?: string
}

export async function insertPasswordToken(arg: InsertRecordType)
: Promise<InsertReturnType> {
  try {
    const result = await db.insert(passwordResetTokens).values({
      userId: arg.userId,
      token: arg.token,
      tokenExpiry: arg.tokenExpiry
    }).returning()
      .onConflictDoUpdate({
        target: passwordResetTokens.userId,
        set: {
          token: arg.token, 
          tokenExpiry: arg.tokenExpiry
        }
      });

    if (!result) {
      return {
        error: true,
        message: "Error inserting into passwordResetTokens table"
      }
    };

    /* Note 2 */
    return {
      error: false
    }
  }catch (e:unknown) {
      return {
        error: true,
        message: "Unknow error occured in the passwordResetTokens table"
      }
    }
  }
```
**Notes**:

  - **Note 1**: The `InsertReturnType` type is exported here so it can be imported and used in the `action.ts` file that will pass the object to be inserted.
  - **Note 2**: A good insert returns *"not an error"* but it's consistent with the way it's being done.

# Step 6: Creat Server Actions Component
The `handleSubmit` function in the `index.tsx` is presently empty but will call the `passwordReset` function that is now to be defined in the `actions.ts` file, shown below.

```tsx
'use server';

import { auth } from "@/auth";
import { getUserByEmail } from "@/db/queries-users";
import { randomBytes } from "crypto";
import { InsertRecordType, insertPasswordToken } from "@/db/queries-passwordResetTokens";

export const passwordReset = async (email: string) => {
  /* Note 1 */
  const session = await auth();
  if (!!session?.user?.id) {
    return {
      error: true,
      message: "You are already logged in"
    }
  };

  /* Note 2 */
  const userInfo = await getUserByEmail(email);
  if (!userInfo.success) {
    return;
  }

  /* Note 3 */
  const passwordResetToken = randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 3600000); //3.6M ms is 1 hour
  const insertRecord: InsertRecordType = {
    userId: userInfo.id as number,
    token: passwordResetToken,
    tokenExpiry: tokenExpiry
  }

  /* Note 4 */
  const result = await insertPasswordToken(insertRecord);
  return result;
  
}
```
**Notes**:

  - **Note 1**: The first validation is to check if there is a `session` object exists. if so, inform the user they are already logged in. 
  - **Note 2**: If the user is NOT registered then simply exit without any message that could be interpreted to a hacker.
  - **Note 3**: Generate a password reset `token` as a hex string and set a `tokenExpiry` of now + 1 hour
  - **Note 4**: Insert the password reset token information into the `passwordResetTokens` table.

# Step 7: Implement the Server Action Component
Before testing the full reset password request what is needed is logic to call the `passwordReset` function in the `actions.ts` file.

1. Open the `@/app/(logged-out)/password-reset/password-reset-form/index.tsx` file.
2. The `handleSubmit` function is so far empty. The code below was added to call `passwordReset`.

    ```tsx
      const handleSubmit = async (data: z.infer<typeof formSchema>) => {
        const response = await passwordReset(data.email);

        if (response?.error) {
          form.setError("email", {
            message: response?.message,
          });
        }
        else {
          toast.success("Password reset has been submitted.", {
            position: "top-center",
            duration: 2000,
            className: "bg-green-500 text-white",
          });
          form.reset();
        }
      };
    ```
3. 

# Step 8: Test the Password Reset Request
To this point we've updated the login page to link to a password reset form where certain validations were implemented and a password reset token created and added to the `passwordResetTokens` table.
