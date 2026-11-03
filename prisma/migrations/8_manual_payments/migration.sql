-- A20 (manual transfer replaces Midtrans): one migration, no row is deleted.
--
-- 1. PaymentStatus is rewritten to the four manual states. Existing rows map by meaning:
--    PENDING/EXPIRED were never paid -> UNPAID, FAILED/REFUNDED -> REJECTED, PAID stays PAID.
-- 2. The gateway columns go: Organization.subscriptionId, Subscription.midtransSubscriptionId,
--    Transaction.midtransOrderId. TransactionStatus.REFUNDED is tenant cash flow and stays.
-- 3. User.platformRole marks platform staff without putting them inside an organization.
-- 4. SubscriptionPayment gains the verification and receipt audit columns.

-- 1. PaymentStatus
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";

CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'WAITING_VERIFICATION', 'PAID', 'REJECTED');

ALTER TABLE "SubscriptionPayment" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "SubscriptionPayment"
  ALTER COLUMN "status" TYPE "PaymentStatus"
  USING (
    CASE "status"::text
      WHEN 'PENDING'  THEN 'UNPAID'
      WHEN 'PAID'     THEN 'PAID'
      WHEN 'EXPIRED'  THEN 'UNPAID'
      WHEN 'FAILED'   THEN 'REJECTED'
      WHEN 'REFUNDED' THEN 'REJECTED'
    END
  )::"PaymentStatus";

ALTER TABLE "SubscriptionPayment" ALTER COLUMN "status" SET DEFAULT 'UNPAID';

DROP TYPE "PaymentStatus_old";

-- 2. Gateway columns
ALTER TABLE "Organization" DROP COLUMN "subscriptionId";
ALTER TABLE "Subscription" DROP COLUMN "midtransSubscriptionId";
ALTER TABLE "Transaction" DROP COLUMN "midtransOrderId";

-- 3. Platform admin
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN');
ALTER TABLE "User" ADD COLUMN "platformRole" "PlatformRole";

-- 4. Verification and receipt audit
ALTER TABLE "SubscriptionPayment"
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedByUserId" TEXT,
  ADD COLUMN "rejectedAt" TIMESTAMP(3),
  ADD COLUMN "rejectedByUserId" TEXT,
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "receiptPath" TEXT,
  ADD COLUMN "receiptMime" TEXT,
  ADD COLUMN "receiptSize" INTEGER,
  ADD COLUMN "receiptUploadedAt" TIMESTAMP(3);

CREATE INDEX "SubscriptionPayment_status_submittedAt_idx"
  ON "SubscriptionPayment"("status", "submittedAt");
