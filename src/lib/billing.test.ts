import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutRefusal } from "./billing.ts";

test("same-plan renewal is allowed", () => {
  assert.equal(checkoutRefusal("BASIC", "BASIC"), null);
  assert.equal(checkoutRefusal("PRO", "PRO"), null);
});

test("upgrade is allowed", () => {
  assert.equal(checkoutRefusal("BASIC", "PRO"), null);
});

test("Pro -> Basic is a downgrade and is refused (no downgrade in the MVP)", () => {
  assert.equal(checkoutRefusal("PRO", "BASIC"), "DOWNGRADE_NOT_SUPPORTED");
});

test("Custom has no checkout", () => {
  assert.equal(checkoutRefusal("BASIC", "CUSTOM"), "PLAN_NOT_PURCHASABLE");
  assert.equal(checkoutRefusal("PRO", "CUSTOM"), "PLAN_NOT_PURCHASABLE");
  assert.equal(checkoutRefusal("CUSTOM", "CUSTOM"), "PLAN_NOT_PURCHASABLE");
});
