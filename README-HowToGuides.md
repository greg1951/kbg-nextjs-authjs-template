# Table of Contents
To keep the implementation documentation at a digestible level, the various markdown files are provided.

- [New User Registration Form](./docs/HOWTO-1-Implement-Register-Form.md): Provide form to create initial credentials and `users` table
- [User Login Form](./docs/HOWTO-2-Implement-Login-Form.md): With user in table, provide a form to login, confirm password, and create session
- [Change Password Form](./docs/HOWTO-3-Change-Password-Form.md): Update the user password, requiring a current password.
- [Reset Password Form](./docs/HOWTO-4-Reset-Password.md): Create token and store in `passwordResetTokens` table with expiration timestamp.
- [Use the Reset Token](./docs/HOWTO-5-UsingTheResetToken.md): Page will to receive token as a URL param and provide form to confirm/reset password.
- [Sending Reset Password Email](./docs/HOWTO-6-SendingResetPasswordEmail.md): Email sent on password reset request to change password.
