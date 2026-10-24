import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { dashboardPathFor } from "@/lib/rbac";

/** /dashboard has no content of its own: send each user to their role's dashboard. */
export default async function DashboardIndexPage() {
  await connection();
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  redirect(dashboardPathFor(session.user.role));
}
