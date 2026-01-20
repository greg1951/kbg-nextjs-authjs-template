'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter }
  from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage }
  from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { passwordMatchSchema } from "@/validation/passwordMatchSchema";
import { registerUser } from "./actions";
import Link from "next/link";
import { useState } from "react";

const formSchema = z
  .object({ email: z.email() })
  .and(passwordMatchSchema);

export default function Register() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: ""
    },
  });

  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const response = await registerUser({
      email: data.email,
      password: data.password,
      passwordConfirm: data.passwordConfirm
    });

    if (response?.error) {
      setSubmitted(false);
      form.setError("email", {
        message: response?.message,
      });
    }
    else {
      setSubmitted(true);
    }
  };

  /* Remember, to see console logs you need to Inspect in the browser */
  console.log('Register->handleSubmit->submitted: ', submitted);
  return (
    <main className="flex justify-center items-center min-h-screen">
      { submitted ? (
        <Card className="w-[350]">
          <CardHeader>
            <CardTitle className="text-center">Your account has been created.</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Login to your account</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (

        <Card className="w-[350]">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Register for a new account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form { ...form }>
              <form onSubmit={ form.handleSubmit(handleSubmit) }>
                <fieldset disabled={ form.formState.isSubmitting } className="flex flex-col gap-2">
                  <FormField
                    control={ form.control }
                    name="email"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input { ...field } type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                  <FormField
                    control={ form.control }
                    name="password"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input { ...field } type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                  <FormField
                    control={ form.control }
                    name="passwordConfirm"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input { ...field } type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                  <Button type="submit">Register</Button>
                </fieldset>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <div className="text-muted-foreground text-sm">
              Already have an account?{ " " }
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </CardFooter>

        </Card>
      ) }
    </main>
  );
}
