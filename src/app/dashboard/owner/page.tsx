import { MemberRole } from "@prisma/client";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { canAddOperator } from "@/lib/operator-quota";
import { countSeatsUsed } from "@/lib/seats";
import OperatorForm from "./operator-form";

export default async function OwnerDashboardPage() {
  // RBAC gate must live in the page: layouts render in parallel and cannot stop page output.
  const session = await requireRole(MemberRole.OWNER);
  const organizationId = session.user.organizationId;

  const [organization, operatorCount] = organizationId
    ? await Promise.all([
        prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true, operatorLimit: true },
        }),
        countSeatsUsed(prisma, organizationId),
      ])
    : [null, 0];
  const operatorLimit = organization?.operatorLimit ?? 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Owner Dashboard</h1>
      <div className="grid gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Welcome, {session.user.name}</h2>
          <p className="text-gray-600">Organization: {organization?.name ?? "None"}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-6 border rounded-lg">
            {/* Active seats only: a deactivated operator frees its seat (PM ruling). */}
            <h3 className="text-lg font-medium">Active Operators</h3>
            <p className="text-3xl font-bold mt-2">
              {operatorCount} / {operatorLimit}
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium">Total Revenue</h3>
            <p className="text-3xl font-bold mt-2">-</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium">Active Files</h3>
            <p className="text-3xl font-bold mt-2">-</p>
          </div>
        </div>
        <div className="p-6 border rounded-lg max-w-md">
          <h2 className="text-xl font-semibold mb-4">Add operator</h2>
          <OperatorForm disabled={!canAddOperator(operatorCount, operatorLimit)} />
        </div>
      </div>
    </div>
  );
}
