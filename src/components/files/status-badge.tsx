import { Badge } from "@/components/ui/badge";
import { UI } from "@/lib/ui-strings";
import type { FileStatusValue } from "@/lib/file-rules";

const tone: Record<FileStatusValue, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  DP_PAID: "bg-blue-50 text-blue-700",
  ON_PROGRESS_SAMSAT: "bg-amber-50 text-amber-800",
  COMPLETED_SAMSAT: "bg-emerald-50 text-emerald-700",
  PICKED_UP: "bg-emerald-600 text-white",
  CANCELED: "bg-zinc-200 text-zinc-600",
};

/** Status is always the Designer's label, never the raw enum, and never a colour alone. */
export function StatusBadge({ status }: { status: FileStatusValue }) {
  return (
    <Badge variant="outline" className={`border-transparent ${tone[status]}`}>
      {UI.status[status]}
    </Badge>
  );
}
