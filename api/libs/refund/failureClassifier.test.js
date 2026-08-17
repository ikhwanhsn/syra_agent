/**
 * Run: node --test api/libs/refund/failureClassifier.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyCallOutcome } from "./failureClassifier.js";

describe("classifyCallOutcome", () => {
  it("rejects unpaid calls", () => {
    const out = classifyCallOutcome({ httpStatus: 503, hadPayment: false });
    assert.equal(out.refundable, false);
    assert.equal(out.reason, "no_payment");
  });

  it("rejects 2xx after payment", () => {
    const out = classifyCallOutcome({ httpStatus: 200, hadPayment: true });
    assert.equal(out.refundable, false);
    assert.equal(out.reason, "success");
  });

  it("rejects 402 payment-layer failures", () => {
    const out = classifyCallOutcome({ httpStatus: 402, hadPayment: true });
    assert.equal(out.refundable, false);
    assert.equal(out.reason, "payment_layer");
  });

  it("rejects ordinary 4xx", () => {
    const out = classifyCallOutcome({
      httpStatus: 400,
      hadPayment: true,
      errorMessage: "bad request",
    });
    assert.equal(out.refundable, false);
    assert.equal(out.reason, "client_error");
  });

  it("refunds 5xx after payment", () => {
    for (const status of [500, 502, 503, 504]) {
      const out = classifyCallOutcome({ httpStatus: status, hadPayment: true });
      assert.equal(out.refundable, true);
      assert.equal(out.reason, "upstream_5xx");
    }
  });

  it("refunds 408 request timeout", () => {
    const out = classifyCallOutcome({ httpStatus: 408, hadPayment: true });
    assert.equal(out.refundable, true);
    assert.equal(out.reason, "request_timeout");
  });

  it("refunds network/timeout throws after payment", () => {
    const out = classifyCallOutcome({
      hadPayment: true,
      errorMessage: "fetch failed: ECONNRESET",
    });
    assert.equal(out.refundable, true);
    assert.equal(out.reason, "network_error");
  });

  it("refunds unknown throw after payment", () => {
    const out = classifyCallOutcome({
      hadPayment: true,
      errorMessage: "something exploded",
    });
    assert.equal(out.refundable, true);
    assert.equal(out.reason, "unknown_after_payment");
  });

  it("does not refund 429", () => {
    const out = classifyCallOutcome({ httpStatus: 429, hadPayment: true });
    assert.equal(out.refundable, false);
    assert.equal(out.reason, "client_error");
  });
});
