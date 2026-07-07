/**
 * Fast, reliable holder count for $ANSEM — RugCheck + GMGN + pump.fun with sticky last-known-good.
 */
import { fetchPumpfunRaw } from './pumpfunCoinAnalysis.js';
import { fetchRugcheckReport } from './rugcheckService.js';
import { runGmgnAgentTool } from './gmgnAgentService.js';

/** @type {{ count: number; source: string; at: number } | null} */
let lastKnownGood = null;

const LAST_KNOWN_MAX_AGE_MS = 24 * 60 * 60_000;

/** @param {unknown} v */
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {T} fallback
 * @template T
 */
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * @param {unknown} raw
 */
function holderCountFromPumpRaw(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  return (
    toNum(o.holder_count) ??
    toNum(o.holderCount) ??
    toNum(o.holders) ??
    toNum(o.num_holders) ??
    null
  );
}

/**
 * @param {string} mint
 */
async function fetchGmgnTokenInfoHolderCount(mint) {
  try {
    const res = await withTimeout(
      runGmgnAgentTool('gmgn-token-info', { chain: 'sol', address: mint }),
      10_000,
      null,
    );
    if (!res?.ok || !res.data) return null;
    const root = /** @type {Record<string, unknown>} */ (res.data);
    const count = toNum(root.holder_count ?? root.holders ?? root.holderCount);
    return count != null && count > 0 ? Math.floor(count) : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} mint
 */
async function fetchGmgnSecurityHolderCount(mint) {
  try {
    const res = await withTimeout(
      runGmgnAgentTool('gmgn-token-security', { chain: 'sol', address: mint }),
      10_000,
      null,
    );
    if (!res?.ok) return null;
    const root =
      res.data && typeof res.data === 'object' && 'data' in res.data
        ? /** @type {Record<string, unknown>} */ (/** @type {object} */ (res.data).data)
        : /** @type {Record<string, unknown>} */ (res.data ?? {});
    const count = toNum(root.holder_count ?? root.holders ?? root.holderCount);
    return count != null && count > 0 ? Math.floor(count) : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} mint
 */
async function fetchGmgnHolderCount(mint) {
  return (
    (await fetchGmgnTokenInfoHolderCount(mint)) ?? (await fetchGmgnSecurityHolderCount(mint))
  );
}

/**
 * @param {string} mint
 */
async function fetchRugcheckHolderCount(mint) {
  try {
    const rug = await withTimeout(fetchRugcheckReport({ mint }), 14_000, null);
    if (!rug) return null;
    const count = toNum(rug.totalHolders ?? rug.holderCount);
    return count != null && count > 0 ? Math.floor(count) : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} mint
 */
async function fetchPumpHolderCount(mint) {
  try {
    const pump = await withTimeout(fetchPumpfunRaw(mint), 10_000, { ok: false });
    if (!pump?.ok) return null;
    const count = holderCountFromPumpRaw(pump.data);
    return count != null && count > 0 ? Math.floor(count) : null;
  } catch {
    return null;
  }
}

const SOURCE_PRIORITY = /** @type {const} */ ({
  gmgn: 5,
  rugcheck: 3,
  pumpfun: 2,
  cache: 1,
});

/**
 * @param {Array<{ source: keyof typeof SOURCE_PRIORITY; count: number | null }>} rows
 */
function pickBestHolderSource(rows) {
  const valid = rows.filter((r) => r.count != null && r.count > 0);
  if (!valid.length) return { count: null, source: null };
  valid.sort(
    (a, b) =>
      (SOURCE_PRIORITY[b.source] ?? 0) - (SOURCE_PRIORITY[a.source] ?? 0) ||
      (b.count ?? 0) - (a.count ?? 0),
  );
  return { count: valid[0].count, source: valid[0].source };
}

/**
 * @param {string} mint
 */
export async function resolveAnsemHolderCount(mint) {
  const [rugCount, gmgnCount, pumpCount] = await Promise.all([
    fetchRugcheckHolderCount(mint),
    fetchGmgnHolderCount(mint),
    fetchPumpHolderCount(mint),
  ]);

  let picked = pickBestHolderSource([
    { source: 'rugcheck', count: rugCount },
    { source: 'gmgn', count: gmgnCount },
    { source: 'pumpfun', count: pumpCount },
  ]);

  if (picked.count != null && picked.count > 0) {
    lastKnownGood = {
      count: picked.count,
      source: String(picked.source),
      at: Date.now(),
    };
    return {
      count: picked.count,
      source: picked.source,
      pumpCount,
      rugCount,
      gmgnCount,
      stale: false,
    };
  }

  if (lastKnownGood && Date.now() - lastKnownGood.at < LAST_KNOWN_MAX_AGE_MS) {
    return {
      count: lastKnownGood.count,
      source: /** @type {'rugcheck' | 'gmgn' | 'pumpfun' | 'cache'} */ ('cache'),
      pumpCount,
      rugCount,
      gmgnCount,
      stale: true,
    };
  }

  return {
    count: null,
    source: null,
    pumpCount,
    rugCount,
    gmgnCount,
    stale: false,
  };
}

/** @returns {number | null} */
export function getAnsemHolderCountLastKnown() {
  if (!lastKnownGood) return null;
  if (Date.now() - lastKnownGood.at > LAST_KNOWN_MAX_AGE_MS) return null;
  return lastKnownGood.count;
}
