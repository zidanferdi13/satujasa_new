import { redirect } from "next/navigation";
import { MemberRole } from "@prisma/client";
import { requireRole } from "@/lib/require-role";
import { activeSeatFor } from "@/lib/seat-guard";
import FileForm from "@/components/files/file-form";
import { UI } from "@/lib/ui-strings";

/**
 * Owner · Input Berkas (A24). An owner who works in the biro records berkas like any operator;
 * what makes it allowed is the seat, not the role. Without an active seat the page is not
 * reachable — the API refuses the write anyway, so this only avoids showing a form that cannot
 * be submitted.
 */
export default async function NewOwnerFilePage() {
  const session = await requireRole(MemberRole.OWNER);
  const organizationId = session.user.organizationId;
  if (!organizationId) redirect("/login");

  if (!(await activeSeatFor(session.user.id, organizationId))) {
    redirect("/dashboard/owner/files");
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{UI.empty.myFilesAction}</h1>
      <FileForm basePath="/dashboard/owner/files" />
    </div>
  );
}
