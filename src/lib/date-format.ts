/**
 * One date format for the whole app. WIB is fixed at UTC+7, so a Date rendered on the server
 * reads the same as one rendered in Jakarta; no client-side formatting means no hydration
 * mismatch and no locale-dependent output.
 */
export function formatJakartaDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}
