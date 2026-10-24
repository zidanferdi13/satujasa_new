-- Refuse to run if any stored amount has a fractional part: the cast below would
-- round it silently. Whole-rupiah data (all data so far) converts losslessly.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "File"
    WHERE "estimatedPrice" <> trunc("estimatedPrice") OR "dpAmount" <> trunc("dpAmount")
       OR "finalPrice" <> trunc("finalPrice") OR "samasPayment" <> trunc("samasPayment")
       OR "serviceFee" <> trunc("serviceFee") OR "revenue" <> trunc("revenue")
  ) OR EXISTS (SELECT 1 FROM "Transaction" WHERE "amount" <> trunc("amount")) THEN
    RAISE EXCEPTION 'Fractional rupiah amounts found; fix the data before converting money to INTEGER';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "File" ALTER COLUMN "estimatedPrice" SET DATA TYPE INTEGER,
ALTER COLUMN "dpAmount" SET DATA TYPE INTEGER,
ALTER COLUMN "finalPrice" SET DATA TYPE INTEGER,
ALTER COLUMN "samasPayment" SET DATA TYPE INTEGER,
ALTER COLUMN "serviceFee" SET DATA TYPE INTEGER,
ALTER COLUMN "revenue" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

