import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberRole } from "@prisma/client";
import { Pencil } from "lucide-react";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { maskKtp } from "@/lib/file-rules";
import { formatRupiah } from "@/lib/money";
import { formatJakartaDate } from "@/lib/date-format";
import { loadOrganizationStatus } from "@/lib/org-status";
import { StatusBadge } from "@/components/files/status-badge";
import { OwnershipFilter, parseOwnership } from "@/components/files/ownership-filter";
import { buttonVariants } from "@/components/ui/button";
import { UI } from "@/lib/ui-strings";

/** Owner · Berkas. Every file in the organization, whichever operator entered it. */
export default async function OwnerFilesPage({
  searchParams,
}: {
  searchParams: Promise<{ ownership?: string }>;
}) {
  const session = await requireRole(MemberRole.OWNER);
  const organizationId = session.user.organizationId;
  if (!organizationId) redirect("/login");

  const ownership = parseOwnership((await searchParams).ownership);

  // A12: a lapsed organization sees the locked screen, not a list it can still read and edit.
  const status = await loadOrganizationStatus(organizationId);
  if (!status?.entitled) redirect("/dashboard/owner");

  const files = await prisma.file.findMany({
    where: { organizationId, ...(ownership ? { ownershipType: ownership } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerName: true,
      customerKtp: true,
      vehicleNumber: true,
      serviceType: true,
      status: true,
      serviceFee: true,
      createdAt: true,
      operator: { select: { name: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{UI.nav.files}</h1>

      <OwnershipFilter basePath="/dashboard/owner/files" active={ownership} />

      {files.length === 0 ? (
        // §12a empty.ownerFiles: no action, because the owner has no Operator row until M4.
        <div className="rounded-lg border p-10 text-center">
          <h2 className="font-medium">{UI.empty.ownerFilesTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{UI.empty.ownerFilesBody}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">{UI.th.customer}</th>
                <th className="p-3 font-medium">{UI.th.vehicle}</th>
                <th className="p-3 font-medium">{UI.th.service}</th>
                <th className="p-3 font-medium">{UI.th.operator}</th>
                <th className="p-3 font-medium">{UI.th.status}</th>
                <th className="p-3 font-medium">{UI.th.revenue}</th>
                <th className="p-3 font-medium">{UI.th.date}</th>
                <th className="p-3 font-medium" aria-label={UI.th.edit} />
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-t">
                  {/* A17: masked in the list; the export is the one place the full NIK is handed back. */}
                  <td className="p-3">
                    <span className="block font-medium">{file.customerName}</span>
                    <span className="text-xs text-muted-foreground">{maskKtp(file.customerKtp)}</span>
                  </td>
                  <td className="p-3">{file.vehicleNumber}</td>
                  <td className="p-3">{UI.service[file.serviceType]}</td>
                  <td className="p-3">{file.operator.name}</td>
                  <td className="p-3">
                    <StatusBadge status={file.status} />
                  </td>
                  <td className="p-3">{file.serviceFee === null ? "—" : formatRupiah(file.serviceFee)}</td>
                  <td className="p-3">{formatJakartaDate(file.createdAt)}</td>
                  <td className="p-3 text-right">
                    {/* §12c: Ubah only. No delete on a file, in any screen. */}
                    <Link
                      href={`/dashboard/owner/files/${file.id}`}
                      aria-label={UI.th.edit}
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
