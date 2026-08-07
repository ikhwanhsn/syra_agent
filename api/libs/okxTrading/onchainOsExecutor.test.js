import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateFill, buildLiveCommand, executeIntent } from "./onchainOsExecutor.js";

const cfg = { slippageBps: 80, feeBps: 20, live: false };

test("simulateFill buy: qty from notional, slippage worsens price", () => {
  const f = simulateFill({ side: "buy", priceUsd: 100, notionalUsd: 100, cfg });
  assert.equal(f.status, "filled");
  assert.equal(f.mode, "paper");
  assert.ok(f.filledPriceUsd > 100); // buy slips up
  assert.ok(Math.abs(f.filledNotionalUsd - 100) < 1e-9);
  assert.ok(Math.abs(f.filledQty - 100 / f.filledPriceUsd) < 1e-9);
  assert.ok(f.feeUsd > 0);
});

test("simulateFill sell: notional from qty, slippage worsens price", () => {
  const f = simulateFill({ side: "sell", priceUsd: 100, qty: 2, cfg });
  assert.ok(f.filledPriceUsd < 100); // sell slips down
  assert.ok(Math.abs(f.filledQty - 2) < 1e-9);
  assert.ok(Math.abs(f.filledNotionalUsd - 2 * f.filledPriceUsd) < 1e-9);
});

test("executeIntent paper never throws and returns a fill", () => {
  const f = executeIntent({ side: "buy", token: "solana", priceUsd: 150, notionalUsd: 50 }, cfg);
  assert.equal(f.status, "filled");
  assert.equal(f.mode, "paper");
});

test("buildLiveCommand builds onchainos swap execute with routes + side", () => {
  process.env.OKX_TRADING_WALLET = "WALLET123";
  process.env.OKX_TRADING_TOKENS = JSON.stringify({
    solana: { chain: "Solana", address: "MINT_SOL", quoteAddress: "MINT_USDT" },
  });
  const buy = buildLiveCommand({ side: "buy", token: "solana", notionalUsd: 42, cfg }).join(" ");
  assert.match(buy, /onchainos swap execute/);
  assert.match(buy, /--from MINT_USDT/); // buy: quote -> token
  assert.match(buy, /--to MINT_SOL/);
  assert.match(buy, /--readable-amount 42/);
  assert.match(buy, /--chain Solana/);
  assert.match(buy, /--wallet WALLET123/);
  assert.match(buy, /--slippage 0.8000/); // 80 bps -> 0.8%

  const sell = buildLiveCommand({ side: "sell", token: "solana", qty: 3, cfg }).join(" ");
  assert.match(sell, /--from MINT_SOL/); // sell: token -> quote
  assert.match(sell, /--to MINT_USDT/);
  assert.match(sell, /--readable-amount 3/);

  delete process.env.OKX_TRADING_WALLET;
  delete process.env.OKX_TRADING_TOKENS;
});

test("buildLiveCommand refuses to guess when route incomplete", () => {
  delete process.env.OKX_TRADING_WALLET;
  delete process.env.OKX_TRADING_TOKENS;
  delete process.env.OKX_TRADING_QUOTE_ADDR;
  delete process.env.OKX_TRADING_CHAIN;
  assert.throws(
    () => buildLiveCommand({ side: "buy", token: "solana", notionalUsd: 10, cfg }),
    /Refusing to guess|full route/,
  );
});
