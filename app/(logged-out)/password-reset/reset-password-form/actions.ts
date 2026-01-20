'use server';

import { auth } from "@/auth";
import { getUserByEmail } from "@/db/queries-users";
import { randomBytes } from "crypto";
import { InsertRecordType, insertPasswordToken } from "@/db/queries-passwordResetTokens";
import { mailer } from "@/lib/email";

export const passwordReset = async (email: string) => {
  const session = await auth();
  if (!!session?.user?.id) {
    return {
      error: true,
      message: "You are already logged in"
    }
  };

  const userInfo = await getUserByEmail(email);
  if (!userInfo.success) {
    return;
  }
  console.log('passwordReset->userInfo.id: ', userInfo.id);

  /* Generate password reset token that will need to be stored in a database table */
  const passwordResetToken = randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 3600000); //3.6M ms is 1 hour
  const insertRecord: InsertRecordType = {
    userId: userInfo.id as number,
    token: passwordResetToken,
    tokenExpiry: tokenExpiry
  }
  // console.log('passwordReset->insertRecord: ', insertRecord);
  const result = await insertPasswordToken(insertRecord);
  // console.log('insert result: ', result);

  const resetLink=`${process.env.SITE_BASE_URL}/update-password?token=${insertRecord.token}`; 
  const sendResult = await mailer.sendMail({
    from: "test@resend.dev",
    subject: "Your Password Reset Request",
    to: email,
    text: `You requested to reset your password. This link will expire in an hour. Click on the link below to reset it on our website:\n\n ${resetLink}`,
  });

  console.log('passwordReset->sendResult: ',sendResult)


  return result;
  
}