import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractEventScore,
  extractHeadlineSentiment,
  extractFreshnessScore,
  warnIfSignalsCollapsed,
  scoreStockSignal,
  applyStocksSignalGate,
} from "./stocksNewsSignals.js";
import { computeMomentumFromPrices } from "./stocksPriceMomentum.js";

describe("stocksNewsSignals", () => {
  it("scores headlines from title text, not a dead API field", () => {
    const bull = extractHeadlineSentiment([
      { title: "Tesla beats earnings and raises guidance" },
      { title: "Analyst upgrade sends shares higher" },
    ]);
    const bear = extractHeadlineSentiment([
      { title: "Tesla misses delivery estimates after probe" },
      { title: "Downgrade and lawsuit hit the stock" },
    ]);
    const empty = extractHeadlineSentiment([{ title: "Company holds annual meeting" }]);
    assert.ok(bull > 0.5, `bull ${bull}`);
    assert.ok(bear < -0.5, `bear ${bear}`);
    assert.equal(empty, 0);
  });

  it("does not saturate event score on a handful of rows", () => {
    const one = extractEventScore(
      [{ date: new Date().toISOString().slice(0, 10), ticker: [{ event_name: "Earnings" }] }],
      Date.now(),
    );
    const many = extractEventScore(
      [
        {
          date: new Date().toISOString().slice(0, 10),
          ticker: [
            { event_name: "Earnings" },
            { event_name: "Earnings" },
            { event_name: "Guidance" },
            { event_name: "Dividend" },
            { event_name: "Buyback" },
            { event_name: "Split" },
          ],
        },
      ],
      Date.now(),
    );
    assert.ok(one > 0 && one < 0.7, `one ${one}`);
    assert.ok(many > one, `many ${many} vs one ${one}`);
    assert.ok(many < 1);
  });

  it("decays stale events toward zero", () => {
    const stale = extractEventScore(
      [{ date: "2020-01-01", ticker: [{ event_name: "Old IPO" }] }],
      Date.now(),
    );
    assert.equal(stale, 0);
  });

  it("freshness is 0 with no news", () => {
    assert.equal(extractFreshnessScore([]), 0);
  });

  it("computes momentum from price returns, not sentiment", () => {
    const up = computeMomentumFromPrices([100, 102, 105, 110], null);
    const down = computeMomentumFromPrices([110, 108, 104, 98], null);
    assert.ok(up.momentumScore > 0.6, `up ${up.momentumScore}`);
    assert.ok(down.momentumScore < 0.4, `down ${down.momentumScore}`);
    assert.ok(up.trendScore > down.trendScore);
    assert.ok(up.volatilityPct > 0);
  });

  it("falls back to 24h change when the series is short", () => {
    const fromChg = computeMomentumFromPrices([100], 8);
    assert.ok(fromChg.momentumScore > 0.55);
  });

  it("flags collapsed momentum across the universe", () => {
    const { collapsed } = warnIfSignalsCollapsed(
      [
        { sentimentScore: 0, eventScore: 1, momentumScore: 0.7, trendScore: 0.7 },
        { sentimentScore: 0, eventScore: 1, momentumScore: 0.7, trendScore: 0.7 },
      ],
      () => {},
    );
    assert.ok(collapsed.includes("momentumScore"));
    assert.ok(collapsed.includes("sentimentScore"));
  });

  it("scores trend_score when weighted", () => {
    const score = scoreStockSignal(
      { momentum_score: 1, trend_score: 1 },
      { momentumScore: 0.8, trendScore: 0.2, sentimentScore: 0, eventScore: 0, freshnessScore: 0, volumeScore: 0, spreadScore: 0 },
    );
    assert.ok(score > 0.4 && score < 0.6);
  });

  it("gates on real momentum fields", () => {
    const pass = applyStocksSignalGate(
      { signalGate: { all: [{ field: "momentum_score", op: "gte", value: 0.55 }], minPasses: 1 } },
      { momentumScore: 0.7, trendScore: 0.6, sentimentScore: 0, eventScore: 0, freshnessScore: 0, volumeScore: 0, spreadScore: 0, direction: "long" },
    );
    const fail = applyStocksSignalGate(
      { signalGate: { all: [{ field: "momentum_score", op: "gte", value: 0.55 }], minPasses: 1 } },
      { momentumScore: 0.4, trendScore: 0.4, sentimentScore: 0, eventScore: 0, freshnessScore: 0, volumeScore: 0, spreadScore: 0, direction: "neutral" },
    );
    assert.equal(pass.pass, true);
    assert.equal(fail.pass, false);
  });
});
