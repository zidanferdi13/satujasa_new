/**
 * The one place money is turned into text. Output: "Rp 99.000".
 * Hand-rolled instead of Intl.NumberFormat("id-ID") because ICU builds differ between
 * Node and browsers (Intl inserts a non-breaking space after "Rp"), which causes
 * server/client hydration mismatches. This output is identical everywhere.
 */
export function formatRupiah(amount: number): string {
  if (!Number.isSafeInteger(amount)) {
    throw new TypeError(`formatRupiah expects whole rupiah, got ${amount}`);
  }
  const digits = String(Math.abs(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${amount < 0 ? "-" : ""}Rp ${digits}`;
}
