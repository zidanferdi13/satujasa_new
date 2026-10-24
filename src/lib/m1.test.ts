// Self-check for pure M1 helpers. Run: node --experimental-strip-types --test src/lib/m1.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, nextAvailableSlug } from "./slug.ts";

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
