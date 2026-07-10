/**
 * SYRA MM paper fill engine — Jupiter-quote fills for resting orders.
 */
import { fetchJupiterQuote } from "../jupiterQuoteService.js";
import { mmConfigFromEnv, MM_SYRA_DECIMALS, MM_USDC_DECIMALS, resolveMmUniverse } from "../../config/mmAgentConfig.js";
import {
  computePriceUsdFromQuote,
  usdToRawAmount,
  usdToSyraRaw,
} from "./mmPriceEngine.js";

/**
 * @param {number} fillPrice
 * @param {number} midPrice
 * @returns {number | null}
 */
export function computeImpactBps(fillPrice, midPrice) {
  if (!(fillPrice > 0) || !(midPrice > 0)) return null;
  return Math.round(Math.abs(fillPrice / midPrice - 1) * 10_000);
}

/**
 * Paper fill for a buy resting order (USDC -> SYRA).
 * @param {object} params
 * @param {number} params.notionalUsd
 * @param {number} params.limitPriceUsd
 * @param {number} params.midPriceUsd
 */
export async function quoteBuyFill({ notionalUsd, limitPriceUsd, midPriceUsd }) {
  const cfg = mmConfigFromEnv();
  const universe = resolveMmUniverse();

  try {
    const amountRaw = usdToRawAmount(notionalUsd, MM_USDC_DECIMALS);
    const { quote } = await fetchJupiterQuote({
      inputMint: universe.quoteMint,
      outputMint: universe.mint,
      amount: amountRaw,
      slippageBps: cfg.quoteSlippageBps,
    });
    const outAmountRaw = String(quote?.outAmount ?? "0");
    const fillPriceUsd =
      computePriceUsdFromQuote(amountRaw, outAmountRaw, MM_USDC_DECIMALS, MM_SYRA_DECIMALS) ??
      limitPriceUsd;

    if (fillPriceUsd > limitPriceUsd * 1.02) {
      return { filled: false, reason: "price_above_limit" };
    }

    return {
      filled: true,
      fillPriceUsd,
      syraAmountRaw: outAmountRaw,
      volumeUsd: notionalUsd,
      fillSource: "jupiter_quote",
      impactBps: computeImpactBps(fillPriceUsd, midPriceUsd),
    };
  } catch {
    if (midPriceUsd <= limitPriceUsd) {
      const syraRaw = usdToSyraRaw(notionalUsd, midPriceUsd);
      return {
        filled: true,
        fillPriceUsd: midPriceUsd,
        syraAmountRaw: syraRaw,
        volumeUsd: notionalUsd,
        fillSource: "mid_fallback",
        impactBps: 0,
      };
    }
    return { filled: false, reason: "quote_failed" };
  }
}

/**
 * Paper fill for a sell resting order (SYRA -> USDC).
 * @param {object} params
 * @param {string} params.syraAmountRaw
 * @param {number} params.limitPriceUsd
 * @param {number} params.midPriceUsd
 * @param {number} params.entryNotionalUsd — for PnL on round trip
 */
export async function quoteSellFill({
  syraAmountRaw,
  limitPriceUsd,
  midPriceUsd,
  entryNotionalUsd,
}) {
  const cfg = mmConfigFromEnv();
  const universe = resolveMmUniverse();

  if (!syraAmountRaw || syraAmountRaw === "0") {
    return { filled: false, reason: "no_inventory" };
  }

  try {
    const { quote } = await fetchJupiterQuote({
      inputMint: universe.mint,
      outputMint: universe.quoteMint,
      amount: syraAmountRaw,
      slippageBps: cfg.quoteSlippageBps,
    });
    const outAmountRaw = String(quote?.outAmount ?? "0");
    const outUsd = Number(outAmountRaw) / 10 ** MM_USDC_DECIMALS;
    const fillPriceUsd =
      computePriceUsdFromQuote(syraAmountRaw, outAmountRaw, MM_SYRA_DECIMALS, MM_USDC_DECIMALS) ??
      midPriceUsd;
    const pnlUsd = outUsd - entryNotionalUsd;

    if (fillPriceUsd < limitPriceUsd * 0.98) {
      return { filled: false, reason: "price_below_limit" };
    }

    return {
      filled: true,
      fillPriceUsd,
      outUsd,
      volumeUsd: outUsd,
      pnlUsd,
      fillSource: "jupiter_quote",
      impactBps: computeImpactBps(fillPriceUsd, midPriceUsd),
    };
  } catch {
    if (midPriceUsd >= limitPriceUsd) {
      const tokens = Number(syraAmountRaw) / 10 ** MM_SYRA_DECIMALS;
      const outUsd = tokens * midPriceUsd;
      const pnlUsd = outUsd - entryNotionalUsd;
      return {
        filled: true,
        fillPriceUsd: midPriceUsd,
        outUsd,
        volumeUsd: outUsd,
        pnlUsd,
        fillSource: "mid_fallback",
        impactBps: 0,
      };
    }
    return { filled: false, reason: "quote_failed" };
  }
}

/**
 * Future real execution adapter — not wired in paper mode.
 * @returns {Promise<never>}
 */
export async function executeRealMmFill() {
  throw new Error("real_mm_execution_not_enabled");
}
