import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/http";
import { fileInputSchema } from "@/lib/file-input";
import { computeMoney } from "@/lib/file-rules";
import { organizationIsEntitled } from "@/lib/org-status";
import { UI } from "@/lib/ui-strings";

/**
 * Create a berkas. The operator comes from the session, never from the body: a caller cannot
 * attribute their work to someone else, and `organizationId` cannot be selected by the client.
 */
export async function POST(request: Request) {
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  if (!session?.user || !organizationId) return badRequest(UI.common.notSignedIn, 401);

  // A12: no new berkas without a paid, unexpired subscription.
  if (!(await organizationIsEntitled(organizationId))) return badRequest(UI.sub.title, 403);

  // Files belong to a staff profile (Operator row), not to a login. The owner has no Operator row
  // until M4 owner-as-operator, so this path is not reachable from the owner UI; the message stays
  // developer-facing (A16).
  const membership = await prisma.member.findFirst({
    where: { userId: session.user.id, organizationId },
    select: { operator: { select: { id: true, isActive: true } } },
  });
  const operator = membership?.operator;
  if (!operator?.isActive) return badRequest("Only an active operator can create a file", 403);

  const parsedBody = await readJson(request);
  if (!parsedBody.ok) return badRequest(UI.common.badJson);

  // Unknown keys are stripped here: serviceFee, revenue and pickedUpAt never survive this parse.
  const parsed = fileInputSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? UI.common.invalidInput);
  }
  const input = parsed.data;
  const money = computeMoney(input);

  const file = await prisma.file.create({
    data: {
      organizationId,
      operatorId: operator.id,
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
      // Stamped by the server only; the request body cannot carry it (A17).
      pickedUpAt: input.status === "PICKED_UP" ? new Date() : null,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: file.id }, { status: 201 });
}
