/**
 * GMGN V/L radar helpers for AyeLabs (ported from ayehuasca/gmgn-vl-radar).
 * Uses Syra gmgnAgentService — does not shell out to gmgn-cli or Python.
 */
import { AYE_LABS_SCREENING_BASE } from "../config/ayeLabsStrategies.js";
import { runGmgnAgentTool } from "./gmgnAgentService.js";

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {object} [screen]
 * @returns {Record<string, string | number>}
 */
export function buildAyeLabsTrendingParams(screen = AYE_LABS_SCREENING_BASE) {
  const s = screen && typeof screen === "object" ? screen : AYE_LABS_SCREENING_BASE;
  const filters = [];
  if (s.requireSocial !== false) filters.push("has_social");
  if (s.excludeWashTrading !== false) filters.push("not_wash_trading");
  if (s.requireCreatorClose === true) filters.push("creator_close");

  return {
    chain: String(s.chain || "sol"),
    interval: String(s.interval || "1h"),
    limit: String(s.candidateLimit ?? 100),
    order_by: "volume",
    direction: "desc",
    filters: filters.join(","),
    min_liquidity: String(s.minLiquidityUsd ?? s.minTvlUsd ?? 2500),
    min_holder_count: String(s.minHolders ?? s.minHolderCount ?? 200),
    min_created: String(s.minAgeMinutes != null ? `${s.minAgeMinutes}m` : "30m"),
    min_gas_fee: String(s.minGasFee ?? 20),
    min_smart_degen_count: String(s.minSmartDegen ?? 2),
    min_swaps: String(s.minSwaps ?? 500),
    min_marketcap: String(s.minMcap ?? 100_000),
  };
}

/**
 * @param {unknown} data
 * @returns {object[]}
 */
export function extractTrendingRank(data) {
  if (!data || typeof data !== "object") return [];
  const root = /** @type {Record<string, unknown>} */ (data);
  const nested = root.data && typeof root.data === "object" ? /** @type {Record<string, unknown>} */ (root.data) : root;
  const rank = nested.rank ?? nested.list ?? nested.tokens ?? root.rank;
  return Array.isArray(rank) ? rank.filter((t) => t && typeof t === "object") : [];
}

/**
 * Local wash-trading reject (radar safe_for_dlmm).
 * @param {object} token
 */
export function isSafeForDlmm(token) {
  return token?.is_wash_trading !== true && token?.isWashTrading !== true;
}

/**
 * @param {object} token
 * @returns {number}
 */
export function tokenVlRatio(token) {
  const vol = toNum(token.volume ?? token.volume_1h);
  const liq = toNum(token.liquidity ?? token.liquidity_usd);
  return liq > 0 ? vol / liq : 0;
}

/**
 * Rank by V/L desc, then volume desc (radar rank_key).
 * @param {object[]} tokens
 * @param {number} [limit]
 */
export function rankByVl(tokens, limit = 10) {
  const sorted = [...tokens].sort((a, b) => {
    const vlA = tokenVlRatio(a);
    const vlB = tokenVlRatio(b);
    if (vlB !== vlA) return vlB - vlA;
    return toNum(b.volume ?? b.volume_1h) - toNum(a.volume ?? a.volume_1h);
  });
  return sorted.slice(0, Math.max(1, limit));
}

/**
 * Fetch Solana trending board with radar gates.
 * @param {object} [screen]
 * @returns {Promise<{ ok: boolean, tokens: object[], error?: string, status?: number }>}
 */
export async function fetchAyeLabsRadarBoard(screen = AYE_LABS_SCREENING_BASE) {
  const params = buildAyeLabsTrendingParams(screen);
  const result = await runGmgnAgentTool("gmgn-market-trending", params);
  if (!result.ok) {
    return {
      ok: false,
      tokens: [],
      error: result.error || "GMGN trending unavailable",
      status: result.status,
    };
  }
  const raw = extractTrendingRank(result.data).filter(isSafeForDlmm);
  const boardLimit = Number(screen.boardLimit) || 10;
  const tokens = rankByVl(raw, boardLimit);
  return { ok: true, tokens };
}

