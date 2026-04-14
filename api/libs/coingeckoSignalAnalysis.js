/**
 * CoinGecko public OHLC (/coins/{id}/ohlc) + CryptoAnalysisEngine for /signal?source=coingecko
 * Used by AI agent chat/tools by default (reliable vs some CEX geo blocks).
 */
import { CryptoAnalysisEngine } from '../scripts/cryptoAnalysisEngine.js';
import { resolveTickerFromCoingecko, getCoinById } from '../utils/coingeckoAPI.js';
import { barDurationMsGeneric, lastClosedAnchorFromEngineRows } from './experimentCandleAnchor.js';

const COINGECKO_API = (process.env.COINGECKO_API_BASE_URL || 'https://api.coingecko.com/api/v3').replace(/\/$/, '');

function coingeckoHeaders() {
  const key = String(process.env.COINGECKO_API_KEY || process.env.COINGECKO_DEMO_API_KEY || '').trim();
  const h = { Accept: 'application/json' };
  if (key) h['x-cg-demo-api-key'] = key;
  return h;
}

/**
 * CoinGecko OHLC only accepts days in 1 | 7 | 14 | 30 | 90 | 180 | 365 | max
 * @param {string|undefined} bar
 * @returns {1|7|14|30|90|180|365|'max'}
 */
function barToOhlcDays(bar) {
  const b = String(bar || '').trim().toLowerCase();
  if (b === '1m' || b === '3m' || b === '5m' || b === '15m' || b === '30m' || b === '1h') return 1;
  if (b === '2h' || b === '4h') return 14;
  if (b === '1d') return 90;
  if (b === '1w' || b === '1mo' || b === '1M') return 180;
  return 90;
}

/**
 * @param {string|undefined} token
 * @param {string|undefined} instId - optional CoinGecko coin id (e.g. solana, bitcoin)
 * @returns {Promise<string>}
 */
export async function resolveCoingeckoCoinId(token, instId) {
  const ex = instId != null ? String(instId).trim().toLowerCase() : '';
  if (ex && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(ex) && ex.length <= 80) {
    const row = await getCoinById(ex);
    if (row) return row.id;
  }
  const t = String(token || 'bitcoin').trim();
  const resolved = await resolveTickerFromCoingecko(t);
  if (resolved?.id) return resolved.id;
  const asId = await getCoinById(t.toLowerCase());
  if (asId) return asId.id;
  throw new Error(`CoinGecko: could not resolve coin id for "${t}"`);
}

/**
 * @param {{ token?: string; instId?: string; bar?: string; limit?: number; signal?: AbortSignal }} params
 * @returns {Promise<{ source: 'coingecko'; meta: { coingecko_id: string; days: number }; report: Record<string, unknown>; anchorCloseMs: number | null }>}
 */
export async function buildCoingeckoSignalReport(params) {
  const coinId = await resolveCoingeckoCoinId(params.token, params.instId);
  const days = barToOhlcDays(params.bar);
  const url = `${COINGECKO_API}/coins/${encodeURIComponent(coinId)}/ohlc?vs_currency=usd&days=${days}`;

  const res = await fetch(url, {
    headers: coingeckoHeaders(),
    ...(params.signal ? { signal: params.signal } : {}),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (body && typeof body === 'object' && (body.error || body.status?.error_message)) ||
      res.statusText ||
      'request failed';
    throw new Error(`CoinGecko OHLC [${res.status}]: ${msg}`);
  }
  if (!Array.isArray(body) || body.length === 0) {
    throw new Error('CoinGecko OHLC: empty or invalid response');
  }

  const raw = body
    .map((row) => {
      if (!Array.isArray(row) || row.length < 5) return null;
      const ts = Number(row[0]);
      const o = Number(row[1]);
      const h = Number(row[2]);
      const l = Number(row[3]);
      const c = Number(row[4]);
      if ([ts, o, h, l, c].some((v) => Number.isNaN(v))) return null;
      return [ts, o, h, l, c];
    })
    .filter(Boolean);

  if (raw.length < 10) {
    throw new Error('CoinGecko OHLC: not enough candles for analysis');
  }

  const instrument = coinId;
  const engine = new CryptoAnalysisEngine({ data: raw }, instrument, 'COINGECKO_SPOT');
  const report = engine.analyze();
  const anchorCloseMs = lastClosedAnchorFromEngineRows(raw, barDurationMsGeneric(params.bar));

  return {
    source: 'coingecko',
    meta: { coingecko_id: coinId, days },
    report,
    anchorCloseMs,
  };
}
