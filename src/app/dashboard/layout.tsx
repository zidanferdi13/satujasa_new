import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
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

  return (
    <div className="flex h-screen">
      <DashboardSidebar role={session.user.role} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
