/**
 * Demo seed: the data a client sees when we demo the platform through a public tunnel.
 *
 * Everything personal in here is invented: KTP numbers use the 3200… block, which is not
 * an issued region code, and every plate ends in "DEMO", which no plate office issues.
 * A public URL must never carry real KTP or vehicle data (PM, demo environment item 6).
 *
 * Run through scripts/demo.sh, which recreates the database first. Idempotent on its own
 * too: it upserts by email/slug and skips if the demo file rows already exist.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * A19: the seed is a second door onto the same demo database, so it enforces the password rule
 * itself. `scripts/demo.sh` refuses a tunnel without DEMO_PASSWORD, but `pnpm prisma db seed`
 * (or this file directly) bypasses that script. Unset APP_URL means local use, which is fine;
 * anything that parses to a non-loopback host is not.
 */
function isLoopbackAppUrl(raw: string | undefined): boolean {
  if (!raw) return true;
  try {
    const host = new URL(raw).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false; // unparseable is not evidence of "local"
  }
}

if (!process.env.DEMO_PASSWORD && !isLoopbackAppUrl(process.env.APP_URL)) {
  console.error("DEMO_PASSWORD must be set when APP_URL is not localhost.");
  process.exit(1);
}

const PASSWORD = process.env.DEMO_PASSWORD ?? "demo1234";

const OWNER = { email: "owner@demo.test", name: "Owner Demo" };
const OPERATOR = { email: "operator@demo.test", name: "Operator Demo" };
/**
 * A20: a Super Admin lives outside tenancy — `platformRole`, no `Member` row, no organization.
 * Zidan runs that console, so the demo cannot depend on someone having typed an INSERT once:
 * a state that exists only by hand is one reseed away from a demo where the receipt queue
 * cannot be shown. This user is deliberately given no membership below.
 */
const SUPER_ADMIN = { email: "admin@demo.test", name: "Super Admin Demo" };

