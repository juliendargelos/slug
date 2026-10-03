import Register from "@/components/auth/register";
import Logo from "@/components/icons/logo";
import { sharedAnimationCards } from "@/components/auth/animation-cards";
import { env } from "@/env.mjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { cn } from "@/utils";
import { notFound } from "next/navigation";

const RegisterPage = () => {
  if (!env.AUTH_SIGNUP_ENABLED) notFound();

  return (
    <Card className={cn("w-full max-w-sm", sharedAnimationCards)}>
      <CardHeader className="flex items-center justify-center text-center">
        <Logo className="mb-2 h-10 w-10" />
        <CardTitle className="text-2xl font-medium">
          Create an account
        </CardTitle>
        <CardDescription>
          Use your email address and a secure password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Register />
      </CardContent>
    </Card>
  );
};

export default RegisterPage;
