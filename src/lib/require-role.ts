import { redirect } from "next/navigation";
import { connection } from "next/server";
import { MemberRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { dashboardPathFor } from "@/lib/rbac";

/**
 * Server-side role gate. Not logged in: /login. Not a tenant principal (A20 platform admin):
 * their own dashboard. Wrong role: sent to their own dashboard. Role and organization are
 * re-read from the database by the jwt callback on every request, never taken from client input.
 */
export async function requireRole(role: MemberRole) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== role) redirect(dashboardPathFor(session.user.role));
  if (!session.user.organizationId) redirect("/login");
  return session;
}

/**
 * A20: the admin console's only gate. A tenant member of any role is sent to their own
 * dashboard — the console is not a page an owner can reach by typing the URL.
 */
export async function requireSuperAdmin() {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect(dashboardPathFor(session.user.role));
  return session;
}
