import Link from "next/link";
import { OWNERSHIP_TYPES, type OwnershipTypeValue } from "@/lib/file-input";
import { UI } from "@/lib/ui-strings";

/** §17 list filter: Semua first, then enum order. Plain links, so it works without JS. */
export function OwnershipFilter({ basePath, active }: { basePath: string; active: OwnershipTypeValue | null }) {
  const options = [[null, UI.filter.all] as const, ...OWNERSHIP_TYPES.map((t) => [t, UI.ownership[t]] as const)];
  return (
    <nav aria-label={UI.th.ownership} className="mb-4 flex flex-wrap gap-2">
      {options.map(([value, label]) => (
        <Link
          key={label}
          href={value ? `${basePath}?ownership=${value}` : basePath}
          aria-current={value === active ? "page" : undefined}
          className={`rounded-full border px-3 py-1 text-sm ${value === active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Reads `?ownership=`; anything outside the enum means no filter, never a query error. */
export function parseOwnership(raw: string | string[] | undefined): OwnershipTypeValue | null {
  return (OWNERSHIP_TYPES as readonly string[]).includes(raw as string) ? (raw as OwnershipTypeValue) : null;
}
