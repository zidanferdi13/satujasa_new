import { requireSuperAdmin } from "@/lib/require-role";
import { organizationsForAdmin } from "@/lib/payments";
import { formatJakartaDate } from "@/lib/date-format";
import { planById } from "@/lib/plans";
import { UI } from "@/lib/ui-strings";
import { OrgControls } from "./org-controls";

/**
 * §16 org list: names, plans, limits, seats, and the subscription date — the things a Super Admin
 * needs to answer "who is paying and who still has access". Nothing from inside the tenant.
 */
export default async function AdminOrganizationsPage() {
  await requireSuperAdmin();
  const organizations = await organizationsForAdmin();

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">{UI.adm.orgTitle}</h1>

      {/* No empty-state key exists for this list (ui-strings §12a covers tenant lists only), so
          an empty console shows the heading alone rather than prose the doc does not define. */}
      {organizations.length === 0 ? null : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2 font-medium">{UI.adm.colOrg}</th>
                <th className="px-3 py-2 font-medium">{UI.adm.colOwner}</th>
                <th className="px-3 py-2 font-medium">{UI.adm.colPlan}</th>
                <th className="px-3 py-2 font-medium">{UI.adm.orgLimit}</th>
                <th className="px-3 py-2 font-medium">{UI.sub.planHeading}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => {
                const subscription = organization.subscriptions[0] ?? null;
                const planName = planById(organization.package)?.name ?? organization.package;
                return (
                  <tr key={organization.id} className="border-t align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium">{organization.name}</p>
                      {organization.isActive ? null : (
                        <p className="text-xs text-rose-600">{UI.adm.orgInactive}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p>{organization.members[0]?.user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {organization.members[0]?.user.email ?? ""}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p>{planName}</p>
                      <p className="text-xs text-muted-foreground">
                        {subscription
                          ? `${subscription.status} · ${formatJakartaDate(subscription.currentPeriodEnd)}`
                          : "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      {organization.operatorLimit === null ? UI.own.seatsCustom : organization.operatorLimit}
                    </td>
                    <td className="px-3 py-3">{organization._count.operators}</td>
                    <td className="px-3 py-3">
                      <OrgControls
                        organizationId={organization.id}
                        isActive={organization.isActive}
                        isCustom={organization.package === "CUSTOM"}
                        operatorLimit={organization.operatorLimit}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
