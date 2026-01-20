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
import { loginUser } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const formSchema = z
  .object({ email: z.email(), password: passwordSchema });


export default function Login() {
  const [emailValue, setEmailValue] = useState("");
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    console.info('Login->handleSubmit: started...')
    const response = await loginUser({
      email: data.email,
      password: data.password
    });

    if (response?.error) {
      form.setError("root", {
        message: response?.message,
      });
    }
    else {
      router.push('/my-account');
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen">
      <Card className="w-[350]">
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
                { !!form.formState.errors.root?.message &&
                  <FormMessage>
                    { form.formState.errors.root.message }
                  </FormMessage>
                }
                <Button type="submit">Login</Button>
              </fieldset>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <div className="text-muted-foreground text-sm">
            Don&apos;t have an account?{ "   " }
            <Link href="/register" className="underline">
              Register
            </Link>
          </div>
          <div className="text-muted-foreground text-sm">
            Forgot password?{ "   " }
            <Link
              href={ `/password-reset${ form.getValues("email") ? `?email=${ encodeURIComponent(form.getValues("email")) }`
                : ""
                }` }
              className="underline"
            >
              Reset my password
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}