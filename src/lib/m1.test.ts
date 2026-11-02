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
  resetThrottleCutoff,
  resetTokenExpiry,
} from "./password-reset.ts";
import { canAddOperator } from "./operator-quota.ts";
import { accessFor } from "./access.ts";
import { formatRupiah } from "./money.ts";
import { PLANS } from "./plans.ts";
import {
  BRAND_COPY,
  CTA_COPY,
  FAQ_COPY,
  FEATURES_COPY,
  FOOTER_COPY,
  HERO_COPY,
  NAV_COPY,
  PRICING_COPY,
  WHATSAPP_URL,
  planCtaHref,
  planCtaLabel,
} from "./landing-copy.ts";

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

test("formatRupiah renders Indonesian thousands, whole rupiah only", () => {
  assert.equal(formatRupiah(99000), "Rp 99.000");
  assert.equal(formatRupiah(249000), "Rp 249.000");
  assert.equal(formatRupiah(0), "Rp 0");
  assert.equal(formatRupiah(1234567), "Rp 1.234.567");
  assert.equal(formatRupiah(-5000), "-Rp 5.000");
  assert.throws(() => formatRupiah(99000.5), TypeError);
});

test("plans match the PM-locked contract", () => {
  assert.deepEqual(
    Object.values(PLANS).map((p) => [p.id, p.priceMonthly, p.operatorLimit, p.checkout, p.featured]),
    [
      ["BASIC", 99000, 1, true, false],
      ["PRO", 249000, 3, true, true],
      ["CUSTOM", null, null, false, false],
    ]
  );
});

test("accessFor fails closed (BUG-07)", () => {
  const org = "org1";
  assert.equal(accessFor(null), null, "no membership: no access");
  assert.equal(accessFor(undefined), null);
  assert.deepEqual(accessFor({ organizationId: org, role: "OWNER" }), { organizationId: org, role: "OWNER" });
  assert.deepEqual(
    accessFor({ organizationId: org, role: "OPERATOR", operator: { isActive: true } }),
    { organizationId: org, role: "OPERATOR" }
  );
  assert.equal(accessFor({ organizationId: org, role: "OPERATOR", operator: { isActive: false } }), null, "deactivated");
  assert.equal(accessFor({ organizationId: org, role: "OPERATOR", operator: null }), null, "no staff profile");
  assert.equal(accessFor({ organizationId: org, role: "ADMIN" }), null, "unknown role");
});

test("reset throttle window is 60 seconds back", () => {
  const now = new Date("2026-10-25T00:01:00Z");
  assert.equal(resetThrottleCutoff(now).toISOString(), "2026-10-25T00:00:00.000Z");
});

test("FAQ ships all six items, seat question third", () => {
  // Designer re-issued FAQ #3 under the CEO seat rule (ui-strings-id.md §13).
  assert.equal(FAQ_COPY.items.length, 6);
  assert.match(FAQ_COPY.items[2].question, /operator yang bisa saya tambahkan/i);
  assert.match(FAQ_COPY.items[2].answer, /akun owner memakai satu slot/);
});

test("landing copy only ever mentions a trial to deny one", () => {
  // The FAQ has to answer the question ("Tidak."), so the check is: nowhere else may a
  // trial be offered, and the one mention must be a refusal.
  const trialItem = FAQ_COPY.items.find((item) => /uji coba/i.test(item.question));
  assert.ok(trialItem);
  assert.match(trialItem.answer, /^Tidak\./);

  const offerSurface = JSON.stringify({
    HERO_COPY,
    FEATURES_COPY,
    PRICING_COPY,
    CTA_COPY,
    FOOTER_COPY,
  });
  assert.equal(/gratis|free trial|uji coba/i.test(offerSurface), false);
});

test("landing prices are formatted by formatRupiah only", () => {
  assert.match(HERO_COPY.microcopy, /^Mulai dari Rp 99\.000\/bulan\.$/);
  assert.equal(formatRupiah(PLANS.PRO.priceMonthly), "Rp 249.000");
  assert.equal(planCtaLabel("BASIC"), "Pilih Basic");
  assert.equal(planCtaLabel("PRO"), "Pilih Pro");
});

test("Custom card and footer contact both go to the client's WhatsApp number", () => {
  assert.equal(planCtaLabel("CUSTOM"), "Hubungi Kami");
  assert.equal(planCtaHref("CUSTOM"), WHATSAPP_URL);
  assert.equal(planCtaHref("BASIC"), "/register");
  assert.equal(planCtaHref("PRO"), "/register");
  assert.equal(FOOTER_COPY.contactLink.href, WHATSAPP_URL);
  assert.ok(WHATSAPP_URL.startsWith("https://wa.me/6281319535441?text="));
  assert.match(decodeURIComponent(WHATSAPP_URL), /paket Custom/);
});

test("no shipped copy says samas, and revenue is never described as fee-subtracted", () => {
  // CEO: the spelling is always SAMSAT, and revenue = customer payment − SAMSAT cost.
  // The re-issued feature line must not subtract a service fee a second time.
  const surface = JSON.stringify({
    NAV_COPY,
    HERO_COPY,
    FEATURES_COPY,
    PRICING_COPY,
    FAQ_COPY,
    CTA_COPY,
    FOOTER_COPY,
    BRAND_COPY,
  });
  assert.equal(/samas(?!t)/i.test(surface), false, "old spelling is back in shipped copy");
  assert.equal(/biaya layanan/i.test(surface), false, "old revenue wording is back");
  assert.equal(FEATURES_COPY.items.length, 6);
  const report = FEATURES_COPY.items.find((item) => item.title === "Laporan Keuangan Otomatis");
  assert.ok(report);
  assert.match(report.body, /dikurangi biaya SAMSAT/);
});

test("landing copy is verbatim from the locked docs", async () => {
  const { readFile } = await import("node:fs/promises");
  const docs =
    (await readFile(new URL("../../docs/landing-copy-id.md", import.meta.url), "utf8")) +
    (await readFile(new URL("../../docs/ui-strings-id.md", import.meta.url), "utf8"));
  const strings = [
    ...FEATURES_COPY.items.flatMap((i) => [i.title, i.body]),
    ...FAQ_COPY.items.flatMap((i) => [i.question, i.answer]),
    FAQ_COPY.heading,
    PRICING_COPY.seatNote,
  ];
  for (const s of strings) assert.ok(docs.includes(s), `not in docs: ${s}`);
});

test("footer only links to sections that exist", () => {
  const allowed = new Set(["#fitur", "#harga", "#faq"]);
  for (const link of FOOTER_COPY.productLinks) {
    assert.ok(allowed.has(link.href), `unexpected dead footer link ${link.href}`);
  }
});
