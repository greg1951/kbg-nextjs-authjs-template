'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";


export default function HandleReset() {
  const searchParams = useSearchParams();
  const email = decodeURIComponent(searchParams.get("email") ?? "") as string
  return (
    <main className="flex justify-center items-center min-h-screen">
      <Card className="w-[350]">
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>If you have an account with us you will receive a password reset email at { email }.</CardDescription>
        </CardHeader>
      </Card>
    </main>
  )
}