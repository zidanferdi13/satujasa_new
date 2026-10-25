import { prisma } from "@/lib/prisma";
import { accessFor, type Access } from "@/lib/access";

/**
 * Resolves access from the database on every call, never from the session token.
 * A removed or deactivated operator therefore loses access on their next request
 * instead of when their token happens to expire.
 *
 * `passwordChangedAt` rides along so the jwt callback can reject sessions issued
 * before the last password change (BUG-09), in the same query.
 *
 * Cost: one indexed lookup on Member(userId, organizationId).
 */
export async function currentAccess(
  userId: string
): Promise<(Access & { passwordChangedAt: Date | null }) | null> {
  const membership = await prisma.member.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      organizationId: true,
      role: true,
      operator: { select: { isActive: true } },
      user: { select: { passwordChangedAt: true } },
    },
  });

  const access = accessFor(membership);
  return access && { ...access, passwordChangedAt: membership!.user.passwordChangedAt };
}
