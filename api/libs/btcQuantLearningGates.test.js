import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  meetsBtcQuantMinConfidence,
  resolveBtcQuantLearningThresholds,
  withBtcQuantLearningGateTighten,
} from "./btcQuantLearningGates.js";

describe("btcQuantLearningGates", () => {
  it("does not block when minConfidence is unset", () => {
    assert.equal(meetsBtcQuantMinConfidence("LOW", null), true);
    assert.equal(meetsBtcQuantMinConfidence(null, undefined), true);
    assert.equal(meetsBtcQuantMinConfidence("MEDIUM", ""), true);
  });

  it("enforces HIGH minConfidence against LOW/MEDIUM/HIGH", () => {
    assert.equal(meetsBtcQuantMinConfidence("LOW", "HIGH"), false);
    assert.equal(meetsBtcQuantMinConfidence("MEDIUM", "HIGH"), false);
    assert.equal(meetsBtcQuantMinConfidence("HIGH", "HIGH"), true);
    assert.equal(meetsBtcQuantMinConfidence(null, "HIGH"), false);
  });

  it("bumps signalGate.minPasses from minPassesDelta", () => {
    const tightened = withBtcQuantLearningGateTighten(
      { id: 1, signalGate: { any: [{ field: "rsi", op: "lte", value: 40 }], minPasses: 1 } },
      { minPassesDelta: 1 },
    );
    assert.equal(tightened.signalGate.minPasses, 2);

    const capped = withBtcQuantLearningGateTighten(
      { id: 1, signalGate: { minPasses: 3 } },
      { minPassesDelta: 2 },
    );
    assert.equal(capped.signalGate.minPasses, 3);

    const untouched = withBtcQuantLearningGateTighten({ id: 1, signalGate: { minPasses: 1 } }, {});
    assert.equal(untouched.signalGate.minPasses, 1);
  });

  it("normalizes thresholdOverrides for consumers", () => {
    const tight = resolveBtcQuantLearningThresholds({
      minConfidence: "high",
      maxNotionalMultiplier: 0.85,
      minPassesDelta: 1,
    });
    assert.deepEqual(tight, {
      minConfidence: "HIGH",
      maxNotionalMultiplier: 0.85,
      minPassesDelta: 1,
    });

    const relaxed = resolveBtcQuantLearningThresholds({
      minConfidence: null,
      maxNotionalMultiplier: 1,
      minPassesDelta: 0,
    });
    assert.equal(relaxed.minConfidence, null);
    assert.equal(relaxed.maxNotionalMultiplier, 1);
    assert.equal(relaxed.minPassesDelta, 0);
  });
});
