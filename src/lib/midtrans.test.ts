import assert from "node:assert/strict";
import test from "node:test";
import {
  grossAmountToRupiah,
  notificationSignature,
  paymentOutcome,
  signatureMatches,
} from "./midtrans.ts";

test("signature is sha512(order_id + status_code + gross_amount + server key)", () => {
  // Fixed vector: if the concatenation order or the hash ever changes, every genuine
  // Midtrans notification would be rejected — so the value is pinned, not recomputed.
  assert.equal(
    notificationSignature({
      orderId: "order-1",
      statusCode: "200",
      grossAmount: "99000.00",
      serverKey: "server-key",
    }),
    "133a9d22bebb8f93818a54ac595c05ee262e24763d0b645b6d634d307fd8d64ee1f760572dc62f6d1b24fd401e6505dd19b94fe20be777761712abc21ab2eb7a",
  );
});

test("signature comparison rejects a wrong or truncated signature", () => {
  const expected = notificationSignature({
    orderId: "order-1",
    statusCode: "200",
    grossAmount: "99000.00",
    serverKey: "server-key",
  });
  assert.equal(signatureMatches(expected, expected), true);
  assert.equal(signatureMatches(expected, `0${expected.slice(1)}`), false);
  assert.equal(signatureMatches(expected, expected.slice(0, -2)), false);
  assert.equal(signatureMatches(expected, ""), false);
});

test("midtrans statuses map to the stored payment state", () => {
  assert.equal(paymentOutcome("settlement"), "PAID");
  assert.equal(paymentOutcome("capture", "accept"), "PAID");
  assert.equal(paymentOutcome("capture", "challenge"), "PENDING");
  assert.equal(paymentOutcome("capture", "deny"), "FAILED");
  assert.equal(paymentOutcome("pending"), "PENDING");
  assert.equal(paymentOutcome("expire"), "EXPIRED");
  assert.equal(paymentOutcome("deny"), "FAILED");
  assert.equal(paymentOutcome("cancel"), "FAILED");
  assert.equal(paymentOutcome("failure"), "FAILED");
  assert.equal(paymentOutcome("refund"), "REFUNDED");
  // An unknown status must never be guessed into PAID or FAILED.
  assert.equal(paymentOutcome("something-new"), undefined);
});

test("gross_amount is accepted only as whole rupiah", () => {
  assert.equal(grossAmountToRupiah("99000.00"), 99000);
  assert.equal(grossAmountToRupiah("249000.00"), 249000);
  assert.equal(grossAmountToRupiah("99000.50"), null);
  assert.equal(grossAmountToRupiah("-1"), null);
  assert.equal(grossAmountToRupiah(""), null);
  assert.equal(grossAmountToRupiah("abc"), null);
});
