'use server';

import z from "zod";
import { passwordSchema } from "@/validation/passwordSchema";
import { signIn } from "@/auth";

export const loginUser = async({
  email, 
  password}: {
    email: string,
    password: string
    }
  ) => {
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
        
      }
      /* Kickoff the auth authentication here to the auth.ts Credentials provider */
      try {
        console.info('Starting Credentails signIn...');
        await signIn("credentials", {
          email,
          password,
          redirect: false
        })
        console.info('Finished Credentails signIn...');
      } catch(e) {
        return {
          error: true,
          message: "Incorrect email or password"
        }
    };    
  }