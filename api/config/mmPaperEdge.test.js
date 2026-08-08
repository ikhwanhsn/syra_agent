import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MM_EARN_CURRENT_STAGE,
  MM_PAPER_EDGE_GATES,
  evaluateMmPaperEdge,
} from "./mmPaperEdge.js";

describe("evaluateMmPaperEdge", () => {
  it("fails on empty / insufficient sample", () => {
    const out = evaluateMmPaperEdge({});
    assert.equal(out.pass, false);
    assert.equal(out.checks.minHonestRoundTrips, false);
    assert.equal(out.earnYieldAllowed, false);
    assert.equal(out.currentStage, MM_EARN_CURRENT_STAGE);
  });

  it("passes when all gates clear", () => {
    const out = evaluateMmPaperEdge({
      honestRoundTrips: MM_PAPER_EDGE_GATES.minHonestRoundTrips,
      promotedNetPnlUsd: 12.5,
      midFallbackFrac: 0.01,
      inventoryDriftFrac: 0.4,
      promotionStability: MM_PAPER_EDGE_GATES.minPromotionStability,
    });
    assert.equal(out.pass, true);
    assert.equal(out.checks.minHonestRoundTrips, true);
    assert.equal(out.checks.netPositivePromoted, true);
    assert.equal(out.checks.midFallbackOk, true);
    assert.equal(out.checks.inventoryDriftOk, true);
    assert.equal(out.checks.promotionStable, true);
    assert.equal(out.earnYieldAllowed, false);
  });

  it("fails mid_fallback poison even with PnL", () => {
    const out = evaluateMmPaperEdge({
      honestRoundTrips: 80,
      promotedNetPnlUsd: 5,
      midFallbackFrac: 0.2,
      inventoryDriftFrac: 0.2,
      promotionStability: 5,
    });
    assert.equal(out.pass, false);
    assert.equal(out.checks.midFallbackOk, false);
  });
});
