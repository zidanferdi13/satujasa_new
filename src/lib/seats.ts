/**
 * Operator seats (TDD + CEO ruling: "owner can operate, and doing so consumes a seat").
 *
 * A seat is an `Operator` row, not a `Member(role: OPERATOR)` row. Today they are
 * one-to-one, because every operator login is created with both in one transaction.
 * The difference matters from M4: when the owner starts operating, the owner gets an
 * `Operator` row of their own and it must consume a seat. Counting Operator rows makes
 * that fall out with no change to the limit check, and makes "two workers on Basic"
 * impossible to build by accident.
 *
 * Only ACTIVE operators count (PM ruling): a deactivated operator cannot log in, so
 * holding their seat would sell capacity nobody can use. Reactivation must therefore
 * pass the same limit check as creation, under the same organization row lock —
 * otherwise deactivate/reactivate hands out a free seat.
 */
import type { Prisma } from "@prisma/client";
import { canAddOperator } from "./operator-quota.ts";

type Db = Pick<Prisma.TransactionClient, "operator">;

export async function countSeatsUsed(db: Db, organizationId: string): Promise<number> {
  return db.operator.count({ where: { organizationId, isActive: true } });
}

export class OperatorLimitReached extends Error {}

/**
 * Takes the organization row lock, then checks a seat is free. Must run inside the
 * transaction that creates or reactivates the operator: the lock serialises those
 * writes, so two concurrent requests cannot both pass the check and overshoot the limit.
 */
export async function claimSeat(tx: Prisma.TransactionClient, organizationId: string) {
  const [organization] = await tx.$queryRaw<{ operatorLimit: number }[]>`
    SELECT "operatorLimit" FROM "Organization" WHERE id = ${organizationId} FOR UPDATE`;
  if (!organization) throw new Error("Organization not found");
  if (!canAddOperator(await countSeatsUsed(tx, organizationId), organization.operatorLimit)) {
    throw new OperatorLimitReached();
  }
}
