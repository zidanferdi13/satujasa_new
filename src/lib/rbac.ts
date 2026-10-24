import { MemberRole } from "@prisma/client";

export const DASHBOARD_HOME: Record<MemberRole, string> = {
  [MemberRole.OWNER]: "/dashboard/owner",
  [MemberRole.OPERATOR]: "/dashboard/operator",
};

/** Dashboard a resolved role lands on. No null/unknown input: callers check access first. */
export function dashboardPathFor(role: MemberRole): string {
  return DASHBOARD_HOME[role];
}
