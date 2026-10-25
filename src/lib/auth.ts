import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { MemberRole } from "@prisma/client"
import { normalizeEmail } from "@/lib/validations"
import { currentAccess } from "@/lib/current-access"

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizeEmail(credentials.email as string) },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        // No organization, or a deactivated operator: refuse the login outright.
        const access = await currentAccess(user.id);
        if (!access) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name, ...access };
      },
    }),
  ],
  callbacks: {
    // Runs on every auth() call. Access is re-read from the database each time, so a
    // removed or deactivated member is signed out on their next request, not at
    // token expiry. Returning null ends the session.
    //
    // BUG-09: a session issued before the user's last password change is dead. `authAt`
    // is stamped once, at sign-in, and never refreshed — unlike `iat`, which NextAuth
    // rewrites on every re-encode and would therefore hide the reset.
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;
      if (!userId) return null;
      const access = await currentAccess(userId);
      if (!access) return null;

      const authAt = user ? Date.now() : (token.authAt as number | undefined);
      if (
        access.passwordChangedAt &&
        (!authAt || authAt < access.passwordChangedAt.getTime())
      ) {
        return null;
      }

      token.authAt = authAt;
      token.organizationId = access.organizationId;
      token.role = access.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.organizationId = token.organizationId as string | null;
        session.user.role = token.role as MemberRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
