import { redirect } from "next/navigation";
import { connection } from "next/server";
import { MemberRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { dashboardPathFor } from "@/lib/rbac";

/**
 * Server-side role gate. Not logged in: /login. Wrong role: sent to own dashboard.
 * Role comes from the signed session JWT, never from client input.
 */
export async function requireRole(role: MemberRole) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== role) redirect(dashboardPathFor(session.user.role));
  return session;
}
