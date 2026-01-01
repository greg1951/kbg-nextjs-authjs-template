"use server";

import { count, eq } from 'drizzle-orm';
import { users } from './schema';
import db from './drizzle';

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