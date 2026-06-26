/**
 * Execution Service — Jupiter interface (read-only quotes; execute stubbed).
 */

import axios from "axios";
import {
  BTC_QUANT_QUOTE_MINT,
  CBBTC_MINT,
} from "../../config/tradingExperimentStrategies.js";
import { executionRepo } from "../../repositories/btc3/index.js";

const JUPITER_API_BASE = process.env.JUPITER_API_KEY ? "https://api.jup.ag" : "https://lite-api.jup.ag";
const JUPITER_QUOTE_API = `${JUPITER_API_BASE}/swap/v1/quote`;

function jupiterHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }
  return headers;
}

/**
 * @param {{ inputMint: string; outputMint: string; amountRaw: string; slippageBps?: number }} params
 */
export async function quote(params) {
  const { inputMint, outputMint, amountRaw, slippageBps = 50 } = params;
  const quoteUrl = new URL(JUPITER_QUOTE_API);
  quoteUrl.searchParams.append("inputMint", inputMint);
  quoteUrl.searchParams.append("outputMint", outputMint);
  quoteUrl.searchParams.append("amount", amountRaw);
  quoteUrl.searchParams.append("slippageBps", String(slippageBps));

  try {
    const res = await axios.get(quoteUrl.toString(), { headers: jupiterHeaders(), timeout: 15_000 });
    return { success: true, quote: res.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      quote: null,
    };
  }
}

/**
 * @param {object} quoteResponse
 */
export async function estimateFee(quoteResponse) {
  if (!quoteResponse) {
    return { feeUsd: null, status: "unavailable" };
  }
  const priceImpact = Number(quoteResponse.priceImpactPct ?? 0);
  const inAmount = Number(quoteResponse.inAmount ?? 0);
  const outAmount = Number(quoteResponse.outAmount ?? 0);
  const estimatedFeeUsd = Math.abs(priceImpact) * 0.01 * (inAmount / 1e6);
  return {
    feeUsd: estimatedFeeUsd || 0.5,
    priceImpactPct: priceImpact,
    inAmount,
    outAmount,
    status: "estimated",
  };
}

/**
 * @param {object} quoteResponse
 */
export async function validateRoute(quoteResponse) {
  if (!quoteResponse?.routePlan?.length) {
    return { valid: false, route: null, reason: "No route plan in quote" };
  }
  const route = quoteResponse.routePlan
    .map((r) => r.swapInfo?.label || r.swapInfo?.ammKey || "unknown")
    .join(" → ");
  return { valid: true, route, hops: quoteResponse.routePlan.length };
}

/**
 * TODO: requires approved decision + wallet broker integration.
 */
export async function swap() {
  return {
    success: false,
    status: "stubbed",
    error: "Execution requires manual approval — swap not implemented yet",
  };
}

/**
 * TODO: requires approved decision + wallet broker integration.
 */
export async function execute() {
  return {
    success: false,
    status: "stubbed",
    error: "Execution requires manual approval — execute not implemented yet",
  };
}

/**
 * @param {{
 *   decisionId: import('mongoose').Types.ObjectId;
 *   currentAllocation: { btcPct: number; usdcPct: number; totalUsd?: number };
 *   targetAllocation: { btcPct: number; usdcPct: number };
 * }} params
 */
export async function prepareExecutionQuote(params) {
  const { decisionId, currentAllocation, targetAllocation } = params;
  const totalUsd = currentAllocation.totalUsd ?? 10_000;
  const diffBtc = targetAllocation.btcPct - currentAllocation.btcPct;

  let inputMint = BTC_QUANT_QUOTE_MINT;
  let outputMint = CBBTC_MINT;
  let amountRaw = "0";

  if (diffBtc > 0) {
    const usdcToSwap = Math.round((diffBtc / 100) * totalUsd * 1e6);
    amountRaw = String(usdcToSwap);
  } else if (diffBtc < 0) {
    inputMint = CBBTC_MINT;
    outputMint = BTC_QUANT_QUOTE_MINT;
    amountRaw = String(Math.round(Math.abs(diffBtc / 100) * totalUsd * 1e8));
  }

  const quoteResult = await quote({ inputMint, outputMint, amountRaw });
  const fee = quoteResult.quote ? await estimateFee(quoteResult.quote) : { feeUsd: null };
  const route = quoteResult.quote ? await validateRoute(quoteResult.quote) : { valid: false, route: null };

  const execution = await executionRepo.create({
    decisionId,
    inputMint,
    outputMint,
    inputAmount: amountRaw,
    outputAmount: quoteResult.quote?.outAmount ?? null,
    estimatedFeeUsd: fee.feeUsd,
    route: route.route,
    quote: quoteResult.quote,
    status: diffBtc === 0 ? "stubbed" : quoteResult.success ? "quoted" : "failed",
    error: quoteResult.error ?? null,
  });

  return { execution, quote: quoteResult.quote, fee, route };
}

export { BTC_QUANT_QUOTE_MINT as USDC_MINT, CBBTC_MINT as BTC_MINT };
