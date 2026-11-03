import Link from "next/link";
import { requireSuperAdmin } from "@/lib/require-role";
import { pruneReceipts, verificationQueue } from "@/lib/payments";
import { formatJakartaDateTime } from "@/lib/date-format";
import { formatRupiah } from "@/lib/money";
import { planById } from "@/lib/plans";
import { jakartaAgeDays } from "@/lib/payment-period";
import { queueAgeLabel } from "@/lib/queue-age";
import { UI } from "@/lib/ui-strings";

/**
 * §16: the verification queue. Oldest WAITING_VERIFICATION first (A21) — the list is a reminder,
 * so it is ordered by how long the customer has been waiting, not by anything else.
 *
 * Nothing from inside a tenant is selected here: no file, no KTP, no transaction, no revenue
 * (A20, structural).
 */
export default async function AdminQueuePage() {
  await requireSuperAdmin();

  // Opportunistic retention (A20): receipts go 90 days after verification, rows keep the audit.
  await pruneReceipts();

  const queue = await verificationQueue();
  const now = new Date();

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold mb-1">{UI.adm.queueTitle}</h1>
      <p className="text-sm text-muted-foreground mb-6">{UI.adm.queueSort}</p>

      {queue.length === 0 ? (
        <p className="p-6 border rounded-lg text-muted-foreground">{UI.adm.queueEmpty}</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-3 py-2 font-medium">{UI.adm.colCode}</th>
                <th className="px-3 py-2 font-medium">{UI.adm.colOrg}</th>
                <th className="px-3 py-2 font-medium">{UI.adm.colOwner}</th>
                <th className="px-3 py-2 font-medium">{UI.adm.colPlan}</th>
                <th className="px-3 py-2 font-medium">{UI.adm.colAmount}</th>
                <th className="px-3 py-2 font-medium">{UI.adm.colSent}</th>
                <th className="px-3 py-2 font-medium">{UI.adm.colAge}</th>
                <th className="px-3 py-2">
                  <span className="sr-only">{UI.adm.action}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {queue.map((payment) => {
                const owner = payment.organization.members[0]?.user.name;
                const planName = planById(payment.package)?.name ?? payment.package;
                const days = jakartaAgeDays(payment.submittedAt ?? payment.createdAt, now);
                return (
                  <tr key={payment.id} className="border-t">
                    <td className="px-3 py-2 font-mono">{payment.orderId}</td>
                    <td className="px-3 py-2">{payment.organization.name}</td>
                    <td className="px-3 py-2">{owner ?? "—"}</td>
                    <td className="px-3 py-2">{planName}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatRupiah(payment.amount)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatJakartaDateTime(payment.submittedAt ?? payment.createdAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{queueAgeLabel(days)}</td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/dashboard/admin/${payment.id}`}
                        aria-label={UI.adm.action}
                        className="underline"
                      >
                        {UI.adm.action}
                      </Link>
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
