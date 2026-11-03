/**
 * Access decision for one identity. Pure: no database import, so it can be unit tested and
 * reasoned about without a connection.
 *
 * Two kinds of principal (A20):
 *  - tenant: a Member row, so an organization and a MemberRole (`organizationId` is set).
 *  - platform: `User.platformRole = SUPER_ADMIN`, no Member row and no organization. Keeping
 *    this outside MemberRole is what stops an admin from ever being "inside" a tenant.
 */
export type AccessRole = "OWNER" | "OPERATOR";
export type SessionRole = AccessRole | "SUPER_ADMIN";

export type TenantAccess = { organizationId: string; role: AccessRole };
export type PlatformAccess = { organizationId: null; role: "SUPER_ADMIN" };
export type Access = TenantAccess | PlatformAccess;

type MembershipLike =
  | { organizationId: string; role: string; operator?: { isActive: boolean } | null }
  | null
  | undefined;

/**
 * Which organization and role this membership grants, or null if it grants none.
 * Fails closed: an unknown role grants nothing, and an operator is cut off as soon
 * as their staff profile is deactivated.
 */
export function accessFor(membership: MembershipLike): TenantAccess | null {
  if (!membership) return null;
  const { organizationId, role } = membership;
  if (role === "OWNER") return { organizationId, role };
  if (role === "OPERATOR" && membership.operator?.isActive) return { organizationId, role };
  return null;
}

/** Platform staff bypass membership entirely; anything else is a tenant principal. */
export function platformAccessFor(platformRole: string | null | undefined): PlatformAccess | null {
  return platformRole === "SUPER_ADMIN" ? { organizationId: null, role: "SUPER_ADMIN" } : null;
}
