import { MemberRole } from "@prisma/client";

export const DASHBOARD_HOME: Record<MemberRole, string> = {
  [MemberRole.OWNER]: "/dashboard/owner",
  [MemberRole.OPERATOR]: "/dashboard/operator",
};

/** Dashboard a role lands on. Unknown/missing role gets the least-privileged dashboard. */
export function dashboardPathFor(role: MemberRole | null | undefined): string {
  return role === MemberRole.OWNER ? DASHBOARD_HOME.OWNER : DASHBOARD_HOME.OPERATOR;
}
