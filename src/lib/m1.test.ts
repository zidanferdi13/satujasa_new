// Self-check for pure M1 helpers. Run: node --experimental-strip-types --test src/lib/m1.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, nextAvailableSlug } from "./slug.ts";
import {
  RESET_TOKEN_TTL_MINUTES,
  buildResetUrl,
  generateResetToken,
  hashResetToken,
  isResetTokenUsable,
  resetTokenExpiry,
} from "./password-reset.ts";
import { canAddOperator } from "./operator-quota.ts";

test("slugify trims, lowercases, strips accents and junk", () => {
  assert.equal(slugify("  Biro Jasa Maju  "), "biro-jasa-maju");
  assert.equal(slugify("Café & Co."), "cafe-co");
  assert.equal(slugify("   "), "org");
  assert.equal(slugify("---"), "org");
});

test("nextAvailableSlug suffixes on collision (BUG-02)", () => {
  assert.equal(nextAvailableSlug("acme", []), "acme");
  assert.equal(nextAvailableSlug("acme", ["acme"]), "acme-2");
  assert.equal(nextAvailableSlug("acme", ["acme", "acme-2", "acme-3"]), "acme-4");
  assert.equal(nextAvailableSlug("acme", ["acme-2"]), "acme");
});

test("reset tokens are random, hashed, expire and are single-use", () => {
  const a = generateResetToken();
  assert.notEqual(a, generateResetToken());
  assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(hashResetToken(a), hashResetToken(a));
  assert.notEqual(hashResetToken(a), a);
  const now = new Date("2026-10-24T00:00:00Z");
  const expiresAt = resetTokenExpiry(now);
  assert.equal(expiresAt.getTime() - now.getTime(), RESET_TOKEN_TTL_MINUTES * 60_000);
  assert.equal(isResetTokenUsable({ expiresAt, usedAt: null }, now), true);
  assert.equal(isResetTokenUsable({ expiresAt, usedAt: now }, now), false);
  assert.equal(isResetTokenUsable({ expiresAt, usedAt: null }, expiresAt), false);
  assert.equal(buildResetUrl("a b", "https://x.test/"), "https://x.test/reset-password?token=a%20b");
});

test("operator limit blocks creation at operatorLimit", () => {
  assert.equal(canAddOperator(0, 1), true);
  assert.equal(canAddOperator(1, 1), false);
  assert.equal(canAddOperator(0, 0), false);
});
