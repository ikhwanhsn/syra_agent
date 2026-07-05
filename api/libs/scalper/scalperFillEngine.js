/**
 * Paper fill engine — realistic Jupiter swap quotes at open/close.
 * Adapter boundary for future real execution via walletBroker.
 */
import { fetchJupiterQuote } from "../jupiterQuoteService.js";
import { scalperConfigFromEnv } from "../../config/scalperConfig.js";

/**
 * @param {number} usd
 * @param {number} decimals
 * @returns {string}
 */
export function usdToQuoteRawAmount(usd, decimals = 6) {
  const n = Number(usd);
  if (!Number.isFinite(n) || n <= 0) return "0";
  const raw = Math.floor(n * 10 ** decimals);
  return String(Math.max(1, raw));
}

/**
 * @param {string} amountRaw
 * @param {number} outAmountRaw
 * @param {number} inDecimals
 * @param {number} outDecimals
 * @returns {number | null}
 */
export function computeEffectivePriceUsdFromQuote(amountRaw, outAmountRaw, inDecimals, outDecimals) {
  const inRaw = Number(amountRaw);
  const outRaw = Number(outAmountRaw);
  if (!Number.isFinite(inRaw) || !Number.isFinite(outRaw) || inRaw <= 0 || outRaw <= 0) return null;
  const inTokens = inRaw / 10 ** inDecimals;
  const outTokens = outRaw / 10 ** outDecimals;
  if (!(inTokens > 0) || !(outTokens > 0)) return null;
  return outTokens / inTokens;
}

/**
 * Entry: USDC -> asset. Price = USDC spent / asset received.
 * @param {string} amountRaw
 * @param {number} outAmountRaw
 * @param {number} assetDecimals
 */
export function computeEntryPriceUsd(amountRaw, outAmountRaw, assetDecimals) {
  const inUsd = Number(amountRaw) / 1e6;
  const outTokens = Number(outAmountRaw) / 10 ** assetDecimals;
  if (!(inUsd > 0) || !(outTokens > 0)) return null;
  return inUsd / outTokens;
}

/**
 * Exit: asset -> USDC. Price = USDC received / asset sold.
 * @param {string} amountRaw
 * @param {number} outAmountRaw
 * @param {number} assetDecimals
 */
export function computeExitPriceUsd(amountRaw, outAmountRaw, assetDecimals) {
  const inTokens = Number(amountRaw) / 10 ** assetDecimals;
  const outUsd = Number(outAmountRaw) / 1e6;
  if (!(inTokens > 0) || !(outUsd > 0)) return null;
  return outUsd / inTokens;
}

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
 * @param {object} params
 * @param {string} params.inputMint
 * @param {string} params.outputMint
 * @param {string} params.amountRaw
 * @param {number} params.outputDecimals
 * @param {number} [params.midPriceUsd]
 * @returns {Promise<{ fillPriceUsd: number; outAmountRaw: string; fillSource: string; impactBps: number | null }>}
 */
export async function quoteEntryFill({
  inputMint,
  outputMint,
  amountRaw,
  outputDecimals,
  midPriceUsd,
}) {
  const cfg = scalperConfigFromEnv();
  try {
    const { quote } = await fetchJupiterQuote({
      inputMint,
      outputMint,
      amount: amountRaw,
      slippageBps: cfg.quoteSlippageBps,
    });
    const outAmountRaw = String(quote?.outAmount ?? "0");
    const fillPriceUsd = computeEntryPriceUsd(amountRaw, outAmountRaw, outputDecimals);
    if (!(fillPriceUsd > 0)) throw new Error("invalid_jupiter_fill_price");
    return {
      fillPriceUsd,
      outAmountRaw,
      fillSource: "jupiter_quote",
      impactBps: computeImpactBps(fillPriceUsd, midPriceUsd ?? fillPriceUsd),
    };
  } catch (e) {
    if (!(midPriceUsd > 0)) throw e;
    const inUsd = Number(amountRaw) / 1e6;
    const outTokens = inUsd / midPriceUsd;
    const outAmountRaw = String(Math.floor(outTokens * 10 ** outputDecimals));
    return {
      fillPriceUsd: midPriceUsd,
      outAmountRaw,
      fillSource: "mid_fallback",
      impactBps: 0,
    };
  }
}

/**
 * @param {object} params
 * @param {string} params.inputMint
 * @param {string} params.outputMint
 * @param {string} params.amountRaw
 * @param {number} params.assetDecimals
 * @param {number} params.midPriceUsd
 * @param {number} params.entryPriceUsd
 * @param {number} params.notionalUsd
 * @returns {Promise<{ fillPriceUsd: number; outAmountRaw: string; fillSource: string; impactBps: number | null; pnlUsd: number; notionalUsd: number }>}
 */
export async function quoteExitFill({
  inputMint,
  outputMint,
  amountRaw,
  assetDecimals,
  midPriceUsd,
  entryPriceUsd,
  notionalUsd,
}) {
  const cfg = scalperConfigFromEnv();
  try {
    const { quote } = await fetchJupiterQuote({
      inputMint,
      outputMint,
      amount: amountRaw,
      slippageBps: cfg.quoteSlippageBps,
    });
    const outAmountRaw = String(quote?.outAmount ?? "0");
    const outUsd = Number(outAmountRaw) / 1e6;
    const fillPriceUsd = computeExitPriceUsd(amountRaw, outAmountRaw, assetDecimals) ?? midPriceUsd;
    const pnlUsd = outUsd - notionalUsd;
    return {
      fillPriceUsd,
      outAmountRaw,
      fillSource: "jupiter_quote",
      impactBps: computeImpactBps(fillPriceUsd, midPriceUsd),
      pnlUsd,
      notionalUsd,
    };
  } catch {
    const exitPriceUsd = midPriceUsd;
    const pnlUsd =
      entryPriceUsd > 0 && exitPriceUsd > 0
        ? notionalUsd * (exitPriceUsd / entryPriceUsd - 1)
        : 0;
    return {
      fillPriceUsd: exitPriceUsd,
      outAmountRaw: usdToQuoteRawAmount(notionalUsd + pnlUsd, 6),
      fillSource: "mid_fallback",
      impactBps: 0,
      pnlUsd,
      notionalUsd,
    };
  }
}

/**
 * Future real execution adapter — not wired in paper mode.
 * @returns {Promise<never>}
 */
export async function executeRealScalpFill() {
  throw new Error("real_scalp_execution_not_enabled");
}
