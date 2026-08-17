/**
 * Run: node --test api/libs/refund/inboundRefundGuard.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateInboundRefund } from "./inboundRefundGuard.js";

describe("evaluateInboundRefund", () => {
  it("refunds 500 after successful settle", () => {
    const out = evaluateInboundRefund({
      statusCode: 500,
      settle: { success: true, payer: "Payer1111111111111111111111111111111111111", transaction: "sig" },
      priceUsd: 0.01,
      network: "solana:mainnet",
    });
    assert.equal(out.refundable, true);
    assert.equal(out.reason, "handler_5xx_after_settle");
    assert.equal(out.chain, "solana");
    assert.equal(out.amountUsd, 0.01);
  });

  it("skips 200", () => {
    const out = evaluateInboundRefund({
      statusCode: 200,
      settle: { success: true, payer: "Payer1111111111111111111111111111111111111" },
      priceUsd: 0.01,
      network: "solana",
    });
    assert.equal(out.refundable, false);
    assert.equal(out.reason, "not_server_error");
  });

  it("skips when settle failed", () => {
    const out = evaluateInboundRefund({
      statusCode: 500,
      settle: { success: false, payer: "Payer1111111111111111111111111111111111111" },
      priceUsd: 0.01,
      network: "solana",
    });
    assert.equal(out.refundable, false);
    assert.equal(out.reason, "settle_not_success");
  });

  it("skips unsupported chain", () => {
    const out = evaluateInboundRefund({
      statusCode: 503,
      settle: { success: true, payer: "0xB8B34bB10fABf2e4b2c2cD19fAe916da161C8445" },
      priceUsd: 0.01,
      network: "eip155:56",
    });
    assert.equal(out.refundable, false);
    assert.equal(out.reason, "unsupported_chain");
  });

  it("caps amount to maxRefundUsd", () => {
    const out = evaluateInboundRefund({
      statusCode: 502,
      settle: { success: true, payer: "Payer1111111111111111111111111111111111111" },
      priceUsd: 50,
      network: "solana",
    });
    assert.equal(out.refundable, true);
    assert.ok(out.amountUsd <= 1);
  });
});
