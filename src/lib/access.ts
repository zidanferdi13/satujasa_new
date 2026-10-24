/**
 * Access decision for one membership row. Pure: no database import, so it can be
 * unit tested and reasoned about without a connection.
 */
export type AccessRole = "OWNER" | "OPERATOR";

export type Access = { organizationId: string; role: AccessRole };

type MembershipLike =
  | { organizationId: string; role: string; operator?: { isActive: boolean } | null }
  | null
  | undefined;

/**
 * Which organization and role this membership grants, or null if it grants none.
 * Fails closed: an unknown role grants nothing, and an operator is cut off as soon
 * as their staff profile is deactivated.
 */
export function accessFor(membership: MembershipLike): Access | null {
  if (!membership) return null;
  const { organizationId, role } = membership;
  if (role === "OWNER") return { organizationId, role };
  if (role === "OPERATOR" && membership.operator?.isActive) return { organizationId, role };
  return null;
}
