-- Migration 4 (BUG-13): at most one ACTIVE subscription per organization, enforced by the
-- database so no code path (webhook, admin script, future checkout) can create a second.

-- Databases that already ran the 1867bd7 webhook may hold duplicates: keep the newest
-- ACTIVE row per organization and close the rest, so the index below can be built.
UPDATE "Subscription" s
SET "status" = 'CANCELED', "updatedAt" = CURRENT_TIMESTAMP
WHERE s."status" = 'ACTIVE'
  AND EXISTS (
    SELECT 1 FROM "Subscription" newer
    WHERE newer."organizationId" = s."organizationId"
      AND newer."status" = 'ACTIVE'
      AND (newer."createdAt", newer."id") > (s."createdAt", s."id")
  );

-- Partial unique index: Prisma's schema language cannot express it, so it lives here only.
CREATE UNIQUE INDEX "Subscription_one_active_per_org"
  ON "Subscription" ("organizationId") WHERE "status" = 'ACTIVE';
