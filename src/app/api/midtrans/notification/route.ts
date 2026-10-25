import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, readJson } from "@/lib/http";
import { PLANS } from "@/lib/plans";
import {
  grossAmountToRupiah,
  notificationSignature,
  paymentOutcome,
  signatureMatches,
  type MidtransNotification,
} from "@/lib/midtrans";

const BILLING_PERIOD_DAYS = 30;

function isNotification(body: unknown): body is MidtransNotification {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return ["order_id", "status_code", "gross_amount", "signature_key", "transaction_status"].every(
    (key) => typeof b[key] === "string" && b[key] !== "",
  );
}

/**
 * Midtrans payment notification (M2). Midtrans redelivers the same notification more than
 * once, so everything here is keyed on the unique SubscriptionPayment.orderId:
 * - the signature proves the body came from Midtrans (Server Key never leaves the server);
 * - the row is found by orderId, never created here, so a replay cannot add a payment;
 * - activation happens only on the one update that moves the row into PAID
 *   (`updateMany ... where status != PAID`), so a second delivery — even a concurrent
 *   one — finds nothing to update and activates nothing.
 * Responds 200 for anything already handled so Midtrans stops retrying.
 */
export async function POST(request: Request) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return badRequest("Payment notifications are not configured", 503);

  const parsed = await readJson(request);
  if (!parsed.ok) return badRequest("Request body must be valid JSON");
  if (!isNotification(parsed.body)) return badRequest("Not a Midtrans notification");
  const n = parsed.body;

  const expected = notificationSignature({
    orderId: n.order_id,
    statusCode: n.status_code,
    grossAmount: n.gross_amount,
    serverKey,
  });
  if (!signatureMatches(expected, n.signature_key)) return badRequest("Invalid signature", 401);

  const payment = await prisma.subscriptionPayment.findUnique({ where: { orderId: n.order_id } });
  // Unknown order: 404 makes Midtrans retry, which is right if checkout is mid-commit.
  if (!payment) return badRequest("Unknown order", 404);

  if (grossAmountToRupiah(n.gross_amount) !== payment.amount) {
    return badRequest("Amount does not match the order", 400);
  }

  const outcome = paymentOutcome(n.transaction_status, n.fraud_status);
  if (!outcome) return NextResponse.json({ ok: true, ignored: n.transaction_status });

  if (outcome !== "PAID") {
    // A PAID payment only ever moves on to REFUNDED; late pending/expire replays are no-ops.
    const allowedFrom = outcome === "REFUNDED" ? ["PAID"] : ["PENDING"];
    await prisma.subscriptionPayment.updateMany({
      where: { id: payment.id, status: { in: allowedFrom as ("PENDING" | "PAID")[] } },
      data: { status: outcome },
    });
    return NextResponse.json({ ok: true });
  }

  const plan = PLANS[payment.package];
  if (!plan.checkout || plan.operatorLimit === null) {
    return badRequest("This package cannot be paid through checkout", 400);
  }
  const operatorLimit = plan.operatorLimit;

  const activated = await prisma.$transaction(async (tx) => {
    const now = new Date();
    // Serialise activations for this organization, so two notifications that arrive
    // together cannot both close "the previous" subscription and both create an ACTIVE one.
    const [organization] = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Organization" WHERE id = ${payment.organizationId} FOR UPDATE`;
    if (!organization) return false;
    const claimed = await tx.subscriptionPayment.updateMany({
      where: { id: payment.id, status: { in: ["PENDING", "FAILED", "EXPIRED"] } },
      data: { status: "PAID", paidAt: now },
    });
    if (claimed.count === 0) return false; // replay: already activated

    // BUG-14 (A13): a same-plan renewal continues from the paid-for end date, so early
    // payment never costs the customer days; an upgrade or a purchase after lapse starts now
    // (unused days are not credited - that is the whole of "no proration").
    const current = await tx.subscription.findFirst({
      where: { organizationId: payment.organizationId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    const renewing = current?.package === payment.package && current.currentPeriodEnd > now;
    const periodStart = renewing ? current.currentPeriodEnd : now;
    const periodEnd = new Date(periodStart.getTime() + BILLING_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    // BUG-13: at most one ACTIVE subscription per organization. The previous one is
    // closed in this same transaction, so no reader ever sees two (or zero mid-swap).
    // A renewed row keeps its period end (access ran to the end of what was paid for).
    await tx.subscription.updateMany({
      where: { organizationId: payment.organizationId, status: "ACTIVE" },
      data: renewing ? { status: "CANCELED" } : { status: "CANCELED", currentPeriodEnd: now },
    });
    await tx.organization.update({
      where: { id: payment.organizationId },
      data: { package: payment.package, operatorLimit },
    });
    await tx.subscription.create({
      data: {
        organizationId: payment.organizationId,
        midtransSubscriptionId: payment.orderId,
        package: payment.package,
        operatorLimit,
        status: "ACTIVE",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    });
    return true;
  });

  return NextResponse.json({ ok: true, activated });
}
