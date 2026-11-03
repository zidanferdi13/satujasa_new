/**
 * Transfer receipts (A20): stored under var/receipts/<paymentId>/, outside public/, served only
 * through an authorized route.
 *
 * The type is decided by the file's own magic bytes, never by the extension or the browser's
 * Content-Type: a .pdf that is really an HTML page must not become a stored document, and a
 * user who picks a valid JPEG from a picker that mislabels it must not be told "format salah".
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export { MAX_RECEIPT_BYTES } from "./payment-limits.ts";

export type ReceiptType = { mime: "image/jpeg" | "image/png" | "application/pdf"; ext: string };

/** Magic bytes only. Returns null for anything we will not store. */
export function sniffReceipt(bytes: Uint8Array): ReceiptType | null {
  const starts = (...sig: number[]) => sig.every((byte, index) => bytes[index] === byte);
  if (starts(0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: "image/png", ext: "png" };
  // "%PDF" — a PDF header may sit behind leading whitespace in the wild, but not in what a bank
  // app or a phone produces, so the strict check is enough and cannot be spoofed by padding.
  if (starts(0x25, 0x50, 0x44, 0x46)) return { mime: "application/pdf", ext: "pdf" };
  return null;
}

function receiptRoot(): string {
  return process.env.RECEIPT_DIR ?? path.join(process.cwd(), "var", "receipts");
}

/** Payment ids are cuids, but the path is built from a value that reached us via the DB: verify. */
function paymentDir(paymentId: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(paymentId)) throw new Error("Invalid payment id");
  return path.join(receiptRoot(), paymentId);
}

export async function writeReceipt(paymentId: string, bytes: Uint8Array, type: ReceiptType): Promise<string> {
  const dir = paymentDir(paymentId);
  await mkdir(dir, { recursive: true });
  const filename = `receipt.${type.ext}`;
  await writeFile(path.join(dir, filename), bytes);
  // Relative to the root, so the DB row survives a move of the var/ directory.
  return path.join(paymentId, filename);
}

export async function readReceipt(storedPath: string): Promise<Buffer> {
  const [paymentId, filename] = storedPath.split("/");
  if (!paymentId || !filename) throw new Error("Invalid receipt path");
  return readFile(path.join(paymentDir(paymentId), filename));
}

export async function deleteReceipt(storedPath: string): Promise<void> {
  const [paymentId] = storedPath.split("/");
  if (!paymentId) return;
  await rm(paymentDir(paymentId), { recursive: true, force: true });
}
