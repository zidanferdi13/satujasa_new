/**
 * Upload limits shared by the browser and the server. A client component cannot import
 * `payment-receipt.ts` (it touches the filesystem), and two copies of "5 MB" would drift —
 * one of them would eventually accept a file the other rejects. So the number lives here.
 */
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

export const RECEIPT_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
