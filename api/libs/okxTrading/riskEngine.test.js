import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sizePosition,
  evaluateExit,
  checkCircuitBreakers,
  buildTradePlan,
} from "./riskEngine.js";

const cfg = {
  perTradePct: 0.35,
  maxOpenPositions: 3,
  maxDeployedPct: 0.9,
  reserveUsd: 10,
  minConviction: 0.45,
  minTradeUsd: 5,
  stopLossPct: 0.06,
  takeProfitPct: 0.25,
  trailingTakeProfitPct: 0.04,
  dailyMaxLossPct: 0.15,
  maxDrawdownPct: 0.4,
};

test("sizePosition scales with conviction", () => {
  const low = sizePosition({ equityUsd: 300, conviction: 0, cfg });
  const high = sizePosition({ equityUsd: 300, conviction: 1, cfg });
  assert.ok(high > low);
  assert.ok(Math.abs(high - 300 * 0.35) < 1e-6); // conviction 1 => full per-trade
  assert.ok(Math.abs(low - 300 * 0.35 * 0.6) < 1e-6);
});

test("evaluateExit triggers hard stop loss", () => {
  const r = evaluateExit({
    position: { entryPriceUsd: 100, peakPriceUsd: 100 },
    currentPriceUsd: 93,
    candidateScore: 0.5,
    cfg,
  });
  assert.equal(r.exit, true);
  assert.equal(r.reason, "stop_loss");
});

test("evaluateExit trailing take profit only after run-up + giveback", () => {
  // +30% from entry (>=25% TP arm) and 7% giveback from peak (>=4%) -> exit
  const exit = evaluateExit({
    position: { entryPriceUsd: 100, peakPriceUsd: 140 },
    currentPriceUsd: 130,
    candidateScore: 0.2,
    cfg,
  });
  assert.equal(exit.exit, true);
  assert.equal(exit.reason, "trailing_take_profit");

  // +38% but still near peak (1.4% giveback < 4%) -> hold
  const hold = evaluateExit({
    position: { entryPriceUsd: 100, peakPriceUsd: 140 },
    currentPriceUsd: 138,
    candidateScore: 0.2,
    cfg,
  });
  assert.equal(hold.exit, false);
});

test("evaluateExit exits on decisive bearish signal flip", () => {
  const r = evaluateExit({
    position: { entryPriceUsd: 100, peakPriceUsd: 105 },
    currentPriceUsd: 102,
    candidateScore: -0.5,
    cfg,
  });
  assert.equal(r.exit, true);
  assert.equal(r.reason, "signal_flip");
});

test("checkCircuitBreakers daily halt and total kill", () => {
  const halt = checkCircuitBreakers({ equityUsd: 84, dayStartEquityUsd: 100, startEquityUsd: 100, cfg });
  assert.equal(halt.haltEntries, true);
  assert.equal(halt.kill, false);

  const kill = checkCircuitBreakers({ equityUsd: 55, dayStartEquityUsd: 60, startEquityUsd: 100, cfg });
  assert.equal(kill.kill, true);
});

test("buildTradePlan opens top conviction buys within limits", () => {
  const candidates = [
    { token: "solana", priceUsd: 100, score: 0.8, side: "buy", conviction: 0.8 },
    { token: "ethereum", priceUsd: 2000, score: 0.6, side: "buy", conviction: 0.6 },
    { token: "ripple", priceUsd: 0.5, score: 0.2, side: "buy", conviction: 0.2 }, // below minConviction
  ];
  const plan = buildTradePlan({
    candidates,
    positions: [],
    equityUsd: 300,
    cashUsd: 300,
    breaker: { haltEntries: false },
    cfg,
  });
  assert.equal(plan.buys.length, 2);
  assert.equal(plan.buys[0].token, "solana");
  assert.ok(plan.buys.every((b) => b.notionalUsd >= cfg.minTradeUsd));
});

test("buildTradePlan halts entries under breaker but still exits", () => {
  const positions = [{ token: "solana", symbol: "SOLUSDT", entryPriceUsd: 100, peakPriceUsd: 100, qty: 1 }];
  const candidates = [{ token: "solana", priceUsd: 90, score: 0.5, side: "buy", conviction: 0.9 }];
  const plan = buildTradePlan({
    candidates,
    positions,
    equityUsd: 90,
    cashUsd: 0,
    breaker: { haltEntries: true },
    cfg,
  });
  assert.equal(plan.buys.length, 0);
  assert.equal(plan.sells.length, 1); // -10% hits stop loss
  assert.equal(plan.sells[0].reason, "stop_loss");
});

test("buildTradePlan does not double-buy an existing holding", () => {
  const positions = [{ token: "solana", symbol: "SOLUSDT", entryPriceUsd: 100, peakPriceUsd: 100, qty: 1 }];
  const candidates = [{ token: "solana", priceUsd: 101, score: 0.8, side: "buy", conviction: 0.8 }];
  const plan = buildTradePlan({
    candidates,
    positions,
    equityUsd: 300,
    cashUsd: 300,
    breaker: { haltEntries: false },
    cfg,
  });
  assert.equal(plan.buys.length, 0);
});
