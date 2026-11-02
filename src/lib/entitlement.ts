/**
 * Subscription entitlement — A12/A13, BUG-15.
 *
 * "Active" is `status = ACTIVE AND currentPeriodEnd > now`, evaluated at read time: the MVP
 * has no scheduled job to flip lapsed rows, so a row that stayed ACTIVE past its end must
 * still read as expired. Entitlement is never derived from Organization.package, which
 * defaults to BASIC at registration.
 *
 * Pure: no database import, so every branch is unit tested without a connection.
 */
export type SubscriptionLike =
  | { status: string; currentPeriodEnd: Date }
  | null
  | undefined;

export function subscriptionIsActive(subscription: SubscriptionLike, now = new Date()): boolean {
  if (!subscription) return false;
  if (subscription.status !== "ACTIVE") return false;
  return subscription.currentPeriodEnd.getTime() > now.getTime();
}

/**
 * A14: an org whose limit dropped below its active operator count (Pro 3 → Basic 1) keeps
 * every row but its operators are blocked until the owner deactivates down to the limit.
 * A null limit means CUSTOM ("Sesuai kesepakatan") and is never over.
 */
export function isOverOperatorLimit(activeOperators: number, operatorLimit: number | null): boolean {
  if (operatorLimit === null) return false;
  return activeOperators > operatorLimit;
}

/**
 * An operator may sign in only when the organization is entitled and not over its limit.
 * The owner is never blocked by this: A12 gives the owner the locked screen instead.
 */
export function operatorMaySignIn(
  subscription: SubscriptionLike,
  activeOperators: number,
  operatorLimit: number | null,
  now = new Date()
): boolean {
  return subscriptionIsActive(subscription, now) && !isOverOperatorLimit(activeOperators, operatorLimit);
}
