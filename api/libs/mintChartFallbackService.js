/**
 * Swap-panel chart fallbacks when Tokens.xyz OHLCV is empty.
 * Order: pump.fun → CoinGecko → Binance (SOL) → GeckoTerminal (DexScreener pairs).
 */
import { getCoingeckoDataApiBaseUrl, coingeckoDataApiHeaders } from '../utils/coingeckoAPI.js';

const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const DEXSCREENER_TOKENS = 'https://api.dexscreener.com/tokens/v1/solana';
const GECKO_NETWORK = 'https://api.geckoterminal.com/api/v2/networks/solana/pools';
const BINANCE_KLINES = 'https://api.binance.com/api/v3/klines';
const PUMP_SWAP_API = (process.env.PUMP_FUN_SWAP_API_URL || 'https://swap-api.pump.fun').replace(/\/$/, '');

const MIN_CANDLES = 2;
const FETCH_TIMEOUT_MS = 12_000;

/** @typedef {{ time: number; open: number; high: number; low: number; close: number; volume?: number }} OhlcvCandle */

/**
 * @param {unknown} v
 * @returns {number | null}
 */
function toNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {OhlcvCandle[]} candles
 * @returns {boolean}
 */
function hasEnoughCandles(candles) {
  return Array.isArray(candles) && candles.length >= MIN_CANDLES;
}

/**
 * @param {Array<{ time: number; value: number }>} points
 * @returns {OhlcvCandle[]}
 */
function closePointsToCandles(points) {
  /** @type {OhlcvCandle[]} */
  const out = [];
  for (const p of points) {
    const time = toNum(p.time);
    const close = toNum(p.value);
    if (time == null || close == null || close <= 0) continue;
    out.push({ time: Math.floor(time), open: close, high: close, low: close, close });
  }
  out.sort((a, b) => a.time - b.time);
  return out;
}

/**
 * @param {OhlcvCandle[]} candles
 * @returns {OhlcvCandle[]}
 */
function dedupeCandles(candles) {
  /** @type {OhlcvCandle[]} */
  const out = [];
  for (const c of candles) {
    const prev = out[out.length - 1];
    if (prev && prev.time === c.time) {
      out[out.length - 1] = c;
    } else {
      out.push(c);
    }
  }
  return out;
}

/**
 * @param {string} url
 * @param {RequestInit} [init]
 */
async function fetchJson(url, init = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { Accept: 'application/json', ...(init.headers || {}) },
    });
    if (!res.ok) return null;
    return res.json().catch(() => null);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string} mint
 * @returns {Promise<{ candles: OhlcvCandle[]; interval: string } | null>}
 */
async function fetchPumpfunOhlcv(mint) {
  const trimmed = String(mint || '').trim();
  if (!trimmed || trimmed === WSOL_MINT) return null;

  const url = `${PUMP_SWAP_API}/v1/coins/${encodeURIComponent(trimmed)}/candles?interval=1h&limit=168`;
  const raw = await fetchJson(url, {
    headers: { Origin: 'https://pump.fun' },
  });
  if (!Array.isArray(raw) || raw.length === 0) return null;

  /** @type {OhlcvCandle[]} */
  const candles = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = /** @type {Record<string, unknown>} */ (row);
    const ts = toNum(o.timestamp);
    const close = toNum(o.close);
    if (ts == null || close == null || close <= 0) continue;
    const open = toNum(o.open) ?? close;
    const high = toNum(o.high) ?? close;
    const low = toNum(o.low) ?? close;
    const volume = toNum(o.volume) ?? undefined;
    candles.push({
      time: Math.floor(ts / 1000),
      open,
      high,
      low,
      close,
      ...(volume != null && volume > 0 ? { volume } : {}),
    });
  }

  const deduped = dedupeCandles(candles);
  if (!hasEnoughCandles(deduped)) return null;
  return { candles: deduped, interval: '1H' };
}

/**
 * @param {string} mint
 * @returns {Promise<string | null>}
 */
