import { MemberRole } from "@prisma/client";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { ACTIVE_FILE_STATUSES } from "@/lib/file-rules";
import { UI } from "@/lib/ui-strings";

export default async function OperatorDashboardPage() {
  // RBAC gate must live in the page: layouts render in parallel and cannot stop page output.
  const session = await requireRole(MemberRole.OPERATOR);

  // Operator identity comes from the session's own Member row, never from the request.
  const operator = await prisma.operator.findFirst({
    where: {
      member: { userId: session.user.id, organizationId: session.user.organizationId ?? "" },
    },
    select: { id: true },
  });
  const mine = { operatorId: operator?.id ?? "" };

  // A16: real numbers, 0 when empty — never "-". "Selesai" counts files already picked up.
  const [myFiles, pending, completed] = operator
    ? await Promise.all([
        prisma.file.count({ where: mine }),
        prisma.file.count({ where: { ...mine, status: { in: [...ACTIVE_FILE_STATUSES] } } }),
        prisma.file.count({ where: { ...mine, status: "PICKED_UP" } }),
      ])
    : [0, 0, 0];

  const cards = [
    { label: UI.opd.myFiles, value: myFiles },
    { label: UI.opd.pending, value: pending },
    { label: UI.opd.completed, value: completed },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{UI.opd.title}</h1>
      <div className="grid gap-6">
        <div className="p-6 border rounded-lg">
          {/* A16: no "Role: OPERATOR" — operators know their role. */}
          <h2 className="text-xl font-semibold">{UI.opd.welcome(session.user.name ?? "")}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="p-6 border rounded-lg">
              <h3 className="text-lg font-medium">{card.label}</h3>
              <p className="text-3xl font-bold mt-2">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
