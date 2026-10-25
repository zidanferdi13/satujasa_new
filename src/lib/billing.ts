import type { Package } from "@prisma/client";
import { PLANS } from "./plans.ts";

/**
 * Checkout rules for M2 (PM ruling: no downgrade in the MVP; the webhook cannot enforce
 * this because by then the money is already taken).
 *
 * Returns the reason to refuse, or null when the order may be created. The checkout
 * endpoint must call this before it creates a SubscriptionPayment row.
 */
export type CheckoutRefusal = "PLAN_NOT_PURCHASABLE" | "DOWNGRADE_NOT_SUPPORTED";

export function checkoutRefusal(currentPackage: Package, targetPackage: Package): CheckoutRefusal | null {
  const target = PLANS[targetPackage];
  if (!target.checkout) return "PLAN_NOT_PURCHASABLE";

  // Pro is the top plan, so any paid package other than Pro is a downgrade. Same-plan
  // renewal stays allowed: it pays for the next period, it does not reduce the limit.
  if (currentPackage === "PRO" && targetPackage !== "PRO") return "DOWNGRADE_NOT_SUPPORTED";

  return null;
}
