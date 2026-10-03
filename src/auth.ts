import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";

import { db } from "@/server/db";
import authConfig from "@/auth.config";
import { getUserByEmail, getUserById } from "./server/utils/user";
import { getTwoFactorConfirmationByUserId } from "./server/utils/two-factor-confirm";
import { env } from "./env.mjs";
import { checkBlockedEmail } from "./server/actions/auth";
import { loginSchema } from "./server/schemas";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  unstable_update,
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  basePath: "/api/auth",
  secret: env.AUTH_SECRET,
  pages: {
    signIn: "/auth",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      const existingUser = await getUserById(user.id);

      // Disable sign in for blocked users
      const emailBlocked = await checkBlockedEmail(user.email!);

      if (emailBlocked) return false;

      // Prevent sign in without email verification
      if (!existingUser?.emailVerified) return false;

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id,
        );

        if (!twoFactorConfirmation) return false;

        // Delete two factor confirmation for next sign in
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email!;
        session.user.isOAuth = token.isOAuth as boolean;
        session.user.limitLinks = token.limitLinks as number;
        session.user.blocked = token.blocked as boolean;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;

      token.isOAuth = false;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
      token.limitLinks = existingUser.limitLinks;
      token.blocked = existingUser.blocked;

      return token;
    },
  },
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedCredentials = loginSchema.safeParse(credentials);

        if (!validatedCredentials.success) return null;

        const { email, password } = validatedCredentials.data;
        const user = await getUserByEmail(email);

        if (!user?.password) return null;

        try {
          return (await argon2.verify(user.password, password)) ? user : null;
        } catch {
          return null;
        }
      },
    }),
  ],
});
