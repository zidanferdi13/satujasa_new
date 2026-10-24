/** Operator seats are per organization and set by the package (BASIC = 1). */
export function canAddOperator(currentCount: number, limit: number): boolean {
  if (!Number.isFinite(limit) || limit <= 0) return false;
  return currentCount < limit;
}

