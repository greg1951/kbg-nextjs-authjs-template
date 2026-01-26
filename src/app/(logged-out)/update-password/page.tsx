import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPasswordToken } from "@/features/auth/components/db/queries-passwordResetTokens";
import Link from "next/link";
import UpdateResetPasswordForm from "./update-password-form";


export default async function UpdateResetPassword({ searchParams }: {

  searchParams: Promise<{
    token?: string;
  }>
}) {

  const { token } = await searchParams;
  // let tokenExpiry;
  let isValidExpiry;
  let email;
  if (token) {
    const result = await getPasswordToken({ token });
    if (result.error) {
      console.log('Error occurred retrieving passwordToken');
    }

    // console.log('UpdateResetPassword->result: ', result);
    // tokenExpiry = result.tokenExpiry;
    isValidExpiry = result.isValidExpiry;
    email = result.email;
  }

  return (
    <main className="flex justify-center items-center min-h-screen">
      <Card className="w-[350]">
        <CardHeader>
          <CardTitle>Password Reset Update</CardTitle>
          <CardDescription>
            { isValidExpiry
              ? `${ email }`
              : "Your password reset link is invalid or has expired"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          { isValidExpiry
            ? <UpdateResetPasswordForm userEmail={ email as string } />
            : <Link href='/password-reset' className="underline">
              Request another password Reset
            </Link>
          }

        </CardContent>
      </Card>
    </main>
  )
}