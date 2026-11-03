import { NextResponse } from "next/server";
import { adminSession } from "@/lib/admin-api";
import { badRequest } from "@/lib/http";
import { AlreadyProcessed, PaymentNotFound, PlanNotPurchasable, verifyPayment } from "@/lib/payments";
import { UI } from "@/lib/ui-strings";

/**
 * A20: verification. One transaction creates or extends the subscription *and* gives the owner
 * their seat (A24), so a freshly activated Basic org can record a berkas with no manual step.
 * Re-verifying the same payment matches zero WAITING_VERIFICATION rows and is refused (409),
 * which is what keeps a second subscription, and a second owner row, from existing.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const admin = await adminSession();
  if (!admin.ok) return badRequest(admin.message, admin.status);

  const { paymentId } = await params;
  try {
    const subscription = await verifyPayment(paymentId, admin.userId);
    return NextResponse.json({
      ok: true,
      package: subscription.package,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (error) {
    if (error instanceof PaymentNotFound) return NextResponse.json({}, { status: 404 });
    if (error instanceof AlreadyProcessed) return badRequest(UI.adm.staleQueue, 409);
    if (error instanceof PlanNotPurchasable) return badRequest(UI.adm.errGeneric, 400);
    console.error("Verify payment error:", error);
    return badRequest(UI.adm.errGeneric, 500);
  }
}
