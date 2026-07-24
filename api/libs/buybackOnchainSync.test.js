import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractTreasurySyraBuy,
  tokenBalancesByMint,
} from "./buybackOnchainSync.js";

const TREASURY = "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t";
const SYRA = "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

describe("buybackOnchainSync", () => {
  it("sums treasury token balances by mint", () => {
    const map = tokenBalancesByMint(
      [
        {
          owner: TREASURY,
          mint: SYRA,
          uiTokenAmount: { uiAmount: 100, amount: "100000000", decimals: 6 },
        },
        {
          owner: "other",
          mint: SYRA,
          uiTokenAmount: { uiAmount: 999, amount: "999000000", decimals: 6 },
        },
      ],
      TREASURY,
    );
    assert.equal(map.get(SYRA)?.ui, 100);
  });

  it("detects USDC→SYRA treasury buy", () => {
    const meta = {
      err: null,
      preTokenBalances: [
        {
          owner: TREASURY,
          mint: USDC,
          uiTokenAmount: { uiAmount: 10, amount: "10000000", decimals: 6 },
        },
        {
          owner: TREASURY,
          mint: SYRA,
          uiTokenAmount: { uiAmount: 1000, amount: "1000000000", decimals: 6 },
        },
      ],
      postTokenBalances: [
        {
          owner: TREASURY,
          mint: USDC,
          uiTokenAmount: { uiAmount: 7.5, amount: "7500000", decimals: 6 },
        },
        {
          owner: TREASURY,
          mint: SYRA,
          uiTokenAmount: {
            uiAmount: 36500,
            amount: "36500000000",
            decimals: 6,
          },
        },
      ],
    };
    const buy = extractTreasurySyraBuy(meta, TREASURY, SYRA, USDC);
    assert.ok(buy);
    assert.equal(buy.paidWith, "USDC");
    assert.equal(buy.buybackUsd, 2.5);
    assert.equal(buy.syraAcquired, 35500);
    assert.equal(buy.outAmountRaw, "35500000000");
  });

  it("ignores txs with no SYRA increase", () => {
    const meta = {
      err: null,
      preTokenBalances: [
        {
          owner: TREASURY,
          mint: USDC,
          uiTokenAmount: { uiAmount: 10, amount: "10000000", decimals: 6 },
        },
      ],
      postTokenBalances: [
        {
          owner: TREASURY,
          mint: USDC,
          uiTokenAmount: { uiAmount: 9, amount: "9000000", decimals: 6 },
        },
      ],
    };
    assert.equal(extractTreasurySyraBuy(meta, TREASURY, SYRA, USDC), null);
  });

  it("ignores failed txs", () => {
    const meta = {
      err: { InstructionError: [0, "Custom"] },
      preTokenBalances: [],
      postTokenBalances: [],
    };
    assert.equal(extractTreasurySyraBuy(meta, TREASURY, SYRA, USDC), null);
  });
});
