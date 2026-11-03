/**
 * Surat Jalan — the cover letter handed to SAMSAT with a customer's documents.
 *
 * CEO/A23: the printed Surat Jalan carries the **full NIK**. Masking belongs to lists, tables and
 * logs, where other people can see the number; the printed sheet is the customer's own KTP shown
 * to the office that has to match it against the original.
 *
 * Two deliberate omissions:
 *  - No money. The sheet goes to a third party; what the customer paid and what we paid SAMSAT are
 *    the biro's margin, and A17 keeps that internal. `finalPrice`/`samsatPayment` exist on the file
 *    but never reach this document.
 *  - No free text beyond the operator's own note, which the operator wrote knowing the customer
 *    reads the sheet.
 *
 * Labels come from `UI.file.*` so the form, the detail screen and the printout cannot drift apart.
 */
import PDFDocument from "pdfkit";
import { UI } from "@/lib/ui-strings";
import { formatJakartaDate } from "@/lib/date-format";

export type SuratJalanData = {
  organizationName: string;
  operatorName: string;
  customerName: string;
  /** Full 16 digits. A String, never a number: leading zeros are part of the NIK. */
  customerKtp: string;
  vehicleNumber: string;
  serviceType: string;
  ownershipTypeLabel: string;
  notes: string | null;
  createdAt: Date;
  pickedUpAt: Date | null;
};

const MARGIN = 56;
const LINE = 18;

/**
 * Resolves once the document is complete. PDFKit is a stream, so the caller gets bytes — a route
 * can return them and a test can read them, without either one owning a file on disk.
 */
export function buildSuratJalan(
  data: SuratJalanData,
  { compress = false }: { compress?: boolean } = {}
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: MARGIN, compress, info: { Title: "Surat Jalan" } });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const field = (label: string, value: string) => {
    doc.font("Helvetica-Bold").fontSize(10).text(`${label}: `, { continued: true });
    doc.font("Helvetica").text(value);
    doc.moveDown(0.2);
  };

  doc.font("Helvetica-Bold").fontSize(16).text("Surat Jalan", { align: "center" });
  doc.moveDown(0.3);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#444444")
    .text(data.organizationName, { align: "center" });
  doc.fillColor("#000000").moveDown(1);

  doc.fontSize(11);
  field(UI.file.customerName, data.customerName);
  field(UI.file.customerKtp, data.customerKtp);
  field(UI.file.vehicleNumber, data.vehicleNumber);
  field(UI.file.ownershipType, data.ownershipTypeLabel);
  field(UI.file.serviceType, data.serviceType);
  if (data.notes?.trim()) field(UI.file.notes, data.notes.trim());
  field(UI.file.createdAt, formatJakartaDate(data.createdAt));
  if (data.pickedUpAt) field(UI.file.pickedUpAt, formatJakartaDate(data.pickedUpAt));

  // No city: A22 closed the address at "Kab. Bekasi, Jawa Barat" for the business identity block,
  // and a document printed from a template should not invent a second one.
  doc.moveDown(1.5);
  doc.fontSize(10).text(formatJakartaDate(new Date()));
  doc.moveDown(2.5);
  doc.text(data.operatorName);
  doc.moveTo(MARGIN, doc.y + LINE * 0.2).lineTo(MARGIN + 180, doc.y + LINE * 0.2).stroke();

  doc.end();
  return done;
}
