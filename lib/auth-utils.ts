'use server';

import { auth } from "@/auth";

export async function getSessionEmail() {
  const session = await auth();
  if (!session) {
    return {
      found: false,
      userEmail: ''
    } 
  }
  const userEmail = session.user?.email;
  return {
    found: true,
    userEmail: userEmail
  }
}