/**
 * Fetch and cache Syra Dune query results for the public about-page analytics API.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYRA_DUNE_QUERIES } from '../config/syraDuneAnalytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.resolve(__dirname, '../scripts/dune/queries.manifest.json');
const DUNE_API_BASE = 'https://api.dune.com/api/v1';
const CACHE_TTL_MS = Number(process.env.SYRA_DUNE_CACHE_TTL_MS || 5 * 60_000);

/** @type {{ data: unknown; fetchedAt: number } | null} */
let cache = null;

/**
 * @returns {Record<string, number>}
 */
function resolveQueryIds() {
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
    const manifest = JSON.parse(raw);
    const entries = manifest?.queries ?? {};
    const fromManifest = Object.fromEntries(
      Object.entries(entries).map(([slug, row]) => [slug, Number(row?.queryId)]),
    );
    const merged = { ...SYRA_DUNE_QUERIES };
    for (const [slug, id] of Object.entries(fromManifest)) {
      const camel = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (Number.isInteger(id) && id > 0) {
        merged[camel] = id;
        merged[slug] = id;
      }
    }
    return merged;
  } catch {
    return { ...SYRA_DUNE_QUERIES };
  }
}

/**
 * @param {string} apiKey
 * @param {number} queryId
 * @param {number} [limit]
 */
