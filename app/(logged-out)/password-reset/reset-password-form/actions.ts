'use server';

import { auth } from "@/auth";
import { getUserByEmail, isUserRegistered } from "@/db/queries-users";
import { randomBytes } from "crypto";
import { InsertRecordType, insertPasswordToken } from "@/db/queries-passwordResetTokens";

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
  console.log('passwordReset->insertRecord: ', insertRecord);
  const result = await insertPasswordToken(insertRecord);
  console.log('insert result: ', result);
  return result;
  
}