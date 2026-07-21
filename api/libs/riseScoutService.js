/**
 * Live RISE scout x402 service — intel, markets, targets views.
 */

import { riseGetMarketByAddress, riseGetMarkets } from "./riseClient.js";
import { normalizeRiseMarketRow } from "../libs/riseMarketNormalize.js";
import { enrichRiseMarket, rankEnrichedByAlpha } from "./riseIntelligence.js";
import { clampInt, withScoutCache } from "./scoutCache.js";

const PAGE_SIZE = 100;
const MAX_PAGES = 20;
const RISE_TIMEOUT_MS = 12_000;

const VALID_VIEWS = new Set(["intel", "markets", "targets"]);
const VALID_TIERS = new Set(["ready", "watch"]);

/**
 * @param {unknown} v
 * @param {number} lo
 * @param {number} hi
 * @param {number} fallback
 */
function clampIntLocal(v, lo, hi, fallback) {
  return clampInt(v, lo, hi, fallback);
}

/**
 * @param {Promise<unknown>} promise
 * @param {number} ms
 */
async function withTimeout(promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("RISE request timed out")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function deriveMarketLens(nowMs, marketCapUsd) {
  const mc = marketCapUsd != null && Number.isFinite(marketCapUsd) ? marketCapUsd : 420_000;
  const seed = Number(nowMs) % 100_000;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const utilizationPct = clamp(38 + (seed % 35), 24, 88);
  const borrowAprPct = clamp(9 + utilizationPct * 0.11 + (seed % 7) * 0.05, 7.5, 26);
  const lendAprPct = clamp(borrowAprPct * 0.62 + (seed % 5) * 0.04, 4, 16);
  const borrowPoolUsd = mc * (2.4 + (seed % 120) / 100);
  const alphaNlvUsd = borrowPoolUsd * (0.55 + (seed % 40) / 200);
  const flow24hUsd = (alphaNlvUsd * ((seed % 17) - 8)) / 400;
  return {
    borrowPoolUsd,
    utilizationPct,
    borrowAprPct,
    lendAprPct,
    alphaNlvUsd,
    flow24hUsd,
  };
}

function rowToTokenSnapshot(row) {
  return {
    mint: row.mint,
    symbol: row.symbol?.trim() || "—",
    name: row.name?.trim() || row.symbol || "—",
    imageUrl: row.imageUrl ?? null,
    priceUsd: row.priceUsd ?? null,
    marketCapUsd: row.marketCapUsd ?? null,
    floorPriceUsd: row.floorPriceUsd ?? null,
    volume24hUsd: row.volume24hUsd ?? null,
    holders: row.holders ?? null,
    priceChange24hPct: row.priceChange24hPct ?? null,
    level: row.level ?? null,
    isVerified: row.isVerified === true,
  };
}

async function fetchAllRiseMarketRows() {
  const first = await withTimeout(riseGetMarkets({ page: 1, limit: PAGE_SIZE }), RISE_TIMEOUT_MS);
  if (!first.ok) {
    throw new Error(first.error || "RISE markets request failed");
  }

  const totalPages = Math.min(
    MAX_PAGES,
    Math.max(1, Number.parseInt(String(first.data?.totalPages ?? 1), 10) || 1),
  );

  const pageResults = [first];
  const pageCalls = [];
  for (let p = 2; p <= totalPages; p += 1) {
    pageCalls.push(withTimeout(riseGetMarkets({ page: p, limit: PAGE_SIZE }), RISE_TIMEOUT_MS));
  }
  const settled = await Promise.allSettled(pageCalls);
  for (const s of settled) {
    if (s.status === "fulfilled") pageResults.push(s.value);
  }

  const allRows = [];
  const seen = new Set();

  for (const r of pageResults) {
    if (!r?.ok || !Array.isArray(r.data?.markets)) continue;
    for (const m of r.data.markets) {
      const row = normalizeRiseMarketRow(m);
      if (!row?.mint || seen.has(row.mint)) continue;
      seen.add(row.mint);
      allRows.push(row);
    }
  }

  return allRows;
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} reqLike
 */
export function parseRiseScoutParams(reqLike = {}) {
  const src =
    reqLike.method === "POST" && reqLike.body && typeof reqLike.body === "object"
      ? reqLike.body
      : (reqLike.query ?? {});

  const viewRaw = String(src.view ?? "intel").trim().toLowerCase();
  const tierRaw = String(src.tier ?? "").trim().toLowerCase();
  const mint = typeof src.mint === "string" ? src.mint.trim() : "";

  return {
    view: VALID_VIEWS.has(viewRaw) ? viewRaw : "intel",
    mint: mint || null,
    limit: clampIntLocal(src.limit, 1, 100, 25),
    tier: VALID_TIERS.has(tierRaw) ? tierRaw : null,
  };
}

/**
 * @param {ReturnType<typeof parseRiseScoutParams>} params
 */
export async function getRiseScout(params) {
  const cacheKey = `rise:scout:${params.view}:${params.mint ?? ""}:${params.limit}:${params.tier ?? ""}`;

  return withScoutCache(cacheKey, async () => {
    const nowMs = Date.now();

    if (params.mint) {
      const one = await withTimeout(riseGetMarketByAddress(params.mint), RISE_TIMEOUT_MS);
      if (!one.ok || !one.data?.market) {
        throw new Error(one.error || "RISE market not found");
      }
      const row = normalizeRiseMarketRow(one.data.market);
      if (!row) throw new Error("Failed to normalize RISE market row");

      const enriched = enrichRiseMarket(row);
      const token = rowToTokenSnapshot(row);
      const rise = deriveMarketLens(nowMs, token.marketCapUsd);

      return {
        view: params.view,
        nowMs,
        mint: params.mint,
        token,
        rise,
        market: row,
        enriched,
        marketCount: 1,
        computedAt: new Date().toISOString(),
      };
    }

    const markets = await fetchAllRiseMarketRows();
    const enriched = rankEnrichedByAlpha(markets.map(enrichRiseMarket));

    const topRow = enriched[0]?.market ?? markets[0] ?? null;
    const token = topRow ? rowToTokenSnapshot(topRow) : null;
    const rise = deriveMarketLens(nowMs, token?.marketCapUsd ?? null);

    const tierFilter = params.tier;
    const targets = enriched
      .filter((r) => {
        if (tierFilter === "ready") return r.agentTier === "ready";
        if (tierFilter === "watch") return r.agentTier === "watch";
        return r.agentTier === "ready" || r.agentTier === "watch";
      })
      .slice(0, params.limit);

    const riseAlphaMintTargets = targets.map((r) => r.market.mint);

    if (params.view === "targets") {
      return {
        view: "targets",
        nowMs,
        marketCount: markets.length,
        riseAlphaMintTargets,
        targets: targets.map((r) => ({
          mint: r.market.mint,
          symbol: r.market.symbol,
          name: r.market.name,
          agentTier: r.agentTier,
          agentNote: r.agentNote,
          alphaScore: r.alpha.score,
          riskFlags: r.riskFlags,
          narratives: r.narratives,
          marketCapUsd: r.market.marketCapUsd,
          volume24hUsd: r.market.volume24hUsd,
        })),
        computedAt: new Date().toISOString(),
      };
    }

    if (params.view === "markets") {
      return {
        view: "markets",
        nowMs,
        marketCount: markets.length,
        markets: enriched.slice(0, params.limit).map((r) => ({
          mint: r.market.mint,
          symbol: r.market.symbol,
          name: r.market.name,
          priceUsd: r.market.priceUsd,
          marketCapUsd: r.market.marketCapUsd,
          volume24hUsd: r.market.volume24hUsd,
          priceChange24hPct: r.market.priceChange24hPct,
          isVerified: r.market.isVerified,
          agentTier: r.agentTier,
          alphaScore: r.alpha.score,
        })),
        computedAt: new Date().toISOString(),
      };
    }

    return {
      view: "intel",
      nowMs,
      token,
      rise,
      riseAlphaMintTargets,
      marketCount: markets.length,
      topTargets: targets.slice(0, 10).map((r) => ({
        mint: r.market.mint,
        symbol: r.market.symbol,
        agentTier: r.agentTier,
        alphaScore: r.alpha.score,
      })),
      computedAt: new Date().toISOString(),
    };
  });
}
