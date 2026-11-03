import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { periodFor } from "./payment-period.ts";
import { bankAccountFromEnv } from "./payment-bank.ts";
import { MAX_RECEIPT_BYTES, sniffReceipt } from "./payment-receipt.ts";
import { queueAgeLabel } from "./queue-age.ts";
import { UI } from "./ui-strings.ts";

// A13/A20: what a paid month actually covers. The end is the last instant of the day in WIB,
// because "aktif sampai 2 Des 2026" has to be true at 23:00 Jakarta, not at 07:00.
test("periodFor: a purchase starts now and ends on the last instant of the same day next month", () => {
  const now = new Date("2026-11-02T03:00:00.000Z"); // 10:00 WIB
  const { start, end } = periodFor(now, null, false);
  assert.equal(start.toISOString(), now.toISOString());
  // 2 Dec 2026 23:59:59.999 WIB = 16:59:59.999Z
  assert.equal(end.toISOString(), "2026-12-02T16:59:59.999Z");
});

test("periodFor: a renewal continues from the paid period, not from today", () => {
  const now = new Date("2026-11-02T03:00:00.000Z");
  const current = { currentPeriodEnd: new Date("2026-11-20T16:59:59.999Z") };
  const { start, end } = periodFor(now, current, true);
  assert.equal(start.toISOString(), "2026-11-20T16:59:59.999Z");
  assert.equal(end.toISOString(), "2026-12-20T16:59:59.999Z");
});

test("periodFor: a lapsed subscription renews from today, and an upgrade starts today", () => {
  const now = new Date("2026-11-02T03:00:00.000Z");
  const lapsed = { currentPeriodEnd: new Date("2026-10-01T16:59:59.999Z") };
  assert.equal(periodFor(now, lapsed, true).start.toISOString(), now.toISOString());
  const live = { currentPeriodEnd: new Date("2026-11-20T16:59:59.999Z") };
  assert.equal(periodFor(now, live, false).start.toISOString(), now.toISOString());
});

test("periodFor: month-end clamps instead of rolling into March", () => {
  // 31 Jan 2027 WIB + 1 month = 28 Feb 2027 (2027 is not a leap year).
  const { end } = periodFor(new Date("2027-01-31T03:00:00.000Z"), null, false);
  assert.equal(end.toISOString(), "2027-02-28T16:59:59.999Z");
});

// A20: with no bank env — or the .env.example zeros — the screen must offer WhatsApp only.
test("bankAccountFromEnv: null when anything is missing or still the placeholder", () => {
  assert.equal(bankAccountFromEnv({}), null);
  assert.equal(
    bankAccountFromEnv({ BANK_NAME: "BCA", BANK_ACCOUNT_NUMBER: "  ", BANK_ACCOUNT_NAME: "PT" }),
    null
  );
  assert.equal(
    bankAccountFromEnv({
      BANK_NAME: "BCA",
      BANK_ACCOUNT_NUMBER: "0000000000",
      BANK_ACCOUNT_NAME: "PT",
    }),
    null
  );
  assert.deepEqual(
    bankAccountFromEnv({ BANK_NAME: "BCA", BANK_ACCOUNT_NUMBER: "123", BANK_ACCOUNT_NAME: "PT" }),
    { bankName: "BCA", accountNumber: "123", accountName: "PT" }
  );
});

// A20: the type comes from the bytes, never from the extension or the browser's Content-Type.
test("sniffReceipt: magic bytes decide, and anything else is refused", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
  const html = new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e]);
  assert.deepEqual(sniffReceipt(jpeg), { mime: "image/jpeg", ext: "jpg" });
  assert.deepEqual(sniffReceipt(png), { mime: "image/png", ext: "png" });
  assert.deepEqual(sniffReceipt(pdf), { mime: "application/pdf", ext: "pdf" });
  assert.equal(sniffReceipt(html), null);
  assert.equal(sniffReceipt(new Uint8Array()), null);
  assert.equal(MAX_RECEIPT_BYTES, 5 * 1024 * 1024);
});

// A21: plain elapsed age, stated in the Designer's words. No working-day arithmetic anywhere.
test("queueAgeLabel: today, yesterday, then a plain day count", () => {
  assert.equal(queueAgeLabel(0), UI.adm.ageToday);
  assert.equal(queueAgeLabel(1), UI.adm.ageYesterday);
  assert.equal(queueAgeLabel(2), UI.adm.ageDays("2"));
});

// A20 structural: the admin console never reads a tenant's files, KTP or transactions.
test("A20: nothing under the admin console touches File or Transaction", () => {
  const hits = execSync(
    "git grep -nE 'prisma\\.(file|transaction)|file-queries' -- src/app/api/admin src/app/dashboard/admin || true",
    { cwd: new URL("../..", import.meta.url).pathname }
  )
    .toString()
    .trim();
  assert.equal(hits, "");
});

// BUG-18, fail closed: a missing identity is a refusal, never an unfiltered Prisma query.
// The guard returns before Prisma is loaded, so this runs without a database.
test("BUG-18: activeSeatFor(undefined, orgId) returns null", async () => {
  const { activeSeatFor } = await import("./seat-guard.ts");
  assert.equal(await activeSeatFor(undefined as unknown as string, "org_1"), null);
  assert.equal(await activeSeatFor("", "org_1"), null);
  assert.equal(await activeSeatFor("user_1", ""), null);
});

test("BUG-18: adminSession refuses a session without an id (401, no verifier)", () => {
  const admin = readFileSync(new URL("./admin-api.ts", import.meta.url), "utf8");
  assert.match(admin, /if \(!userId\) return \{ ok: false, status: 401/);
  assert.doesNotMatch(admin, /userId: session\.user\.id/);
});
