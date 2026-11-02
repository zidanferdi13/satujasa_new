import { MemberRole } from "@prisma/client";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { canAddOperator } from "@/lib/operator-quota";
import { countSeatsUsed } from "@/lib/seats";
import OperatorForm from "./operator-form";
import { organizationIsEntitled } from "@/lib/org-status";
import { PricingCards } from "@/components/landing/pricing-cards";
import { UI } from "@/lib/ui-strings";

export default async function OwnerDashboardPage() {
  // RBAC gate must live in the page: layouts render in parallel and cannot stop page output.
  const session = await requireRole(MemberRole.OWNER);
  const organizationId = session.user.organizationId;

  // A12: never-paid and lapsed orgs get the same locked screen; nothing else is usable.
  // ponytail: cards link to /register until checkout lands (blocked on Midtrans keys).
  if (!organizationId || !(await organizationIsEntitled(organizationId))) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-3xl font-bold mb-2">{UI.lock.title}</h1>
        <p className="text-muted-foreground mb-1">{UI.lock.body}</p>
        <p className="text-muted-foreground mb-8">{UI.lock.operatorNote}</p>
        <PricingCards />
      </div>
    );
  }

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
