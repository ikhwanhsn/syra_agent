/**
 * Growth — SYRA market & liquidity pulse (DexScreener + Jupiter quote + CoinGecko macro → OpenRouter).
 * Server-side only; no x402. Supports path to $1M FDV narrative grounded on fetched numbers.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { parseJsonObjectFromLlm } from "../libs/llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
} from "../config/internalPipelineAgents.js";
import { SYRA_TOKEN_MINT } from "../libs/syraToken.js";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const JUPITER_QUOTE =
  "https://quote-api.jup.ag/v6/quote";
const DEXSCREENER_TOKEN = "https://api.dexscreener.com/latest/dex/tokens";
const DEXSCREENER_TOKEN_PAIRS_V1 = "https://api.dexscreener.com/token-pairs/v1/solana";
const COINGECKO_SIMPLE =
  "https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin&vs_currencies=usd&include_24hr_change=true";

const SYSTEM_PROMPT = `You are Syra's growth analyst (Syra token + product) with awareness of the Up Only community as a distribution tailwind — never fabricate volume, FDV, or holder counts.

You receive ONLY structured JSON from DexScreener (Solana pairs for $SYRA), an optional Jupiter v6 quote (SOL→SYRA), and macro prices (SOL/BTC).

Rules:
- Ground every claim in the input numbers. If FDV/marketCap is missing, say "not reported" and infer cautiously from liquidity + volume — never invent a precise FDV.
- Focus on what moves Syra toward ~$1M fully diluted valuation or sustained liquidity: volume trends, pool depth, catalyst risks.
- Output ONLY one JSON object, no markdown fences:
{
  "summary": string (3-6 sentences),
  "liquidityAssessment": "thin"|"moderate"|"healthy"|"unknown",
  "volumeAssessment": "cold"|"warming"|"active"|"unknown",
  "bullSignals": string[] (0-6 short items tied to data),
  "riskSignals": string[] (0-6),
  "growthActions": string[] (3-8 concrete marketing/product/listings tactics — no guaranteed price promises),
  "oneLineNorthStar": string (≤140 chars)
}
Write in English. Be direct; no hype phrases like "guaranteed" or "moon".`;

/**
 * @returns {Promise<object>}
 */
async function fetchJsonWithRetry(url, { timeoutMs, retries = 2, optional = false, headers } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          ...(headers || {}),
        },
        signal:
          typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
            ? AbortSignal.timeout(timeoutMs)
            : undefined,
      });
      if (!res.ok) {
        if (optional) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
        continue;
      }
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  if (optional) return null;
  throw new Error(`fetch failed: ${errorMessage}`);
}

/**
 * @returns {Promise<object>}
 */
async function fetchDexScreenerPairs(mint) {
  const url = `${DEXSCREENER_TOKEN}/${encodeURIComponent(mint)}`;
  try {
    return await fetchJsonWithRetry(url, { timeoutMs: 14_000, retries: 2 });
  } catch (primaryErr) {
    // Fallback endpoint helps when one DexScreener route is flaky/rate-limited.
    const fallbackUrl = `${DEXSCREENER_TOKEN_PAIRS_V1}/${encodeURIComponent(mint)}`;
    try {
      const rawPairs = await fetchJsonWithRetry(fallbackUrl, { timeoutMs: 14_000, retries: 2 });
      const pairs = Array.isArray(rawPairs) ? rawPairs : [];
      return { pairs };
    } catch (fallbackErr) {
      const p = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      const f = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      throw new Error(`DexScreener unreachable (${p}; fallback: ${f})`);
    }
  }
}

/**
 * @returns {Promise<object | null>}
 */
async function fetchJupiterQuoteSolToSyra(mint) {
  const params = new URLSearchParams({
    inputMint: SOL_MINT,
    outputMint: mint,
    amount: String(1_000_000_000),
    slippageBps: "150",
  });
  const url = `${JUPITER_QUOTE}?${params.toString()}`;
  return fetchJsonWithRetry(url, { timeoutMs: 12_000, retries: 2, optional: true });
}

/**
 * @returns {Promise<object | null>}
 */
async function fetchMacroUsd() {
  return fetchJsonWithRetry(COINGECKO_SIMPLE, { timeoutMs: 10_000, retries: 1, optional: true });
}

/**
 * @param {unknown} obj
 * @returns {boolean}
 */
