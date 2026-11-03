import { NextResponse } from "next/server";
import { adminSession } from "@/lib/admin-api";
import { badRequest, readJson } from "@/lib/http";
import { AlreadyProcessed, PaymentNotFound, rejectPayment } from "@/lib/payments";
import { UI } from "@/lib/ui-strings";

/**
 * Rejection keeps the row and the receipt (A20), so the owner re-uploads against the same code.
 * The reason is mandatory: it is customer-facing copy, and a rejection without one is a dead end.
 */
export async function POST(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const admin = await adminSession();
  if (!admin.ok) return badRequest(admin.message, admin.status);

  const parsedBody = await readJson(request);
  if (!parsedBody.ok) return badRequest(UI.common.badJson);

  const reason = (parsedBody.body as { reason?: unknown } | null)?.reason;
  if (typeof reason !== "string" || !reason.trim()) return badRequest(UI.adm.rejectReasonRequired);
  if (reason.trim().length > 500) return badRequest(UI.common.invalidInput);

  const { paymentId } = await params;
  try {
    await rejectPayment(paymentId, admin.userId, reason.trim());
    return NextResponse.json({ ok: true, message: UI.adm.rejectedOk });
  } catch (error) {
    if (error instanceof PaymentNotFound) return NextResponse.json({}, { status: 404 });
    if (error instanceof AlreadyProcessed) return badRequest(UI.adm.staleQueue, 409);
    console.error("Reject payment error:", error);
    return badRequest(UI.adm.errGeneric, 500);
  }
}
