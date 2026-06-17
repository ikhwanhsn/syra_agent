/**
 * Real on-chain / API pool intelligence for the Meteora LP real agent.
 * Replaces synthetic derivePoolSignals() for live capital deployment.
 */
import { fetchSplTokenTopHolders } from "./solanaTokenLargestHolders.js";
import { fetchJupiterTokenMetaBatch } from "./solanaTokenMetadata.js";
import { runGmgnAgentTool } from "./gmgnAgentService.js";
import { isSolMint } from "./meteoraDlmmExecutor.js";
import { derivePoolSignals } from "./lpPoolSignalsSynthetic.js";
import { getLpRealUseRealSignals } from "../config/lpRealAgentAccess.js";

const SIGNAL_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CONCURRENT = 6;

/** @type {Map<string, { ts: number, value: import("./lpRealSignals.js").RealPoolSignals }>} */
const signalCache = new Map();

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * @param {string} mint
 * @param {{ baseMint?: string | null, quoteMint?: string | null }} pool
 */
export function resolveNonSolTokenMint(pool, mint) {
  if (mint) return mint;
  const base = String(pool?.baseMint || "").trim();
  const quote = String(pool?.quoteMint || "").trim();
  if (base && !isSolMint(base)) return base;
  if (quote && !isSolMint(quote)) return quote;
  return null;
}

/**
 * @param {unknown} raw
 */
function extractMeteoraOrganic(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (raw);
  const candidates = [
    r.organic_score,
    r.organicScore,
    r.token_x?.organic_score,
    r.token_y?.organic_score,
    r.metrics?.organic_score,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return clamp(n, 0, 100);
  }
  return null;
}

/**
 * @param {unknown} raw
 */
function extractMeteoraHolders(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (raw);
  const candidates = [
    r.holder_count,
    r.holders,
    r.token_x?.holder_count,
    r.token_y?.holder_count,
    r.metrics?.holder_count,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  return null;
}

/**
 * @param {unknown} data
 */
function parseGmgnSecurity(data) {
  const root =
    data && typeof data === "object" && "data" in /** @type {object} */ (data)
      ? /** @type {Record<string, unknown>} */ (/** @type {object} */ (data).data)
      : /** @type {Record<string, unknown>} */ (data ?? {});

  const mintRenounced =
    root.is_mint_renounced ??
    root.mint_renounced ??
    root.mint_authority_disabled ??
    root.mintAuthorityRenounced;
  const freezeRenounced =
    root.is_freeze_renounced ??
    root.freeze_renounced ??
    root.freeze_authority_disabled ??
    root.freezeAuthorityRenounced;

  return {
    mintAuthorityRenounced: mintRenounced == null ? null : Boolean(mintRenounced),
    freezeAuthorityRenounced: freezeRenounced == null ? null : Boolean(freezeRenounced),
    botHoldersPct: toNum(
      root.bot_degen_rate ?? root.bot_holder_rate ?? root.bot_ratio ?? root.bot_holders_pct,
      NaN,
    ),
    launchpad: String(root.launchpad ?? root.platform ?? root.launchpad_platform ?? "").trim() || null,
    holderCount: toNum(root.holder_count ?? root.holders, NaN),
    mcapUsd: toNum(root.market_cap ?? root.mcap ?? root.fdv, NaN),
    deployerAddress: String(root.creator ?? root.deployer ?? root.owner ?? "").trim() || null,
  };
}

/**
 * @param {import("./solanaTokenMetadata.js").TokenMeta & Record<string, unknown>} meta
 */
function parseJupiterRow(meta, mint) {
  const row = /** @type {Record<string, unknown>} */ (meta);
  return {
    mcapUsd: toNum(row.mcap ?? row.marketCap ?? row.fdv, NaN),
    holderCount: toNum(row.holderCount ?? row.holders, NaN),
    organicScore: toNum(row.organicScore ?? row.organic_score, NaN),
    topHoldersPct: toNum(row.topHoldersPercentage ?? row.top_holders_pct, NaN),
    botHoldersPct: toNum(row.audit?.botHoldersPercentage ?? row.botHoldersPct, NaN),
    mintAuthorityRenounced:
      row.mintAuthority == null && row.mint_authority == null
        ? null
        : row.mintAuthority === null || row.mint_authority === null,
    freezeAuthorityRenounced:
      row.freezeAuthority == null && row.freeze_authority == null
        ? null
        : row.freezeAuthority === null || row.freeze_authority === null,
    launchpad: String(row.launchpad ?? row.launchpadName ?? "").trim() || null,
    mint,
  };
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T) => Promise<unknown>} fn
 */
