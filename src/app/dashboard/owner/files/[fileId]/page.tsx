import { notFound, redirect } from "next/navigation";
import { MemberRole } from "@prisma/client";
import { requireRole } from "@/lib/require-role";
import { fileForForm } from "@/lib/file-queries";
import { loadOrganizationStatus } from "@/lib/org-status";
import FileForm from "@/components/files/file-form";

/** Owner may correct any file in their own organization; tenant scope is the only boundary. */
export default async function OwnerEditFilePage({ params }: { params: Promise<{ fileId: string }> }) {
  const session = await requireRole(MemberRole.OWNER);
  const organizationId = session.user.organizationId;
  if (!organizationId) redirect("/login");

  const status = await loadOrganizationStatus(organizationId);
  if (!status?.entitled) redirect("/dashboard/owner");

  const { fileId } = await params;
  const file = await fileForForm(fileId, organizationId);
  if (!file) notFound();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{file.values.customerName}</h1>
      <FileForm file={file.values} basePath="/dashboard/owner/files" />
    </div>
  );
}