/**
 * FLOW + S× from token info / kline (radar flow_5m).
 * @param {object} token
 * @returns {Promise<{
 *   flow_ratio: number | null;
 *   flow_bullish: boolean;
 *   flow_bearish: boolean;
 *   swaps_1h: number;
 *   swaps_5m: number;
 *   swap_speed: number | null;
 * }>}
 */
export async function enrichTokenFlow(token) {
  const address = String(token.address || token.token_address || "").trim();
  const chain = String(token.chain || "sol");
  const empty = {
    flow_ratio: null,
    flow_bullish: false,
    flow_bearish: false,
    swaps_1h: toNum(token.swaps),
    swaps_5m: 0,
    swap_speed: null,
  };
  if (!address) return empty;

  const vol1h = toNum(token.volume ?? token.volume_1h);
  const nowSec = Math.floor(Date.now() / 1000);

  const [infoRes, klineRes] = await Promise.all([
    runGmgnAgentTool("gmgn-token-info", { chain, address }),
    runGmgnAgentTool("gmgn-market-kline", {
      chain,
      address,
      resolution: "1m",
      from: String(nowSec - 480),
      to: String(nowSec),
    }),
  ]);

  const price =
    infoRes.ok && infoRes.data && typeof infoRes.data === "object"
      ? /** @type {Record<string, unknown>} */ (infoRes.data).price || infoRes.data
      : {};
  const priceObj = price && typeof price === "object" ? /** @type {Record<string, unknown>} */ (price) : {};

  let candles = [];
  if (klineRes.ok && klineRes.data && typeof klineRes.data === "object") {
    const d = /** @type {Record<string, unknown>} */ (klineRes.data);
    const list = d.list ?? d.data;
    candles = Array.isArray(list) ? list.slice(-5) : [];
  }

  const vol5mFromCandles = candles.reduce((sum, c) => sum + toNum(c?.volume), 0);
  const vol5m = toNum(priceObj.volume_5m, vol5mFromCandles);
  const flowRatio = vol1h > 0 ? (vol5m * 12) / vol1h : null;

  const open5m = candles.length ? toNum(candles[0]?.open) : 0;
  const close5m = candles.length ? toNum(candles[candles.length - 1]?.close) : 0;
  const priceChange5m = open5m > 0 ? close5m / open5m - 1 : 0;
  const buyVol5m = toNum(priceObj.buy_volume_5m);
  const sellVol5m = toNum(priceObj.sell_volume_5m);
  const swaps5m = Math.floor(toNum(priceObj.swaps_5m));
  const swaps1h = toNum(priceObj.swaps_1h, toNum(token.swaps));
  const swapSpeed = swaps1h > 0 ? (swaps5m * 12) / swaps1h : null;

  const flowBullish = priceChange5m > 0.01 && buyVol5m > sellVol5m * 1.05;
  const flowBearish = priceChange5m < -0.01 && sellVol5m > buyVol5m * 1.05;

  return {
    flow_ratio: flowRatio,
    flow_bullish: flowBullish,
    flow_bearish: flowBearish,
    swaps_1h: swaps1h,
    swaps_5m: swaps5m,
    swap_speed: swapSpeed,
  };
}

/**
 * Enrich a board with FLOW metrics (bounded concurrency).
 * @param {object[]} tokens
 * @param {number} [maxEnrich]
 */
export async function enrichRadarBoardFlow(tokens, maxEnrich = 10) {
  const slice = tokens.slice(0, maxEnrich);
  const out = [];
  const concurrency = 3;
  for (let i = 0; i < slice.length; i += concurrency) {
    const batch = slice.slice(i, i + concurrency);
    const enriched = await Promise.all(
      batch.map(async (t) => {
        const flow = await enrichTokenFlow(t);
        return {
          ...t,
          vl_ratio: tokenVlRatio(t),
          ...flow,
        };
      }),
    );
    out.push(...enriched);
  }
  return out;
}
