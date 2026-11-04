import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { formatJakartaDate, formatJakartaDateTime } from "./date-format.ts";
import { formatRupiah } from "./money.ts";
import { UI } from "./ui-strings.ts";

/**
 * Owner export (item 9, A12/A17). One column definition feeds both formats, so the spreadsheet
 * and the PDF can never disagree about what a column is called or which field it comes from.
 *
 * The KTP is written in full here and that is deliberate: this is the owner's own data going back
 * to the owner, which is the entire point of an export. Masking belongs to lists, tables and logs,
 * where other people can see the value (A17). Operators have no export path at all.
 */

export type ExportFile = {
  createdAt: Date;
  customerName: string;
  customerKtp: string;
  vehicleNumber: string;
  ownershipType: keyof typeof UI.ownership;
  serviceType: keyof typeof UI.service;
  status: keyof typeof UI.status;
  operatorName: string;
  finalPrice: number | null;
  samsatPayment: number | null;
  serviceFee: number | null;
};

type Column = {
  header: string;
  /** Value as text, for the PDF and for anything that must not be coerced. */
  text: (file: ExportFile) => string;
  /** Spreadsheet value: money stays a number so the owner can sum it in Excel. */
  cell: (file: ExportFile) => string | number;
};

const money = (amount: number | null) => (amount === null ? 0 : amount);

/**
 * Order is the order the owner reads a berkas in: when, who, what vehicle, what was done, where it
 * stands, who did it, then the three money columns in the same order as the file form.
 */
export const EXPORT_COLUMNS: readonly Column[] = [
  {
    header: UI.file.createdAt,
    text: (f) => formatJakartaDate(f.createdAt),
    cell: (f) => formatJakartaDate(f.createdAt),
  },
  {
    header: UI.file.customerName,
    text: (f) => f.customerName,
    cell: (f) => f.customerName,
  },
  {
    // Full NIK, kept as a string so a leading zero survives Excel's type inference.
    header: UI.file.customerKtp,
    text: (f) => f.customerKtp,
    cell: (f) => f.customerKtp,
  },
  {
    header: UI.file.vehicleNumber,
    text: (f) => f.vehicleNumber,
    cell: (f) => f.vehicleNumber,
  },
  {
    header: UI.th.ownership,
    text: (f) => UI.ownership[f.ownershipType],
    cell: (f) => UI.ownership[f.ownershipType],
  },
  {
    header: UI.file.serviceType,
    text: (f) => UI.service[f.serviceType],
    cell: (f) => UI.service[f.serviceType],
  },
  {
    header: UI.file.status,
    text: (f) => UI.status[f.status],
    cell: (f) => UI.status[f.status],
  },
  {
    header: UI.th.operator,
    text: (f) => f.operatorName,
    cell: (f) => f.operatorName,
  },
  {
    header: UI.file.finalPrice,
    text: (f) => (f.finalPrice === null ? "" : formatRupiah(f.finalPrice)),
    cell: (f) => money(f.finalPrice),
  },
  {
    header: UI.file.samsatPayment,
    text: (f) => (f.samsatPayment === null ? "" : formatRupiah(f.samsatPayment)),
    cell: (f) => money(f.samsatPayment),
  },
  {
    // The fee, never finalPrice − fee: A1 says the fee is the revenue, not a cost.
    header: UI.file.serviceFee,
    text: (f) => (f.serviceFee === null ? "" : formatRupiah(f.serviceFee)),
    cell: (f) => money(f.serviceFee),
  },
];

/**
 * The owner picks calendar days in Jakarta. A day starts at 00:00 WIB, so the range is built from
 * that offset rather than from the server's clock zone; `end` is exclusive, which is what makes an
 * inclusive "1 sampai 30" one comparison instead of an off-by-a-millisecond.
 */
/**
 * The one predicate both the download and the page's count use. Two copies of "which berkas are in
 * this range" would let the page say "3 berkas" above a file containing four, which is the same
 * failure the count column had: two answers to one question.
 */
