import { MemberRole } from "@prisma/client";
import { requireRole } from "@/lib/require-role";
import FileForm from "@/components/files/file-form";
import { UI } from "@/lib/ui-strings";

/**
 * Input Berkas. Creating a file needs an active Operator row, which the owner does not have until
 * M4 owner-as-operator — so this route exists only under the operator dashboard.
 */
export default async function NewFilePage() {
  await requireRole(MemberRole.OPERATOR);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{UI.empty.myFilesAction}</h1>
      <FileForm />
    </div>
  );
}
