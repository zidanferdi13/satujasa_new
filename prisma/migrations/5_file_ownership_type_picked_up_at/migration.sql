-- Migration 5 (A16/A17): File.ownershipType becomes an enum, File.pickedUpAt is added.

CREATE TYPE "OwnershipType" AS ENUM ('PERORANGAN', 'BADAN_USAHA');

-- The cast fails loudly on any value outside the enum instead of guessing a mapping.
-- Seed data only holds 'PERORANGAN'.
ALTER TABLE "File"
  ALTER COLUMN "ownershipType" TYPE "OwnershipType" USING ("ownershipType"::"OwnershipType");

-- Stamped by the server when status becomes PICKED_UP; never taken from a request body.
ALTER TABLE "File" ADD COLUMN "pickedUpAt" TIMESTAMP(3);
