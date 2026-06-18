/**
 * x402 /bitcoin — full BTC Intelligence Hub payload (Bitcoin page).
 */
import { getBtcDashboard, computeBtcDashboard } from './btcDashboardService.js';
import {
  BTC_VALID_INTERVALS,
  computeBtcBubblemap,
  getBtcBubblemap,
} from './btcIntelligenceService.js';

const VALID_EXCHANGES = new Set(['binance', 'coinbase']);
const MIN_LIMIT = 20;
const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parseBitcoinX402Request(req) {
  const src =
    req.method === 'POST' && req.body && typeof req.body === 'object'
      ? { ...req.query, ...req.body }
      : req.query || {};

  const exchangeRaw = String(src.exchange ?? 'binance').trim().toLowerCase();
  const exchange = VALID_EXCHANGES.has(exchangeRaw) ? exchangeRaw : 'binance';

  const intervalRaw = String(src.interval ?? '1h').trim();
  const interval = BTC_VALID_INTERVALS.includes(intervalRaw) ? intervalRaw : '1h';

  let limit = DEFAULT_LIMIT;
  if (src.limit != null && String(src.limit).trim() !== '') {
    const n = Number(src.limit);
    if (!Number.isFinite(n)) throw new Error('limit must be a number');
    limit = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.floor(n)));
  }

  return { exchange, interval, limit };
}

/**
 * @param {ReturnType<typeof parseBitcoinX402Request>} params
 */
export async function fetchBitcoinX402(params) {
  const bubblemapOpts = {
    exchange: params.exchange,
    interval: params.interval,
    limit: params.limit,
  };

  let dashboard = await getBtcDashboard();
  let dashboardSource = 'snapshot';
  if (!dashboard) {
    dashboard = await computeBtcDashboard();
    dashboardSource = 'live';
  }

  let bubblemap = await getBtcBubblemap(bubblemapOpts);
  let bubblemapSource = 'snapshot';
  if (!bubblemap) {
    bubblemap = await computeBtcBubblemap(bubblemapOpts);
    bubblemapSource = 'live';
  }

  if (!dashboard && !bubblemap) {
    const err = new Error('Bitcoin intelligence unavailable');
    err.status = 503;
    throw err;
  }

  return {
    dashboard: dashboard ?? null,
    bubblemap: bubblemap ?? null,
    bubblemapParams: bubblemapOpts,
    sources: {
      dashboard: dashboard ? dashboardSource : null,
      bubblemap: bubblemap ? bubblemapSource : null,
    },
    computedAt: new Date().toISOString(),
  };
}
