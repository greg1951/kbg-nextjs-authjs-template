# Overview

The previous [How-To guide](./HOWTO-7-TwoFactorAuth.md) covered providing a user with two-factor authentication. Now that 2FA is added to the project all that remains is to update the login process to use it. It's pretty involved, so there's an overview below.

When a user with 2FA enabled logs in, there are two logins occurring under the covers:
1. Validate email and password credentials (this user has 2FA enabled)

![](./step1-email-login.png)

2. Once validated, then render a 2nd login form to capture the one-time passcode (OTP).

![](./step2-otp.png)

When the OTP is validated then the user is take to the "my-account" page.

![](./after-step2-my-account.png)