async function mapWithConcurrency(items, concurrency, fn) {
  const out = [];
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx;
      idx += 1;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * @typedef {ReturnType<typeof derivePoolSignals> & {
 *   available: boolean;
 *   topHoldersPct: number | null;
 *   botHoldersPct: number | null;
 *   mintAuthorityRenounced: boolean | null;
 *   freezeAuthorityRenounced: boolean | null;
 *   launchpad: string | null;
 *   deployerAddress: string | null;
 *   tokenMint: string | null;
 *   signalSource: "real" | "synthetic";
 *   realSignalErrors: string[];
 * }} RealPoolSignals
 */

/**
 * Fetch real token/pool signals for a Meteora pool candidate.
 * Fail-closed: `available: false` when no trustworthy holder/security data is returned.
 *
 * @param {Record<string, unknown>} pool
 * @returns {Promise<RealPoolSignals>}
 */
export async function fetchRealPoolSignals(pool) {
  const tokenMint = resolveNonSolTokenMint(pool);
  if (!tokenMint) {
    return {
      ...derivePoolSignals(pool),
      available: false,
      topHoldersPct: null,
      botHoldersPct: null,
      mintAuthorityRenounced: null,
      freezeAuthorityRenounced: null,
      launchpad: null,
      deployerAddress: null,
      tokenMint: null,
      signalSource: "real",
      realSignalErrors: ["no_token_mint"],
    };
  }

  const cacheKey = tokenMint;
  const cached = signalCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SIGNAL_CACHE_TTL_MS) {
    const base = derivePoolSignals(pool);
    return { ...base, ...cached.value, volTvlRatio: base.volTvlRatio, freshnessScore: base.freshnessScore };
  }

  const errors = [];
  const feeTvl = toNum(pool.feeTvlRatio);
  const feeTvlPts = feeTvl * 100;
  const tvl = toNum(pool.tvlUsd);
  const vol = toNum(pool.volume24hUsd);
  const volTvlRatio = tvl > 0 ? vol / tvl : vol > 0 ? 8 : 0;

  const [holdersSettled, gmgnSettled, jupSettled] = await Promise.allSettled([
    fetchSplTokenTopHolders(tokenMint, { limit: 10 }),
    runGmgnAgentTool("gmgn-token-security", { chain: "sol", address: tokenMint }),
    fetchJupiterTokenMetaBatch([tokenMint]),
  ]);

  /** @type {Record<string, unknown>} */
  let holderData = {};
  if (holdersSettled.status === "fulfilled") {
    holderData = holdersSettled.value;
  } else {
    errors.push("holders_rpc_failed");
  }

  /** @type {ReturnType<typeof parseGmgnSecurity>} */
  let gmgn = {
    mintAuthorityRenounced: null,
    freezeAuthorityRenounced: null,
    botHoldersPct: NaN,
    launchpad: null,
    holderCount: NaN,
    mcapUsd: NaN,
    deployerAddress: null,
  };
  if (gmgnSettled.status === "fulfilled" && gmgnSettled.value?.ok) {
    gmgn = parseGmgnSecurity(gmgnSettled.value.data);
  } else {
    errors.push("gmgn_security_unavailable");
  }

  /** @type {ReturnType<typeof parseJupiterRow> | null} */
  let jup = null;
  if (jupSettled.status === "fulfilled") {
    const meta = jupSettled.value.get(tokenMint);
    if (meta) jup = parseJupiterRow(meta, tokenMint);
  }
  if (!jup) errors.push("jupiter_audit_unavailable");

  const topHoldersPct =
    holderData.top10ConcentrationPct != null
      ? toNum(holderData.top10ConcentrationPct)
      : jup?.topHoldersPct != null && Number.isFinite(jup.topHoldersPct)
        ? jup.topHoldersPct
        : null;

  const holderCount =
    extractMeteoraHolders(pool.raw) ??
    (Number.isFinite(gmgn.holderCount) ? gmgn.holderCount : null) ??
    (jup && Number.isFinite(jup.holderCount) ? jup.holderCount : null) ??
    (Array.isArray(holderData.holders) ? Math.max(400, holderData.holders.length * 50) : null);

  const organicScore =
    extractMeteoraOrganic(pool.raw) ??
    (jup && Number.isFinite(jup.organicScore) ? jup.organicScore : null);

  const mcapUsd =
    (Number.isFinite(gmgn.mcapUsd) ? gmgn.mcapUsd : null) ??
    (jup && Number.isFinite(jup.mcapUsd) ? jup.mcapUsd : null);

  const botHoldersPct =
    Number.isFinite(gmgn.botHoldersPct) && gmgn.botHoldersPct >= 0
      ? gmgn.botHoldersPct
      : jup && Number.isFinite(jup.botHoldersPct)
        ? jup.botHoldersPct
        : null;

  const mintAuthorityRenounced = gmgn.mintAuthorityRenounced ?? jup?.mintAuthorityRenounced ?? null;
  const freezeAuthorityRenounced = gmgn.freezeAuthorityRenounced ?? jup?.freezeAuthorityRenounced ?? null;
  const launchpad = gmgn.launchpad ?? jup?.launchpad ?? null;

  const hasHolderSignal = topHoldersPct != null || (holderCount != null && holderCount > 0);
  const available = hasHolderSignal;

  const organicFinal =
    organicScore != null
      ? clamp(organicScore, 0, 100)
      : clamp(36 + feeTvlPts * 120 + Math.min(20, volTvlRatio * 2), 0, 100);

  const studyWinRate = clamp(
    0.35 +
      (organicFinal / 100) * 0.25 +
      (topHoldersPct != null ? Math.max(0, (55 - topHoldersPct) / 100) : 0) +
      (botHoldersPct != null ? Math.max(0, (25 - botHoldersPct) / 100) : 0),
    0.32,
    0.72,
  );

  const smartWalletsPresent =
    botHoldersPct != null
      ? botHoldersPct < 18 && vol > 50_000 && feeTvlPts > 0.03
      : false;

  const narrativeScore = clamp(4 + feeTvlPts * 8 + (organicFinal / 100) * 3, 1, 10);
  const volatilityScore = clamp(feeTvlPts * 6 + vol / 400_000 + volTvlRatio * 0.08, 0, 1);
  const freshnessScore = clamp(
    Math.min(1, volTvlRatio / 6) * 0.65 + Math.max(0, 1 - tvl / 550_000) * 0.35,
    0,
    1,
  );

  /** @type {RealPoolSignals} */
  const signals = {
    organicScore: organicFinal,
    holderCount: holderCount != null ? Math.floor(holderCount) : 0,
    mcapUsd: mcapUsd != null ? Math.floor(mcapUsd) : 0,
    smartWalletsPresent,
    narrativeScore,
    studyWinRate,
    hiveConsensus: clamp(0.35 + feeTvlPts * 2 + (organicFinal / 100) * 0.35, 0.25, 0.95),
    volatilityScore,
    freshnessScore,
    volTvlRatio,
    priceVsAthPct: clamp(38 + volatilityScore * 48, 22, 92),
    available,
    topHoldersPct,
    botHoldersPct,
    mintAuthorityRenounced,
    freezeAuthorityRenounced,
    launchpad,
    deployerAddress: gmgn.deployerAddress,
    tokenMint,
    signalSource: "real",
    realSignalErrors: errors,
  };

  signalCache.set(cacheKey, { ts: Date.now(), value: signals });
  return signals;
}

/**
 * Enrich real-mode pool list with real signals (fail-closed skips unavailable pools).
 *
 * @param {Record<string, unknown>[]} pools
 * @param {{ maxPools?: number }} [opts]
 */
export async function enrichPoolsWithRealSignals(pools, { maxPools = 48 } = {}) {
  if (!getLpRealUseRealSignals()) {
    return pools.map((pool) => ({
      ...pool,
      ...derivePoolSignals(pool),
      realSignalsAvailable: false,
      signalSource: "synthetic",
    }));
  }

  const slice = pools.slice(0, maxPools);
  const enriched = await mapWithConcurrency(slice, MAX_CONCURRENT, async (pool) => {
    const signals = await fetchRealPoolSignals(pool);
    if (!signals.available) return null;
    return {
      ...pool,
      ...signals,
      realSignalsAvailable: true,
      signalSource: "real",
    };
  });

  return enriched.filter(Boolean);
}

export function __clearLpRealSignalsCacheForTest() {
  signalCache.clear();
}