const FILES = [
  {
    customerName: "Budi Santoso",
    customerKtp: "3200000000000001",
    vehicleNumber: "B 0001 DEMO",
    serviceType: "STNK" as const,
    status: "COMPLETED_SAMSAT" as const,
    estimatedPrice: 1_500_000,
    dpAmount: 750_000,
    finalPrice: 1_500_000,
    samsatPayment: 1_100_000,
  },
  {
    customerName: "Siti Aminah",
    customerKtp: "3200000000000002",
    vehicleNumber: "B 0002 DEMO",
    serviceType: "PLAT" as const,
    status: "ON_PROGRESS_SAMSAT" as const,
    estimatedPrice: 900_000,
    dpAmount: 450_000,
    finalPrice: 900_000,
    samsatPayment: 650_000,
  },
  {
    customerName: "Agus Wijaya",
    customerKtp: "3200000000000003",
    vehicleNumber: "B 0003 DEMO",
    serviceType: "MUTASI" as const,
    status: "DP_PAID" as const,
    estimatedPrice: 1_200_000,
    dpAmount: 600_000,
    finalPrice: null,
    samsatPayment: null,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const owner = await prisma.user.upsert({
    where: { email: OWNER.email },
    // BUG-20: demo passwords are seed data too. Without the hash here, a reseed kept whatever
    // bcrypt string an earlier run wrote, so `demo1234` in the runbook was true only on a virgin
    // database — the one state the demo never starts from.
    update: { passwordHash },
    create: { email: OWNER.email, name: OWNER.name, passwordHash },
  });

  // A5/A24: Basic yields one worker total, so a demo that needs an owner *and* a staff operator
  // cannot be Basic. Pro (3 seats) is also the plan a biro with staff actually buys.
  const organization = await prisma.organization.upsert({
    where: { slug: "biro-jasa-demo" },
    update: {},
    create: { name: "Biro Jasa Demo", slug: "biro-jasa-demo", package: "PRO", operatorLimit: 3 },
  });

  const ownerMember = await prisma.member.upsert({
    where: { userId_organizationId: { userId: owner.id, organizationId: organization.id } },
    update: {},
    create: { userId: owner.id, organizationId: organization.id, role: "OWNER" },
  });

  // A24: the owner who works holds one of the seats, and verification provisions it in production.
  // Seeded here so the demo org has the row without anyone pressing "verify" on seed data.
  await prisma.operator.upsert({
    where: { memberId: ownerMember.id },
    update: {},
    create: {
      organizationId: organization.id,
      memberId: ownerMember.id,
      email: OWNER.email,
      name: OWNER.name,
    },
  });

  const existingActive = await prisma.subscription.count({
    where: { organizationId: organization.id, status: "ACTIVE" },
  });
  if (existingActive === 0) {
    // A12: no plan without a PAID payment, so the seeded subscription has one behind it.
    // A18: the subscription points back at that payment, so "which payment bought this?" is
    // answerable for the seeded org too — upsert, because a re-run must not throw on orderId.
    const seedPayment = await prisma.subscriptionPayment.upsert({
      where: { orderId: "DEMO-SEED-1" },
      update: {},
      create: {
        organizationId: organization.id,
        orderId: "DEMO-SEED-1",
        amount: 249_000,
        status: "PAID",
        paidAt: new Date(),
        verifiedAt: new Date(),
        package: "PRO",
        kind: "PURCHASE",
      },
    });
    await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        subscriptionPaymentId: seedPayment.id,
        package: "PRO",
        operatorLimit: 3,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const operatorUser = await prisma.user.upsert({
    where: { email: OPERATOR.email },
    update: { passwordHash },
    create: { email: OPERATOR.email, name: OPERATOR.name, passwordHash },
  });
  const operatorMember = await prisma.member.upsert({
    where: { userId_organizationId: { userId: operatorUser.id, organizationId: organization.id } },
    update: {},
    create: { userId: operatorUser.id, organizationId: organization.id, role: "OPERATOR" },
  });
  const operator = await prisma.operator.upsert({
    where: { memberId: operatorMember.id },
    update: {},
    create: {
      organizationId: organization.id,
      memberId: operatorMember.id,
      email: OPERATOR.email,
      name: OPERATOR.name,
    },
  });

  for (const file of FILES) {
    const exists = await prisma.file.findFirst({
      where: { organizationId: organization.id, vehicleNumber: file.vehicleNumber },
    });
    if (exists) continue;

    // revenue is the cached service fee: finalPrice - samsatPayment (never minus itself).
    const revenue = file.finalPrice === null ? null : file.finalPrice - (file.samsatPayment ?? 0);
    const record = await prisma.file.create({
      data: {
        organizationId: organization.id,
        operatorId: operator.id,
        customerName: file.customerName,
        customerKtp: file.customerKtp,
        vehicleNumber: file.vehicleNumber,
        ownershipType: "PERORANGAN",
        serviceType: file.serviceType,
        status: file.status,
        estimatedPrice: file.estimatedPrice,
        dpAmount: file.dpAmount,
        finalPrice: file.finalPrice,
        samsatPayment: file.samsatPayment,
        serviceFee: revenue,
        revenue,
      },
    });

    for (const type of ["CUSTOMER_PAYMENT", "SAMSAT_PAYMENT"] as const) {
      if (type === "SAMSAT_PAYMENT" && file.samsatPayment === null) continue;
      await prisma.transaction.create({
        data: {
          organizationId: organization.id,
          operatorId: operator.id,
          fileId: record.id,
          type,
          amount: type === "CUSTOMER_PAYMENT" ? (file.finalPrice ?? file.dpAmount) : file.samsatPayment!,
          paymentMethod: "transfer",
          status: "PAID",
        },
      });
    }
  }

  // Idempotent like the rest: the role is re-asserted on every run, so a demoted admin is
  // promoted back rather than leaving the console unreachable.
  await prisma.user.upsert({
    where: { email: SUPER_ADMIN.email },
    update: { platformRole: "SUPER_ADMIN", passwordHash },
    create: {
      email: SUPER_ADMIN.email,
      name: SUPER_ADMIN.name,
      passwordHash,
      platformRole: "SUPER_ADMIN",
    },
  });

  console.log(
    `seeded: ${organization.name} (owner ${OWNER.email}, operator ${OPERATOR.email}, super admin ${SUPER_ADMIN.email})`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
