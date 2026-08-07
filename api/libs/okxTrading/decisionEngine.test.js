import { test } from "node:test";
import assert from "node:assert/strict";
import {
  signalToScore,
  sentimentToScore,
  computeCompositeScore,
} from "./decisionEngine.js";

test("signalToScore maps direction + strength", () => {
  assert.equal(signalToScore({ metadata: { TRADING_SIGNAL: "BUY", SIGNAL_STRENGTH: "HIGH" } }), 1);
  assert.equal(signalToScore({ metadata: { TRADING_SIGNAL: "SELL", SIGNAL_STRENGTH: "HIGH" } }), -1);
  assert.equal(signalToScore({ metadata: { TRADING_SIGNAL: "BUY", SIGNAL_STRENGTH: "MEDIUM" } }), 0.6);
  assert.equal(signalToScore({ metadata: { TRADING_SIGNAL: "HOLD" } }), 0);
  assert.equal(signalToScore({}), 0);
});

test("sentimentToScore clamps and normalizes shapes", () => {
  assert.equal(sentimentToScore(null), 0);
  assert.equal(sentimentToScore(0.5), 0.5);
  assert.equal(sentimentToScore(1.5), 1); // boundary: not >1.5, so clamped to 1
  assert.equal(sentimentToScore([{ sentiment_score: -0.3 }]), -0.3);
  // 0..100 scale
  assert.equal(sentimentToScore(75), 0.5);
  assert.equal(sentimentToScore(25), -0.5);
});

test("computeCompositeScore weights signals and decides side", () => {
  const strongBuy = computeCompositeScore({
    signals: [
      { score: 1, weight: 0.7 },
      { score: 1, weight: 0.4 },
    ],
    sentimentScore: 1,
  });
  assert.equal(strongBuy.side, "buy");
  assert.ok(strongBuy.conviction > 0.9);

  const hold = computeCompositeScore({ signals: [{ score: 0, weight: 0.7 }], sentimentScore: 0 });
  assert.equal(hold.side, "hold");

  const sell = computeCompositeScore({
    signals: [
      { score: -1, weight: 0.7 },
      { score: -0.6, weight: 0.4 },
    ],
    sentimentScore: -0.5,
  });
  assert.equal(sell.side, "sell");
  assert.ok(sell.score < -0.15);
});

test("computeCompositeScore stays within [-1,1]", () => {
  const r = computeCompositeScore({
    signals: [
      { score: 5, weight: 1 },
      { score: 5, weight: 1 },
    ],
    sentimentScore: 5,
  });
  assert.ok(r.score <= 1 && r.score >= -1);
});
