import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatJakartaDate, formatJakartaDateTime } from "@/lib/date-format";
import { formatRupiah } from "@/lib/money";
import { planById } from "@/lib/plans";
import { jakartaAgeDays, periodFor } from "@/lib/payment-period";
import { queueAgeLabel } from "@/lib/queue-age";
import { UI } from "@/lib/ui-strings";
import { PaymentActions } from "./payment-actions";

/**
 * §16 detail. It shows the proof and the money, and nothing about the tenant's business: no
 * berkas, no KTP, no revenue (A20). The receipt itself is never linked as a static file — it is
 * served by the authorized route, which also checks that this session is a Super Admin.
 */
export default async function AdminPaymentPage({ params }: { params: Promise<{ paymentId: string }> }) {
  await requireSuperAdmin();
  const { paymentId } = await params;

  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      orderId: true,
      amount: true,
      package: true,
      status: true,
      submittedAt: true,
      createdAt: true,
      verifiedAt: true,
      rejectedAt: true,
      rejectionReason: true,
      receiptPath: true,
      receiptMime: true,
      organization: {
        select: {
          id: true,
          name: true,
          members: { where: { role: "OWNER" }, take: 1, select: { user: { select: { name: true } } } },
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { package: true, status: true, currentPeriodEnd: true },
          },
        },
      },
    },
  });
  if (!payment) notFound();

  const planName = planById(payment.package)?.name ?? payment.package;
  const owner = payment.organization.members[0]?.user.name;
  const now = new Date();
  const days = jakartaAgeDays(payment.submittedAt ?? payment.createdAt, now);
  const isWaiting = payment.status === "WAITING_VERIFICATION";
  const isPdf = payment.receiptMime === "application/pdf";

  // Same function the write path uses, so the confirm dialog's date is the date that will be
  // written — a renewal continues from the paid period, a purchase starts today (A13).
  const live = payment.organization.subscriptions[0] ?? null;
  const isRenewal = Boolean(
    live && live.package === payment.package && live.status === "ACTIVE" && live.currentPeriodEnd > now
  );
  const previewPeriodEnd = periodFor(now, live, isRenewal).end;

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/admin" className="text-sm underline">
        {UI.adm.navQueue}
      </Link>
      <h1 className="text-3xl font-bold mt-2 mb-6">{UI.adm.detailTitle(payment.orderId)}</h1>

      <dl className="grid grid-cols-2 gap-4 p-6 border rounded-lg mb-4 text-sm">
        <div>
          <dt className="text-muted-foreground">{UI.adm.colOrg}</dt>
          <dd className="font-medium">{payment.organization.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{UI.adm.colOwner}</dt>
          <dd className="font-medium">{owner ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{UI.adm.colPlan}</dt>
          <dd className="font-medium">{planName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{UI.adm.colAmount}</dt>
          <dd className="font-medium">{formatRupiah(payment.amount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{UI.adm.colSent}</dt>
          <dd className="font-medium">
            {formatJakartaDateTime(payment.submittedAt ?? payment.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{UI.adm.colAge}</dt>
          <dd className="font-medium">{queueAgeLabel(days)}</dd>
        </div>
      </dl>

      <section className="p-6 border rounded-lg mb-4">
        <h2 className="text-lg font-medium mb-3">{UI.adm.receipt}</h2>
        {payment.receiptPath ? (
          isPdf ? (
            <a
              className="underline text-sm"
              href={`/api/payments/${payment.id}/receipt`}
              target="_blank"
              rel="noreferrer"
            >
              PDF
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/payments/${payment.id}/receipt`}
              alt={UI.adm.receipt}
              className="max-h-[28rem] w-auto rounded border"
            />
          )
        ) : (
          <p className="text-sm text-muted-foreground">{UI.adm.receiptMissing}</p>
        )}
      </section>

      {payment.status === "PAID" && payment.verifiedAt ? (
        <p className="p-4 border rounded-lg text-sm">
          {UI.adm.verifiedOk(formatJakartaDate(payment.verifiedAt))}
        </p>
      ) : null}

      {payment.status === "REJECTED" ? (
        <div className="p-4 border rounded-lg text-sm">
          <p className="text-muted-foreground">{UI.adm.rejectTitle}</p>
          <p className="font-medium">{payment.rejectionReason ?? ""}</p>
          {payment.rejectedAt ? (
            <p className="mt-1 text-muted-foreground">{formatJakartaDateTime(payment.rejectedAt)}</p>
          ) : null}
        </div>
      ) : null}

      {isWaiting ? (
        <PaymentActions
          paymentId={payment.id}
          planName={planName}
          amountLabel={formatRupiah(payment.amount)}
          periodEndIso={previewPeriodEnd.toISOString()}
        />
      ) : null}
    </div>
  );
}
