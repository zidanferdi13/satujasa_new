import { prisma } from "@/lib/prisma";
import { accessFor, type Access } from "@/lib/access";

/**
 * Resolves access from the database on every call, never from the session token.
 * A removed or deactivated operator therefore loses access on their next request
 * instead of when their token happens to expire.
 *
 * Cost: one indexed lookup on Member(userId, organizationId).
 */
export async function currentAccess(userId: string): Promise<Access | null> {
  const membership = await prisma.member.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      organizationId: true,
      role: true,
      operator: { select: { isActive: true } },
    },
  });

  return accessFor(membership);
}
