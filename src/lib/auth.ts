import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { MemberRole } from "@prisma/client"
import { normalizeEmail } from "@/lib/validations"

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
          include: {
            memberships: {
              include: {
                organization: true,
              },
            },
          },
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

        // Get the primary membership (first organization)
        const membership = user.memberships[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: membership?.organizationId || null,
          role: membership?.role || MemberRole.OPERATOR,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const signedInUser = user as { organizationId?: string | null; role?: MemberRole };
        token.organizationId = signedInUser.organizationId ?? null;
        token.role = signedInUser.role ?? MemberRole.OPERATOR;
      }
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
