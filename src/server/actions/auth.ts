"use server";

import type { z } from "zod";
import argon2 from "argon2";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { env } from "@/env.mjs";
import { db } from "../db";
import { loginSchema, registerSchema } from "../schemas";
import { getUserByEmail } from "../utils/user";
import { DEFAULT_LOGIN_REDIRECT_URL } from "@/routes";

interface AuthResponse {
  message: string;
  isError: boolean;
}

export const handleSignOut = async () => {
  await signOut();
};

export const checkBlockedEmail = async (email: string) => {
  const result = await db.blockedEmails.findFirst({
    where: {
      email,
    },
  });
  if (result) {
    return true;
  }
  return false;
};

export const login = async (values: z.infer<typeof loginSchema>) => {
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { message: "Invalid fields", isError: true } satisfies AuthResponse;
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT_URL,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message: "Invalid email or password.",
        isError: true,
      } satisfies AuthResponse;
    }

    throw error;
  }
};

export const register = async (values: z.infer<typeof registerSchema>) => {
  if (!env.AUTH_SIGNUP_ENABLED) {
    return {
      message: "Account registration is currently disabled.",
      isError: true,
    } satisfies AuthResponse;
  }

  const validatedFields = registerSchema.safeParse(values);

  if (!validatedFields.success) {
    return { message: "Invalid fields", isError: true } satisfies AuthResponse;
  }

  const { email, password, name } = validatedFields.data;
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return {
      message: "User already exists.",
      isError: true,
    } satisfies AuthResponse;
  }

  const hashedPassword = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      emailVerified: new Date(),
    },
  });

  return {
    message: "Account created successfully. You can now sign in.",
    isError: false,
  } satisfies AuthResponse;
};
