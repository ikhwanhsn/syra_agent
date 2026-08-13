import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_BUYBACK_TOTALS_WALLETS } from "../config/buybackTotalsWallets.js";
import {
  extractTreasurySyraBuy,
  nativeSolSpentUi,
  resolveBuybackScanWallets,
  tokenBalancesByMint,
} from "./buybackOnchainSync.js";

const TREASURY = "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t";
const SYRA = "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WSOL = "So11111111111111111111111111111111111111112";

describe("buybackOnchainSync", () => {
  it("resolveBuybackScanWallets puts primary first then silent totals", () => {
    const wallets = resolveBuybackScanWallets(TREASURY, { envValue: null });
    assert.equal(wallets[0], TREASURY);
    assert.equal(wallets.length, 1 + DEFAULT_BUYBACK_TOTALS_WALLETS.length);
    for (const silent of DEFAULT_BUYBACK_TOTALS_WALLETS) {
      assert.ok(wallets.includes(silent), `missing silent ${silent}`);
    }
    assert.equal(new Set(wallets).size, wallets.length);
  });

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

  it("detects native SOL→SYRA spend", () => {
    const meta = {
      err: null,
      preBalances: [2 * 1e9, 0],
      postBalances: [1.5 * 1e9, 0],
      preTokenBalances: [
        {
          owner: TREASURY,
          mint: SYRA,
          uiTokenAmount: { uiAmount: 0, amount: "0", decimals: 6 },
        },
      ],
      postTokenBalances: [
        {
          owner: TREASURY,
          mint: SYRA,
          uiTokenAmount: { uiAmount: 10000, amount: "10000000000", decimals: 6 },
        },
      ],
    };
    assert.equal(nativeSolSpentUi(meta, TREASURY, [TREASURY, "other"]), 0.5);
    const buy = extractTreasurySyraBuy(meta, TREASURY, {
      syraMint: SYRA,
      usdcMint: USDC,
      accountKeys: [TREASURY, "other"],
      solUsd: 100,
    });
    assert.ok(buy);
    assert.equal(buy.paidWith, "SOL");
    assert.equal(buy.buybackUsd, 50);
    assert.equal(buy.syraAcquired, 10000);
  });

  it("detects WSOL→SYRA spend", () => {
    const meta = {
      err: null,
      preTokenBalances: [
        {
          owner: TREASURY,
          mint: WSOL,
          uiTokenAmount: { uiAmount: 1.25, amount: "1250000000", decimals: 9 },
        },
        {
          owner: TREASURY,
          mint: SYRA,
          uiTokenAmount: { uiAmount: 0, amount: "0", decimals: 6 },
        },
      ],
      postTokenBalances: [
        {
          owner: TREASURY,
          mint: WSOL,
          uiTokenAmount: { uiAmount: 0.25, amount: "250000000", decimals: 9 },
        },
        {
          owner: TREASURY,
          mint: SYRA,
          uiTokenAmount: { uiAmount: 8000, amount: "8000000000", decimals: 6 },
        },
      ],
    };
    const buy = extractTreasurySyraBuy(meta, TREASURY, {
      syraMint: SYRA,
      wsolMint: WSOL,
      solUsd: 80,
    });
    assert.ok(buy);
    assert.equal(buy.paidWith, "WSOL");
    assert.equal(buy.buybackUsd, 80);
  });

  it("estimates USD from SYRA spot when spend unknown", () => {
    const meta = {
      err: null,
      preTokenBalances: [
        {
          owner: TREASURY,
          mint: SYRA,
          uiTokenAmount: { uiAmount: 100, amount: "100000000", decimals: 6 },
        },
      ],
      postTokenBalances: [
        {
          owner: TREASURY,
          mint: SYRA,
          uiTokenAmount: { uiAmount: 1100, amount: "1100000000", decimals: 6 },
        },
      ],
    };
    const buy = extractTreasurySyraBuy(meta, TREASURY, {
      syraMint: SYRA,
      syraUsd: 0.0001,
    });
    assert.ok(buy);
    assert.equal(buy.paidWith, "estimated");
    assert.equal(buy.buybackUsd, 0.1);
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
