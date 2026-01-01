'use server';

import db from "@/db/drizzle";
import { users } from "@/db/usersSchema";
import { passwordMatchSchema } from "@/validation/passwordMatchSchema";
import z from "zod";
import { hashUserPassword, splitHashedPassword } from "@/lib/hash";
import { isUserRegistered } from "@/db/userQueries";

export const registerUser = async({
  email, 
  password, 
  passwordConfirm}: {
    email: string,
    password: string, 
    passwordConfirm: string
    }
  ) => {
    try {
    const newUserSchema = z.object({
      email: z.email()
    }).and(passwordMatchSchema);
    
    const newUserValidation = newUserSchema.safeParse({email, password, passwordConfirm});
    if (!newUserValidation.success) {
      return {
        error: true,
        message: newUserValidation.error.issues[0]?.message ?? "An error occurred",
      };
    };
    const isRegistered = await isUserRegistered(email);
    // console.log('action->registerUser->isRegistered? ',isRegistered);
    if (isRegistered) {
      return {
        error: true,
        message: `An account is already registered for this email.`
      }
    }
    const hashedPassword = hashUserPassword(password);
    // console.log('action->registerUser->password: ', hashedPassword);
    const insertResult = await db.insert(users).values({
      email: email,
      password: hashedPassword,
    });
    console.log('action->registerUser->newUserValidation ',newUserValidation);
    //return newUserValidation;
    } catch (e: unknown) {
      if (e instanceof Error && e.code === "23505") {
        return {
          error: true,
          message: "An accound is already registered with that emaill"
        };
      }
      return {
        error: true,
        message: "An unknown error occured."
      }
    }    
  };