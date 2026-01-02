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
import Link from "next/link";
import { passwordSchema } from "@/validation/passwordSchema";
import { useState } from "react";
import { loginUser } from "./actions";

const formSchema = z
  .object({ email: z.email(), password: passwordSchema });


export default function Login() {

  const [submitted, setSubmitted] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  });
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const response = await loginUser({
      email: data.email,
      password: data.password
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


  return (
    <main className="flex justify-center items-center min-h-screen">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Login to your account.</CardDescription>
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
                <Button type="submit">Login</Button>
              </fieldset>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <div className="text-muted-foreground text-sm">
            Create new account?{ " " }
            <Link href="/register" className="underline">
              Register
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>

  )
}