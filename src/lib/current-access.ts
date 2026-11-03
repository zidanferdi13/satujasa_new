import { prisma } from "@/lib/prisma";
import { accessFor, platformAccessFor, type Access } from "@/lib/access";

/**
 * Resolves access from the database on every call, never from the session token.
 * A removed or deactivated operator therefore loses access on their next request
 * instead of when their token happens to expire.
 *
 * A Super Admin (A20) has no Member row: `platformRole` wins and yields `organizationId: null`,
 * which is how every tenant route stays out of their reach.
 *
 * `passwordChangedAt` rides along so the jwt callback can reject sessions issued
 * before the last password change (BUG-09), in the same query.
 *
 * Cost: one indexed lookup on User, plus one membership row.
 */
export async function currentAccess(
  userId: string
): Promise<(Access & { passwordChangedAt: Date | null }) | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      platformRole: true,
      passwordChangedAt: true,
      memberships: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          organizationId: true,
          role: true,
          operator: { select: { isActive: true } },
        },
      },
    },
  });
  if (!user) return null;

  const access = platformAccessFor(user.platformRole) ?? accessFor(user.memberships[0]);
  return access && { ...access, passwordChangedAt: user.passwordChangedAt };
}
