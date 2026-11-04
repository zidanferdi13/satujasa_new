import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
import {
  EXPORT_COLUMNS,
  buildWorkbook,
  defaultExportRange,
  exportHeaders,
  exportRows,
  exportSheet,
  exportWhere,
  jakartaDayKey,
  jakartaDayRange,
  type ExportFile,
} from "./export.ts";
import { UI } from "./ui-strings.ts";

const file = (over: Partial<ExportFile> = {}): ExportFile => ({
  createdAt: new Date("2026-11-04T03:15:00Z"),
  customerName: "Budi Santoso",
  // A NIK with a leading zero: the case that turns into 8 digits if it ever becomes a number.
  customerKtp: "0320000000000001",
  vehicleNumber: "B 1234 XYZ",
  ownershipType: "PERORANGAN",
  serviceType: "STNK",
  status: "PICKED_UP",
  operatorName: "Operator Demo",
  finalPrice: 1_500_000,
  samsatPayment: 1_100_000,
  serviceFee: 400_000,
  ...over,
});

test("headers come from the approved strings, not from field names", () => {
  const headers = exportHeaders();
  assert.deepEqual(headers, EXPORT_COLUMNS.map((column) => column.header));
  assert.ok(headers.includes(UI.file.customerKtp));
  assert.ok(headers.includes(UI.th.ownership));
  assert.ok(headers.includes(UI.file.serviceFee));
  // A raw enum or a camelCase field name on a printed sheet is a bug, not a typo.
  for (const header of headers) {
    assert.doesNotMatch(header, /[a-z][A-Z]/, `header looks like a field name: ${header}`);
    assert.doesNotMatch(header, /^[A-Z_]+$/, `header is a raw enum: ${header}`);
  }
});

test("the owner gets the full KTP, and only as text", () => {
  const [row] = exportRows([file()]);
  assert.equal(row[2], "0320000000000001");
  const [sheetRow] = exportSheet([file()]);
  assert.equal(sheetRow[2], "0320000000000001");
  assert.equal(typeof sheetRow[2], "string");
  // Masking here would defeat the export's only purpose (A17).
  assert.doesNotMatch(String(row[2]), /•/);
});

test("ownership and service render as labels, status as its display word", () => {
  const [row] = exportRows([file({ ownershipType: "YAYASAN", serviceType: "SIM_B", status: "CANCELED" })]);
  assert.equal(row[4], "Yayasan");
  assert.equal(row[5], "SIM B");
  assert.equal(row[6], "Dibatalkan");
});

test("money is a number in the spreadsheet and rupiah text on the printed sheet", () => {
  const [sheetRow] = exportSheet([file()]);
  assert.equal(sheetRow[8], 1_500_000);
  assert.equal(sheetRow[9], 1_100_000);
  assert.equal(sheetRow[10], 400_000);

  const [row] = exportRows([file()]);
  assert.equal(row[8], "Rp 1.500.000");
  assert.equal(row[10], "Rp 400.000");
});

test("an unpriced berkas is blank, never zero", () => {
  const unpriced = file({ status: "DRAFT", finalPrice: null, samsatPayment: null, serviceFee: null });
  const [row] = exportRows([unpriced]);
  assert.equal(row[8], "");
  assert.equal(row[9], "");
  assert.equal(row[10], "");
  // The workbook still needs a numeric cell for those columns, so Excel can sum them.
  const [sheetRow] = exportSheet([unpriced]);
  assert.equal(sheetRow[8], 0);
});

test("the workbook is a real xlsx with one header row and every berkas", () => {
  const buffer = buildWorkbook([file(), file({ customerName: "Siti Aminah", customerKtp: "3200000000000002" })]);
  assert.ok(buffer.length > 1000);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false });
  assert.deepEqual(matrix[0], exportHeaders());
  assert.equal(matrix.length, 3);
  // Leading zero survives the round trip: this is why the cell is written as text.
  assert.equal(String(matrix[1][2]), "0320000000000001");
});

