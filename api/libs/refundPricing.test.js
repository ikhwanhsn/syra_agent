/**
 * Run: node --test api/libs/refundPricing.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isRefundEligibleAgentTool,
  getEffectiveAgentToolPriceUsd,
  getDisplayAgentToolPriceUsd,
} from "./refundPricing.js";

describe("refundPricing", () => {
  process.env.REFUND_ENABLED = "true";
  process.env.REFUND_COVER_OUTBOUND = "true";

  it("marks external paid providers eligible", () => {
    assert.equal(isRefundEligibleAgentTool({ nansenPath: "/v1/foo" }), true);
    assert.equal(isRefundEligibleAgentTool({ birdeyePath: "/defi/price" }), true);
    assert.equal(isRefundEligibleAgentTool({ path: "/news", priceUsd: 0.01 }), false);
  });

  it("does not add a premium to tool price", () => {
    const tool = { priceUsd: 0.05, nansenPath: "/v1/foo" };
    assert.equal(getEffectiveAgentToolPriceUsd(tool, null), 0.05);
    assert.equal(getDisplayAgentToolPriceUsd({ ...tool, displayPriceUsd: 0.04 }), 0.04);
  });
});
