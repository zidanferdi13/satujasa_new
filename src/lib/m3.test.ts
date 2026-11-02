import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeMoney,
  jakartaMonthRange,
  maskKtp,
  pickupRefused,
  sumRevenue,
  transitionRefusal,
} from "./file-rules.ts";
import { isOverOperatorLimit, operatorMaySignIn, subscriptionIsActive } from "./entitlement.ts";

test("serviceFee = revenue = finalPrice − samsatPayment, null until both exist", () => {
  assert.deepEqual(computeMoney({ finalPrice: 1_500_000, samsatPayment: 1_200_000 }), {
    serviceFee: 300_000,
    revenue: 300_000,
  });
  assert.deepEqual(computeMoney({ finalPrice: 1_500_000, samsatPayment: null }), {
    serviceFee: null,
    revenue: null,
  });
  assert.deepEqual(computeMoney({ finalPrice: null, samsatPayment: 900_000 }), {
    serviceFee: null,
    revenue: null,
  });
  // A fee of zero is a real number, not "missing".
  assert.deepEqual(computeMoney({ finalPrice: 900_000, samsatPayment: 900_000 }), {
    serviceFee: 0,
    revenue: 0,
  });
});

test("PICKED_UP refuses without finalPrice, and below samsatPayment", () => {
  assert.equal(pickupRefused({ finalPrice: null, samsatPayment: 500_000 }), true);
  assert.equal(pickupRefused({ finalPrice: 500_000, samsatPayment: null }), true);
  assert.equal(pickupRefused({ finalPrice: 400_000, samsatPayment: 500_000 }), true);
  assert.equal(pickupRefused({ finalPrice: 500_000, samsatPayment: 500_000 }), false);
});

test("transitions walk forward, cancel is allowed once, nothing walks back", () => {
  assert.equal(transitionRefusal("DRAFT", "DP_PAID"), null);
  assert.equal(transitionRefusal("DRAFT", "COMPLETED_SAMSAT"), null);
  assert.equal(transitionRefusal("DRAFT", "PICKED_UP"), null);
  assert.equal(transitionRefusal("COMPLETED_SAMSAT", "PICKED_UP"), null);
  assert.equal(transitionRefusal("DRAFT", "CANCELED"), null);
  assert.equal(transitionRefusal("COMPLETED_SAMSAT", "CANCELED"), null);
  // Same status is a re-save, not a transition.
  assert.equal(transitionRefusal("DP_PAID", "DP_PAID"), null);
  // Backwards is refused.
  assert.equal(transitionRefusal("COMPLETED_SAMSAT", "DP_PAID"), "BACKWARD");
  assert.equal(transitionRefusal("DP_PAID", "DRAFT"), "BACKWARD");
  assert.equal(transitionRefusal("CANCELED", "DRAFT"), "TERMINAL");
  // Terminal means terminal, even to another terminal state.
  assert.equal(transitionRefusal("PICKED_UP", "CANCELED"), "TERMINAL");
  assert.equal(transitionRefusal("PICKED_UP", "PICKED_UP"), "TERMINAL");
});

test("KTP masks to 12 dots + last four digits, and short values mask fully", () => {
  assert.equal(maskKtp("3200000000000001"), "••••••••••••0001");
  assert.equal(maskKtp("3200 0000 0000 0001"), "••••••••••••0001");
  assert.equal(maskKtp("12"), "••••••••••••");
  assert.equal(maskKtp("").includes("0001"), false);
});

test("a Jakarta month window is half-open and does not use server local time", () => {
  // 2026-10-31T18:30Z = 2026-11-01 01:30 WIB → November.
  const { start, end } = jakartaMonthRange(new Date("2026-10-31T18:30:00Z"));
  assert.equal(start.toISOString(), "2026-10-31T17:00:00.000Z");
  assert.equal(end.toISOString(), "2026-11-30T17:00:00.000Z");
  // 2026-10-01T00:00 WIB is 2026-09-30T17:00Z, inside the window.
  const october = jakartaMonthRange(new Date("2026-10-05T00:00:00Z"));
  assert.equal(october.start.toISOString(), "2026-09-30T17:00:00.000Z");
  assert.equal(october.end.toISOString(), "2026-10-31T17:00:00.000Z");
  assert.equal(october.start.getTime() <= new Date("2026-10-01T00:00:00+07:00").getTime(), true);
});

test("revenue sums cached values and treats null as zero", () => {
  assert.equal(sumRevenue([{ revenue: 300_000 }, { revenue: null }, { revenue: 50_000 }]), 350_000);
  assert.equal(sumRevenue([]), 0);
});

test("subscription is active only while ACTIVE and not past its end", () => {
  const now = new Date("2026-10-28T00:00:00Z");
  assert.equal(subscriptionIsActive(null, now), false);
  assert.equal(
    subscriptionIsActive({ status: "ACTIVE", currentPeriodEnd: new Date("2026-10-29T00:00:00Z") }, now),
    true
  );
  assert.equal(
    subscriptionIsActive({ status: "ACTIVE", currentPeriodEnd: new Date("2026-10-27T00:00:00Z") }, now),
    false
  );
  assert.equal(
    subscriptionIsActive({ status: "CANCELED", currentPeriodEnd: new Date("2027-01-01T00:00:00Z") }, now),
    false
  );
  // Exactly at the end instant is expired, not active.
  assert.equal(
    subscriptionIsActive({ status: "ACTIVE", currentPeriodEnd: now }, now),
    false
  );
});

test("over-limit blocks operators; a null (Custom) limit never does", () => {
  assert.equal(isOverOperatorLimit(2, 1), true);
  assert.equal(isOverOperatorLimit(1, 1), false);
  assert.equal(isOverOperatorLimit(9, null), false);
  const future = { status: "ACTIVE", currentPeriodEnd: new Date("2027-01-01T00:00:00Z") };
  const now = new Date("2026-10-28T00:00:00Z");
  assert.equal(operatorMaySignIn(future, 1, 1, now), true);
  assert.equal(operatorMaySignIn(future, 2, 1, now), false);
  assert.equal(operatorMaySignIn(null, 0, 1, now), false);
});
