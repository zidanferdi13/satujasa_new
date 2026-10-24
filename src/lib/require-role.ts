import { redirect } from "next/navigation";
import { connection } from "next/server";
import { MemberRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { dashboardPathFor } from "@/lib/rbac";

/**
 * Server-side role gate. Not logged in, or no organization: /login.
 * Wrong role: sent to own dashboard. Role and organization are re-read from the
 * database by the jwt callback on every request, never taken from client input.
 */
export async function requireRole(role: MemberRole) {
  await connection();
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (session.user.role !== role) redirect(dashboardPathFor(session.user.role));
  return session;
}
