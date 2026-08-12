/**
 * Real pool screen / Meteora pagination guards for Earn LP opens.
 * Run: node --test api/libs/lpRealPoolScreen.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isDeepLiquidRealPool,
  passesRealPoolScreen,
  resolveRealMaxVolTvlRatio,
} from "./lpExperimentService.js";

const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

test("resolveRealMaxVolTvlRatio raises cap for deep TVL", () => {
  assert.ok(resolveRealMaxVolTvlRatio(5_000_000) >= 12);
  assert.ok(resolveRealMaxVolTvlRatio(1_200_000) >= 8);
  assert.ok(resolveRealMaxVolTvlRatio(800_000) >= 5);
  assert.equal(resolveRealMaxVolTvlRatio(100_000, 2.5), 2.5);
});

test("busy SOL-USDC deep pool passes real screen (was no_candidate)", () => {
  const pool = {
    poolAddress: "sol-usdc-deep",
    poolName: "SOL-USDC",
    baseMint: SOL,
    quoteMint: USDC,
    tvlUsd: 5_300_000,
    volume24hUsd: 19_700_000, // vol/TVL ~3.7 > old flat 2.5 cap
    feeTvlRatio: 0.0014,
  };
  assert.equal(isDeepLiquidRealPool(pool), true);
  assert.equal(passesRealPoolScreen(pool), true);
});

test("thin high-fee meme still fails fee spike / RR path", () => {
  const pool = {
    poolAddress: "meme-thin",
    poolName: "MEME-SOL",
    baseMint: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
    quoteMint: SOL,
    tvlUsd: 80_000,
    volume24hUsd: 200_000,
    feeTvlRatio: 0.08,
  };
  assert.equal(passesRealPoolScreen(pool), false);
});