async function resolveCoingeckoIdFromMint(mint) {
  if (mint === WSOL_MINT) return 'solana';
  const base = getCoingeckoDataApiBaseUrl();
  const url = `${base}/coins/solana/contract/${encodeURIComponent(mint)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: coingeckoDataApiHeaders(), signal: ctrl.signal });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== 'object' || typeof data.id !== 'string' || !data.id.trim()) {
      return null;
    }
    return data.id.trim();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string} coinId
 * @returns {Promise<{ candles: OhlcvCandle[]; interval: string } | null>}
 */
async function fetchCoingeckoOhlcv(coinId) {
  const id = String(coinId || '').trim();
  if (!id) return null;

  const base = getCoingeckoDataApiBaseUrl();
  const url = `${base}/coins/${encodeURIComponent(id)}/ohlc?vs_currency=usd&days=7`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: coingeckoDataApiHeaders(), signal: ctrl.signal });
    const body = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(body)) return null;

    /** @type {OhlcvCandle[]} */
    const candles = [];
    for (const row of body) {
      if (!Array.isArray(row) || row.length < 5) continue;
      const ts = toNum(row[0]);
      const open = toNum(row[1]);
      const high = toNum(row[2]);
      const low = toNum(row[3]);
      const close = toNum(row[4]);
      if (ts == null || close == null || close <= 0) continue;
      candles.push({
        time: Math.floor(ts / 1000),
        open: open ?? close,
        high: high ?? close,
        low: low ?? close,
        close,
      });
    }

    const deduped = dedupeCandles(candles);
    if (!hasEnoughCandles(deduped)) return null;
    return { candles: deduped, interval: '1H' };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @returns {Promise<{ candles: OhlcvCandle[]; interval: string } | null>}
 */
async function fetchBinanceSolOhlcv() {
  const url = `${BINANCE_KLINES}?symbol=SOLUSDT&interval=1h&limit=168`;
  const raw = await fetchJson(url);
  if (!Array.isArray(raw)) return null;

  /** @type {OhlcvCandle[]} */
  const candles = [];
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const openMs = row[0];
    const open = toNum(row[1]);
    const high = toNum(row[2]);
    const low = toNum(row[3]);
    const close = toNum(row[4]);
    const volume = toNum(row[5]);
    const tSec =
      typeof openMs === 'number'
        ? Math.floor(openMs / 1000)
        : typeof openMs === 'string'
          ? Math.floor(Number.parseInt(openMs, 10) / 1000)
          : null;
    if (tSec == null || close == null || close <= 0) continue;
    candles.push({
      time: tSec,
      open: open ?? close,
      high: high ?? close,
      low: low ?? close,
      close,
      ...(volume != null && volume > 0 ? { volume } : {}),
    });
  }

  const deduped = dedupeCandles(candles);
  if (!hasEnoughCandles(deduped)) return null;
  return { candles: deduped, interval: '1H' };
}

/**
 * @param {Record<string, unknown>} row
 * @returns {'usd' | 'sol' | 'other'}
 */
function quoteMintHint(row) {
  const qt = row.quoteToken && typeof row.quoteToken === 'object' ? row.quoteToken : null;
  const addr = qt && typeof qt.address === 'string' ? qt.address : '';
  const sym = qt && typeof qt.symbol === 'string' ? qt.symbol.toUpperCase() : '';
  if (addr === USDC_MINT || addr === USDT_MINT || sym === 'USDC' || sym === 'USDT') return 'usd';
  if (addr === WSOL_MINT || sym === 'SOL' || sym === 'WSOL') return 'sol';
  return 'other';
}

/**
 * @param {string} mint
 * @returns {Promise<string[]>}
 */
async function resolveDexPairCandidates(mint) {
  const raw = await fetchJson(`${DEXSCREENER_TOKENS}/${encodeURIComponent(mint)}`);
  if (!Array.isArray(raw) || raw.length === 0) return [];

  /** @type {{ pairAddress: string; liq: number; hint: 'usd' | 'sol' | 'other' }[]} */
  const scored = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const pair = /** @type {Record<string, unknown>} */ (row);
    const pairAddress = typeof pair.pairAddress === 'string' ? pair.pairAddress : '';
    if (!pairAddress) continue;
    const liqObj = pair.liquidity;
    const liq =
      liqObj && typeof liqObj === 'object'
        ? toNum(/** @type {Record<string, unknown>} */ (liqObj).usd) ?? 0
        : 0;
    scored.push({ pairAddress, liq, hint: quoteMintHint(pair) });
  }

  const rank = (h) => (h === 'usd' ? 0 : h === 'sol' ? 1 : 2);
  scored.sort((a, b) => {
    const dr = rank(a.hint) - rank(b.hint);
    if (dr !== 0) return dr;
    return b.liq - a.liq;
  });
  return scored.map((s) => s.pairAddress);
}

/**
 * @returns {Promise<number>}
 */
async function fetchSolUsdSpot() {
  const base = getCoingeckoDataApiBaseUrl();
  const raw = await fetchJson(`${base}/simple/price?ids=solana&vs_currencies=usd`, {
    headers: coingeckoDataApiHeaders(),
  });
  if (!raw || typeof raw !== 'object') return 0;
  const sol = /** @type {Record<string, unknown>} */ (raw).solana;
  if (!sol || typeof sol !== 'object') return 0;
  const usd = toNum(/** @type {Record<string, unknown>} */ (sol).usd);
  return usd != null && usd > 0 ? usd : 0;
}

/**
 * @param {{ quote?: { address?: string; symbol?: string } } | undefined} meta
 */
function quoteIsUsd(meta) {
  const addr = meta?.quote?.address;
  if (addr === USDC_MINT || addr === USDT_MINT) return true;
  const sym = meta?.quote?.symbol?.toUpperCase();
  return sym === 'USDC' || sym === 'USDT';
}

/**
 * @param {{ quote?: { address?: string; symbol?: string } } | undefined} meta
 */
function quoteIsSol(meta) {
  const addr = meta?.quote?.address;
  if (addr === WSOL_MINT) return true;
  return meta?.quote?.symbol?.toUpperCase() === 'SOL';
}

/**
 * @param {string} pool
 * @returns {Promise<{ candles: OhlcvCandle[]; interval: string } | null>}
 */
async function fetchGeckoTerminalOhlcvForPool(pool) {
  const url = `${GECKO_NETWORK}/${encodeURIComponent(pool)}/ohlcv/hour?aggregate=1&limit=168`;
  const json = await fetchJson(url);
  const list = json?.data?.attributes?.ohlcv_list;
  if (!Array.isArray(list) || list.length === 0) return null;

  const meta = json?.data?.meta;
  const solUsd = quoteIsSol(meta) ? await fetchSolUsdSpot() : 0;
  const useSol = quoteIsSol(meta) && solUsd > 0;
  const useUsd = quoteIsUsd(meta);

  /** @type {OhlcvCandle[]} */
  const candles = [];
  for (const row of list) {
    if (!Array.isArray(row) || row.length < 5) continue;
    const time = toNum(row[0]);
    const open = toNum(row[1]);
    const high = toNum(row[2]);
    const low = toNum(row[3]);
    const close = toNum(row[4]);
    if (time == null || close == null) continue;

    let usdClose = close;
    let usdOpen = open ?? close;
    let usdHigh = high ?? close;
    let usdLow = low ?? close;

    if (useUsd) {
      /* already USD */
    } else if (useSol) {
      usdClose = close * solUsd;
      usdOpen = (open ?? close) * solUsd;
      usdHigh = (high ?? close) * solUsd;
      usdLow = (low ?? close) * solUsd;
    } else {
      continue;
    }

    if (usdClose <= 0) continue;
    candles.push({
      time: Math.floor(time),
      open: usdOpen,
      high: usdHigh,
      low: usdLow,
      close: usdClose,
    });
  }

  const deduped = dedupeCandles(candles);
  if (!hasEnoughCandles(deduped)) return null;
  return { candles: deduped, interval: '1H' };
}

/**
 * @param {string} mint
 * @returns {Promise<{ candles: OhlcvCandle[]; interval: string } | null>}
 */
async function fetchGeckoTerminalOhlcv(mint) {
  const candidates = await resolveDexPairCandidates(mint);
  for (const pool of candidates) {
    const hit = await fetchGeckoTerminalOhlcvForPool(pool);
    if (hit) return hit;
  }
  return null;
}

/**
 * @param {string} mint
 * @returns {Promise<{ candles: OhlcvCandle[]; interval: string; source: string } | null>}
 */
export async function fetchMintChartFallback(mint) {
  const trimmed = String(mint || '').trim();
  if (!trimmed) return null;

  const pump = await fetchPumpfunOhlcv(trimmed);
  if (pump) return { ...pump, source: 'pumpfun' };

  const coinId = await resolveCoingeckoIdFromMint(trimmed);
  if (coinId) {
    const cg = await fetchCoingeckoOhlcv(coinId);
    if (cg) return { ...cg, source: 'coingecko' };
  }

  if (trimmed === WSOL_MINT) {
    const binance = await fetchBinanceSolOhlcv();
    if (binance) return { ...binance, source: 'binance' };
  }

  const gecko = await fetchGeckoTerminalOhlcv(trimmed);
  if (gecko) return { ...gecko, source: 'geckoterminal' };

  return null;
}

export { MIN_CANDLES as CHART_MIN_CANDLES, hasEnoughCandles, closePointsToCandles };
