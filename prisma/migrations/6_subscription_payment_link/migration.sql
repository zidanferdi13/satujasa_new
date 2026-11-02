-- Migration 6 (A18 / BUG-17): Subscription.subscriptionPaymentId links a subscription to the
-- payment that created it, so a refund can end exactly the access it paid for.
-- Nullable because subscriptions created before this migration have no recorded payment link;
-- unique because one payment can only ever create one subscription.

ALTER TABLE "Subscription" ADD COLUMN "subscriptionPaymentId" TEXT;

CREATE UNIQUE INDEX "Subscription_subscriptionPaymentId_key"
  ON "Subscription"("subscriptionPaymentId");

ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_subscriptionPaymentId_fkey"
  FOREIGN KEY ("subscriptionPaymentId") REFERENCES "SubscriptionPayment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
