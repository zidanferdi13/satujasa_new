import { redirect } from "next/navigation";
import { MemberRole } from "@prisma/client";
import { requireRole } from "@/lib/require-role";
import { canAddOperator } from "@/lib/operator-quota";
import OperatorForm from "./operator-form";
import { loadOrganizationStatus } from "@/lib/org-status";
import { UI } from "@/lib/ui-strings";
import { formatRupiah } from "@/lib/money";
import { formatJakartaDate } from "@/lib/date-format";
import { planById } from "@/lib/plans";

export default async function OwnerDashboardPage() {
  // RBAC gate must live in the page: layouts render in parallel and cannot stop page output.
  const session = await requireRole(MemberRole.OWNER);
  const organizationId = session.user.organizationId;
  const status = organizationId ? await loadOrganizationStatus(organizationId) : null;

  // A12: a never-paid or lapsed org can use exactly one screen, and it is the subscribe screen.
  // A19/§15: that screen lives at one route, so the locked dashboard does not duplicate its cards.
  if (!status || !status.entitled) redirect("/dashboard/subscription");

  const {
    organization,
    subscription,
    activeOperators,
    activeFiles,
    revenueThisMonth,
    revenueByOperator,
    overLimit,
  } = status;
  // A16: a null limit is CUSTOM ("Sesuai kesepakatan"); never render "1 / null".
  const operatorLimit: number | null = organization.operatorLimit;
  const seatIsFull = operatorLimit === null ? false : !canAddOperator(activeOperators, operatorLimit);
  const planName = subscription ? planById(subscription.package)?.name ?? subscription.package : null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{UI.own.title}</h1>
      <div className="grid gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">{UI.own.welcome(session.user.name ?? "")}</h2>
          <p className="text-muted-foreground">{UI.own.org(organization.name)}</p>
          {subscription && planName ? (
            <p className="text-muted-foreground">
              {UI.own.plan(planName, formatJakartaDate(subscription.currentPeriodEnd))}
            </p>
          ) : null}
        </div>

        {/* A14: an org whose limit dropped below its active seats keeps the rows but is
            blocked until the owner deactivates down to the limit. */}
        {overLimit && operatorLimit !== null ? (
          <p className="p-3 text-sm rounded-md bg-muted text-foreground">
            {UI.addop.overLimit(String(activeOperators), String(operatorLimit))}
          </p>
        ) : null}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-6 border rounded-lg">
            {/* Active seats only: a deactivated operator frees its seat (PM ruling). */}
            <h3 className="text-lg font-medium">{UI.own.seats}</h3>
            <p className="text-3xl font-bold mt-2">
              {operatorLimit === null
                ? UI.own.seatsCustom
                : UI.own.seatsValue(String(activeOperators), String(operatorLimit))}
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium">{UI.own.revenue}</h3>
            <p className="text-3xl font-bold mt-2">{formatRupiah(revenueThisMonth)}</p>
            <p className="mt-2 text-xs text-muted-foreground">{UI.own.revenueHelp}</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium">{UI.own.activeFiles}</h3>
            <p className="text-3xl font-bold mt-2">{activeFiles}</p>
          </div>
        </div>

        {/* Item 5: the same sum as the card above, split by operator. The owner appears here like
            any operator when they hold a seat and pick files up themselves. */}
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-1">{UI.own.revenueByOp}</h2>
          <p className="text-xs text-muted-foreground mb-4">{UI.own.revenueHelp}</p>
          {revenueByOperator.length === 0 ? (
            <p className="text-sm text-muted-foreground">{UI.own.revenueByOpEmpty}</p>
          ) : (
            <ul className="divide-y">
              {revenueByOperator.map((row) => (
                <li key={row.operatorId} className="flex items-baseline justify-between py-2">
                  <span>{row.operatorName}</span>
                  <span className="text-right">
                    <span className="font-medium block">{formatRupiah(row.revenue)}</span>
                    {/* §12e: how many jobs produced that number. A count, never money. */}
                    <span className="text-xs text-muted-foreground">
                      {UI.own.revenueByOpCount(String(row.files))}
                    </span>
                  </span>
                </li>
              ))}
              <li className="flex items-baseline justify-between py-2 border-t font-semibold">
                <span>{UI.own.revenue}</span>
                <span>{formatRupiah(revenueThisMonth)}</span>
              </li>
            </ul>
          )}
        </div>

        <div className="p-6 border rounded-lg max-w-md">
          <h2 className="text-xl font-semibold mb-1">{UI.addop.title}</h2>
          {operatorLimit === null ? null : (
            <p className="text-sm text-muted-foreground mb-4">
              {UI.addop.counter(String(activeOperators), String(operatorLimit))}
            </p>
          )}
          <OperatorForm
            disabled={seatIsFull}
            limitMessage={
              operatorLimit === null
                ? null
                : UI.addop.limit(String(activeOperators), String(operatorLimit))
            }
          />
        </div>
      </div>
    </div>
  );
}
