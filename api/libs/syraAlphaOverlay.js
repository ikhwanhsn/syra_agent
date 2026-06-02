/**
 * Syra Alpha Overlay — fuse CEX TA + on-chain smart money + sentiment into one bias score.
 * Server-side (treasury/env keys); fault-tolerant per source.
 */
import { perceiveBitgetMarket } from "./integrations/bitget/bitgetAgentHubClient.js";
import { fetchSmartMoney } from "./analyticsFetchers.js";
import { fetchSentimentTicker } from "./internalNewsAgent.js";

const CACHE_MS = Number(process.env.SYRA_OVERLAY_CACHE_MS || 60_000);
/** @type {Map<string, { at: number; value: Record<string, unknown> }>} */
const cache = new Map();

/**
 * @param {string} token e.g. BTC
 */
function tokenToTicker(token) {
  const t = String(token || "BTC").trim().toUpperCase();
  if (t.includes("USDT")) return t.replace("USDT", "");
  return t;
}

/**
 * @param {unknown} netflowPayload
 * @param {string} token
 */
function scoreSmartMoney(netflowPayload, token) {
  try {
    const data = netflowPayload?.data ?? netflowPayload;
    const rows = Array.isArray(data) ? data : data?.data;
    if (!Array.isArray(rows) || rows.length === 0) return { score: 0, summary: "No smart-money netflow rows" };

    const needle = token.toUpperCase();
    const hit =
      rows.find((r) => {
        const sym = String(r?.symbol || r?.token_symbol || r?.asset || "").toUpperCase();
        return sym.includes(needle);
      }) || rows[0];

    const flow = Number(hit?.net_flow_24h_usd ?? hit?.netflow_usd ?? hit?.net_flow ?? 0);
    const normalized = Math.max(-1, Math.min(1, flow / 5_000_000));
    return {
      score: normalized,
      summary: `Smart-money 24h net flow ${flow >= 0 ? "+" : ""}$${Math.round(flow).toLocaleString()} (${needle})`,
      raw: hit,
    };
  } catch (e) {
    return {
      score: 0,
      summary: `Smart-money unavailable: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * @param {unknown} sentimentPayload
 */
function scoreSentiment(sentimentPayload) {
  try {
    const data = sentimentPayload?.data ?? sentimentPayload;
    const scoreRaw =
      data?.sentiment_score ??
      data?.score ??
      data?.average_sentiment ??
      data?.sentiment;
    if (scoreRaw == null) {
      return { score: 0, summary: "Sentiment neutral (no score)" };
    }
    const n = Number(scoreRaw);
    if (!Number.isFinite(n)) return { score: 0, summary: "Sentiment neutral" };
    const normalized = n > 1 ? (n - 50) / 50 : Math.max(-1, Math.min(1, n));
    return {
      score: normalized,
      summary: `News sentiment ${n > 1 ? n.toFixed(1) : normalized.toFixed(2)}`,
    };
  } catch (e) {
    return {
      score: 0,
      summary: `Sentiment unavailable: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * @param {ReturnType<typeof perceiveBitgetMarket> extends Promise<infer T> ? T : never} perception
 */
function scoreTechnical(perception) {
  const signal = perception?.signal;
  const clear = String(signal?.clearSignal || "HOLD").toUpperCase();
  let score = 0;
  if (clear === "BUY") score = 0.45;
  else if (clear === "SELL") score = -0.45;
  const rsi = signal?.rsi != null ? Number(signal.rsi) : null;
  if (rsi != null && Number.isFinite(rsi)) {
    if (rsi < 30) score += 0.15;
    else if (rsi > 70) score -= 0.15;
  }
  score = Math.max(-1, Math.min(1, score));
  return {
    score,
    summary: `CEX signal ${clear}${rsi != null ? ` RSI ${rsi.toFixed(1)}` : ""} @ ${perception?.price ?? "n/a"}`,
    signal: clear,
    rsi,
  };
}

/**
 * @param {{
 *   token: string;
 *   bar?: string;
 *   limit?: number;
 *   includeOnChain?: boolean;
 *   includeSentiment?: boolean;
 * }} params
 */
export async function computeSyraAlphaOverlay(params) {
  const token = tokenToTicker(params.token || "BTC");
  const bar = String(params.bar || "1h").trim();
  const limit = Math.min(500, Math.max(50, Number(params.limit) || 200));
  const cacheKey = `${token}:${bar}:${limit}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return hit.value;
  }

  const components = {};
  const errors = [];

  let perception = null;
  try {
    perception = await perceiveBitgetMarket({ token, bar, limit });
    components.technical = scoreTechnical(perception);
  } catch (e) {
    errors.push(`technical: ${e instanceof Error ? e.message : String(e)}`);
    components.technical = { score: 0, summary: "CEX perception failed" };
  }

  if (params.includeOnChain !== false) {
    try {
      if (process.env.PAYER_KEYPAIR || process.env.NANSEN_API_KEY) {
        const sm = await fetchSmartMoney();
        components.smartMoney = scoreSmartMoney(sm?.["smart-money/netflow"], token);
      } else {
        components.smartMoney = {
          score: 0,
          summary: "Smart-money skipped (configure PAYER_KEYPAIR or NANSEN_API_KEY)",
        };
      }
    } catch (e) {
      errors.push(`smartMoney: ${e instanceof Error ? e.message : String(e)}`);
      components.smartMoney = { score: 0, summary: "Smart-money fetch failed" };
    }
  }

  if (params.includeSentiment !== false) {
    try {
      const sent = await fetchSentimentTicker(token);
      components.sentiment = scoreSentiment(sent);
    } catch (e) {
      errors.push(`sentiment: ${e instanceof Error ? e.message : String(e)}`);
      components.sentiment = { score: 0, summary: "Sentiment fetch failed" };
    }
  }

  const weights = { technical: 0.45, smartMoney: 0.35, sentiment: 0.2 };
  let wSum = 0;
  let bias = 0;
  for (const [key, w] of Object.entries(weights)) {
    const comp = components[key];
    if (!comp || typeof comp.score !== "number") continue;
    bias += comp.score * w;
    wSum += w;
  }
  if (wSum > 0) bias /= wSum;
  bias = Math.round(bias * 1000) / 1000;

  const gatePassDefault = bias >= -0.35;
  const result = {
    token,
    bar,
    bias,
    biasLabel: bias > 0.25 ? "bullish" : bias < -0.25 ? "bearish" : "neutral",
    gatePass: gatePassDefault,
    components,
    perceptionSummary: perception?.signalSummary ?? null,
    computedAt: new Date().toISOString(),
    errors,
  };

  cache.set(cacheKey, { at: Date.now(), value: result });
  return result;
}

/**
 * @param {number} bias
 * @param {number} minBias
 */
export function overlayAllowsEntry(bias, minBias = -0.35) {
  return Number(bias) >= Number(minBias);
}
