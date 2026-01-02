'use server';

import z from "zod";
import { insertRegisteredUser, isUserRegistered } from "@/db/userQueries";
import { passwordSchema } from "@/validation/passwordSchema";

export const loginUser = async({
  email, 
  password}: {
    email: string,
    password: string
    }
  ) => {
    try {
    const userSchema = z.object({
      email: z.email(),
      password: passwordSchema
    });
    
    const userValidation = userSchema.safeParse({email, password});
    if (!userValidation.success) {
      return {
        error: true,
        message: userValidation.error.issues[0]?.message ?? "An error occurred in validation",
      };
    };
    const isRegistered = await isUserRegistered(email);
    if (!isRegistered) {
      return {
        error: true,
        message: `Unable to find a registered email.`
      }
    }

    // const result = await insertRegisteredUser(email, password);
    
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