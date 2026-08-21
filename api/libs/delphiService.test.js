/**
 * Delphi paper PnL math and entry gates. Offline only.
 * Run: node --test api/libs/delphiService.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateDelphiOpenGate, evaluateDelphiRunResolution } from "./delphiService.js";

const STRATEGY = {
  minTraderQuality: 0.45,
  minConsensus: 0.6,
  minSampleSize: 3,
  biasThreshold: 0.25,
  exit: { stopLossPct: -5, takeProfitPct: 8, maxHoldMin: 36 * 60, flipOnReversal: true },
  maxHoldHours: 36,
};

test("evaluateDelphiOpenGate requires sample, consensus, quality, and |bias|", () => {
  const weak = evaluateDelphiOpenGate({
    strategy: STRATEGY,
    signal: { sampleSize: 1, consensus: 0.9, traderQuality: 0.8, bias: 0.8 },
  });
  assert.equal(weak.pass, false);
  assert.equal(weak.reason, "sample_size");

  const chop = evaluateDelphiOpenGate({
    strategy: STRATEGY,
    signal: { sampleSize: 5, consensus: 0.9, traderQuality: 0.8, bias: 0.1 },
  });
  assert.equal(chop.pass, false);
  assert.equal(chop.reason, "bias");

  const long = evaluateDelphiOpenGate({
    strategy: STRATEGY,
    signal: { sampleSize: 5, consensus: 0.8, traderQuality: 0.7, bias: 0.55 },
  });
  assert.equal(long.pass, true);
  assert.equal(long.side, "long");

  const short = evaluateDelphiOpenGate({
    strategy: STRATEGY,
    signal: { sampleSize: 5, consensus: 0.8, traderQuality: 0.7, bias: -0.6 },
  });
  assert.equal(short.pass, true);
  assert.equal(short.side, "short");
});

test("evaluateDelphiRunResolution applies SL/TP on directional PnL", () => {
  const longRun = {
    side: "long",
    entryPriceUsd: 100,
    notionalUsd: 200,
    openedAt: new Date("2026-08-17T00:00:00Z"),
  };
  const sl = evaluateDelphiRunResolution(longRun, {
    markPriceUsd: 94,
    now: new Date("2026-08-17T01:00:00Z"),
    strategy: STRATEGY,
  });
  assert.equal(sl.close, true);
  assert.equal(sl.status, "loss");
  assert.equal(sl.resolution, "stop_loss");
  assert.ok(sl.pnlPct <= -5);
  assert.equal(sl.pnlUsd, -12);

  const tp = evaluateDelphiRunResolution(longRun, {
    markPriceUsd: 110,
    now: new Date("2026-08-17T01:00:00Z"),
    strategy: STRATEGY,
  });
  assert.equal(tp.close, true);
  assert.equal(tp.status, "win");
  assert.equal(tp.resolution, "take_profit");
  assert.equal(tp.pnlUsd, 20);
});

test("short paper PnL inverts mark vs entry", () => {
  const shortRun = {
    side: "short",
    entryPriceUsd: 100,
    notionalUsd: 100,
    openedAt: new Date("2026-08-17T00:00:00Z"),
  };
  const win = evaluateDelphiRunResolution(shortRun, {
    markPriceUsd: 90,
    now: new Date("2026-08-17T01:00:00Z"),
    strategy: STRATEGY,
  });
  assert.equal(win.close, true);
  assert.equal(win.status, "win");
  assert.equal(win.pnlPct, 10);

  const loss = evaluateDelphiRunResolution(shortRun, {
    markPriceUsd: 108,
    now: new Date("2026-08-17T01:00:00Z"),
    strategy: STRATEGY,
  });
  assert.equal(loss.close, true);
  assert.equal(loss.status, "loss");
  assert.equal(loss.pnlPct, -8);
});

test("signal reversal flattens when live bias crosses the threshold", () => {
  const longRun = {
    side: "long",
    entryPriceUsd: 100,
    notionalUsd: 100,
    openedAt: new Date("2026-08-17T00:00:00Z"),
  };
  const hold = evaluateDelphiRunResolution(longRun, {
    markPriceUsd: 101,
    liveBias: 0.4,
    now: new Date("2026-08-17T01:00:00Z"),
    strategy: STRATEGY,
  });
  assert.equal(hold.close, false);

  const flip = evaluateDelphiRunResolution(longRun, {
    markPriceUsd: 101,
    liveBias: -0.4,
    now: new Date("2026-08-17T01:00:00Z"),
    strategy: STRATEGY,
  });
  assert.equal(flip.close, true);
  assert.equal(flip.resolution, "signal_reversal");
  assert.equal(flip.status, "win");
});

test("time expiry labels win vs expired from signed PnL", () => {
  const run = {
    side: "long",
    entryPriceUsd: 100,
    notionalUsd: 50,
    openedAt: new Date("2026-08-01T00:00:00Z"),
  };
  const expired = evaluateDelphiRunResolution(run, {
    markPriceUsd: 99,
    now: new Date("2026-08-17T00:00:00Z"),
    strategy: STRATEGY,
  });
  assert.equal(expired.close, true);
  assert.equal(expired.resolution, "time_expiry");
  assert.equal(expired.status, "expired");
});
