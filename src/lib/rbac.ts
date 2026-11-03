import { MemberRole } from "@prisma/client";
import type { SessionRole } from "@/lib/access";

export const DASHBOARD_HOME: Record<SessionRole, string> = {
  [MemberRole.OWNER]: "/dashboard/owner",
  [MemberRole.OPERATOR]: "/dashboard/operator",
  // A20: platform staff live outside any organization, so their own console is their home.
  SUPER_ADMIN: "/dashboard/admin",
};

/** Dashboard a resolved role lands on. No null/unknown input: callers check access first. */
export function dashboardPathFor(role: SessionRole): string {
  return DASHBOARD_HOME[role];
}
