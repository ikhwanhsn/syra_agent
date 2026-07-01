/**
 * Sniper / bundle wallet detection for pump.fun tokens.
 * Primary: OKX memepump tokenBundleInfo.
 */
import { getDexMemepumpTokenBundleInfo, hasOkxDexCredentials } from './okxDexMarket.js';

const CACHE_TTL_MS = 90_000;

/** @type {Map<string, { expires: number; data: unknown }>} */
const cache = new Map();

/** @param {unknown} v */
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** @param {string} mint */
function readCache(mint) {
  const hit = cache.get(mint);
  if (!hit || Date.now() > hit.expires) {
    if (hit) cache.delete(mint);
    return null;
  }
  return hit.data;
}

/** @param {string} mint @param {unknown} data */
function writeCache(mint, data) {
  cache.set(mint, { expires: Date.now() + CACHE_TTL_MS, data });
}

/** @param {unknown} root */
function unwrapOkxData(root) {
  if (!root || typeof root !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (root);
  if (o.data && typeof o.data === 'object') return /** @type {Record<string, unknown>} */ (o.data);
  return o;
}

/** @param {unknown} root */
function extractWalletRows(root) {
  const data = unwrapOkxData(root);
  if (!data) return [];
  const candidates = [
    data.bundleWalletList,
    data.sniperWalletList,
    data.walletList,
    data.wallets,
    data.list,
    data.items,
    data.snipers,
    data.bundles,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

/** @param {unknown} row @param {number} idx */
function normalizeSniperRow(row, idx) {
  if (!row || typeof row !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (row);
  const wallet = String(
    o.walletAddress ?? o.wallet ?? o.address ?? o.owner ?? o.account ?? '',
  ).trim();
  if (!wallet || wallet.length < 32) return null;

  const holdingPct =
    toNum(o.holdRate) ??
    toNum(o.holdingRate) ??
    toNum(o.holdRatio) ??
    toNum(o.sharePct) ??
    toNum(o.holdingPct);

  const boughtUsd = toNum(o.buyAmountUsd ?? o.buyUsd ?? o.amountUsd ?? o.buyValue);
  const soldPct = toNum(o.soldRate ?? o.sellRate ?? o.soldPct);

  const blockIndex = toNum(o.blockIndex ?? o.block ?? o.slot ?? o.buyBlock);
  const isFirstBlock = o.isFirstBlock != null ? Boolean(o.isFirstBlock) : blockIndex === 0 || blockIndex === 1;

  return {
    rank: idx + 1,
    wallet,
    holdingPct,
    boughtUsd,
    soldPct,
    blockIndex,
    isFirstBlock,
    label: typeof o.label === 'string' ? o.label : typeof o.type === 'string' ? o.type : null,
  };
}

/** @param {unknown} root */
function extractSummary(root) {
  const data = unwrapOkxData(root);
  if (!data) return {};
  return {
    bundleCount: toNum(data.bundleCount ?? data.sniperCount ?? data.walletCount),
    bundleSupplyPct: toNum(data.bundleSupplyPct ?? data.bundleRate ?? data.sniperRate ?? data.totalHoldRate),
    firstBlockBuyerCount: toNum(data.firstBlockBuyerCount ?? data.firstBlockCount),
    sniperSupplyPct: toNum(data.sniperSupplyPct ?? data.sniperRate),
  };
}

/**
 * @param {{ mint: string }} input
 * @returns {Promise<{ ok: boolean; data?: object; error?: string; status?: number }>}
 */
export async function buildTokenSnipers({ mint }) {
  const trimmed = typeof mint === 'string' ? mint.trim() : '';
  if (!trimmed) {
    return { ok: false, error: 'mint is required', status: 400 };
  }

  const cached = readCache(trimmed);
  if (cached) return { ok: true, data: cached };

  if (!hasOkxDexCredentials()) {
    return {
      ok: false,
      error: 'OKX credentials not configured for sniper detection',
      status: 503,
    };
  }

  let raw = null;
  try {
    const out = await getDexMemepumpTokenBundleInfo(trimmed, 'solana');
    raw = out.result;
  } catch (err) {
    console.error('[token-snipers] OKX failed:', err?.message || err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Sniper lookup failed',
      status: 502,
    };
  }

  const rows = extractWalletRows(raw)
    .map(normalizeSniperRow)
    .filter(Boolean);

  const summaryRaw = extractSummary(raw);
  const firstBlockBuyers = rows.filter((r) => r.isFirstBlock).length;
  const stillHolding = rows.filter((r) => r.holdingPct != null && r.holdingPct > 0.5).length;
  const fullySold = rows.filter((r) => r.soldPct != null && r.soldPct >= 95).length;

  const data = {
    mint: trimmed,
    snipers: rows.slice(0, 50),
    summary: {
      totalSnipers: summaryRaw.bundleCount ?? rows.length,
      bundleSupplyPct: summaryRaw.bundleSupplyPct ?? null,
      firstBlockBuyerCount: summaryRaw.firstBlockBuyerCount ?? firstBlockBuyers,
      sniperSupplyPct: summaryRaw.sniperSupplyPct ?? null,
      stillHolding,
      fullySold,
      verdict:
        (summaryRaw.bundleSupplyPct ?? 0) > 15
          ? 'High sniper concentration — early buyers may dump'
          : rows.length > 0
            ? 'Sniper activity detected — review wallet behavior'
            : 'No significant sniper/bundle activity detected',
      tone:
        (summaryRaw.bundleSupplyPct ?? 0) > 15
          ? 'danger'
          : rows.length > 5
            ? 'warning'
            : 'neutral',
    },
    source: 'okx',
    fetchedAt: new Date().toISOString(),
  };

  writeCache(trimmed, data);
  return { ok: true, data };
}
