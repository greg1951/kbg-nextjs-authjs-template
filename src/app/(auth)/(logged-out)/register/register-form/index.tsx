'use client';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { passwordMatchSchema } from "@/features/auth/components/validation/passwordMatchSchema";
import { Button } from "@/components/ui/button";
import { registerUser } from "./actions";
import { useRouter } from "next/navigation";

const formSchema = z
  .object({
    email: z.email()
  })
  .and(passwordMatchSchema);

export default function RegisterAccountForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: ""
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const response = await registerUser({
      email: data.email,
      password: data.password,
      passwordConfirm: data.passwordConfirm
    });

    if (response?.error) {
      form.setError("email", {
        message: response?.message,
      });
    }
    else {
      router.push(`/login${ form.getValues("email") ? `?email=${ encodeURIComponent(form.getValues("email")) }` : "" }`)
    }
  }

  return (
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
  )
};