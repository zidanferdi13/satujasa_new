/** URL-safe slug from an organization name. Falls back to "org" when nothing usable remains. */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "org";
}

/**
 * First free slug among base, base-2, base-3, ... given the slugs already taken.
 * BUG-02: duplicate company names get a suffix instead of failing.
 */
export function nextAvailableSlug(base: string, taken: Iterable<string>): string {
  const takenSet = new Set(taken);
  if (!takenSet.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!takenSet.has(candidate)) return candidate;
  }
}
