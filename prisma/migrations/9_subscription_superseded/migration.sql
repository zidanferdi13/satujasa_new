-- Migration 9 (A25): SubscriptionStatus gains SUPERSEDED, "replaced by an upgrade".
-- Additive only, no data statement: PG cannot use a new enum value in the transaction that adds
-- it, so only application code writes it.
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'SUPERSEDED';
