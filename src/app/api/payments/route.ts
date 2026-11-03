import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { badRequest, readJson } from "@/lib/http";
import { startPayment, PaymentRefused, PlanNotPurchasable } from "@/lib/payments";
import { UI } from "@/lib/ui-strings";

/**
 * Owner picks a plan (§15 state A → B). The organization comes from the session, never the body,
 * so a caller cannot open a payment against someone else's tenant.
 *
 * The server sets the amount from the price table; a `amount` in the body is ignored by
 * construction (only `plan` is read).
 */
export async function POST(request: Request) {
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  if (!session?.user || !organizationId) return badRequest(UI.common.notSignedIn, 401);
  if (session.user.role !== "OWNER") return badRequest(UI.addop.ownerOnly, 403);

  const parsedBody = await readJson(request);
  if (!parsedBody.ok) return badRequest(UI.common.badJson);

  const plan = (parsedBody.body as { plan?: unknown } | null)?.plan;
  if (typeof plan !== "string") return badRequest(UI.common.invalidInput);

  try {
    const payment = await startPayment(organizationId, plan);
    return NextResponse.json(
      {
        payment: {
          id: payment.id,
          code: payment.orderId,
          amount: payment.amount,
          package: payment.package,
          status: payment.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof PlanNotPurchasable) return badRequest(UI.common.invalidInput, 400);
    if (error instanceof PaymentRefused) return badRequest(UI.co.downgradeRefused, 409);
    console.error("Start payment error:", error);
    return badRequest(UI.common.internal, 500);
  }
}
