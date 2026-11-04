import { redirect } from "next/navigation";
import { MemberRole } from "@prisma/client";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { defaultExportRange, exportWhere, jakartaDayKey, jakartaDayRange } from "@/lib/export";
import { UI } from "@/lib/ui-strings";
import { ExportForm } from "./export-form";

export const metadata = { title: UI.exp.title };

/**
 * §19 / A12: the owner's export page. A route, not a dialog — a range with a result state and a
 * download needs a URL the owner can come back to, and the locked screen has to be able to link
 * here. That second reason is also why there is no `organizationIsEntitled` call on this page:
 * export survives a lapsed subscription, and the screen that promises it links straight here.
 * Gating the page would make `sub.body` false on the only screen that says it.
 *
 * The count is read with `exportWhere`, the predicate the download itself uses, so "no berkas in
 * this range" is a statement about the file the owner would get and not about a similar query.
 */
export default async function ExportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; format?: string }>;
}) {
  const session = await requireRole(MemberRole.OWNER);
  const organizationId = session.user.organizationId;
  if (!organizationId) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const fallback = defaultExportRange(now);
  const from = params.from ?? fallback.from;
  const to = params.to ?? fallback.to;
  const format = params.format === "pdf" ? "pdf" : "xlsx";

  const range = jakartaDayRange(from, to);
  const rows = range ? await prisma.file.count({ where: exportWhere(organizationId, range) }) : 0;

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">{UI.exp.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{UI.exp.subtitle}</p>
      <ExportForm
        from={from}
        to={to}
        format={format}
        rows={rows}
        rangeValid={range !== null}
        today={jakartaDayKey(now)}
      />
    </div>
  );
}
