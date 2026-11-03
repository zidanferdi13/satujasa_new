import { DefaultSession } from "next-auth"
import type { SessionRole } from "@/lib/access"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      organizationId: string | null
      role: SessionRole
    } & DefaultSession["user"]
  }

  interface User {
    organizationId: string | null
    role: SessionRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId: string | null
    role: SessionRole
  }
}
