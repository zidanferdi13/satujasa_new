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
 * Deactivated operators still count, exactly as the previous Member(OPERATOR) count did.
 * Whether deactivation should free a seat is an open question for PM/CEO (M3), not decided here.
 */
import type { Prisma } from "@prisma/client";

type Db = Pick<Prisma.TransactionClient, "operator">;

export async function countSeatsUsed(db: Db, organizationId: string): Promise<number> {
  return db.operator.count({ where: { organizationId } });
}
