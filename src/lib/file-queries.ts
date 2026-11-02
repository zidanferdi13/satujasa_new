/**
 * Server-side reads shared by the M3 berkas pages.
 *
 * Every query is scoped by `organizationId` taken from the session, never from the URL. The file
 * id is the only client-supplied key and it is always paired with the tenant, so an id from another
 * organization resolves to null (404) instead of leaking a row.
 */
import { prisma } from "@/lib/prisma";
import type { FileFormValues } from "@/components/files/file-form";

/** The signed-in user's Operator row, and only while it is active. Deactivated means no identity. */
export async function operatorIdFor(userId: string, organizationId: string): Promise<string | null> {
  const membership = await prisma.member.findFirst({
    where: { userId, organizationId },
    select: { operator: { select: { id: true, isActive: true } } },
  });
  const operator = membership?.operator;
  return operator?.isActive ? operator.id : null;
}

/**
 * A single file in this organization, shaped for the form, plus the operator who owns it.
 * Null is a 404 — never "someone else's file". Ownership beyond the tenant is the caller's
 * decision: an operator may only open their own, the owner may open any in their organization.
 */
export async function fileForForm(
  fileId: string,
  organizationId: string
): Promise<{ values: FileFormValues; operatorId: string } | null> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, organizationId },
    select: {
      id: true,
      customerName: true,
      customerKtp: true,
      vehicleNumber: true,
      ownershipType: true,
      serviceType: true,
      notes: true,
      estimatedPrice: true,
      dpAmount: true,
      finalPrice: true,
      samsatPayment: true,
      status: true,
      operatorId: true,
      pickedUpAt: true,
      createdAt: true,
    },
  });
  if (!file) return null;

  const { operatorId, pickedUpAt, createdAt, ...rest } = file;
  return {
    operatorId,
    values: {
      ...rest,
      pickedUpAt: pickedUpAt ? pickedUpAt.toISOString() : null,
      createdAt: createdAt.toISOString(),
    },
  };
}