function validateOutput(obj) {
  if (!obj || typeof obj !== "object") return false;
  const o = /** @type {Record<string, unknown>} */ (obj);
  if (typeof o.summary !== "string" || !o.summary.trim()) return false;
  const liq = o.liquidityAssessment;
  const vol = o.volumeAssessment;
  const allowedLiquidity = new Set(["thin", "moderate", "healthy", "unknown"]);
  const allowedVolume = new Set(["cold", "warming", "active", "unknown"]);
  if (!allowedLiquidity.has(liq) || !allowedVolume.has(vol)) return false;
  if (!Array.isArray(o.bullSignals) || !Array.isArray(o.riskSignals) || !Array.isArray(o.growthActions))
    return false;
  if (typeof o.oneLineNorthStar !== "string") return false;
  return true;
}

/**
 * @param {{ model?: string | null }} params
 */
export async function runGrowthSyraMarketAgent({ model }) {
  const mint = SYRA_TOKEN_MINT;
  const [dexBody, jup, macro] = await Promise.all([
    fetchDexScreenerPairs(mint),
    fetchJupiterQuoteSolToSyra(mint),
    fetchMacroUsd(),
  ]);

  const pairs = Array.isArray(dexBody?.pairs) ? dexBody.pairs : [];
  const top = [...pairs]
    .sort((a, b) => {
      const la = Number(a?.liquidity?.usd) || 0;
      const lb = Number(b?.liquidity?.usd) || 0;
      return lb - la;
    })
    .slice(0, 6)
    .map((p) => ({
      chainId: p.chainId,
      dexId: p.dexId,
      pairAddress: p.pairAddress,
      priceUsd: p.priceUsd,
      fdv: p.fdv,
      marketCap: p.marketCap,
      liquidityUsd: p.liquidity?.usd,
      volumeH24: p.volume?.h24,
      txnsH24: p.txns?.h24,
      url: p.url,
    }));

  const payload = {
    mint,
    collectedAt: new Date().toISOString(),
    dexPairCount: pairs.length,
    topPairs: top,
    jupiterQuote1SolToSyraOutAmount:
      jup && typeof jup === "object" && jup.outAmount != null ? String(jup.outAmount) : null,
    jupiterPriceImpactPct:
      jup && typeof jup === "object" && typeof jup.priceImpactPct === "number"
        ? jup.priceImpactPct
        : null,
    macroUsd: macro || null,
    note: "SYRA often 9 decimals on pump.fun style mints; interpret Jupiter outAmount accordingly.",
  };

  const modelId = resolveInternalPipelineModel(model);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Analyze Syra token liquidity and growth levers toward ~$1M FDV (informational only):\n\n${JSON.stringify(payload)}`,
    },
  ];

  const llmOpts = {
    model: modelId,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.growthSyraMarket,
    temperature: 0.24,
  };

  const apiMessages = withLlmIdentitySystemNote(messages, modelId);
  const first = await callOpenRouter(apiMessages, llmOpts);

  let parsed;
  try {
    parsed = parseJsonObjectFromLlm(first.response);
  } catch {
    const retryMessages = [
      ...apiMessages,
      {
        role: "assistant",
        content: typeof first.response === "string" ? first.response.slice(0, 6000) : "",
      },
      {
        role: "user",
        content:
          "Reply with ONLY valid JSON matching the schema: summary, liquidityAssessment, volumeAssessment (thin|moderate|healthy|unknown), bullSignals, riskSignals, growthActions, oneLineNorthStar.",
      },
    ];
    const second = await callOpenRouter(retryMessages, llmOpts);
    parsed = parseJsonObjectFromLlm(second.response);
  }

  if (!validateOutput(parsed)) {
    throw new Error("growth-syra-market: invalid LLM JSON shape");
  }

  const o = /** @type {Record<string, unknown>} */ (parsed);
  return {
    summary: String(o.summary).trim(),
    liquidityAssessment: /** @type {"thin"|"moderate"|"healthy"|"unknown"} */ (o.liquidityAssessment),
    volumeAssessment: /** @type {"cold"|"warming"|"active"|"unknown"} */ (o.volumeAssessment),
    bullSignals: o.bullSignals.map((s) => String(s).trim()).filter(Boolean),
    riskSignals: o.riskSignals.map((s) => String(s).trim()).filter(Boolean),
    growthActions: o.growthActions.map((s) => String(s).trim()).filter(Boolean),
    oneLineNorthStar: String(o.oneLineNorthStar).trim().slice(0, 200),
    generatedAt: new Date().toISOString(),
    sourceStats: {
      dexPairCount: pairs.length,
      bestLiquidityUsd: top[0]?.liquidityUsd ?? null,
      bestVolumeH24: top[0]?.volumeH24 ?? null,
      bestFdv: top[0]?.fdv ?? null,
    },
  };
}