test("the day range is Jakarta midnight to the next Jakarta midnight, end exclusive", () => {
  const range = jakartaDayRange("2026-11-01", "2026-11-30");
  assert.ok(range);
  assert.equal(range.start.toISOString(), "2026-10-31T17:00:00.000Z");
  assert.equal(range.end.toISOString(), "2026-11-30T17:00:00.000Z");
  // A berkas entered at 23:30 WIB on the 30th is inside the range; 00:30 WIB on 1 Dec is not.
  const late = new Date("2026-11-30T16:30:00Z");
  const nextMonth = new Date("2026-11-30T17:30:00Z");
  assert.ok(late >= range.start && late < range.end);
  assert.ok(!(nextMonth < range.end));
});

test("a malformed or inverted day range is refused rather than guessed", () => {
  assert.equal(jakartaDayRange("2026-11-01", "2026-11-30T00:00"), null);
  assert.equal(jakartaDayRange("", "2026-11-30"), null);
  assert.equal(jakartaDayRange("2026-11-30", "2026-11-01"), null);
  assert.equal(jakartaDayRange("2026-11-01", "2026-12-32"), null);
  // A single day is a legitimate report ("hari ini"), so from === to is not an error.
  const oneDay = jakartaDayRange("2026-11-04", "2026-11-04");
  assert.ok(oneDay);
  assert.equal(oneDay.end.getTime() - oneDay.start.getTime(), 24 * 60 * 60 * 1000);
});

test("§19: the page opens on the Jakarta month to date, not the UTC one", () => {
  // 18:30 UTC on 31 October is already 01:30 on 1 November in Jakarta. A page in UTC would open on
  // October and offer the owner a range that ends in the wrong month.
  const boundary = new Date("2026-10-31T18:30:00Z");
  assert.equal(jakartaDayKey(boundary), "2026-11-01");
  assert.deepEqual(defaultExportRange(boundary), { from: "2026-11-01", to: "2026-11-01" });

  const midMonth = new Date("2026-11-04T03:15:00Z");
  assert.deepEqual(defaultExportRange(midMonth), { from: "2026-11-01", to: "2026-11-04" });
});

test("§19: the count on the page and the file's contents share one predicate", () => {
  // If these were two queries, the page could report "3 berkas" above a file holding four — the
  // same failure as the per-operator count, one layer up.
  const route = readFileSync(new URL("../app/api/export/route.ts", import.meta.url), "utf8");
  const page = readFileSync(
    new URL("../app/dashboard/owner/export/page.tsx", import.meta.url),
    "utf8"
  );
  assert.match(route, /where: exportWhere\(/);
  assert.match(page, /exportWhere\(/);
  // Neither may hand-roll the range again.
  assert.doesNotMatch(route, /createdAt: \{ gte/);
  assert.doesNotMatch(page, /createdAt: \{ gte/);

  const range = jakartaDayRange("2026-11-01", "2026-11-04");
  assert.ok(range);
  assert.deepEqual(exportWhere("org-1", range), {
    organizationId: "org-1",
    createdAt: { gte: range.start, lt: range.end },
  });
});

test("§19/A12: the export page carries no entitlement gate", () => {
  // "Data Anda tetap tersimpan dan bisa diekspor" is on the locked screen, which links here. A gate
  // on this route would make that sentence false on the only screen that says it.
  const page = readFileSync(
    new URL("../app/dashboard/owner/export/page.tsx", import.meta.url),
    "utf8"
  ).replace(/\/\*[\s\S]*?\*\//g, ""); // the comment that explains *why* there is no gate
  assert.doesNotMatch(page, /organizationIsEntitled/);
  assert.doesNotMatch(page, /dashboard\/subscription/);

  // The link from the locked screen exists, and it points at that page.
  const locked = readFileSync(
    new URL("../app/dashboard/subscription/subscribe-client.tsx", import.meta.url),
    "utf8"
  );
  assert.match(locked, /href="\/dashboard\/owner\/export"/);
});

test("§19: a malformed or inverted range answers in the owner's words", () => {
  const route = readFileSync(new URL("../app/api/export/route.ts", import.meta.url), "utf8");
  assert.match(route, /badRequest\(UI\.exp\.errRange\)/);
  // The old body is a message for whoever reads the server log, not for someone picking dates.
  assert.match(UI.exp.errRange, /Tanggal tidak valid/);
  assert.notEqual(UI.exp.errRange, UI.common.invalidInput);
});
