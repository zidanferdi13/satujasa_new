/**
 * The seat is the permission (A24).
 *
 * A seat is an active `Operator` row owned by the session user — the same rows `seats.ts`
 * counts against `operatorLimit`, so the guard and the quota can never disagree. An owner
 * without a seat may view their organization's berkas but not write one; that is the point of
 * the ruling, and it closes the owner-bypass that used to sit in the PATCH handler.
 *
 * Tenant scoping is still the caller's job: this answers "does this user hold a seat in this
 * organization", never "does this user own this file".
 */

export async function activeSeatFor(
  userId: string,
  organizationId: string
): Promise<{ id: string } | null> {
  // Fail closed (BUG-18). `member: { userId: undefined }` is not an error in Prisma, it is
  // dropped — the query would answer with whichever active operator comes first, handing the
  // owner's seat to every member. No id, no seat, no query.
  if (!userId || !organizationId) return null;

  // Loaded here so the refusal above provably touches no query, and a test can assert it.
  const { prisma } = await import("@/lib/prisma");
  return prisma.operator.findFirst({
    where: { organizationId, isActive: true, member: { userId } },
    select: { id: true },
  });
}
