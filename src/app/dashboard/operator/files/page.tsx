import Link from "next/link";
import { MemberRole } from "@prisma/client";
import { Pencil } from "lucide-react";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { maskKtp } from "@/lib/file-rules";
import { formatRupiah } from "@/lib/money";
import { formatJakartaDate } from "@/lib/date-format";
import { operatorIdFor } from "@/lib/file-queries";
import { StatusBadge } from "@/components/files/status-badge";
import { OwnershipFilter, parseOwnership } from "@/components/files/ownership-filter";
import { buttonVariants } from "@/components/ui/button";
import { UI } from "@/lib/ui-strings";

/** Operator · Berkas Saya. Only this operator's own files, never the organization's. */
export default async function OperatorFilesPage({
  searchParams,
}: {
  searchParams: Promise<{ ownership?: string }>;
}) {
  const session = await requireRole(MemberRole.OPERATOR);
  const organizationId = session.user.organizationId ?? "";
  const ownership = parseOwnership((await searchParams).ownership);
  const operatorId = await operatorIdFor(session.user.id, organizationId);

  const files = operatorId
    ? await prisma.file.findMany({
        where: { organizationId, operatorId, ...(ownership ? { ownershipType: ownership } : {}) },
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
        },
      })
    : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{UI.opd.myFiles}</h1>
        {files.length > 0 && (
          <Link href="/dashboard/operator/files/new" className={buttonVariants()}>
            {UI.empty.myFilesAction}
          </Link>
        )}
      </div>

      <OwnershipFilter basePath="/dashboard/operator/files" active={ownership} />

      {files.length === 0 ? (
        // §12a empty.myFiles: the action renders because its route exists.
        <div className="rounded-lg border p-10 text-center">
          <h2 className="font-medium">{UI.empty.myFilesTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{UI.empty.myFilesBody}</p>
          <Link href="/dashboard/operator/files/new" className={`${buttonVariants()} mt-4`}>
            {UI.empty.myFilesAction}
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">{UI.th.customer}</th>
                <th className="p-3 font-medium">{UI.th.vehicle}</th>
                <th className="p-3 font-medium">{UI.th.service}</th>
                <th className="p-3 font-medium">{UI.th.status}</th>
                <th className="p-3 font-medium">{UI.th.revenue}</th>
                <th className="p-3 font-medium">{UI.th.date}</th>
                <th className="p-3 font-medium" aria-label={UI.th.edit} />
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-t">
                  {/* A17: KTP is KTP data — masked in every list, full value only on the detail screen. */}
                  <td className="p-3">
                    <span className="block font-medium">{file.customerName}</span>
                    <span className="text-xs text-muted-foreground">{maskKtp(file.customerKtp)}</span>
                  </td>
                  <td className="p-3">{file.vehicleNumber}</td>
                  <td className="p-3">{UI.service[file.serviceType]}</td>
                  <td className="p-3">
                    <StatusBadge status={file.status} />
                  </td>
                  <td className="p-3">{file.serviceFee === null ? "—" : formatRupiah(file.serviceFee)}</td>
                  <td className="p-3">{formatJakartaDate(file.createdAt)}</td>
                  <td className="p-3 text-right">
                    {/* §12c: one action, Ubah. There is no delete — files are cancelled. */}
                    <Link
                      href={`/dashboard/operator/files/${file.id}`}
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
