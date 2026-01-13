"use server";

import { count, eq } from 'drizzle-orm';
import { users } from './schema';
import db from './drizzle';
import { hashUserPassword } from "@/lib/hash";

type RegisteredReturnType = {
  id: number;
  email: string;
  password: string;
  mfaSecret: string;
  mfaActivated: boolean;
}
type RegisteredTypeof = ReturnType<RegisteredReturnType>;

type ErrorReturnType = {
  error: boolean;
  message?: string;
}

type UserPasswordReturnType = {
  success: boolean; 
  id?: string; 
  password?: string; 
  salt?: string; 
  message?: string
}

type AuthValidationReturnType = {
  id: number; 
  email: string; 
  password: string; 
  salt: string
}


export async function isUserRegistered(email: string) {
  const result = await db
    .select({count: count()})
    .from(users)
    .where(eq(users.email, email)); 
  
  if (result[0].count > 0)
    return true;
  else
    return false;
}

export async function insertRegisteredUser(email: string, password: string)
: Promise<RegisteredTypeof> {
    const hashedPassword = hashUserPassword(password);
    
    const result = await db.insert(users).values({
      email: email,
      password: hashedPassword,
    }).returning();
    return result;

}

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

/* This function is used by the Auth.js Credentials provider */
export async function nextAuthUserByEmail(email: string)
  : Promise<AuthValidationReturnType> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      password: users.password,
    })
    .from(users)
    .where(eq(users.email, email)); 
    /* 
      The stored password contains to fields, separated by colon:
        1. actual hashed password
        2. salt used to hash password
     */
    
    if (user) {
      const passwordParts = user.password.split(':');
      // console.log('nextAuthUserByEmail->passwordParts: ', passwordParts);
  
      const returnedUser = {
        id: user.id,
        email: user.email as string,
        password: passwordParts[0],
        salt: passwordParts[1]
    }
    return returnedUser;
  }
  /* This user is null but the auth.ts will check for it */
  return user;
}

export async function getUserByEmail(email: string) 
  : Promise<UserPasswordReturnType>  {
  const [user] = await db
    .select({
      id: users.id,
      password: users.password,
    })
    .from(users)
    .where(eq(users.email, email)); 

    if (!user) 
      return {
        success: false,
        message: "There were no users found matching that email."
      };
    
    // console.log('getUserByEmail->user: ', user);
    const passwordParts = user.password.split(':');
    // console.log('getUserByEmail->passwordParts', passwordParts);
    if (passwordParts.length === 2) {
      const fullUserInfo = {
        success: true,
        email: email,
        password: passwordParts[0],
        salt: passwordParts[1],
      }
      console.log('fullUserInfo: ', fullUserInfo);
      return fullUserInfo;
    }
    else {
      return {
        success: false,
        message: "The credentials could not be parsed properly."
      }
    }
}