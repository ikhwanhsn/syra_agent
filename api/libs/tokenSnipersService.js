/**
 * Sniper / bundle wallet detection for pump.fun tokens.
 * OKX sources:
 * - memepump/tokenBundleInfo — bundler totals (no wallet list)
 * - memepump/tokenDetails — tags.snipersPercent / tags.bundlersPercent
 * - market/token/advanced-info — snipersTotal, sniperHoldingPercent
 * - memepump/apedWallet — early/co-invested wallet rows (table)
 */
import {
  getDexMemepumpApedWallet,
  getDexMemepumpTokenBundleInfo,
  getDexMemepumpTokenDetails,
  getDexTokenAdvancedInfo,
  hasOkxDexCredentials,
} from './okxDexMarket.js';

const CACHE_TTL_MS = 90_000;

/** @type {Map<string, { expires: number; data: unknown }>} */
const cache = new Map();

/** @param {unknown} v */
function toNum(v) {
  if (v == null || v === '') return null;
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
function extractApedWalletRows(root) {
  if (!root) return [];
  if (Array.isArray(root)) return root;
  const data = unwrapOkxData(root);
  if (!data) return [];
  const candidates = [
    data.apedWalletList,
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
    toNum(o.holdingPercent) ??
    toNum(o.holdRate) ??
    toNum(o.holdingRate) ??
    toNum(o.holdRatio) ??
    toNum(o.sharePct) ??
    toNum(o.holdingPct);

  const boughtUsd =
    toNum(o.holdingUsd) ??
    toNum(o.buyAmountUsd) ??
    toNum(o.buyUsd) ??
    toNum(o.amountUsd) ??
    toNum(o.buyValue);

  const pnlPct = toNum(o.pnlPercent ?? o.pnlRate);
  let soldPct = toNum(o.soldRate ?? o.sellRate ?? o.soldPct);
  if (soldPct == null && holdingPct != null && holdingPct < 99) {
    soldPct = Math.max(0, 100 - holdingPct);
  }
  if (soldPct == null && pnlPct != null && holdingPct != null && holdingPct < 1) {
    soldPct = 100;
  }

  const blockIndex = toNum(o.blockIndex ?? o.block ?? o.slot ?? o.buyBlock);
  const isFirstBlock = o.isFirstBlock != null ? Boolean(o.isFirstBlock) : blockIndex === 0 || blockIndex === 1;

  const walletType = typeof o.walletType === 'string' ? o.walletType.trim() : null;
  const label =
    walletType ??
    (typeof o.label === 'string' ? o.label : typeof o.type === 'string' ? o.type : null);

  return {
    rank: idx + 1,
    wallet,
    holdingPct,
    boughtUsd,
    soldPct,
    pnlPct,
    blockIndex,
    isFirstBlock,
    label,
  };
}

/** @param {unknown} bundleRoot */
function extractBundleSummary(bundleRoot) {
  const data = unwrapOkxData(bundleRoot);
  if (!data) return {};
  return {
    totalBundlers: toNum(data.totalBundlers ?? data.bundleCount ?? data.sniperCount),
    bundlerAthPercent: toNum(data.bundlerAthPercent ?? data.bundleSupplyPct ?? data.bundleRate),
    bundledValueNative: toNum(data.bundledValueNative ?? data.bundledValue),
    bundledTokenAmount: toNum(data.bundledTokenAmount ?? data.bundledAmount),
  };
}

/** @param {unknown} detailsRoot */
function extractTagsSummary(detailsRoot) {
  const data = unwrapOkxData(detailsRoot);
  if (!data) return {};
  const tags =
    data.tags && typeof data.tags === 'object'
      ? /** @type {Record<string, unknown>} */ (data.tags)
      : data;
  return {
    snipersPercent: toNum(tags.snipersPercent ?? tags.sniperPercent ?? tags.sniperRate),
    bundlersPercent: toNum(tags.bundlersPercent ?? tags.bundlerPercent ?? tags.bundleRate),
    freshWalletsPercent: toNum(tags.freshWalletsPercent),
    totalHolders: toNum(tags.totalHolders),
  };
}

/** @param {unknown} advancedRoot */
function extractAdvancedSummary(advancedRoot) {
  const data = unwrapOkxData(advancedRoot);
  if (!data) return {};
  return {
    snipersTotal: toNum(data.snipersTotal ?? data.sniperCount),
    snipersClearAddressCount: toNum(data.snipersClearAddressCount ?? data.snipersSoldCount),
    sniperHoldingPercent: toNum(data.sniperHoldingPercent ?? data.sniperHoldPercent),
    bundleHoldingPercent: toNum(data.bundleHoldingPercent ?? data.bundleHoldPercent),
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

  /** @type {string[]} */
  const errors = [];

  const [bundleOut, detailsOut, advancedOut, apedOut] = await Promise.all([
    getDexMemepumpTokenBundleInfo(trimmed, 'solana').catch((err) => {
      errors.push(`bundle: ${err instanceof Error ? err.message : 'failed'}`);
      return { result: null };
    }),
    getDexMemepumpTokenDetails(trimmed, 'solana').catch((err) => {
      errors.push(`details: ${err instanceof Error ? err.message : 'failed'}`);
      return { result: null };
    }),
    getDexTokenAdvancedInfo(trimmed, 'solana').catch((err) => {
      errors.push(`advanced: ${err instanceof Error ? err.message : 'failed'}`);
      return { result: null };
    }),
    getDexMemepumpApedWallet(trimmed, 'solana').catch((err) => {
      errors.push(`aped: ${err instanceof Error ? err.message : 'failed'}`);
      return { result: null };
    }),
  ]);

  if (!bundleOut.result && !detailsOut.result && !advancedOut.result && !apedOut.result) {
    return {
      ok: false,
      error: errors[0] || 'Sniper lookup failed',
      status: 502,
    };
  }

  const bundleSummary = extractBundleSummary(bundleOut.result);
  const tagsSummary = extractTagsSummary(detailsOut.result);
  const advancedSummary = extractAdvancedSummary(advancedOut.result);

  const rows = extractApedWalletRows(apedOut.result)
    .map(normalizeSniperRow)
    .filter(Boolean);

  const totalSnipers =
    advancedSummary.snipersTotal ??
    bundleSummary.totalBundlers ??
    (rows.length > 0 ? rows.length : null) ??
    0;

  const sniperSupplyPct =
    tagsSummary.snipersPercent ??
    advancedSummary.sniperHoldingPercent ??
    null;

  const bundleSupplyPct =
    tagsSummary.bundlersPercent ??
    bundleSummary.bundlerAthPercent ??
    advancedSummary.bundleHoldingPercent ??
    null;

  const riskPct = Math.max(sniperSupplyPct ?? 0, bundleSupplyPct ?? 0);

  const stillHoldingFromAdvanced =
    advancedSummary.snipersTotal != null && advancedSummary.snipersClearAddressCount != null
      ? Math.max(0, advancedSummary.snipersTotal - advancedSummary.snipersClearAddressCount)
      : null;

  const stillHolding =
    stillHoldingFromAdvanced ??
    rows.filter((r) => r.holdingPct != null && r.holdingPct > 0.5).length;

  const fullySold =
    advancedSummary.snipersClearAddressCount ??
    rows.filter((r) => (r.soldPct != null && r.soldPct >= 95) || (r.holdingPct != null && r.holdingPct < 1)).length;

  const firstBlockBuyerCount = rows.filter((r) => r.isFirstBlock).length;

  const data = {
    mint: trimmed,
    snipers: rows.slice(0, 50),
    summary: {
      totalSnipers,
      bundleSupplyPct,
      firstBlockBuyerCount,
      sniperSupplyPct,
      stillHolding,
      fullySold,
      bundledValueNative: bundleSummary.bundledValueNative ?? null,
      totalHolders: tagsSummary.totalHolders ?? null,
      verdict:
        riskPct > 15
          ? 'High sniper concentration — early buyers may dump'
          : totalSnipers > 0 || rows.length > 0
            ? 'Sniper activity detected — review wallet behavior'
            : 'No significant sniper/bundle activity detected',
      tone: riskPct > 15 ? 'danger' : totalSnipers > 5 || rows.length > 5 ? 'warning' : 'neutral',
    },
    source: 'okx',
    errors: errors.length > 0 ? errors : undefined,
    fetchedAt: new Date().toISOString(),
  };

  writeCache(trimmed, data);
  return { ok: true, data };
}
