/**
 * Manual-transfer payments (A20). One open payment per organization; only PAID grants access.
 *
 * The write path that matters is `verifyPayment`: a Super Admin's click must create or extend
 * the subscription exactly once, no matter how many times it is replayed, and it must leave the
 * owner holding a seat (A24) so a freshly activated Basic org can record a berkas with no manual
 * seat manipulation.
 *
 * Idempotency is enforced with a guarded `updateMany` on the payment status inside the same
 * transaction that creates the subscription: the second caller matches zero rows, throws, and
 * the transaction rolls back instead of paying twice.
 */
import { randomInt } from "node:crypto";
import { Prisma, type Package, type PaymentKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkoutRefusal } from "@/lib/billing";
import { planById } from "@/lib/plans";
import { periodFor } from "@/lib/payment-period";
import { MAX_RECEIPT_BYTES, deleteReceipt, sniffReceipt, writeReceipt } from "@/lib/payment-receipt";
import { subscriptionIsActive } from "@/lib/entitlement";

export class PaymentNotFound extends Error {}
export class PlanNotPurchasable extends Error {}
export class ReceiptTooBig extends Error {}
export class ReceiptUnreadable extends Error {}
export class AlreadyProcessed extends Error {}
export class PaymentRefused extends Error {}

/** No 0/O/1/I: the code is read off a bank statement and typed by a human. */
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 6;

function newPaymentCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `BJ-${code}`;
}

/** UNPAID, WAITING_VERIFICATION and REJECTED are one open order: the owner reuses that row. */
export const OPEN_STATUSES = ["UNPAID", "WAITING_VERIFICATION", "REJECTED"] as const;

export function openPaymentFor(organizationId: string) {
  return prisma.subscriptionPayment.findFirst({
    where: { organizationId, status: { in: [...OPEN_STATUSES] } },
    orderBy: { createdAt: "desc" },
  });
}

/** The live subscription, if any: entitlement is evaluated at read time (A12). */
function liveSubscription(organizationId: string) {
  return prisma.subscription.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Creates or replaces the single open payment for a plan the owner picked (§15 state A → B).
 * Replacing clears any previous proof: the amount changed, so the old receipt proves nothing.
 */
export async function startPayment(organizationId: string, planId: string) {
  const plan = planById(planId);
  if (!plan || !plan.checkout || plan.priceMonthly === null) throw new PlanNotPurchasable();

  const subscription = await liveSubscription(organizationId);
  const active = subscriptionIsActive(subscription) ? subscription : null;
  const currentPackage: Package = active?.package ?? "BASIC";
  if (checkoutRefusal(currentPackage, plan.id as Package)) throw new PaymentRefused();

  const kind: PaymentKind = active && active.package !== plan.id ? "UPGRADE" : "PURCHASE";
  const open = await openPaymentFor(organizationId);

  if (open) {
    if (open.receiptPath) await deleteReceipt(open.receiptPath);
    return prisma.subscriptionPayment.update({
      where: { id: open.id },
      data: {
        package: plan.id,
        amount: plan.priceMonthly,
        kind,
        status: "UNPAID",
        submittedAt: null,
        paidAt: null,
        verifiedAt: null,
        verifiedByUserId: null,
        rejectedAt: null,
        rejectedByUserId: null,
        rejectionReason: null,
        receiptPath: null,
        receiptMime: null,
        receiptSize: null,
        receiptUploadedAt: null,
      },
    });
  }

  // orderId is unique; a collision is a retry, not an error the owner should see.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.subscriptionPayment.create({
        data: {
          organizationId,
          orderId: newPaymentCode(),
          amount: plan.priceMonthly,
          package: plan.id,
          kind,
          status: "UNPAID",
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    }
  }
  throw new Error("Could not allocate a payment code");
}

/** Loads a payment only if it belongs to the session's organization (tenant scoping first). */
export async function paymentForOrganization(organizationId: string, paymentId: string) {
  return prisma.subscriptionPayment.findFirst({ where: { id: paymentId, organizationId } });
}

/**
 * Receipt upload (§15 state B → C). The magic bytes decide the type; the client's word does not.
 * A re-upload after a rejection returns the same row to WAITING_VERIFICATION (A20) and moves it
 * to the back of the queue by resetting submittedAt.
 */
