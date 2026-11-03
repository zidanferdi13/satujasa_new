import { UI } from "./ui-strings.ts";

/**
 * A21: the age is plain elapsed time — never a working-day counter, never a colour that turns red
 * at the promise deadline. The promise is a human commitment; the queue is a reminder, not a timer.
 *
 * The day count itself comes from `jakartaAgeDays` (payment-period.ts), so the queue and the
 * subscription copy cannot disagree about what "2 hari" means. Re-uploading moves `submittedAt`
 * forward, so the age always describes the proof currently under review.
 */
export function queueAgeLabel(days: number): string {
  if (days === 0) return UI.adm.ageToday;
  if (days === 1) return UI.adm.ageYesterday;
  return UI.adm.ageDays(String(days));
}