export function exportWhere(
  organizationId: string,
  range: { start: Date; end: Date }
): { organizationId: string; createdAt: { gte: Date; lt: Date } } {
  return { organizationId, createdAt: { gte: range.start, lt: range.end } };
}

/** The Jakarta calendar day a moment falls on, as `YYYY-MM-DD`. WIB has no daylight saving. */
export function jakartaDayKey(date: Date): string {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** §19: the page opens on the current Jakarta month to date — the range an owner means by "bulan ini". */
export function defaultExportRange(now: Date): { from: string; to: string } {
  const today = jakartaDayKey(now);
  return { from: `${today.slice(0, 7)}-01`, to: today };
}

export function jakartaDayRange(
  fromDay: string,
  toDay: string
): { start: Date; end: Date } | null {
  const day = /^\d{4}-\d{2}-\d{2}$/;
  if (!day.test(fromDay) || !day.test(toDay)) return null;
  const start = new Date(`${fromDay}T00:00:00+07:00`);
  const end = new Date(new Date(`${toDay}T00:00:00+07:00`).getTime() + 24 * 60 * 60 * 1000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return null;
  return { start, end };
}

export function exportHeaders(): string[] {
  return EXPORT_COLUMNS.map((column) => column.header);
}

export function exportRows(files: readonly ExportFile[]): string[][] {
  return files.map((file) => EXPORT_COLUMNS.map((column) => column.text(file)));
}

export function exportSheet(files: readonly ExportFile[]): (string | number)[][] {
  return files.map((file) => EXPORT_COLUMNS.map((column) => column.cell(file)));
}

/** Excel: one sheet, header row frozen, money as numbers, NIK as text. */
export function buildWorkbook(files: readonly ExportFile[]): Buffer {
  const sheet = XLSX.utils.aoa_to_sheet([exportHeaders(), ...exportSheet(files)]);
  sheet["!cols"] = EXPORT_COLUMNS.map((column) => ({ wch: Math.max(column.header.length + 2, 14) }));
  sheet["!freeze"] = { xSplit: "0", ySplit: "1" };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Berkas");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

/**
 * PDF: landscape A4, the same columns in the same order, money formatted rather than raw. It is a
 * printable copy of the workbook, not a second report — no totals row, because a total printed
 * beside rows that exclude unpriced berkas is the drift A26 warned about.
 */
export function buildExportPdf(
  files: readonly ExportFile[],
  range: { from: Date; to: Date }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 28 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const width = doc.page.width - 56;
    const weights = [9, 16, 14, 11, 11, 10, 11, 9, 12, 10, 9];
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const widths = weights.map((weight) => (width * weight) / total);
    const padding = 3;
    const lineHeight = 12;

    const cell = (text: string, x: number, y: number, w: number, options: { bold?: boolean } = {}) => {
      doc
        .font(options.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(7)
        .text(text, x + padding, y + padding, { width: w - padding * 2, height: lineHeight * 2 + 2 });
    };

    let y = 28;
    doc.font("Helvetica-Bold").fontSize(11).text(UI.nav.files, 28, y, { width });
    y += 16;
    doc
      .font("Helvetica")
      .fontSize(8)
      .text(`${formatJakartaDate(range.from)} — ${formatJakartaDate(range.to)}`, 28, y, { width });
    y += 16;

    const headerHeight = lineHeight + padding * 2;
    let x = 28;
    exportHeaders().forEach((header, index) => {
      cell(header, x, y, widths[index], { bold: true });
      x += widths[index];
    });
    doc.moveTo(28, y + headerHeight).lineTo(28 + width, y + headerHeight).lineWidth(0.5).stroke();
    y += headerHeight;

    for (const row of exportRows(files)) {
      const rowHeight = lineHeight + padding * 2;
      if (y + rowHeight > doc.page.height - 28) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 28 });
        y = 28;
      }
      x = 28;
      row.forEach((value, index) => {
        cell(value, x, y, widths[index]);
        x += widths[index];
      });
      y += rowHeight;
    }

    doc.end();
  });
}

/** Timestamp footer for the printed copy: who exported what, and when, in WIB. */
export function exportStamp(now: Date): string {
  return formatJakartaDateTime(now);
}
