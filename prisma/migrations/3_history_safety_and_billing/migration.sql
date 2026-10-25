-- Migration 3: protect revenue history (BUG-12), SAMSAT spelling (tdd-amendments A2),
-- session invalidation on password change (A6), and subscription payments for M2.
--
-- Renames are ALTER ... RENAME, not drop/recreate: the columns and enum values keep
-- their data and their indexes. Pre-launch there is no data, but the migration has to
-- be safe on a database that already has some, because it will run on the trial box.

-- 1. SAMSAT spelling -------------------------------------------------------------
ALTER TABLE "File" RENAME COLUMN "samasPayment" TO "samsatPayment";
ALTER TYPE "FileStatus" RENAME VALUE 'ON_PROGRESS_SAMAS' TO 'ON_PROGRESS_SAMSAT';
ALTER TYPE "FileStatus" RENAME VALUE 'COMPLETED_SAMAS' TO 'COMPLETED_SAMSAT';
ALTER TYPE "TransactionType" RENAME VALUE 'SAMAS_PAYMENT' TO 'SAMSAT_PAYMENT';

-- 2. BUG-12: no path may delete a File or Transaction through staff removal ---------
-- Before: User -> Member -> Operator -> File/Transaction all CASCADE, so deleting a
-- login silently erased the owner's revenue history. Now every link in that chain that
-- carries business records is RESTRICT, so the delete fails loudly instead.
ALTER TABLE "Operator" DROP CONSTRAINT "Operator_memberId_fkey";
ALTER TABLE "Operator" ADD CONSTRAINT "Operator_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "File" DROP CONSTRAINT "File_operatorId_fkey";
ALTER TABLE "File" ADD CONSTRAINT "File_operatorId_fkey"
  FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_operatorId_fkey";
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_operatorId_fkey"
  FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. BUG-09: sessions issued before a password reset must stop working --------------
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

-- 4. M2: subscription payments ------------------------------------------------------
CREATE TYPE "PaymentKind" AS ENUM ('PURCHASE', 'UPGRADE');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED');

CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "package" "Package" NOT NULL,
    "kind" "PaymentKind" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- The idempotency key: Midtrans redelivers the same notification, and a second
-- delivery must hit this constraint instead of activating a second time.
CREATE UNIQUE INDEX "SubscriptionPayment_orderId_key" ON "SubscriptionPayment"("orderId");
CREATE INDEX "SubscriptionPayment_organizationId_status_idx"
  ON "SubscriptionPayment"("organizationId", "status");

ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
