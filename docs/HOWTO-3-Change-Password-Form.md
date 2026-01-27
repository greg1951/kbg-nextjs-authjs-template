1. [Overview](#overview)
   1. [Implement Toaster](#implement-toaster)
   2. [Development Steps](#development-steps)
2. [Step 1: Create Basic Client Form](#step-1-create-basic-client-form)
3. [Step 2: Copy and Modify Form](#step-2-copy-and-modify-form)
   1. [The Client Page Component](#the-client-page-component)
   2. [The Actions Server Component](#the-actions-server-component)
   3. [The updateUserPassword DML](#the-updateuserpassword-dml)

# Overview
The purpose of this How-To guide is to document a password change form, now that the register and login forms are completed. (See the [markdown index](../README-HowToGuides.md) for a list of all the How-To documents.)

## Implement Toaster
The shadcn Toaster component will provide a nice message box to be shown after the password is updated. To implement it, follow the steps below.

1. The Toast (now Sonner) component requires: **{ node: '^20.17.0 || >=22.9.0' }**

    **Note**: I was running **20.16.0** so I had to install a new Node.js (**24.12.0**) 

2. Install the toast component: `npx shadcn@latest add sonner`

    **Note**: As usual for shadcn, it will be installed in the `@/components/ui` directory.

3. Add the Toaster component to the **root** layout component shown below.

    **source file**: *`@/app/layout.tsx*

    ```tsx
      ...
      return (
        <html lang="en">
          <body className={ `${ geistSans.variable } ${ geistMono.variable } antialiased` }>
            <>
              <Toaster />
              { children }
            </>
          </body>
        </html>
      );
    ```

## Development Steps
The change password development steps are:
1. Create client form component
2. Copy and modify form
3. Create server action component

# Step 1: Create Basic Client Form
The pages and form to change the user password are described here, in a **step-by-step** format, as much of what was done previously can simply be copied and quickly changed.

1. Create the `index.tsx` file below, to which we'll later copy in a form and modify.

    **source file**: *`@/app/(auth)/(logged-in)/change-password/change-password-form/index.tsx`*

    ```tsx
      'use client';

      export default function ChangePasswordForm() {
        return <div>change password form</div>
      }
    ```
2. Create a new page with the following boilerplate code which includes the above client component.

    **source file**: *`@/app/(auth)/(logged-in)/change-password/page.tsx`*

    ```tsx
      import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
      import ChangePasswordForm from "./change-password-form";

      export default function ChangePassword() {
        return (
          <Card className="w-[400]">
            <CardHeader>
              <CardDescription>Your current password is required in order to change your password.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        )
      }
    ```
3. Save all and then run the *Change Password* link from the my-account page header. It should display a form card (shown below) ready for input fields.

    ![](./docs/boiler-plate-change-pwd.png)

# Step 2: Copy and Modify Form
Copy the Register form file contents into the change password form file and make adjustments to it for the password change functionality that **requires the current password**. 

1. The copy source/target files below were done to populate the new `index.tsx` file for the password change.

    **source file**: *`@/app/(auth)/(logged-out)/register/page.tsx`* <<< copy only the entire `<Form>` element only
    **target file**: *`@/app/(logged-in)/change-password/change-password-form/index.tsx`*

2. The copied contents were modified for a password change. Shown below is a snippet of the move interesting parts of the `<ChangePasswordForm>` component.

    **source file**: *@/app/(logged-in)/change-password/change-password-form/index.tsx*

    ```tsx
      ...
      /* Note 1 */
      const formSchema = z.object({
        currentPassword: passwordSchema,
      }).and(passwordMatchSchema);

      type UserEmailProp = {
        userEmail: string;
      }

      export default function ChangePasswordForm({ userEmail }: UserEmailProp) {
        const form = useForm<z.infer<typeof formSchema>>({
          resolver: zodResolver(formSchema),
          defaultValues: {
            currentPassword: "",
            password: "",
            passwordConfirm: ""
          }
        });

        const handleSubmit = async (data: z.infer<typeof formSchema>) => {
          /* Note 2 */
          const response = await changeUserPassword({
            email: userEmail,
            currentPassword: data.currentPassword,
            password: data.password,
            passwordConfirm: data.passwordConfirm
          });

          if (response?.error) {
            form.setError("root", {
              message: response?.message,
            });
          }
          else {
            /* Note 3 */
            toast.success("Your password has been updated.", {
              position: "top-center",
              duration: 2000,
              className: "bg-green-500 text-white",
            });
            form.reset();
          }
        };
      ...
    ```
**Notes**:

  - **Note 1**: *The Zod validation includes the current password but only for the content length. *
  - **Note 2**: *The actual current password validation is done in the `changeUserPassword` actions function of the form submission event handler.*

    ![](./change-password-validation-error.png)

  - **Note 3**: The form fields are reset after a successful password change. 

## The Client Page Component

The page client component that implements the `ChangePasswordForm` form will pass the email (taken from the session object) as a prop to the form component. 

**source file**: *@/app/(logged-in)/change-password/page.tsx*

```tsx
...
  export default async function ChangePassword() {

  const session = await getSessionEmail();
  if (!session.found) {
    redirect('/login');
  }
  const userEmail = session.userEmail as string;

  return (
    <Card className="w-[400]">
      <CardHeader>
        <CardTitle className="text-center font-bold size-1.2">Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm userEmail={ userEmail } />
      </CardContent>
    </Card>
  )
}
```

## The Actions Server Component
The `changeUserPassword` function in the server-side actions component does a lot, so reference the notes after the code block. 

**source file**: *@/app/(logged-in)/change-password/change-password-form/actions.ts* 

```tsx
  ...
  export const changeUserPassword = async({
    email,
    currentPassword,
    password, 
    passwordConfirm}: {
      email: string, 
      currentPassword: string,
      password: string, 
      passwordConfirm: string
      }
    ) => {  

      try {
        const formSchema = z.object({
          currentPassword: passwordSchema
        }).and(passwordMatchSchema);
        /* Note 1 */
        const passwordValidation = formSchema.safeParse({currentPassword, password, passwordConfirm});
        if (!passwordValidation.success) {
          return {
            error: true,
            message: passwordValidation.error.issues[0]?.message ?? "An error occurred",
          };
        };
        const returnType = await getUserByEmail(email);
        if (!returnType.success) {
          return {
            error: true,
            message: 'Unable to find user account'
          }
        }
        /* Note 2 */
        const hashedPassword = hashPasswordWithSalt(currentPassword, returnType.salt as string);
        if (hashedPassword !== returnType.password) {
          return {
            error: true,
            message: 'Current password is incorrect, guess again!'
          }
        }
        /* Note 3 */
        const updatedUser = await updateUserPassword(email, password);
        return {
          error:false,
          message: 'Password changed'
        };
      
      } catch (e: unknown) {
        if (e instanceof Error && e.code === "23505") {
          return {
            error: true,
            message: "An account is already registered with that email"
          };
        }
        return {
          error: true,
          message: "An unknown error occured."
        }
      }    
    };
  ```

**Notes**:

  - **Note 1**: *Validate Zod form schema contents.*
  - **Note 2**: *Return the user's password which contains the hashed password and the salt used to hash it. Use the salt to hash the input password and compare the two.*
  -  **Note 3**: *Update the user password on the `users` table, replacing the password (which also includes a new salt string).*

## The updateUserPassword DML
All of the data manipulation code on the `users` table is implemented in the `@/db/queries-users.ts` file. Although the database component below is fairly ordinary, it is shown to document the good use of typescript.

```tsx
...
type ErrorReturnType = {
  error: boolean;
  message?: string;
}
...
export async function updateUserPassword(email: string, password: string) : Promise<ErrorReturnType> {
  const hashedPassword = hashUserPassword(password);
  let returnedResult;
  try {
      await db.update(users)
        .set({password: hashedPassword})
        .where(eq(users.email,email))
      ;
      returnedResult = {
        error: false,
      }      
      
    } catch(e: unknown) {
      returnedResult = {
        error: true,
        message: 'Failed to updated password'
      }      
    }      
    return returnedResult;
}
```
