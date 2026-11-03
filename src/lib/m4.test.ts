import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { jakartaMonthKey, revenueByOperator } from "./revenue.ts";

const picked = (revenue: number | null, operatorId = "op1", operatorName = "Andi") => ({
  operatorId,
  operatorName,
  revenue,
});

test("item 5: per-operator revenue sums paid minus SAMSAT cost, owner included", () => {
  const report = revenueByOperator([
    picked(150_000),
    picked(50_000),
    picked(249_000, "owner", "Zidan"),
  ]);

  assert.equal(report.byOperator.length, 2);
  assert.equal(report.total.revenue, 449_000);
  assert.equal(report.total.files, 3);
  // The owner's own berkas are part of the same sum, not a separate total.
  assert.equal(report.byOperator.find((row) => row.operatorId === "owner")?.revenue, 249_000);
});

test("item 5: a file with no revenue contributes to no total, not as a zero", () => {
  const report = revenueByOperator([picked(null)]);

  assert.deepEqual(report.byOperator, []);
  assert.deepEqual(report.total, { files: 0, revenue: 0 });
});

test("item 5: a file's serviceFee is the same number as its revenue, never a second metric", () => {
  // file-rules.ts sets both from one computation; this guards the assumption the report rests on.
  const rules = readFileSync(new URL("./file-rules.ts", import.meta.url), "utf8");
  assert.match(rules, /return \{ serviceFee: fee, revenue: fee \};/);
});

test("biggest contributor first, then by name", () => {
  const report = revenueByOperator([
    picked(10_000, "a", "Budi"),
    picked(10_000, "b", "Ani"),
    picked(90_000, "c", "Citra"),
  ]);
  assert.deepEqual(
    report.byOperator.map((row) => row.operatorName),
    ["Citra", "Ani", "Budi"]
  );
});

test("a picked-up time belongs to the month Jakarta says it does", () => {
  // 31 Oct 23:30 UTC is 1 Nov 06:30 in Jakarta: the report must not push it back a month.
  assert.equal(jakartaMonthKey(new Date("2026-10-31T23:30:00Z")), "2026-11");
  assert.equal(jakartaMonthKey(new Date("2026-10-31T16:59:00Z")), "2026-10");
});
