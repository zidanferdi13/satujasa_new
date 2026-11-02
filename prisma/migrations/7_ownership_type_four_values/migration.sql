-- Migration 7 (A23): OwnershipType is closed at four values. Additive only: existing rows keep
-- PERORANGAN/BADAN_USAHA, and no data is updated here.
ALTER TYPE "OwnershipType" ADD VALUE IF NOT EXISTS 'PEMERINTAH';
ALTER TYPE "OwnershipType" ADD VALUE IF NOT EXISTS 'YAYASAN';
