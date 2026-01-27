1. [Overview](#overview)
2. [Step 1: Create 2FA Enablement Form](#step-1-create-2fa-enablement-form)
3. [Step 2: Create Function to Return User's 2FA Settings from the Database](#step-2-create-function-to-return-users-2fa-settings-from-the-database)
4. [Step 3: Pass 2FA Fields to Enablement Form](#step-3-pass-2fa-fields-to-enablement-form)
5. [Step 4: Create Server Action to Generate 2FA Secret](#step-4-create-server-action-to-generate-2fa-secret)
6. [Step 5: Display the QR Code in 2FA Form](#step-5-display-the-qr-code-in-2fa-form)
7. [Step 6: Add Input-OTP Form](#step-6-add-input-otp-form)
8. [Step 7: Enable 2FA Submit Event](#step-7-enable-2fa-submit-event)
9. [Step 8: Disable 2FA Submit Event](#step-8-disable-2fa-submit-event)

---
# Overview
The functionality in this markdown documents how to implement 2-Factor-Auth. It is the last of the How-To documentation in this project. (See the [markdown index](../README-HowToGuides.md) for a list of all the How-To documents.)

Implementing 2FA authentication requires three steps in the UI, predicated on 2FA not previously activated for the user.
- The **first** UI step is to display a button in the 2FA form that they click on if they want to enable 2FA.

  ![](./2FA-enable-step.png)

- The **second** UI step is to generate a secret and render a QR code to the user which they can scan into their authenticator app.

  ![](./2FA-qr-code-step.png)

- The **third** UI step is to prompt the user to enter a one-time code (from the authenticator app) that will then commit the user's 2FA settings into the `users` table.

  ![](./2FA-otp-submit-step.png)

The developments steps are summarized below. The code will be primarily implemented in the `@/app/(logged-in)/my-account` routes of the app. 

1. Create 2FA enablement form.
2. Create function to return user's 2FA fields from database.
3. Pass 2FA fields to the enablement form.
4. Create server action to generate and update secret.
5. Render the QR code in the 2FA form.
6. Commit 2FA changes to the users table.
7. Update the login to use the authenticator app code.

# Step 1: Create 2FA Enablement Form
If 2FA is not active for the user, then display a button on the `my-account` page to enable it. If the user clicks on the enable button then the second step is to generate a QR code for the authenticator app. 

The `index.tsx` file implements a form to perform all of the 2FA UI steps. 

**Note**: The snippet below does not show all of the code. That will be filled in later steps.

  **source**: *`@app/(auth)/(logged-in)/my-account/two-factor-auth-form/index.tsx`*

  ```tsx
    'use client';

    import { Button } from "@/components/ui/button";
    import { useState } from "react";

    /* Note 1 */
    type Props = {
      isActivated: boolean;
      email: string;
    }

    export default function TwoFactorAuthForm({ isActivated, email }: Props) {
      /* Note 2 */
      const [activated, setActivated] = useState(isActivated);
      const [step, setStep] = useState(1);

      /* Note 3 */
      function handleEnableClick() {
        setStep(2);
      }
      
      return (
        <div>
          { activated && (
            <div className="flex py-2">
              <Button onClick={ handleDisableClick }>
                Disable 2FA Authentication
              </Button>
            </div>
          ) }
          { !activated &&
            <div className="flex py-2">
              { step === 1 && (
                <Button onClick={ handleEnableClick }>
                  Enable 2FA Authentication
                </Button>
              ) }
              { step === 2 && (
                <div>
                  <p className="text-xs text-muted-foreground py-2">
                    Scan the QR code below in the Authenticator app to activate 2FA.
                  </p>
                  <QRCodeSVG value={ code } />
                  <Button onClick={ () => setStep(3) } className="w-full my-2">
                    I have scanned the QR Code
                  </Button>
                  <Button onClick={ () => setStep(1) } className="w-full bg-gray-400">
                    Cancel
                  </Button>
                </div>
              ) } 
          </div>
    ...
  ```
**Notes**:

  - **Note 1**: The `my-account` page will pass several props to this form. The first is the `users.twoFactorActivated` boolean and the other is the email which the page component will pass in from a session that exists in the page.

  - **Note 2**: State will be used to track what step in the 2FA enablement is in. The default status of the `active` state is set from the incoming `isActive` value. 

  - **Note 3**: Presently the onClick function only increments the step state variable. 
    - Code will be shown in a later step to call a server action to generate the key URI used for the QR code to be rendered.
    - The `<Button>` component in step 2 is a placeholder for a QR code that will be added in **Step 5** below.

  - **Another step will be added later to the above**, to prompt the user for a one-time authenticator code to finally commit the two-factor auth setup.

# Step 2: Create Function to Return User's 2FA Settings from the Database
The `getUser2fa` function below will be used in the next step to return all of the user's 2FA settings.

  **source file**: *@/features/auth/components/db/queries-users.ts*

  ```tsx
    /* NOTE 1 */
    export async function getUser2fa(email: string) 
      : Promise<GetUser2faReturnType>  {
      const [user] = await db
        .select({
          id: users.id,
          secret: users.twoFactorSecret,
          isActivated: users.twoFactorActivated
        })
        .from(users)
        .where(eq(users.email, email)); 

      if (!user) 
        return {
          success: false,
          message: "There were no users found matching that email."
        };
      return {
        success: true, 
        id: user.id as number,
        secret: user.secret as string,
        isActivated: user.isActivated as boolean,
      }
    };
  ```
**Notes**: 

  - **Note 1**: *The `GetUser2faReturnType` type can be found in `@/features/auth/types/users.ts` file which consolidates all of the Typescript types associated with the `users` table functions.*

# Step 3: Pass 2FA Fields to Enablement Form
The `my-account` page will be updated to include the enablement form created earlier. That form will (optionally) render the buttons to enable 2FA. A snippet of the code in the `page.tsx` file is shown below. 

**Note**: *The `getUser2fa` function shown earlier is run to return the 2FA settings for the user.*

  **source file**: *`@/app/(auth)/(logged-in)/my-account/page.tsx`*

  ```tsx
    ...
      /* NOTE 1 */
      const email = session?.user?.email as string;
      const result2FA = await getUser2fa(email);

      /* NOTE 2 */
      return (
        <Card className="w-[400] ">
          <CardHeader>
            <CardTitle className="text-center font-bold size-1.2">My Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Label>
              Email Address
            </Label>
            <div className="text-muted-foreground">
              { session?.user?.email }
            </div>
            <TwoFactorAuthForm isActivated={ result2fa.isActivated ?? false } email={ email } />
          </CardContent>
        </Card>
      )
  ```
**Notes**:

  - **Note 1**: Grab the email from the session object and retrieve the 2FA settings for the user. 
  - **Note 2**: The `<TwoFactorAuthForm>` client component is passed the 2FA boolean and the email address (used for the update of the user's 2FA settings).

# Step 4: Create Server Action to Generate 2FA Secret
An server-side actions component will be created for the 2FA form that will generate a secret (if there is none) for the user and return a QR URI that can be used to display a QR Code for the user's authenticator app. 

- If a secret is generated then the server component will also update the 2FA settings for the user.
- As you may have surmised, additional packages need to be installed to do this.

1. Install the shadcn One-Time Passcode component and the QR Code package: `npm i otplib qrcode.react`

   **Note**: *See the [otplib package](https://www.npmjs.com/package/otplib) and the [qrcode.react](https://www.npmjs.com/package/qrcode.react) documentation.*  

2. Create a server-side actions component to generate a secret and store that secret in the users table.   

  **source file**: *`@/app/(auth)/(logged-in)/my-account/two-factor-auth-form/actions.ts`*

    ```tsx
        import { getUser2fa, 
                updateUser2faSecret, 
                updateUser2faActivated, 
                Update2fsaActivatedRecordType, 
                Update2faSecretRecordType, 
                } 
              from "@/db/queries-users";

        import { generateSecret, generateURI, generate } from 'otplib';
        export const generate2faSecret = async(email:string) => {
          /* NOTE 1 */
          const result2fa = await getUser2FA(email);
          if (!result2fa) {
            return {
              errror: true,
              message: "Authentication error"
            }
          };
          /* NOTE 2 */
          let twoFactorSecret = result2fa.secret;
          if (!result2fa.secret) {
            twoFactorSecret = generateSecret();
            const update2faSecret:Update2faSecretRecordType = {
              email: email,
              secret: twoFactorSecret,
            }
            /* NOTE 3 */
            const updateResult = await updateUser2faSecret(update2faSecret);
            if (updateResult.error) {
              return {
                error: true,
                message: "Authorization update error"
              }
            }
            /* NOTE 4 */
            return {
              error: false,
              qrUri: generateURI({
                issuer: "KbgAuthApp",
                label: email,
                secret: twoFactorSecret
              })
            };  
          }
        }
    ```
**Notes**:

  - **Note 1**: Retrieve user's 2FA secret from the `users` table
  - **Note 2**: If the user does not have a secret then generate one.
  - **Note 3**: Update both of the user's 2FA settings. 
  - **Note 4**: Generate and return a key URI to be used by the authenticator

# Step 5: Display the QR Code in 2FA Form

The `handleEnableClick` event below renders the 2FA form and runs the `generate2faSecret` function shown in preceding step.

  **source file**: *`@app/(auth)/(logged-in)/my-account/two-factor-auth-form/index.tsx`*

  ```tsx
    import { get2faSecret } from "./actions";
    import { toast } from "sonner";
    ...
    const handleEnableClick = async () => {
      const getResponse = await generate2faSecret(email);
      if (getResponse?.error) {
        toast.error(getResponse.message, {
          position: "bottom-center",
          duration: 2000,
        });
        return;
      }
      setStep(2);
      setCode(getResponse?.qrUri ?? "");
    }
  ```

The 2FA form was updated for step 2 to replace the button (it was a placeholder) with the QR Code component.

  **source file**: *`@app/(auth)/(logged-in)/my-account/two-factor-auth-form/index.tsx`*

  ```tsx
    import { QRCodeSVG } from "qrcode.react";
    ...  
        { step === 2 && (
          <div>
            <p className="text-xs text-muted-foreground py-2">
              Scan the QR code below in the Authenticator app to activate 2FA.
            </p>
            <QRCodeSVG value={ code } />
          </div>
          <Button onClick={ () => setStep(3) } className="w-full my-2">
            I have scanned the QR Code
          </Button>
          <Button onClick={ () => setStep(1) } className="w-full bg-gray-400">
            Cancel
          </Button>
        ) }
    ...
  ```

1. Step through the 2FA enablement steps and confirm output.

2. On the Neon platform, confirm in the `users` table that the record for that email address has been updated to be 2FA *activated* and includes a *secret* string.

3. Open your authenticator app on your mobile device and scan the code. Confirm `KbgAuthApp` was added to your authenticator apps.

# Step 6: Add Input-OTP Form
The third and final step is to render an input field to capture a **one-time code** from the authenticatior app. Once a code is entered by the user and validated, the user can then click on a button to commit the 2FA settings or not.

- The user will click on the *I have scanned the QR code* button. 
- An input field will be rendered ([shadcn input OTP](https://ui.shadcn.com/docs/components/base/input-otp)) so a one-time code can be entered. 
- Use the otplib verify function to confirm the one-time code is correct.
- If it is correct, then the 2FA settings in the user table are updated.
- Going forward, when the user logs in, the user will be prompted to an authenticator code (See the next How-To guide).

1. Install the `input-otp` component: `npx shadcn@latest add input-otp`
2. In the login `TwoFactorAuthForm`, add a 3rd step to the return section which consists of a form. As you can see in the snippet below, it uses a number of imports and a bit of state which is also shown.

  **Note**: *The event handler function will associated with the Input-Opt component will be covered in the next section.*

  **source file**: `@app/(auth)/(logged-in)/my-account/two-factor-auth-form/index.tsx`

  ```tsx
    import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
    ...
    /* NOTE 1 */
    export default function TwoFactorAuthForm({ isActivated, email }: Props) {
      const [step, setStep] = useState(1);
      const [code, setCode] = useState("");
      const [otp, setOtp] = useState("");
      const [otpError, setOtpError] = useState("");
    ...
      return (
    ...
      { step === 3 && (
        { "NOTE 2" }
        <form onSubmit={ handleSubmit }>
          <p className="text-xm">
            Please enter the one-time passcode from the authenticator app.
          </p>
          { "NOTE 3" }
          <InputOTP maxLength={ 6 } value={ otp } onChange={ setOtp }>
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xm">
              <InputOTPSlot index={ 0 } />
              <InputOTPSlot index={ 1 } />
              <InputOTPSlot index={ 2 } />
            </InputOTPGroup>
            <InputOTPSeparator className="mx-2" />
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xm">
              <InputOTPSlot index={ 3 } />
              <InputOTPSlot index={ 4 } />
              <InputOTPSlot index={ 5 } />
            </InputOTPGroup>
          </InputOTP>
          { "NOTE 4" }
          { otpError && 
            <div>
              <p className="text-sm text-red-600 text-center">{ otpError }</p>
            </div>
          }
          { !activated && (
            <>
              <Button disabled={ otp.length != 6 } type="submit" className="w-full my-2">
                Submit and activate 2FA
              </Button>
              { "NOTE 5" }
              <Button onClick={ () => setStep(2) } className="w-full bg-gray-400">
                Cancel
              </Button>
            </>
          ) }
        </form>
      )
    ...
  ```

**Notes**: 

  - **Note 1**: Various parts of the login are held together with React state.
  - **Note 2**: When the form is submitted, the `handleSubmit` event will validate the input OTP and advance to the next step (which is not shown above). 
  - **Note 3**: `otp` will contain the one-time passcode, while `setOtp` is used on the onChange event for input-otp.
  - **Note 4**: The event handler (not shown above) will validate the input and `setOtpError` should it not be valid.
  - **Note 5**: Advancing the `step` variable will renders a different part of the 2FA UI. 

# Step 7: Enable 2FA Submit Event 
The event handler will call the `activate2fa` function to update the user's 2FA settings in the `users` table. The update means that 2FA verification will be done on each account login.

**source file**: *`@app/(auth)/(logged-in)/my-account/two-factor-auth-form/index.tsx`*

```tsx
  ...
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setActivated(false);
      const activatedRecord: Activated2faRecordType = { email: email, otp: otp };
      const activatedResult = await activate2fa(activatedRecord);
      if (activatedResult?.error) {
        setOtpError(activatedResult.message);
      }
      else {
        setOtpError("");
        setActivated(true);
        toast.success("2FA has been enabled for your login", {
          position: "bottom-center",
          duration: 3000,
        });
      };
    };
```

# Step 8: Disable 2FA Submit Event
A submit button to disable 2FA simply sets the `user.twoFactorActivated` to `false`. 

**Note**: *The `user.twoFactorSecret` is not touched as it can be reused should the user want to enable 2FA again.*

**source file**: *`@app/(auth)/(logged-in)/my-account/two-factor-auth-form/index.tsx`*

```tsx
  import { generate2faSecret, activate2fa, disable2fa } from "./actions";
  ...
    const handleDisableClick = async () => {
      const disableResult = await disable2fa(email);
      if (disableResult.error) {
        toast.error(disableResult.message, {
          position: "bottom-center",
          duration: 3000,
        });
        setActivated(true);
        return;
      }
      setActivated(false);
      setStep(1);
    };
```




