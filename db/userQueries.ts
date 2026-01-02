"use server";

import { count, eq } from 'drizzle-orm';
import { users } from './schema';
import db from './drizzle';
import { hashUserPassword } from "@/lib/hash";

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

export async function insertRegisteredUser(email: string, password: string) {
    const hashedPassword = hashUserPassword(password);
    
    const result = await db.insert(users).values({
      email: email,
      password: hashedPassword,
    });

}