export async function submitReceipt(organizationId: string, paymentId: string, bytes: Uint8Array) {
  const payment = await paymentForOrganization(organizationId, paymentId);
  if (!payment) throw new PaymentNotFound();
  if (payment.status === "PAID") throw new AlreadyProcessed();
  if (bytes.byteLength > MAX_RECEIPT_BYTES) throw new ReceiptTooBig();

  const type = sniffReceipt(bytes);
  if (!type) throw new ReceiptUnreadable();

  if (payment.receiptPath) await deleteReceipt(payment.receiptPath);
  const receiptPath = await writeReceipt(payment.id, bytes, type);

  return prisma.subscriptionPayment.update({
    where: { id: payment.id },
    data: {
      status: "WAITING_VERIFICATION",
      submittedAt: new Date(),
      receiptPath,
      receiptMime: type.mime,
      receiptSize: bytes.byteLength,
      receiptUploadedAt: new Date(),
      rejectionReason: null,
    },
  });
}

/** The WhatsApp path (A20): the owner says "sudah transfer" without uploading anything. */
export async function confirmByWhatsApp(organizationId: string, paymentId: string) {
  const payment = await paymentForOrganization(organizationId, paymentId);
  if (!payment) throw new PaymentNotFound();
  if (payment.status === "PAID") throw new AlreadyProcessed();
  if (payment.status === "WAITING_VERIFICATION") return payment;
  return prisma.subscriptionPayment.update({
    where: { id: payment.id },
    data: { status: "WAITING_VERIFICATION", submittedAt: new Date(), rejectionReason: null },
  });
}

type Tx = Prisma.TransactionClient;

/**
 * A24: verification is also the moment the owner gets their seat. Idempotent by construction —
 * an already-active owner row is left alone, and a seat that is already taken by staff is not
 * stolen (the owner then stays read-only until a seat frees up).
 */
async function provisionOwnerSeat(tx: Tx, organizationId: string, operatorLimit: number) {
  const owner = await tx.member.findFirst({
    where: { organizationId, role: "OWNER" },
    select: { id: true, user: { select: { name: true, email: true } } },
  });
  if (!owner) return;

  const existing = await tx.operator.findUnique({
    where: { memberId: owner.id },
    select: { id: true, isActive: true },
  });
  if (existing?.isActive) return;

  const used = await tx.operator.count({ where: { organizationId, isActive: true } });
  if (used >= operatorLimit) return;

  if (existing) {
    await tx.operator.update({ where: { id: existing.id }, data: { isActive: true } });
    return;
  }
  await tx.operator.create({
    data: {
      organizationId,
      memberId: owner.id,
      name: owner.user.name,
      email: owner.user.email,
    },
  });
}

/**
 * A20 verification: PAID + a new Subscription + the owner's seat, in one transaction.
 * A13: a same-plan renewal continues from the paid period's end; anything else starts now.
 */
export async function verifyPayment(paymentId: string, adminUserId: string, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.subscriptionPayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new PaymentNotFound();

    const plan = planById(payment.package);
    if (!plan || plan.operatorLimit === null) throw new PlanNotPurchasable();

    // Serialises two admins working the same organization's queue at once.
    await tx.$queryRaw`SELECT id FROM "Organization" WHERE id = ${payment.organizationId} FOR UPDATE`;

    const claimed = await tx.subscriptionPayment.updateMany({
      where: { id: payment.id, status: "WAITING_VERIFICATION" },
      data: { status: "PAID", paidAt: now, verifiedAt: now, verifiedByUserId: adminUserId },
    });
    if (claimed.count === 0) throw new AlreadyProcessed();

    const current = await tx.subscription.findFirst({
      where: { organizationId: payment.organizationId },
      orderBy: { createdAt: "desc" },
    });
    const isRenewal = Boolean(current && current.package === payment.package && subscriptionIsActive(current, now));
    const period = periodFor(now, current, isRenewal);

    // A25. `Subscription_one_active_per_org` is checked at insert, so a still-ACTIVE prior row is
    // closed before the new row exists — never after.
    let subscription;
    if (isRenewal && current) {
      // Renewal: the same row runs on. It now points at the payment that bought this period.
      subscription = await tx.subscription.update({
        where: { id: current.id },
        data: { subscriptionPaymentId: payment.id, currentPeriodEnd: period.end },
      });
    } else {
      if (current?.status === "ACTIVE") {
        // Still in period and a different plan: an upgrade (downgrades are refused at checkout).
        // Past its period: it lapsed unpaid; A12 evaluated that at read time, the row now says so.
        const upgrade = subscriptionIsActive(current, now);
        await tx.subscription.update({
          where: { id: current.id },
          data: { status: upgrade ? "SUPERSEDED" : "UNPAID" },
        });
      }
      subscription = await tx.subscription.create({
        data: {
          organizationId: payment.organizationId,
          subscriptionPaymentId: payment.id,
          package: payment.package,
          operatorLimit: plan.operatorLimit,
          status: "ACTIVE",
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
        },
      });
    }

    await tx.organization.update({
      where: { id: payment.organizationId },
      data: { package: payment.package, operatorLimit: plan.operatorLimit },
    });

    await provisionOwnerSeat(tx, payment.organizationId, plan.operatorLimit);

    await tx.activityLog.create({
      data: {
        organizationId: payment.organizationId,
        userId: adminUserId,
        action: "PAYMENT_VERIFIED",
        resourceType: "SubscriptionPayment",
        resourceId: payment.id,
        metadata: JSON.stringify({
          package: payment.package,
          amount: payment.amount,
          periodStart: period.start,
          periodEnd: period.end,
        }),
      },
    });

    return subscription;
  }, { timeout: 15_000 });
}

