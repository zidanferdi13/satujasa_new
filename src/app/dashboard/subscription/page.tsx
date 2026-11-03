import { redirect } from "next/navigation";
import { MemberRole } from "@prisma/client";
import { requireRole } from "@/lib/require-role";
import { loadOrganizationStatus } from "@/lib/org-status";
import { openPaymentFor } from "@/lib/payments";
import { bankAccountFromEnv } from "@/lib/payment-bank";
import { SubscribeClient } from "./subscribe-client";

/**
 * §15: the subscribe screen. One route for "no plan" and "paying", because two screens showing
 * the same cards is how an owner ends up on the one that cannot help them.
 *
 * Reachable while locked — it is the only screen a locked owner may use (A12). Once the org is
 * entitled there is nothing to do here, so it sends them back to the dashboard (state E).
 */
export default async function SubscriptionPage() {
  const session = await requireRole(MemberRole.OWNER);
  const organizationId = session.user.organizationId;
  if (!organizationId) redirect("/login");

  const status = await loadOrganizationStatus(organizationId);
  if (status?.entitled) redirect("/dashboard/owner");

  const payment = await openPaymentFor(organizationId);

  return (
    <SubscribeClient
      payment={
        payment
          ? {
              id: payment.id,
              code: payment.orderId,
              amount: payment.amount,
              package: payment.package,
              status: payment.status,
              rejectionReason: payment.rejectionReason,
            }
          : null
      }
      bank={bankAccountFromEnv()}
    />
  );
}
