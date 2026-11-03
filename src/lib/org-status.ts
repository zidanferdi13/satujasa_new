/**
 * Entitlement and dashboard counters, read from the database on every request (A12/A14).
 *
 * Nothing here trusts `Organization.package`: it defaults to BASIC at registration precisely so
 * that it can never be mistaken for a paid plan. The source is the subscription row.
 */
import { prisma } from "@/lib/prisma";
import { isOverOperatorLimit, operatorMaySignIn, subscriptionIsActive } from "@/lib/entitlement";
import { jakartaMonthRange } from "@/lib/file-rules";
import { ACTIVE_FILE_STATUSES } from "@/lib/file-rules";

export type OrganizationStatus = {
  organization: { id: string; name: string; slug: string; operatorLimit: number };
  subscription: { package: string; status: string; currentPeriodEnd: Date } | null;
  entitled: boolean;
  overLimit: boolean;
  activeOperators: number;
  activeFiles: number;
  fileCount: number;
  revenueThisMonth: number;
};

const subscriptionSelect = { package: true, status: true, currentPeriodEnd: true } as const;

/**
 * "Active" is evaluated at read time, so a row that stayed ACTIVE past its end reads as expired.
 * Monthly revenue is summed over pickedUpAt in the current Asia/Jakarta month (A16) — job
 * completion, never cash receipts.
 */
export async function loadOrganizationStatus(
  organizationId: string
): Promise<OrganizationStatus | null> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, slug: true, operatorLimit: true, isActive: true },
  });
  if (!organization) return null;

  const range = jakartaMonthRange();
  const [subscription, activeOperators, activeFiles, fileCount, revenue] = await Promise.all([
    prisma.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: subscriptionSelect,
    }),
    prisma.operator.count({ where: { organizationId, isActive: true } }),
    prisma.file.count({
      where: { organizationId, status: { in: [...ACTIVE_FILE_STATUSES] } },
    }),
    prisma.file.count({ where: { organizationId } }),
    prisma.file.aggregate({
      _sum: { revenue: true },
      where: {
        organizationId,
        status: "PICKED_UP",
        pickedUpAt: { gte: range.start, lt: range.end },
      },
    }),
  ]);

  return {
    organization,
    subscription,
    // A20: a deactivated organization is unentitled whatever its subscription says. A refund is
    // recorded as deactivation, so this is the state a refunded org is left in.
    entitled: organization.isActive && subscriptionIsActive(subscription),
    overLimit: isOverOperatorLimit(activeOperators, organization.operatorLimit),
    activeOperators,
    activeFiles,
    fileCount,
    revenueThisMonth: revenue._sum.revenue ?? 0,
  };
}

/** A12: no new berkas, no new operator, without a paid, unexpired subscription. */
export async function organizationIsEntitled(organizationId: string): Promise<boolean> {
  const [subscription, organization] = await Promise.all([
    prisma.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: subscriptionSelect,
    }),
    prisma.organization.findUnique({ where: { id: organizationId }, select: { isActive: true } }),
  ]);
  return Boolean(organization?.isActive) && subscriptionIsActive(subscription);
}

/**
 * BUG-15: an operator is cut off while the org is unentitled or over its seat limit (A14).
 * Evaluated on every request through the jwt callback, so a subscription that lapses mid-session
 * ends the session instead of waiting for the token to expire.
 */
export async function operatorAccessBlocked(organizationId: string): Promise<boolean> {
  const [subscription, organization, activeOperators] = await Promise.all([
    prisma.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: subscriptionSelect,
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { operatorLimit: true, isActive: true },
    }),
    prisma.operator.count({ where: { organizationId, isActive: true } }),
  ]);
  if (!organization) return true;
  // A20: deactivation refuses operators at sign-in; the owner still reaches the locked screen.
  if (!organization.isActive) return true;
  return !operatorMaySignIn(subscription, activeOperators, organization.operatorLimit);
}