async function fetchQueryRows(apiKey, queryId, limit = 5000) {
  const res = await fetch(`${DUNE_API_BASE}/query/${queryId}/results?limit=${limit}`, {
    headers: { 'X-DUNE-API-KEY': apiKey },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof body.error === 'string' ? body.error : `Dune HTTP ${res.status}`;
    throw new Error(`query ${queryId}: ${msg}`);
  }
  return {
    rows: Array.isArray(body.result?.rows) ? body.result.rows : [],
    executionId: body.execution_id ?? null,
    state: body.state ?? null,
  };
}

/**
 * @param {unknown} value
 */
function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {string | undefined} day
 */
function formatDayLabel(day) {
  if (!day) return '';
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) return String(day).slice(0, 10);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * @param {Record<string, unknown>[]} rows
 */
function buildOverview(rows) {
  const row = rows[0] ?? {};
  return {
    priceUsd: toNumber(row.price_usd),
    fdvUsd: toNumber(row.fdv_usd),
    volume24hUsd: toNumber(row.volume_24h_usd),
    volume7dUsd: toNumber(row.volume_7d_usd),
    volumeAllTimeUsd: toNumber(row.volume_all_time_usd),
    totalHolders: Math.round(toNumber(row.total_holders)),
    top10ConcentrationPct: toNumber(row.top10_concentration_pct),
  };
}

/**
 * @param {Record<string, unknown>[]} rows
 */
function buildTradingVolume(rows) {
  return rows
    .map((r) => ({
      day: String(r.day ?? ''),
      label: formatDayLabel(String(r.day ?? '')),
      buyVolumeUsd: toNumber(r.buy_volume_usd),
      sellVolumeUsd: toNumber(r.sell_volume_usd),
      totalVolumeUsd: toNumber(r.total_volume_usd),
      tradeCount: Math.round(toNumber(r.trade_count)),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * @param {Record<string, unknown>[]} rows
 */
function buildUniqueTraders(rows) {
  return rows
    .map((r) => ({
      day: String(r.day ?? ''),
      label: formatDayLabel(String(r.day ?? '')),
      uniqueTraders: Math.round(toNumber(r.unique_traders)),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * @param {Record<string, unknown>[]} rows
 */
function buildVwap(rows) {
  return rows
    .map((r) => ({
      day: String(r.day ?? ''),
      label: formatDayLabel(String(r.day ?? '')),
      vwapPriceUsd: toNumber(r.vwap_price_usd),
      volumeUsd: toNumber(r.volume_usd),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * @param {Record<string, unknown>[]} rows
 */
function buildVenueSplit(rows) {
  return rows
    .map((r) => ({
      day: String(r.day ?? ''),
      label: formatDayLabel(String(r.day ?? '')),
      project: String(r.project ?? 'unknown'),
      volumeUsd: toNumber(r.volume_usd),
      tradeCount: Math.round(toNumber(r.trade_count)),
    }))
    .sort((a, b) => a.day.localeCompare(b.day) || b.volumeUsd - a.volumeUsd);
}

/**
 * @param {Record<string, unknown>[]} rows
 */
function buildHoldersOverTime(rows) {
  return rows
    .map((r) => ({
      day: String(r.day ?? ''),
      label: formatDayLabel(String(r.day ?? '')),
      holderCount: Math.round(toNumber(r.holder_count)),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * @param {Record<string, unknown>[]} rows
 */
function buildTopHolders(rows) {
  return rows.map((r) => ({
    wallet: String(r.wallet ?? ''),
    syraBalance: toNumber(r.syra_balance),
    pctOfSupply: toNumber(r.pct_of_supply),
    updatedAt: r.updated_at ? String(r.updated_at) : null,
  }));
}

/**
 * @param {Record<string, unknown>[]} rows
 */
function buildStakingLocked(rows) {
  return rows
    .map((r) => ({
      day: String(r.day ?? ''),
      label: formatDayLabel(String(r.day ?? '')),
      grossInflow: toNumber(r.gross_inflow),
      grossOutflow: toNumber(r.gross_outflow),
      netFlow: toNumber(r.net_flow),
      cumulativeNetLocked: toNumber(r.cumulative_net_locked),
      pctSupplyLocked: toNumber(r.pct_supply_locked),
      uniqueLockers: Math.round(toNumber(r.unique_lockers)),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * @param {Record<string, unknown>[]} rows
 */
function buildBuybacks(rows) {
  const events = rows.map((r) => ({
    blockTime: String(r.block_time ?? ''),
    syraBought: toNumber(r.syra_bought),
    usdSpent: toNumber(r.usd_spent),
    paidWith: r.paid_with ? String(r.paid_with) : null,
    project: r.project ? String(r.project) : null,
    txId: r.tx_id ? String(r.tx_id) : null,
    cumulativeSyraBought: toNumber(r.cumulative_syra_bought),
    cumulativeUsdSpent: toNumber(r.cumulative_usd_spent),
  }));

  const latest = events[0];
  return {
    events: events.slice(0, 50),
    cumulativeSyraBought: latest?.cumulativeSyraBought ?? 0,
    cumulativeUsdSpent: latest?.cumulativeUsdSpent ?? 0,
    totalEvents: events.length,
  };
}

/**
 * @param {boolean} [force]
 */
export async function getSyraDuneAnalytics(force = false) {
  const apiKey = process.env.DUNE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('dune_api_key_missing');
  }

  if (!force && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const ids = resolveQueryIds();
  const [
    overviewRes,
    tradingVolumeRes,
    uniqueTradersRes,
    vwapRes,
    venueRes,
    holdersRes,
    topHoldersRes,
    stakingRes,
    buybacksRes,
  ] = await Promise.all([
    fetchQueryRows(apiKey, ids.overview, 10),
    fetchQueryRows(apiKey, ids.tradingVolume, 120),
    fetchQueryRows(apiKey, ids.uniqueTraders, 120),
    fetchQueryRows(apiKey, ids.priceVwap, 120),
    fetchQueryRows(apiKey, ids.venueSplit, 500),
    fetchQueryRows(apiKey, ids.holdersOverTime, 500),
    fetchQueryRows(apiKey, ids.topHolders, 100),
    fetchQueryRows(apiKey, ids.stakingLocked, 500),
    fetchQueryRows(apiKey, ids.buybacks, 200),
  ]);

  const data = {
    updatedAt: new Date().toISOString(),
    source: 'dune',
    queryIds: ids,
    overview: buildOverview(overviewRes.rows),
    trading: {
      dailyVolume: buildTradingVolume(tradingVolumeRes.rows),
      uniqueTraders: buildUniqueTraders(uniqueTradersRes.rows),
      vwap: buildVwap(vwapRes.rows),
      venues: buildVenueSplit(venueRes.rows),
    },
    holders: {
      overTime: buildHoldersOverTime(holdersRes.rows),
      topHolders: buildTopHolders(topHoldersRes.rows),
    },
    staking: {
      daily: buildStakingLocked(stakingRes.rows),
      approximate: true,
    },
    buybacks: buildBuybacks(buybacksRes.rows),
  };

  // Fallback when overview query returns no row (e.g. stale cache or price oracle gap).
  const overviewEmpty =
    !overviewRes.rows.length ||
    (data.overview.totalHolders === 0 && data.overview.volumeAllTimeUsd === 0);
  if (overviewEmpty) {
    const dailyVolume = data.trading.dailyVolume;
    const vwap = data.trading.vwap;
    const holders = data.holders.overTime;
    const topHolders = data.holders.topHolders;

    const now = Date.now();
    const dayMs = 24 * 60 * 60_000;
    const volume24hUsd = dailyVolume
      .filter((d) => d.day && now - new Date(d.day).getTime() <= dayMs)
      .reduce((sum, d) => sum + d.totalVolumeUsd, 0);
    const volume7dUsd = dailyVolume
      .filter((d) => d.day && now - new Date(d.day).getTime() <= 7 * dayMs)
      .reduce((sum, d) => sum + d.totalVolumeUsd, 0);
    const volumeAllTimeUsd = dailyVolume.reduce((sum, d) => sum + d.totalVolumeUsd, 0);
    const latestVwap = vwap.length ? vwap[vwap.length - 1].vwapPriceUsd : 0;
    const latestHolders = holders.length ? holders[holders.length - 1].holderCount : 0;
    const top10Balance = topHolders.slice(0, 10).reduce((sum, h) => sum + h.syraBalance, 0);
    const totalSupply = Number(process.env.SYRA_TOTAL_SUPPLY || '1000000000');

    data.overview = {
      priceUsd: latestVwap,
      fdvUsd: latestVwap * totalSupply,
      volume24hUsd,
      volume7dUsd,
      volumeAllTimeUsd,
      totalHolders: latestHolders,
      top10ConcentrationPct: totalSupply > 0 ? (100 * top10Balance) / totalSupply : 0,
    };
  }

  cache = { data, fetchedAt: Date.now() };
  return data;
}
