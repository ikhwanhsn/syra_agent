/**
 * Delphi signal parsing + aggregation. Offline fixtures only.
 * Run: node --test api/libs/polymarketTraderSignals.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseMarketAsset,
  inferDirectionFromOutcome,
  parsePositionView,
  scoreTraderQuality,
  rankTraders,
  aggregateAssetBias,
  fetchPolymarketTraderSignals,
  invalidatePolymarketSignalCache,
} from "./polymarketTraderSignals.js";

test("parseMarketAsset extracts BTC/ETH/SOL and ignores other tickers", () => {
  assert.equal(parseMarketAsset("Bitcoin Up or Down - August 17"), "BTC");
  assert.equal(parseMarketAsset("Will ETH hit $5,000 in 2026?"), "ETH");
  assert.equal(parseMarketAsset("Solana above $200 on Friday"), "SOL");
  assert.equal(parseMarketAsset("Will XRP flip BTC this year?"), "BTC");
  assert.equal(parseMarketAsset("US election 2028"), null);
});

test("inferDirectionFromOutcome maps up/down and above/below binaries", () => {
  assert.equal(
    inferDirectionFromOutcome({ title: "Bitcoin Up or Down", outcome: "Up" }),
    1,
  );
  assert.equal(
    inferDirectionFromOutcome({ title: "Bitcoin Up or Down", outcome: "Down" }),
    -1,
  );
  assert.equal(
    inferDirectionFromOutcome({ title: "Will Bitcoin hit $150k?", outcome: "Yes" }),
    1,
  );
  assert.equal(
    inferDirectionFromOutcome({ title: "Will Bitcoin hit $150k?", outcome: "No" }),
    -1,
  );
  assert.equal(
    inferDirectionFromOutcome({ title: "ETH below $2,000 this week?", outcome: "Yes" }),
    -1,
  );
  assert.equal(
    inferDirectionFromOutcome({ title: "ETH below $2,000 this week?", outcome: "No" }),
    1,
  );
  assert.equal(
    inferDirectionFromOutcome({ title: "Range market 90-100", outcome: "Maybe" }),
    null,
  );
});

test("parsePositionView requires a confident crypto map and size", () => {
  const longBtc = parsePositionView({
    title: "Bitcoin Up or Down - 6PM",
    outcome: "Up",
    currentValue: 250,
    size: 400,
    curPrice: 0.62,
  });
  assert.equal(longBtc?.asset, "BTC");
  assert.equal(longBtc?.direction, 1);
  assert.ok(longBtc.notionalUsd >= 250);

  assert.equal(
    parsePositionView({
      title: "Trump wins 2028?",
      outcome: "Yes",
      currentValue: 500,
    }),
    null,
  );
  assert.equal(
    parsePositionView({
      title: "Bitcoin Up or Down",
      outcome: "Up",
      currentValue: 1,
      size: 1,
      curPrice: 0.5,
    }),
    null,
  );
});

test("rankTraders keeps profitable sampled wallets and scores quality", () => {
  const ranked = rankTraders(
    [
      { address: "0xaaa", pnl: 40_000, winRate: 0.72, resolvedCount: 30, volume: 200_000 },
      { address: "0xbbb", pnl: 2_000, winRate: 0.51, resolvedCount: 8, volume: 20_000 },
      { address: "0xccc", pnl: 80_000, winRate: 0.9, resolvedCount: 1, volume: 10_000 },
      { address: "0xddd", pnl: -5_000, winRate: 0.4, resolvedCount: 40, volume: 50_000 },
    ],
    { minResolved: 3, minPnl: 0, limit: 10 },
  );
  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].address, "0xaaa");
  assert.ok(ranked[0].quality > ranked[1].quality);
  assert.ok(scoreTraderQuality({ pnl: 40_000, winRate: 0.72, resolvedCount: 30 }) > 0.6);
});

test("aggregateAssetBias weights quality * notional into [-1,1] bias", () => {
  const assets = aggregateAssetBias({
    traders: [
      { address: "0x1", quality: 0.9 },
      { address: "0x2", quality: 0.4 },
      { address: "0x3", quality: 0.8 },
    ],
    views: [
      { address: "0x1", asset: "BTC", direction: 1, notionalUsd: 1000 },
      { address: "0x2", asset: "BTC", direction: -1, notionalUsd: 200 },
      { address: "0x3", asset: "SOL", direction: -1, notionalUsd: 800 },
    ],
  });
  const btc = assets.find((a) => a.symbol === "BTC");
  const sol = assets.find((a) => a.symbol === "SOL");
  assert.ok(btc.bias > 0.5);
  assert.equal(btc.side, "long");
  assert.equal(btc.sampleSize, 2);
  assert.ok(btc.consensus >= 0.5);
  assert.equal(sol.bias, -1);
  assert.equal(sol.side, "short");
  assert.equal(sol.sampleSize, 1);
  assert.equal(sol.consensus, 1);
});

test("fetchPolymarketTraderSignals uses injected fetch and stays offline", async () => {
  invalidatePolymarketSignalCache();
  const leaderboard = [
    {
      proxyWallet: "0x1111111111111111111111111111111111111111",
      pnl: 12_000,
      vol: 80_000,
      wins: 18,
      losses: 6,
    },
  ];
  const events = [
    {
      title: "Bitcoin Up or Down",
      markets: [
        {
          question: "Bitcoin Up or Down - August 17",
          conditionId: "0xcond",
          slug: "btc-updown",
          closed: false,
        },
      ],
    },
  ];
  const positions = [
    {
      title: "Bitcoin Up or Down - August 17",
      outcome: "Up",
      currentValue: 420,
      size: 700,
      curPrice: 0.6,
    },
    {
      title: "Solana above $250 this month?",
      outcome: "No",
      currentValue: 180,
      size: 300,
      curPrice: 0.4,
    },
  ];

  const fetchImpl = async (url) => {
    const u = String(url);
    let body = [];
    if (u.includes("gamma-api") && u.includes("/events")) body = events;
    else if (u.includes("leaderboard")) body = leaderboard;
    else if (u.includes("/positions")) body = positions;
    else if (u.includes("/holders")) body = [];
    else if (u.includes("/markets")) body = [];
    else body = [];
    return {
      ok: true,
      status: 200,
      json: async () => body,
    };
  };

  const payload = await fetchPolymarketTraderSignals({
    fetchImpl,
    skipCache: true,
    minResolved: 3,
  });
  assert.equal(payload.source, "polymarket");
  assert.equal(payload.traders.length, 1);
  const btc = payload.assets.find((a) => a.symbol === "BTC");
  const sol = payload.assets.find((a) => a.symbol === "SOL");
  assert.equal(btc?.side, "long");
  assert.ok(btc.bias > 0);
  assert.equal(sol?.side, "short");
  assert.ok(sol.bias < 0);
});
