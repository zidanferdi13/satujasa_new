import { DefaultSession } from "next-auth"
import { MemberRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      organizationId: string | null
      role: MemberRole
    } & DefaultSession["user"]
  }

  interface User {
    organizationId: string | null
    role: MemberRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId: string | null
    role: MemberRole
  }
}
