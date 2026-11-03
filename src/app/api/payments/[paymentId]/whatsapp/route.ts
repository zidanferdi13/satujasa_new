import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { badRequest } from "@/lib/http";
import { AlreadyProcessed, PaymentNotFound, confirmByWhatsApp } from "@/lib/payments";
import { UI } from "@/lib/ui-strings";

/**
 * A20: the WhatsApp path is a real confirmation, not decoration. The owner says "sudah transfer"
 * and the row moves to WAITING_VERIFICATION without a receipt; the admin queue treats it the
 * same. Idempotent — pressing it twice changes nothing.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  if (!session?.user || !organizationId) return badRequest(UI.common.notSignedIn, 401);
  if (session.user.role !== "OWNER") return badRequest(UI.addop.ownerOnly, 403);

  const { paymentId } = await params;
  try {
    const payment = await confirmByWhatsApp(organizationId, paymentId);
    return NextResponse.json({ status: payment.status });
  } catch (error) {
    if (error instanceof PaymentNotFound) return NextResponse.json({}, { status: 404 });
    if (error instanceof AlreadyProcessed) return badRequest(UI.adm.alreadyDone, 409);
    console.error("WhatsApp confirmation error:", error);
    return badRequest(UI.common.internal, 500);
  }
}
