1. [Overview](#overview)
2. [Step 1: Create Client Form And Test](#step-1-create-client-form-and-test)
3. [Step 2: Copy and Modify Form](#step-2-copy-and-modify-form)
4. [Step 3: Create Server Action](#step-3-create-server-action)
   1. [The page.tsx Client Component](#the-pagetsx-client-component)
   2. [The index.tsx Form Component](#the-indextsx-form-component)
   3. [The actions.ts Server Component](#the-actionsts-server-component)
   4. [The updateUserPassword DML](#the-updateuserpassword-dml)
5. [Step 5: Implement Toaster](#step-5-implement-toaster)

# Overview
With register and login forms completed, this markdown documents the creation of a Change Password form.

The implementation steps are:
1. Create client form component and test
2. Copy and modify form
3. Create server action component

# Step 1: Create Client Form And Test
1. Create new folder: `@/app/(logged-in)/change-password/change-password-form`
2. Create file inside this new folder named index.tsx with a default function of ChangePassword.

    ```tsx
    'use client';

    export default function ChangePasswordForm() {
      return <div>change password form</div>
    }
    ```
3. Create new page for the form in `@/app/(logged-in)change-password/page.tsx` with the following boilerplate code which includes the above client component.

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
4. Save all and then run the *Change Password* link from the my-account page header. It should display a form card (shown below) ready for input fields.

    ![](./docs/boiler-plate-change-pwd.png)

# Step 2: Copy and Modify Form
It's easier to copy in the Register form and make adjustments to it for the password change. 

1. Copy the entire (second) `<Card>` element from `@/app/(logged-out)/register/page.tsx`, as well as the imports at the top of the file into the new form page at `@/app/(logged-in)/change-password/change-password-form/index.tsx`. 

2. Update the `<FormField>` elements to rename the one for email to be the current password field. When done the file should look like that shown below.

    ```tsx
      'use client';

      import z from "zod";
      import { passwordSchema } from "@/validation/passwordSchema";
      import { passwordMatchSchema } from "@/validation/passwordMatchSchema";
      import { zodResolver } from "@hookform/resolvers/zod";
      import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
      import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
      import { Input } from "@/components/ui/input";
      import { Button } from "@/components/ui/button";
      import { useForm } from "react-hook-form";

      const formSchema = z.object({
        currentPassword: passwordSchema,
      }).and(passwordMatchSchema);


      export default function ChangePasswordForm() {
        const form = useForm<z.infer<typeof formSchema>>({
          resolver: zodResolver(formSchema),
          defaultValues: {
            currentPassword: "",
            password: "",
            passwordConfirm: ""
          }
        });

        const handleSubmit = async (data: z.infer<typeof formSchema>) => {};

        return (
          <Card className="w-[350]">
            <CardHeader>
              <CardDescription>Your current password is required in order to change your password.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form { ...form }>
                <form onSubmit={ form.handleSubmit(handleSubmit) }>
                  <fieldset disabled={ form.formState.isSubmitting } className="flex flex-col gap-2">
                    <FormField
                      control={ form.control }
                      name="currentPassword"
                      render={ ({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input { ...field } type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      ) }
                    />
                    <FormField
                      control={ form.control }
                      name="password"
                      render={ ({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input { ...field } type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      ) }
                    />
                    <FormField
                      control={ form.control }
                      name="passwordConfirm"
                      render={ ({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input { ...field } type="password" />
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
                    <Button type="submit">Change Password</Button>
                  </fieldset>
                </form>
              </Form>
            </CardContent>
          </Card>
          )
        }    
    ```
**Notes**:

- The form field validation is essentially the same as the Register form, except there is no email input Field. 
- The `<Fieldset>` element `name` attribute must match the typescript schema property names.
- The `handleSubmit` function is presently empty but at some point must invoke a `changeUserPassword` function in the server action.
- If deployed this form will behave properly except the `handleSubmit` doesn't do anything. The validation should work, as shown below.
- Just above the submit Button is a `<FormMessage>` area that will be used to display root error messages (e.g. validation) that might occur.

![](./docs/change-password-validation-error.png)

# Step 3: Create Server Action
The password change entails three files within the `@/(logged-in)/change-password` directories: `page.tsx`, `index.tsx`, and `actions.ts` shown below.

  ![](./docs/update-password-server-action.png)

## The page.tsx Client Component

The `@/app/(logged-in)/change-password/page.tsx` implements a `ChangeUserPassword` component and is passed the email based on the session variable accessed there. (This way the logged-in session did not need to be accessed for that property.)

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

## The index.tsx Form Component

The `ChangeUserPassword` React component is implemented in the `@/app/(logged-in)/change-password/change-password-form/index.tsx` file. The `handleSubmit` onSubmit form function in the `index.tsx` file triggers the call to the `changeUserPassword` function shown below. 

```tsx
...
  const router = useRouter();
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    console.info('Starting changeUserPassword for: ', userEmail);
    const response = await changeUserPassword({
      email: userEmail,
      currentPassword: data.currentPassword,
      password: data.password,
      passwordConfirm: data.passwordConfirm
    });
    console.log('ChangePasswordForm->response: ', response);
    if (response?.error) {
      form.setError("root", {
        message: response?.message,
      });
    }
    else {
      router.push('/my-account');
    }
  };
```

## The actions.ts Server Component
In the same folder as the UpdatePasswordForm component, the server-side `actions.ts` file implements the `changeUserPassword` function, shown below.

```tsx
'use server';

import { passwordMatchSchema } from "@/validation/passwordMatchSchema";
import z from "zod";
import { updateUserPassword, getUserByEmail } from "@/db/queries-users";
import { passwordSchema } from "@/validation/passwordSchema";
import { hashPasswordWithSalt } from "@/lib/hash";

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
    /* Note 1: Zod schema validation */
    const formSchema = z.object({
      currentPassword: passwordSchema
    }).and(passwordMatchSchema);
    
    const passwordValidation = formSchema.safeParse({currentPassword, password, passwordConfirm});
    if (!passwordValidation.success) {
      return {
        error: true,
        message: passwordValidation.error.issues[0]?.message ?? "An error occurred",
      };
    };

    /* Note 2: The returnType below will return the current password and salt*/
    const returnType = await getUserByEmail(email);
    if (!returnType.success) {
      return {
        error: true,
        message: 'Unable to find user account'
      }
    }

    /* Note 3: hash current password to compare with retrieved password */
    const hashedPassword = hashPasswordWithSalt(currentPassword, returnType.salt as string);
    if (hashedPassword !== returnType.password) {
      return {
        error: true,
        message: 'Current password is incorrect, guess again!'
      }
    }
    
    /* Note 4: The async function below will hash the new password (with new salt) */
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

  - **Note 1**: Create a `formSchema` Zod object that will perform basic input validations on the input password form fields.

  - **Note 2**: The returned object contains the current hashed `password` and the `salt` used to hash it.

  - **Note 3**: Hash the `currentPassword` with the `salt` retrieve in previous step and then compare with hased password in the `users` table.

  -  **Note 4**: Update the user password on the `users` table, replacing the password (which also includes a new salt string).

## The updateUserPassword DML
All of the data manipulation code on the `users` table occurs in the `@/db/queries-users.ts` file. Shown below is the async function to update the user's password in that table. The returnedResult is based on a type defined in the file, as a good typescript practice.

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
      console.error(returnedResult);
    }      
    return returnedResult;
}
```

# Step 5: Implement Toaster
The shadcn Toaster component will provide a nice message box to be shown after the password is updated. To implement it, follow the steps below.

1. The Toast (now Sonner) component requires: **{ node: '^20.17.0 || >=22.9.0' }**

    **Note**: I was running **20.16.0** so I had to install a new Node.js (**24.12.0**) 

2. Install the toast component: `npx shadcn@latest add sonner`

    **Note**: As usual for shadcn, it will be installed in the `@/components/ui` directory.

3. Add the Toaster component to the root `Layout.tsx` component, as seen below.

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

4. Add the toast function import to the `ChangeUserPassword` (index.tsx) component: `import { toast } from "sonner";`

5. In the `handleSubmit` function, add an else code block to render a password changed message in the `toast` function, and to clear the form fields.

    ```tsx
    ...
      const handleSubmit = async (data: z.infer<typeof formSchema>) => {
        console.info('Starting changeUserPassword for: ', userEmail);
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

 - There are various flavors of toast: `toast.success`, `toast.info`, `toast.error`, and `toast.promise`. 
 - The toast.promise can show a "loading..." message, until the Promise completes. [Consult this doc](https://ui.shadcn.com/docs/components/sonner) for more info.
 - Attempted to style the toaster output (Tailwindcss) but there was no change in the output.

6. Save, restart the app and change the password. The toaster will render at the top-center position (Default is bottom right).


