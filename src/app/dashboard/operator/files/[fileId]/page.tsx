import { MemberRole } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-role";
import { fileForForm, operatorIdFor } from "@/lib/file-queries";
import FileForm from "@/components/files/file-form";

/** Operator edits their own file. Another operator's id is a 404, not a 403: existence is private. */
export default async function EditFilePage({ params }: { params: Promise<{ fileId: string }> }) {
  const session = await requireRole(MemberRole.OPERATOR);
  const organizationId = session.user.organizationId ?? "";
  const { fileId } = await params;

  const operatorId = await operatorIdFor(session.user.id, organizationId);
  if (!operatorId) notFound();

  const file = await fileForForm(fileId, organizationId);
  if (!file || file.operatorId !== operatorId) notFound();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{file.values.customerName}</h1>
      <FileForm file={file.values} basePath="/dashboard/operator/files" />
    </div>
  );
}
