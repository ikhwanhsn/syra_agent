/**
 * Live trade tape for pump.fun / Solana tokens.
 * Primary: OKX DEX market trades.
 */
import { getDexTrades, hasOkxDexCredentials } from './okxDexMarket.js';

const CACHE_TTL_MS = 30_000;
const DEFAULT_LIMIT = 50;

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
function extractTradeRows(root) {
  if (Array.isArray(root)) return root;
  if (!root || typeof root !== 'object') return [];
  const o = /** @type {Record<string, unknown>} */ (root);
  const data = o.data && typeof o.data === 'object' ? /** @type {Record<string, unknown>} */ (o.data) : o;
  const candidates = [data.trades, data.list, data.items, data.result];
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

/** @param {unknown} row @param {number} idx */
function normalizeTradeRow(row, idx) {
  if (!row || typeof row !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (row);

  const side =
    normalizeSide(o.side ?? o.type ?? o.tradeType ?? o.direction ?? o.txType) ??
    (o.isBuy != null ? (Boolean(o.isBuy) ? 'buy' : 'sell') : null);

  const amountUsd =
    toNum(o.amountUsd ?? o.tradeUsd ?? o.volumeUsd ?? o.valueUsd ?? o.usdAmount) ??
    toNum(o.amount_usd);

  const amountToken = toNum(o.amountToken ?? o.tokenAmount ?? o.quantity ?? o.amount);
  const priceUsd = toNum(o.priceUsd ?? o.price ?? o.tokenPrice);

  const wallet = String(o.walletAddress ?? o.wallet ?? o.trader ?? o.owner ?? '').trim() || null;

  let at = null;
  const tsRaw = o.timestamp ?? o.time ?? o.blockTime ?? o.txTime ?? o.createdAt;
  if (typeof tsRaw === 'string') {
    const d = new Date(tsRaw);
    at = Number.isNaN(d.getTime()) ? null : d.toISOString();
  } else if (typeof tsRaw === 'number' && Number.isFinite(tsRaw)) {
    const ms = tsRaw > 1_000_000_000_000 ? tsRaw : tsRaw * 1000;
    const d = new Date(ms);
    at = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const txHash = String(o.txHash ?? o.hash ?? o.signature ?? o.txId ?? '').trim() || null;

  return {
    id: txHash ?? `trade-${idx}`,
    side,
    amountUsd,
    amountToken,
    priceUsd,
    wallet,
    at,
    txHash,
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
    .map(normalizeTradeRow)
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
