"use server";

import { eq } from 'drizzle-orm';
import { passwordResetTokens } from './schema';
import db from './drizzle';

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
    // console.log('insertPasswordToken->result: ',result);
    return {
      error: false
    }
  }catch (e:unknown) {
      return {
        error: true,
        message: "Likely duplicate found"
      }
    }
  }
