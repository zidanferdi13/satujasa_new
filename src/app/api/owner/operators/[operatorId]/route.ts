import { NextResponse } from "next/server";
import { MemberRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/http";
import { setOperatorActiveSchema } from "@/lib/validations";
import { claimSeat, OperatorLimitReached } from "@/lib/seats";
import { UI } from "@/lib/ui-strings";

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
 *
 * BUG-16: setting an operator who is already active to isActive: true is a no-op, not a seat
 * claim. Otherwise an owner at the limit gets 403 on a row that never changed state.
 */
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return badRequest(UI.common.notSignedIn, 401);
  if (session.user.role !== MemberRole.OWNER || !session.user.organizationId) {
    return badRequest(UI.addop.ownerOnlyEdit, 403);
  }
  const organizationId = session.user.organizationId;

  const parsed = await readJson(request);
  if (!parsed.ok) return badRequest(UI.common.badJson);
  const validated = setOperatorActiveSchema.safeParse(parsed.body);
  if (!validated.success) {
    return badRequest(validated.error.issues[0]?.message ?? UI.common.invalidInput);
  }
  const { isActive } = validated.data;
  const { operatorId } = await params;

  // Tenant isolation: the id comes from the URL, so it is filtered by the owner's own
  // organization rather than trusted.
  const existing = await prisma.operator.findFirst({
    where: { id: operatorId, organizationId },
    select: { id: true, name: true, email: true, isActive: true },
  });
  if (!existing) return badRequest(UI.addop.notFound, 404);

  // BUG-16: already in the requested state — nothing to claim, nothing to write.
  if (existing.isActive === isActive) {
    const { id, name, email } = existing;
    return NextResponse.json({ operator: { id, name, email, isActive } });
  }

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
      return badRequest(UI.addop.limitApi, 403);
    }
    console.error("Update operator error:", error);
    return badRequest(UI.common.internal, 500);
  }
}

/**
 * "Delete" an operator. Deliberately the same operation as deactivating: nothing is
 * removed from the database. A real DELETE is refused by the Restrict foreign keys from
 * File and Transaction, but this handler never even attempts one.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return badRequest(UI.common.notSignedIn, 401);
  if (session.user.role !== MemberRole.OWNER || !session.user.organizationId) {
    return badRequest(UI.addop.ownerOnlyEdit, 403);
  }

  const { operatorId } = await params;
  const deleted = await prisma.operator.updateMany({
    where: { id: operatorId, organizationId: session.user.organizationId },
    data: { isActive: false },
  });
  if (deleted.count !== 1) return badRequest(UI.addop.notFound, 404);

  return NextResponse.json({ hidden: true });
}
