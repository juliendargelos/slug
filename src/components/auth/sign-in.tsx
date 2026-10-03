"use client";

import type { z } from "zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader } from "lucide-react";

import { login } from "@/server/actions/auth";
import { loginSchema } from "@/server/schemas";
import { Button } from "@/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui/form";
import { Input } from "@/ui/input";
import Alert from "@/ui/alert";

interface SignInProps {
  signupEnabled: boolean;
}

const SignIn = ({ signupEnabled }: SignInProps) => {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setMessage("");
    setIsError(false);

    startTransition(async () => {
      const result = await login(values);

      if (result) {
        setMessage(result.message);
        setIsError(result.isError);
      }
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {message ? (
            <Alert variant={isError ? "error" : "success"}>{message}</Alert>
          ) : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader className="animate-spin" size={16} /> : null}
            Sign in
          </Button>
        </form>
      </Form>
      {signupEnabled ? (
        <div className="pt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
          <Link
            href="/register"
            className="hover:text-black dark:hover:text-white"
          >
            Create an account
          </Link>
        </div>
      ) : null}
    </>
  );
};

export default SignIn;
