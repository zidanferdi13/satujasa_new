import { NextResponse } from "next/server";
import { MemberRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/http";
import { setOperatorActiveSchema } from "@/lib/validations";
import { claimSeat, OperatorLimitReached } from "@/lib/seats";

type Params = { params: Promise<{ operatorId: string }> };

/**
 * Deactivate or reactivate an operator (M3 groundwork for BUG-12).
 *
 * Deactivation is the only supported form of "removal": the Operator row stays, so every
 * File and Transaction it produced keeps its foreign key and the owner's revenue history
 * survives. The row is hidden from use instead — isActive = false — and the operator
 * loses access on their next request, because accessFor() fails closed.
 *
 * Reactivation takes the organization row lock and the same seat check as creation.
 * Without that, deactivate-then-reactivate would be a free seat.
 */
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return badRequest("Not signed in", 401);
  if (session.user.role !== MemberRole.OWNER || !session.user.organizationId) {
    return badRequest("Only an organization owner can change operators", 403);
  }
  const organizationId = session.user.organizationId;

  const parsed = await readJson(request);
  if (!parsed.ok) return badRequest("Request body must be valid JSON");
  const validated = setOperatorActiveSchema.safeParse(parsed.body);
  if (!validated.success) {
    return badRequest(validated.error.issues[0]?.message ?? "Invalid input");
  }
  const { isActive } = validated.data;
  const { operatorId } = await params;

  // Tenant isolation: the id comes from the URL, so it is filtered by the owner's own
  // organization rather than trusted.
  const existing = await prisma.operator.findFirst({
    where: { id: operatorId, organizationId },
    select: { id: true },
  });
  if (!existing) return badRequest("Operator not found", 404);

  try {
    const operator = await prisma.$transaction(async (tx) => {
      if (isActive) await claimSeat(tx, organizationId);
      return tx.operator.update({
        where: { id: existing.id },
        data: { isActive },
        select: { id: true, name: true, email: true, isActive: true },
      });
    });
    return NextResponse.json({ operator });
  } catch (error) {
    if (error instanceof OperatorLimitReached) {
      return badRequest("Operator limit reached for your package", 403);
    }
    console.error("Update operator error:", error);
    return badRequest("Internal server error", 500);
  }
}

/**
 * "Delete" an operator. Deliberately the same operation as deactivating: nothing is
 * removed from the database. A real DELETE is refused by the Restrict foreign keys from
 * File and Transaction, but this handler never even attempts one.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return badRequest("Not signed in", 401);
  if (session.user.role !== MemberRole.OWNER || !session.user.organizationId) {
    return badRequest("Only an organization owner can change operators", 403);
  }

  const { operatorId } = await params;
  const deleted = await prisma.operator.updateMany({
    where: { id: operatorId, organizationId: session.user.organizationId },
    data: { isActive: false },
  });
  if (deleted.count !== 1) return badRequest("Operator not found", 404);

  return NextResponse.json({ hidden: true });
}
