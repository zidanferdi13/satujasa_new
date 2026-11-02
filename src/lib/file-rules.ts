/**
 * Berkas (File) rules — tdd-amendments.md A16/A17.
 *
 * All of this is pure so it can be unit tested without a database, and so the API route cannot
 * quietly disagree with the form. Money is whole rupiah (Int).
 */
export const FILE_STATUSES = [
  "DRAFT",
  "DP_PAID",
  "ON_PROGRESS_SAMSAT",
  "COMPLETED_SAMSAT",
  "PICKED_UP",
  "CANCELED",
] as const;

export type FileStatusValue = (typeof FILE_STATUSES)[number];

/** PICKED_UP and CANCELED are terminal in the MVP, so pickedUpAt and monthly revenue are frozen. */
export const TERMINAL_STATUSES: readonly FileStatusValue[] = ["PICKED_UP", "CANCELED"];

/** Still in the workshop: everything not terminal. This is what "Berkas Diproses" counts. */
export const ACTIVE_FILE_STATUSES: readonly FileStatusValue[] = FILE_STATUSES.filter(
  (status) => !TERMINAL_STATUSES.includes(status)
);

const FORWARD_ORDER: readonly FileStatusValue[] = [
  "DRAFT",
  "DP_PAID",
  "ON_PROGRESS_SAMSAT",
  "COMPLETED_SAMSAT",
  "PICKED_UP",
];

export type TransitionRefusal = "TERMINAL" | "BACKWARD";

/**
 * A file walks forward, may be cancelled at any non-terminal point, and never walks back.
 * Same-status saves on a non-terminal file are allowed, so a form can be resubmitted. A terminal
 * file is frozen entirely (A17: owner-side correction is post-MVP).
 */
export function transitionRefusal(from: FileStatusValue, to: FileStatusValue): TransitionRefusal | null {
  // Terminal first: re-saving a picked-up file is still an edit of a frozen row.
  if (TERMINAL_STATUSES.includes(from)) return "TERMINAL";
  if (from === to) return null;
  if (to === "CANCELED") return null;
  const fromIndex = FORWARD_ORDER.indexOf(from);
  const toIndex = FORWARD_ORDER.indexOf(to);
  return toIndex > fromIndex ? null : "BACKWARD";
}

export type MoneyInput = { finalPrice: number | null; samsatPayment: number | null };

/**
 * serviceFee = revenue = finalPrice − samsatPayment (A1). Both columns hold the same number:
 * the service fee IS the revenue, never a cost. Null until both inputs exist, so an unfinished
 * file contributes nothing to a total instead of a wrong number.
 */
export function computeMoney({ finalPrice, samsatPayment }: MoneyInput): {
  serviceFee: number | null;
  revenue: number | null;
} {
  if (finalPrice === null || samsatPayment === null) return { serviceFee: null, revenue: null };
  const fee = finalPrice - samsatPayment;
  return { serviceFee: fee, revenue: fee };
}

/** PICKED_UP needs finalPrice and samsatPayment, and finalPrice ≥ samsatPayment (A17). */
export function pickupRefused({ finalPrice, samsatPayment }: MoneyInput): boolean {
  if (finalPrice === null || samsatPayment === null) return true;
  return finalPrice < samsatPayment;
}

/** KTP is masked everywhere except the detail/edit screen and the owner export (A17). */
export function maskKtp(ktp: string): string {
  const digits = ktp.replace(/\D/g, "");
  if (digits.length < 4) return "•".repeat(12);
  return `${"•".repeat(12)}${digits.slice(-4)}`;
}

/**
 * The current calendar month in Asia/Jakarta (UTC+7, no DST), as a half-open UTC window:
 * [start, end). "Pendapatan Bulan Ini" sums pickedUpAt inside this window (A16).
 */
export function jakartaMonthRange(now = new Date()): { start: Date; end: Date } {
  const offsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offsetMs);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1) - offsetMs),
    end: new Date(Date.UTC(year, month + 1, 1) - offsetMs),
  };
}

/** Sum of cached revenue for files already picked up. Callers pass only matching rows. */
export function sumRevenue(files: readonly { revenue: number | null }[]): number {
  return files.reduce((total, file) => total + (file.revenue ?? 0), 0);
}
