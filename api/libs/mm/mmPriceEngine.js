/**
 * SYRA MM price engine — paired Jupiter probe quotes for mid, spread, and impact.
 */
import { fetchJupiterQuote } from "../jupiterQuoteService.js";
import {
  mmConfigFromEnv,
  MM_SYRA_DECIMALS,
  MM_USDC_DECIMALS,
  resolveMmUniverse,
} from "../../config/mmAgentConfig.js";

/**
 * @param {number} usd
 * @param {number} decimals
 * @returns {string}
 */
export function usdToRawAmount(usd, decimals = 6) {
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
export function computePriceUsdFromQuote(amountRaw, outAmountRaw, inDecimals, outDecimals) {
  const inRaw = Number(amountRaw);
  const outRaw = Number(outAmountRaw);
  if (!Number.isFinite(inRaw) || !Number.isFinite(outRaw) || inRaw <= 0 || outRaw <= 0) return null;
  const inTokens = inRaw / 10 ** inDecimals;
  const outTokens = outRaw / 10 ** outDecimals;
  if (!(inTokens > 0) || !(outTokens > 0)) return null;
  return outTokens / inTokens;
}

/**
 * @param {number} buyPriceUsd — USDC per SYRA (buy side)
 * @param {number} sellPriceUsd — USDC per SYRA (sell side)
 */
export function computeMidAndSpread(buyPriceUsd, sellPriceUsd) {
  if (!(buyPriceUsd > 0) || !(sellPriceUsd > 0)) return null;
  const mid = (buyPriceUsd + sellPriceUsd) / 2;
  const halfSpreadBps = Math.round(Math.abs(sellPriceUsd - buyPriceUsd) / (2 * mid) * 10_000);
  return { midPriceUsd: mid, halfSpreadBps, buyPriceUsd, sellPriceUsd };
}

/**
 * @param {number[]} priceHistory
 * @returns {{ regime: 'low' | 'normal' | 'high'; volPct: number }}
 */
export function detectVolRegime(priceHistory, cfg) {
  const samples = Array.isArray(priceHistory) ? priceHistory.filter((p) => p > 0) : [];
  if (samples.length < 3) return { regime: "normal", volPct: 0 };

  const returns = [];
  for (let i = 1; i < samples.length; i += 1) {
    const prev = samples[i - 1];
    const curr = samples[i];
    if (prev > 0) returns.push(Math.abs((curr - prev) / prev) * 100);
  }
  if (returns.length === 0) return { regime: "normal", volPct: 0 };

  const volPct = returns.reduce((a, b) => a + b, 0) / returns.length;
  if (volPct >= cfg.highVolThresholdPct) return { regime: "high", volPct };
  if (volPct <= cfg.lowVolThresholdPct) return { regime: "low", volPct };
  return { regime: "normal", volPct };
}

/**
 * Probe market with paired Jupiter quotes.
 * @param {number} [probeUsd] — USD notional for probe quotes
 * @returns {Promise<{
 *   midPriceUsd: number;
 *   buyPriceUsd: number;
 *   sellPriceUsd: number;
 *   halfSpreadBps: number;
 *   impactBps: number;
 *   probedAt: string;
 *   source: string;
 * }>}
 */
export async function fetchMmMarketSnapshot(probeUsd = 10) {
  const cfg = mmConfigFromEnv();
  const universe = resolveMmUniverse();
  const slippageBps = cfg.quoteSlippageBps;

  const usdcRaw = usdToRawAmount(probeUsd, MM_USDC_DECIMALS);

  let buyPriceUsd = null;
  let sellPriceUsd = null;
  let source = "jupiter_quote";

  try {
    const buyQuote = await fetchJupiterQuote({
      inputMint: universe.quoteMint,
      outputMint: universe.mint,
      amount: usdcRaw,
      slippageBps,
    });
    const buyOut = String(buyQuote?.quote?.outAmount ?? "0");
    buyPriceUsd = computePriceUsdFromQuote(usdcRaw, buyOut, MM_USDC_DECIMALS, MM_SYRA_DECIMALS);

    const syraRaw = buyOut;
    if (syraRaw && syraRaw !== "0") {
      const sellQuote = await fetchJupiterQuote({
        inputMint: universe.mint,
        outputMint: universe.quoteMint,
        amount: syraRaw,
        slippageBps,
      });
      const sellOut = String(sellQuote?.quote?.outAmount ?? "0");
      sellPriceUsd = computePriceUsdFromQuote(syraRaw, sellOut, MM_SYRA_DECIMALS, MM_USDC_DECIMALS);
      if (sellPriceUsd > 0) {
        const tokens = Number(syraRaw) / 10 ** MM_SYRA_DECIMALS;
        sellPriceUsd = tokens > 0 ? probeUsd / tokens : sellPriceUsd;
      }
    }
  } catch {
    source = "fallback";
  }

  if (!(buyPriceUsd > 0)) {
    throw new Error("mm_price_probe_failed");
  }

  if (!(sellPriceUsd > 0)) {
    sellPriceUsd = buyPriceUsd * 0.997;
  }

  const spread = computeMidAndSpread(buyPriceUsd, sellPriceUsd);
  if (!spread) throw new Error("mm_spread_compute_failed");

  const impactBps = Math.round(Math.abs(buyPriceUsd - spread.midPriceUsd) / spread.midPriceUsd * 10_000);

  return {
    midPriceUsd: spread.midPriceUsd,
    buyPriceUsd: spread.buyPriceUsd ?? buyPriceUsd,
    sellPriceUsd: spread.sellPriceUsd ?? sellPriceUsd,
    halfSpreadBps: spread.halfSpreadBps,
    impactBps,
    probedAt: new Date().toISOString(),
    source,
  };
}

/**
 * Convert SYRA raw amount to USD at price.
 * @param {string} syraRaw
 * @param {number} priceUsd
 */
export function syraRawToUsd(syraRaw, priceUsd) {
  const tokens = Number(syraRaw) / 10 ** MM_SYRA_DECIMALS;
  if (!Number.isFinite(tokens) || !(priceUsd > 0)) return 0;
  return Math.round((tokens * priceUsd + Number.EPSILON) * 100) / 100;
}

/**
 * Convert USD to SYRA raw at price.
 * @param {number} usd
 * @param {number} priceUsd
 */
export function usdToSyraRaw(usd, priceUsd) {
  if (!(usd > 0) || !(priceUsd > 0)) return "0";
  const tokens = usd / priceUsd;
  return String(Math.floor(tokens * 10 ** MM_SYRA_DECIMALS));
}
