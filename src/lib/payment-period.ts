/**
 * Subscription periods for manual-transfer activation (A13, restated by A20).
 *
 * Both rules are about the *start*: a same-plan renewal continues from the day the paid
 * period ends (`max(now, currentPeriodEnd)`), an upgrade starts the day it is verified.
 * A period is one calendar month, and its end is the last instant of that day in WIB —
 * "aktif sampai 2 Des 2026" must still be true at 23:00 Jakarta, not at 07:00.
 *
 * Pure: no database, no clock of its own, so every branch is unit tested.
 */
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type Period = { start: Date; end: Date };

type Parts = { year: number; month: number; day: number };

function jakartaDate(date: Date): Parts {
  const shifted = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

/** The last millisecond of that calendar day in WIB, as an absolute instant. */
function endOfJakartaDay({ year, month, day }: Parts): Date {
  return new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - JAKARTA_OFFSET_MS);
}

/** Same day next month, clamped: 31 Jan + 1 month is 28/29 Feb, never 3 Mar. */
function addOneMonth({ year, month, day }: Parts): Parts {
  const nextMonth = month + 1;
  const firstOfNext = new Date(Date.UTC(year, nextMonth, 1));
  const daysInNextMonth = new Date(
    Date.UTC(firstOfNext.getUTCFullYear(), firstOfNext.getUTCMonth() + 1, 0)
  ).getUTCDate();
  return {
    year: firstOfNext.getUTCFullYear(),
    month: firstOfNext.getUTCMonth(),
    day: Math.min(day, daysInNextMonth),
  };
}

/**
 * A13: renewal extends the paid period; everything else starts now.
 * `isRenewal` is the caller's decision (same package as the live subscription), not a guess here.
 */
export function periodFor(
  now: Date,
  current: { currentPeriodEnd: Date } | null,
  isRenewal: boolean
): Period {
  const start = isRenewal && current && current.currentPeriodEnd > now ? current.currentPeriodEnd : now;
  return { start, end: endOfJakartaDay(addOneMonth(jakartaDate(start))) };
}

/** Whole days elapsed in WIB, floored — "2 hari lalu" at 47 hours, never "1 hari lalu". */
export function jakartaAgeDays(from: Date, now: Date): number {
  const start = jakartaDate(from);
  const end = jakartaDate(now);
  const a = Date.UTC(start.year, start.month, start.day);
  const b = Date.UTC(end.year, end.month, end.day);
  return Math.max(0, Math.floor((b - a) / DAY_MS));
}
