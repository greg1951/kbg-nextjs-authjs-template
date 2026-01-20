1. [Overview](#overview)
2. [Step 1: Setup resend.com Account](#step-1-setup-resendcom-account)
3. [Step 2: Install Node Mailer Module](#step-2-install-node-mailer-module)
4. [Step 3: Configure a Helper Function](#step-3-configure-a-helper-function)
5. [Step 4: Update Password Reset Server Action](#step-4-update-password-reset-server-action)

---

# Overview
The functionality in this markdown documents sending the email. Traditionally an SMTP server would need to be set up but in our cloud environment we'll use the [resend.com](https://resend.com/pricing) cloud service to do this. 

There are two ways to use resend: via their REST APIs or SMTP. Although the former is likely more often utilized by developers, using the SMTP interface can be transferred to different vendors providing this class of service (e.g. Resend, Bravo, SendGrid).

The functionality here will follow these steps. 

1. Sign up for a developer account at resend.com.
2. Install NodeMailer in the project.
3. Configure a helper function.
4. Add code to the server action for password-reset.
5. Create a server function to send the email.
6. Test the standalone server function.
7. Test the entire reset password end-to-end.

# Step 1: Setup resend.com Account
No big deal there, just provide your email address and a password. You'll then be send an email to confirm the account. Do so and then you'll be directed to the login page. There will be no need to create a domain as the test server will be used.

# Step 2: Install Node Mailer Module
1. In a terminal run: `npm i nodemailer`
2. Install the typescript types: `npm i --save-dev @types/nodemailer`

# Step 3: Configure a Helper Function
Documentation on how to configure SMTP for a resend [can be found here](https://resend.com/settings/smtp). (The values below can be copied from this page.)

1. Create a nodemailer helper function in a new file `@/lib/emails.ts`
2. Add the following code to the the helper function. The configuration object contains the `host` name, `port`, `user` name, and an `API key`.

```tsx
import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 587,
  auth: {
    user: 'resend',
    password: process.env.RESEND_API_KEY,
  }
});
```
3. Go to [resend.com site](https://resend.com/docs/send-with-nodemailer-smtp) and create an API key. Copy the value to your clipboard!

4. Paste the API key value to the `@/env.local` file as RESEND_API_KEY property.

```bash
...
RESEND_API_KEY="re_aBuMBPbq_JwfdMXzCiqxsDbi5WZFtoZZ4" 
```
4. Save all files. 

# Step 4: Update Password Reset Server Action
 In this step code will be added to the `@/app/(logged-out)/password-reset/reset-password-form/actions.ts` file that created the password reset token, to send the email using the above helper function.

 1. Again, update the `@/env.local` adding the site URL (for DEV): 

 ```bash
 SITE_BASE_URL="http://localhost:3000" 
 ```

 2. Add the code below right after inserting the record into the `passwordResetTokens` table.

 ```tsx
 ...
    const insertRecord: InsertRecordType = {
    userId: userInfo.id as number,
    token: passwordResetToken,
    tokenExpiry: tokenExpiry
  }
  const result = await insertPasswordToken(insertRecord);
  const resetLink=`${process.env.SITE_BASE_URL}/update-password?token=${token}`
  return result;
```

