/**
 * Midtrans notification handling (M2). Kept free of Prisma and Next so the signature
 * and status rules can be unit-tested directly.
 *
 * Docs: the notification body carries `order_id`, `status_code`, `gross_amount` and
 * `signature_key`; the signature is SHA-512 of `order_id + status_code + gross_amount +
 * ServerKey`, so an unsigned request can never be trusted to change a subscription.
 */
import { createHash, timingSafeEqual } from "node:crypto";

export type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
};

/** The four states a SubscriptionPayment can hold after a notification. */
export type PaymentOutcome = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

export function notificationSignature(input: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  serverKey: string;
}): string {
  return createHash("sha512")
    .update(`${input.orderId}${input.statusCode}${input.grossAmount}${input.serverKey}`)
    .digest("hex");
}

/** Constant-time compare that also rejects a length mismatch. */
export function signatureMatches(expected: string, given: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Maps a notification to the state to store. `undefined` means "nothing to record":
 * a status we do not recognise must not silently mark a payment paid or failed.
 */
export function paymentOutcome(
  transactionStatus: string,
  fraudStatus?: string,
): PaymentOutcome | undefined {
  switch (transactionStatus) {
    case "capture":
      // Card payments arrive as capture; Midtrans asks for the fraud decision.
      if (fraudStatus === "accept") return "PAID";
      if (fraudStatus === "deny") return "FAILED";
      return "PENDING";
    case "settlement":
      return "PAID";
    case "pending":
      return "PENDING";
    case "deny":
    case "cancel":
    case "failure":
      return "FAILED";
    case "expire":
      return "EXPIRED";
    case "refund":
    case "partial_refund":
    case "chargeback":
    case "partial_chargeback":
      // Refunds are issued by hand in the Midtrans dashboard (TDD); we only record them.
      return "REFUNDED";
    default:
      return undefined;
  }
}

/** Midtrans sends `gross_amount` as "99000.00"; money is whole rupiah everywhere else. */
export function grossAmountToRupiah(grossAmount: string): number | null {
  const trimmed = grossAmount.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  if (!Number.isInteger(value)) return null; // we never bill fractional rupiah
  return value;
}
