'use client';

import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { passwordReset } from "./actions";
import { useRouter } from "next/navigation";


const formSchema = z.object({
  email: z.email()
});

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: decodeURIComponent(searchParams.get("email") ?? "") as string,
    }
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const response = await passwordReset(data.email);

    if (response?.error) {
      form.setError("email", {
        message: response?.message,
      });
    }
    else {
      toast.success("Password reset has been submitted.", {
        position: "top-center",
        duration: 2000,
        className: "bg-green-500 text-white",
      });
      router.push(`/password-reset/password-reset-sent?email=${ encodeURIComponent(form.getValues("email")) }`);
    }
  };

  return (
    <Form { ...form }>
      <form onSubmit={ form.handleSubmit(handleSubmit) }>
        <fieldset disabled={ form.formState.isSubmitting } className="flex flex-col gap-2">
          <FormField
            control={ form.control }
            name="email"
            render={ ({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input { ...field } type="email" />
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
          <Button type="submit">Submit Password Reset</Button>
        </fieldset>
        <CardFooter className="flex flex-col gap-2">
          <div className="text-muted-foreground text-sm">
            Remember your password? { " " } <Link href="/login" className="underline">Login</Link>
          </div>
          <div className="text-muted-foreground text-sm">
            Register new account? { " " } <Link href="/register" className="underline">Register</Link>
          </div>
        </CardFooter>
      </form>
    </Form>
  )
}
