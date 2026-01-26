'use server';

import { passwordMatchSchema } from "@/features/auth/components/validation/passwordMatchSchema";
import z from "zod";
import { insertRegisteredUser, isUserRegistered } from "@/features/auth/components/db/queries-users";

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
    if (isRegistered) {
      return {
        error: true,
        message: `An account is already registered for this email.`
      }
    }

    const insertResult = await insertRegisteredUser(email, password);
    if (!insertResult) {
      return {
        error: true,
        message: "Registered user insert failed"
      }
    }
    
    } catch (e: unknown) {
      if (e instanceof Error && e.code === "23505") {
        return {
          error: true,
          message: "An accound is already registered with that email"
        };
      }
      return {
        error: true,
        message: "An unknown error occured."
      }
    }    
  };