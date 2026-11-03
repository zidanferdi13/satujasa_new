/**
 * Revenue attribution (item 5, as the CEO defined it).
 *
 * One definition, two appearances: per-operator Σ(paid − SAMSAT cost), and the owner total over
 * the same sum — the owner's own berkas included, because the owner may hold a seat and work like
 * any operator. `serviceFee` and `revenue` are the same number by construction (`file-rules.ts`),
 * so this module never adds them, never subtracts one from the other, and never recomputes the
 * fee from prices. A file where the two disagree is a bug, not a second metric.
 *
 * Only a picked-up file counts: revenue is frozen at `pickedUpAt`, which is the moment the money
 * is settled and the SAMSAT cost is known. Anything earlier is a forecast.
 */

/**
 * The columns this module needs. The caller scopes the tenant, the period and the status — a row
 * that reaches this function is a picked-up file by contract, which is why `pickedUpAt` is absent:
 * filtering on it here would be a second, weaker copy of the SQL predicate.
 */
export type RevenueRow = {
  operatorId: string;
  operatorName: string;
  revenue: number | null;
};

export type OperatorTotal = {
  operatorId: string;
  operatorName: string;
  /** A count, never money: the UI must not run it through formatRupiah. */
  files: number;
  revenue: number;
};

export type RevenueReport = {
  byOperator: OperatorTotal[];
  total: { files: number; revenue: number };
};

/** Oldest-first is the wrong reading for money; biggest contribution first, name breaks ties. */
function order(a: OperatorTotal, b: OperatorTotal): number {
  if (b.revenue !== a.revenue) return b.revenue - a.revenue;
  return a.operatorName.localeCompare(b.operatorName, "id");
}

export function revenueByOperator(rows: readonly RevenueRow[]): RevenueReport {
  const map = new Map<string, OperatorTotal>();

  for (const row of rows) {
    // Unpriced cannot happen while `file-rules.ts` fills revenue at pickup; if it ever does, the
    // file is counted nowhere rather than contributing a silent zero.
    if (row.revenue === null) continue;

    const current = map.get(row.operatorId) ?? {
      operatorId: row.operatorId,
      operatorName: row.operatorName,
      files: 0,
      revenue: 0,
    };
    current.files += 1;
    current.revenue += row.revenue;
    map.set(row.operatorId, current);
  }

  const byOperator = [...map.values()].sort(order);
  return {
    byOperator,
    total: {
      files: byOperator.reduce((sum, operator) => sum + operator.files, 0),
      revenue: byOperator.reduce((sum, operator) => sum + operator.revenue, 0),
    },
  };
}

/**
 * The Jakarta month a picked-up time belongs to, for the report's period label.
 *
 * `jakartaMonthRange` in `file-rules.ts` owns the boundaries; this only names the month, and the
 * two agree because both shift by the same fixed offset. WIB has no daylight saving, so there is
 * no edge case to reconcile.
 */
/** The month a picked-up file belongs to, for display and for the default report period. */
export function jakartaMonthKey(date: Date): string {
  const shifted = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 7);
}
