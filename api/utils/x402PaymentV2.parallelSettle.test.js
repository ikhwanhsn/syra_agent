/**
 * Parallel settle: settlePaymentAndSetResponse must await a stashed settlePromise
 * (kicked off after verify) instead of starting a second settle.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { settlePaymentAndSetResponse } from "./x402PaymentV2.js";

function mockRes() {
  /** @type {Record<string, string>} */
  const headers = {};
  return {
    headers,
    statusCode: 200,
    setHeader(name, value) {
      headers[String(name).toLowerCase()] = String(value);
    },
  };
}

describe("settlePaymentAndSetResponse eager settlePromise", () => {
  it("awaits req.x402Payment.settlePromise and does not double-settle", async () => {
    let settleCalls = 0;
    const settleResult = {
      success: true,
      payer: "TestPayer1111111111111111111111111111111",
      transaction: "5".repeat(64),
      network: "solana:mainnet",
      retries: 0,
    };
    const settlePromise = (async () => {
      settleCalls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return settleResult;
    })();

    const req = {
      path: "/health",
      method: "GET",
      headers: {},
      get() {
        return undefined;
      },
      x402Payment: {
        payload: { x402Version: 2, accepted: { network: "solana:mainnet", amount: "1000" } },
        accepted: { network: "solana:mainnet", amount: "1000" },
        priceUsd: 0.001,
        settlePromise,
        settleStartedAt: Date.now() - 50,
        paidPathStartedAt: Date.now() - 120,
        verifyLatencyMs: 70,
      },
    };
    const res = mockRes();

    const out = await settlePaymentAndSetResponse(res, req);

    assert.equal(settleCalls, 1);
    assert.equal(out?.success, true);
    assert.ok(res.headers["payment-response"]);
    assert.equal(req._requestInsightPaid, true);
  });
});
