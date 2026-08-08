import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MM_DEFAULTS } from "../../config/mmAgentConfig.js";
import {
  computeMmLearningDelta,
  computePromotionStability,
  resolveCurrentMmParams,
} from "./mmLearningService.js";

describe("resolveCurrentMmParams", () => {
  it("falls back to base when overrides empty", () => {
    const cur = resolveCurrentMmParams({}, MM_DEFAULTS);
    assert.equal(cur.spreadBps, MM_DEFAULTS.spreadBps);
    assert.equal(cur.inventorySkewFactor, MM_DEFAULTS.inventorySkewFactor);
  });

  it("applies partial overrides", () => {
    const cur = resolveCurrentMmParams({ spreadBps: 50, inventorySkewFactor: 0.7 }, MM_DEFAULTS);
    assert.equal(cur.spreadBps, 50);
    assert.equal(cur.inventorySkewFactor, 0.7);
    assert.equal(cur.orderSizeUsd, MM_DEFAULTS.orderSizeUsd);
  });
});

describe("computePromotionStability", () => {
  it("counts consecutive matches at end of history", () => {
    assert.equal(computePromotionStability([], "adaptive"), 1);
    assert.equal(
      computePromotionStability(
        [{ strategyId: "tight" }, { strategyId: "adaptive" }, { strategyId: "adaptive" }],
        "adaptive",
      ),
      3,
    );
    assert.equal(
      computePromotionStability([{ strategyId: "tight" }, { strategyId: "wide" }], "adaptive"),
      1,
    );
  });
});

describe("computeMmLearningDelta", () => {
  function makeTrip(partial) {
    return {
      strategyId: "adaptive",
      volumeUsd: 40,
      simPnlUsd: 0.5,
      spreadBps: 40,
      inventoryUsdAfter: 20,
      fillSource: "jupiter_quote",
      ...partial,
    };
  }

  it("evolves incrementally from current params on negative PnL", () => {
    const current = resolveCurrentMmParams({ spreadBps: 40, orderSizeUsd: 20 }, MM_DEFAULTS);
    const honestClosed = Array.from({ length: 10 }, () =>
      makeTrip({ simPnlUsd: -1, strategyId: "adaptive" }),
    );
    const out = computeMmLearningDelta({
      honestClosed,
      current,
      baseCfg: { ...MM_DEFAULTS },
      now: Date.now(),
    });
    assert.ok(out.effectiveParams.spreadBps > current.spreadBps);
    assert.ok(out.effectiveParams.orderSizeUsd < current.orderSizeUsd);
    assert.equal(out.thresholdOverrides.spreadBps, out.effectiveParams.spreadBps);
  });

  it("does not jump from defaults when current is already adapted", () => {
    const current = resolveCurrentMmParams(
      { spreadBps: 80, orderSizeUsd: 12, minEdgeBufferPct: 0.2 },
      MM_DEFAULTS,
    );
    const honestClosed = Array.from({ length: 10 }, () => makeTrip({ simPnlUsd: -2 }));
    const out = computeMmLearningDelta({
      honestClosed,
      current,
      baseCfg: { ...MM_DEFAULTS },
      now: Date.now(),
    });
    // +5 from current 80, not MM_DEFAULTS.spreadBps + 15
    assert.equal(out.effectiveParams.spreadBps, 85);
  });

  it("raises inventorySkewFactor on high-inventory losses", () => {
    const current = resolveCurrentMmParams({}, MM_DEFAULTS);
    const honestClosed = Array.from({ length: 8 }, (_, i) =>
      makeTrip({
        simPnlUsd: i < 3 ? -2 : 0.1,
        inventoryUsdAfter: MM_DEFAULTS.maxInventoryUsd * 0.9,
      }),
    );
    const out = computeMmLearningDelta({
      honestClosed,
      current,
      baseCfg: { ...MM_DEFAULTS },
      now: Date.now(),
    });
    assert.ok(out.effectiveParams.inventorySkewFactor > current.inventorySkewFactor);
    assert.ok(out.thresholdOverrides.inventorySkewFactor != null);
  });

  it("merges active cooldowns instead of dropping them", () => {
    const now = Date.now();
    const current = resolveCurrentMmParams({}, MM_DEFAULTS);
    const honestClosed = Array.from({ length: 8 }, () =>
      makeTrip({ strategyId: "tight", simPnlUsd: -2 }),
    );
    const out = computeMmLearningDelta({
      honestClosed,
      current,
      baseCfg: { ...MM_DEFAULTS },
      existingCooldowns: [
        {
          strategyId: "wide",
          reason: "prior",
          until: new Date(now + 60_000),
        },
      ],
      now,
    });
    const ids = out.strategyCooldowns.map((c) => c.strategyId).sort();
    assert.deepEqual(ids, ["tight", "wide"]);
  });
});
