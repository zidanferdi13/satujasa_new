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

/**
 * The admin queue shows when the proof arrived, in WIB, because "2 hari lalu" alone does not tell
 * an admin whether it came in before or after the working day started.
 */
export function formatJakartaDateTime(date: Date): string {
  const day = formatJakartaDate(date);
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  })
    .format(date)
    .replace(":", ".");
  return `${day}, ${time} WIB`;
}
