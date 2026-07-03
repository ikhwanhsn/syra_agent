/**
 * Live trade tape for pump.fun / Solana tokens.
 * Primary: OKX DEX market trades (GET /api/v6/dex/market/trades).
 */
import { getDexTrades, hasOkxDexCredentials } from './okxDexMarket.js';

const CACHE_TTL_MS = 30_000;
const DEFAULT_LIMIT = 50;

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
function extractTradeRows(root) {
  if (Array.isArray(root)) return root;
  if (!root || typeof root !== 'object') return [];
  const o = /** @type {Record<string, unknown>} */ (root);
  const data = o.data && typeof o.data === 'object' ? /** @type {Record<string, unknown>} */ (o.data) : o;
  const candidates = [data.trades, data.tradeList, data.list, data.items, data.result];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

/** @param {unknown} sideRaw */
function normalizeSide(sideRaw) {
  const s = String(sideRaw ?? '').trim().toLowerCase();
  if (s === 'buy' || s === '1' || s === 'b') return 'buy';
  if (s === 'sell' || s === '2' || s === 's') return 'sell';
  return null;
}

/** @param {unknown} txHashUrl */
function extractTxHash(txHashUrl) {
  if (typeof txHashUrl !== 'string' || !txHashUrl.trim()) return null;
  const trimmed = txHashUrl.trim();
  const parts = trimmed.split('/');
  const last = parts[parts.length - 1]?.trim();
  return last && last.length >= 32 ? last : null;
}

/**
 * @param {unknown} changedTokenInfo
 * @param {string} mint
 */
function tokenAmountFromChangedInfo(changedTokenInfo, mint) {
  if (!Array.isArray(changedTokenInfo)) return null;
  for (const entry of changedTokenInfo) {
    if (!entry || typeof entry !== 'object') continue;
    const o = /** @type {Record<string, unknown>} */ (entry);
    const addr = String(o.tokenContractAddress ?? o.address ?? '').trim();
    if (addr && mint && addr !== mint) continue;
    const amount = toNum(o.amount ?? o.tokenAmount);
    if (amount != null) return amount;
  }
  return null;
}

/** @param {unknown} row @param {number} idx @param {string} mint */
function normalizeTradeRow(row, idx, mint) {
  if (!row || typeof row !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (row);

  const side =
    normalizeSide(o.type ?? o.side ?? o.tradeType ?? o.direction ?? o.txType) ??
    (o.isBuy != null ? (Boolean(o.isBuy) ? 'buy' : 'sell') : null);

  const amountUsd =
    toNum(o.volume) ??
    toNum(o.amountUsd ?? o.tradeUsd ?? o.volumeUsd ?? o.valueUsd ?? o.usdAmount) ??
    toNum(o.amount_usd);

  const amountToken =
    tokenAmountFromChangedInfo(o.changedTokenInfo, mint) ??
    toNum(o.amountToken ?? o.tokenAmount ?? o.quantity ?? o.amount);

  const priceUsd = toNum(o.priceUsd ?? o.price ?? o.tokenPrice);

  const wallet =
    String(o.userAddress ?? o.walletAddress ?? o.wallet ?? o.trader ?? o.owner ?? '').trim() || null;

  let at = null;
  const tsRaw = o.time ?? o.timestamp ?? o.blockTime ?? o.txTime ?? o.tradeTime ?? o.createdAt;
  if (typeof tsRaw === 'string') {
    const asNum = Number(tsRaw);
    if (Number.isFinite(asNum) && asNum > 0) {
      const ms = asNum > 1_000_000_000_000 ? asNum : asNum * 1000;
      const d = new Date(ms);
      at = Number.isNaN(d.getTime()) ? null : d.toISOString();
    } else {
      const d = new Date(tsRaw);
      at = Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
  } else if (typeof tsRaw === 'number' && Number.isFinite(tsRaw)) {
    const ms = tsRaw > 1_000_000_000_000 ? tsRaw : tsRaw * 1000;
    const d = new Date(ms);
    at = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const txHash =
    String(o.txHash ?? o.hash ?? o.signature ?? o.txId ?? '').trim() ||
    extractTxHash(o.txHashUrl) ||
    null;

  const id = String(o.id ?? '').trim() || txHash || `trade-${idx}`;

  return {
    id,
    side,
    amountUsd,
    amountToken,
    priceUsd,
    wallet,
    at,
    txHash,
    dexName: typeof o.dexName === 'string' ? o.dexName : null,
  };
}

/**
 * @param {{ mint: string; limit?: number }} input
 * @returns {Promise<{ ok: boolean; data?: object; error?: string; status?: number }>}
 */
export async function buildTokenTrades({ mint, limit = DEFAULT_LIMIT }) {
  const trimmed = typeof mint === 'string' ? mint.trim() : '';
  if (!trimmed) {
    return { ok: false, error: 'mint is required', status: 400 };
  }

  const cacheKey = `${trimmed}|${limit}`;
  const cached = readCache(cacheKey);
  if (cached) return { ok: true, data: cached };

  if (!hasOkxDexCredentials()) {
    return {
      ok: false,
      error: 'OKX credentials not configured for trade tape',
      status: 503,
    };
  }

  let raw = null;
  try {
    const out = await getDexTrades(trimmed, 'solana', {
      limit: Math.min(Math.max(1, limit), 100),
    });
    raw = out.result;
  } catch (err) {
    console.error('[token-trades] OKX failed:', err?.message || err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Trade tape lookup failed',
      status: 502,
    };
  }

  const trades = extractTradeRows(raw)
    .map((row, idx) => normalizeTradeRow(row, idx, trimmed))
    .filter(Boolean)
    .slice(0, limit);

  const buys = trades.filter((t) => t.side === 'buy');
  const sells = trades.filter((t) => t.side === 'sell');
  const buyVolumeUsd = buys.reduce((sum, t) => sum + (t.amountUsd ?? 0), 0);
  const sellVolumeUsd = sells.reduce((sum, t) => sum + (t.amountUsd ?? 0), 0);
  const totalVolumeUsd = buyVolumeUsd + sellVolumeUsd;
  const buyPressurePct = totalVolumeUsd > 0 ? (buyVolumeUsd / totalVolumeUsd) * 100 : null;

  const data = {
    mint: trimmed,
    trades,
    summary: {
      total: trades.length,
      buyCount: buys.length,
      sellCount: sells.length,
      buyVolumeUsd: buyVolumeUsd > 0 ? buyVolumeUsd : null,
      sellVolumeUsd: sellVolumeUsd > 0 ? sellVolumeUsd : null,
      buyPressurePct,
      verdict:
        buyPressurePct != null
          ? buyPressurePct >= 60
            ? 'Buy pressure dominant'
            : buyPressurePct <= 40
              ? 'Sell pressure dominant'
              : 'Balanced buy/sell activity'
          : 'Insufficient trade data',
      tone:
        buyPressurePct != null
          ? buyPressurePct >= 60
            ? 'safe'
            : buyPressurePct <= 40
              ? 'danger'
              : 'warning'
          : 'warning',
    },
    source: 'okx',
    fetchedAt: new Date().toISOString(),
  };

  writeCache(cacheKey, data);
  return { ok: true, data };
}
