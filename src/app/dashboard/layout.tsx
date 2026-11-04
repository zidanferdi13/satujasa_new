import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { organizationIsEntitled } from "@/lib/org-status";
import { DashboardSidebar } from "@/components/layout/sidebar";

export const instant = false;

/** Renders the shell for signed-in users. Access control is enforced per page via requireRole(). */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // §19: an owner's nav depends on entitlement — while lapsed, every link but export bounces to the
  // locked screen. Reading it here keeps that decision in one place instead of in each page.
  const entitled =
    session.user.role === "OWNER" && session.user.organizationId
      ? await organizationIsEntitled(session.user.organizationId)
      : true;

  return (
    <div className="flex h-screen">
      <DashboardSidebar role={session.user.role} entitled={entitled} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
