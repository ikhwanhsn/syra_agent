import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import {
  riseGetMarkets,
  riseGetMarketByAddress,
  riseGetMarketTransactions,
  riseGetMarketOhlc,
  risePostMarketQuote,
  risePostBuyToken,
  risePostSellToken,
  riseGetPortfolioSummary,
  riseGetPortfolioPositions,
  risePostBorrowQuote,
  risePostDepositAndBorrow,
  risePostRepayAndWithdraw,
  riseGetMarketsStreamNewNote,
} from "../libs/riseClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const API_ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(__dirname, "rise-api-snapshot.json");

dotenv.config({ path: path.join(API_ROOT, ".env") });

const MARKET = "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise";
const WALLET = "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t";

const riseCalls = [
  {
    toolId: "rise-markets",
    args: { page: 1, limit: 2 },
    run: () => riseGetMarkets({ page: 1, limit: 2 }),
  },
  {
    toolId: "rise-market",
    args: { address: MARKET },
    run: () => riseGetMarketByAddress(MARKET),
  },
  {
    toolId: "rise-market-transactions",
    args: { address: MARKET, page: 1, limit: 3 },
    run: () => riseGetMarketTransactions(MARKET, { page: 1, limit: 3 }),
  },
  {
    toolId: "rise-market-ohlc",
    args: { address: MARKET, timeframe: "1h", limit: 3 },
    run: () => riseGetMarketOhlc(MARKET, "1h", { limit: 3 }),
  },
  {
    toolId: "rise-market-quote",
    args: { address: MARKET, amount: 1_000_000, direction: "buy" },
    run: () => risePostMarketQuote(MARKET, { amount: 1_000_000, direction: "buy" }),
  },
  {
    toolId: "rise-buy-token",
    args: { wallet: WALLET, market: MARKET, cashIn: 1_000_000, minTokenOut: 1 },
    run: () =>
      risePostBuyToken({
        wallet: WALLET,
        market: MARKET,
        cashIn: 1_000_000,
        minTokenOut: 1,
      }),
  },
  {
    toolId: "rise-sell-token",
    args: { wallet: WALLET, market: MARKET, tokenIn: 1_000, minCashOut: 1 },
    run: () =>
      risePostSellToken({
        wallet: WALLET,
        market: MARKET,
        tokenIn: 1_000,
        minCashOut: 1,
      }),
  },
  {
    toolId: "rise-portfolio-summary",
    args: { wallet: WALLET },
    run: () => riseGetPortfolioSummary(WALLET),
  },
  {
    toolId: "rise-portfolio-positions",
    args: { wallet: WALLET, page: 1, limit: 5 },
    run: () => riseGetPortfolioPositions(WALLET, { page: 1, limit: 5 }),
  },
  {
    toolId: "rise-borrow-quote",
    args: { address: MARKET, wallet: WALLET, amountToBorrow: 1_000_000 },
    run: () =>
      risePostBorrowQuote(MARKET, {
        wallet: WALLET,
        amountToBorrow: 1_000_000,
      }),
  },
  {
    toolId: "rise-deposit-and-borrow",
    args: { wallet: WALLET, market: MARKET, borrowAmount: 1_000_000 },
    run: () =>
      risePostDepositAndBorrow({
        wallet: WALLET,
        market: MARKET,
        borrowAmount: 1_000_000,
      }),
  },
  {
    toolId: "rise-repay-and-withdraw",
    args: { wallet: WALLET, market: MARKET, withdrawAmount: 1_000_000 },
    run: () =>
      risePostRepayAndWithdraw({
        wallet: WALLET,
        market: MARKET,
        withdrawAmount: 1_000_000,
      }),
  },
  {
    toolId: "rise-stream-new",
    args: {},
    run: async () => riseGetMarketsStreamNewNote(),
  },
];

async function main() {
  if (!process.env.RISE_API_KEY) {
    throw new Error("Missing RISE_API_KEY in api/.env");
  }

  const startedAt = new Date().toISOString();
  const results = [];

  for (const item of riseCalls) {
    const started = Date.now();
    const response = await item.run();
    const elapsedMs = Date.now() - started;

    results.push({
      toolId: item.toolId,
      args: item.args,
      elapsedMs,
      response,
    });

    const status = response.ok ? "ok" : `error (${response.status ?? "unknown"})`;
    console.log(`[RISE] ${item.toolId}: ${status} in ${elapsedMs}ms`);
  }

  const output = {
    meta: {
      createdAt: new Date().toISOString(),
      startedAt,
      baseUrl: process.env.RISE_API_BASE_URL || "https://public.rise.rich",
      market: MARKET,
      wallet: WALLET,
      totalCalls: results.length,
    },
    results,
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`\nSaved snapshot: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("[RISE] Failed:", error?.message || error);
  process.exitCode = 1;
});