/** Rejection keeps the row and the receipt: the owner re-uploads against the same code. */
export async function rejectPayment(paymentId: string, adminUserId: string, reason: string, now = new Date()) {
  const payment = await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new PaymentNotFound();

  const updated = await prisma.subscriptionPayment.updateMany({
    where: { id: paymentId, status: "WAITING_VERIFICATION" },
    data: { status: "REJECTED", rejectedAt: now, rejectedByUserId: adminUserId, rejectionReason: reason },
  });
  if (updated.count === 0) throw new AlreadyProcessed();

  await prisma.activityLog.create({
    data: {
      organizationId: payment.organizationId,
      userId: adminUserId,
      action: "PAYMENT_REJECTED",
      resourceType: "SubscriptionPayment",
      resourceId: payment.id,
      metadata: JSON.stringify({ reason }),
    },
  });
}

/** A21: oldest submission first. Plain age in WIB, no working-day arithmetic. */
export function verificationQueue(take = 100) {
  return prisma.subscriptionPayment.findMany({
    where: { status: "WAITING_VERIFICATION" },
    orderBy: [{ submittedAt: "asc" }, { createdAt: "asc" }],
    take,
    select: {
      id: true,
      orderId: true,
      amount: true,
      package: true,
      submittedAt: true,
      createdAt: true,
      receiptPath: true,
      organization: {
        select: {
          name: true,
          members: {
            where: { role: "OWNER" },
            take: 1,
            select: { user: { select: { name: true } } },
          },
        },
      },
    },
  });
}

/**
 * A20 retention: receipt files go 90 days after verification; the row keeps the audit trail.
 * Runs opportunistically when an admin opens the queue, and from cron on the VPS.
 */
export async function pruneReceipts(now = new Date(), take = 200): Promise<number> {
  const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const stale = await prisma.subscriptionPayment.findMany({
    where: { status: "PAID", verifiedAt: { lt: cutoff }, receiptPath: { not: null } },
    select: { id: true, receiptPath: true },
    take,
  });
  for (const row of stale) {
    if (row.receiptPath) await deleteReceipt(row.receiptPath);
    await prisma.subscriptionPayment.update({ where: { id: row.id }, data: { receiptPath: null } });
  }
  return stale.length;
}

/** Admin org list. Names, plans, limits and seats only — nothing from inside the tenant. */
export async function organizationsForAdmin() {
  return prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      package: true,
      operatorLimit: true,
      isActive: true,
      members: {
        where: { role: "OWNER" },
        take: 1,
        select: { user: { select: { name: true, email: true } } },
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, currentPeriodEnd: true },
      },
      _count: { select: { operators: { where: { isActive: true } } } },
    },
  });
}

/**
 * Custom orgs get their limit from the contract, so it is the one limit an admin may edit.
 * A Basic/Pro limit is the price table and is not a form field.
 */
export async function setCustomOperatorLimit(organizationId: string, operatorLimit: number) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { package: true },
  });
  if (!organization) throw new PaymentNotFound();
  if (organization.package !== "CUSTOM") throw new PaymentRefused();
  await prisma.organization.update({ where: { id: organizationId }, data: { operatorLimit } });
}

/** A20: a refund is recorded as deactivation, not as a payment status. */
export async function setOrganizationActive(organizationId: string, isActive: boolean) {
  await prisma.organization.update({ where: { id: organizationId }, data: { isActive } });
}
