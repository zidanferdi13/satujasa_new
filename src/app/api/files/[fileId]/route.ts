import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/http";
import { fileInputSchema } from "@/lib/file-input";
import { computeMoney, transitionRefusal } from "@/lib/file-rules";
import { organizationIsEntitled } from "@/lib/org-status";
import { UI } from "@/lib/ui-strings";

/**
 * Update a berkas. There is no DELETE handler, and there never will be: files are cancelled,
 * not deleted (A17/bug-12), so no request can erase a revenue row.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  if (!session?.user || !organizationId) return badRequest(UI.common.notSignedIn, 401);

  if (!(await organizationIsEntitled(organizationId))) return badRequest(UI.sub.title, 403);

  const { fileId } = await params;

  // Tenant isolation: the id alone is never enough, organizationId is part of the lookup.
  const existing = await prisma.file.findFirst({
    where: { id: fileId, organizationId },
    select: { id: true, operatorId: true, status: true },
  });
  if (!existing) return NextResponse.json({}, { status: 404 });

  // An operator edits their own files. The owner may correct any file in their own organization.
  if (session.user.role === "OPERATOR") {
    const membership = await prisma.member.findFirst({
      where: { userId: session.user.id, organizationId },
      select: { operator: { select: { id: true, isActive: true } } },
    });
    const operator = membership?.operator;
    if (!operator?.isActive || operator.id !== existing.operatorId) {
      return NextResponse.json({}, { status: 404 });
    }
  }

  const parsedBody = await readJson(request);
  if (!parsedBody.ok) return badRequest(UI.common.badJson);

  const parsed = fileInputSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? UI.common.invalidInput);
  }
  const input = parsed.data;

  const refusal = transitionRefusal(existing.status, input.status);
  if (refusal === "TERMINAL") return badRequest(UI.file.terminalNote, 409);
  // Unreachable from the form (its options are filtered): no user-facing copy needed.
  if (refusal === "BACKWARD") return badRequest("Files cannot move backwards in status", 409);

  const money = computeMoney(input);

  await prisma.file.update({
    where: { id: existing.id },
    data: {
      customerName: input.customerName,
      customerKtp: input.customerKtp,
      vehicleNumber: input.vehicleNumber,
      ownershipType: input.ownershipType,
      serviceType: input.serviceType,
      notes: input.notes,
      estimatedPrice: input.estimatedPrice,
      dpAmount: input.dpAmount,
      finalPrice: input.finalPrice,
      samsatPayment: input.samsatPayment,
      serviceFee: money.serviceFee,
      revenue: money.revenue,
      status: input.status,
      // Set once, on the transition to PICKED_UP. The body cannot move it, and a terminal file
      // cannot be reached again, so a past month's revenue can never be rewritten (A17).
      pickedUpAt: input.status === "PICKED_UP" ? new Date() : null,
    },
  });

  return NextResponse.json({ id: existing.id });
}
