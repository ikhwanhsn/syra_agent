/**
 * pump.fun price candles via swap-api (works for bonding-curve + graduated tokens).
 * @see https://swap-api.pump.fun/v1/coins/{mint}/candles
 */
const SWAP_API_BASE = (process.env.PUMP_FUN_SWAP_API_URL || 'https://swap-api.pump.fun').replace(
  /\/$/,
  '',
);

/** @param {string} range */
function rangeToPumpParams(range) {
  const r = String(range || '1D').trim().toUpperCase();
  switch (r) {
    case '1W':
      return { interval: '15m', limit: 672 };
    case '1M':
      return { interval: '1h', limit: 720 };
    case '1Y':
      return { interval: '1d', limit: 365 };
    case '1D':
    default:
      return { interval: '5m', limit: 288 };
  }
}

/**
 * @param {string} mint
 * @param {string} [range]
 * @returns {Promise<{ points: Array<{ time: number; value: number }>; source: string }>}
 */
export async function fetchPumpfunChartSeries(mint, range = '1D') {
  const trimmed = String(mint || '').trim();
  if (!trimmed) {
    return { points: [], source: 'pumpfun' };
  }

  const { interval, limit } = rangeToPumpParams(range);
  const url = `${SWAP_API_BASE}/v1/coins/${encodeURIComponent(trimmed)}/candles?interval=${encodeURIComponent(interval)}&limit=${limit}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', Origin: 'https://pump.fun' },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return { points: [], source: 'pumpfun' };
    }

    const raw = await res.json().catch(() => null);
    if (!Array.isArray(raw) || raw.length === 0) {
      return { points: [], source: 'pumpfun' };
    }

    /** @type {Array<{ time: number; value: number }>} */
    const points = [];
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue;
      const o = /** @type {Record<string, unknown>} */ (row);
      const ts = Number(o.timestamp);
      const close = Number(o.close);
      if (!Number.isFinite(ts) || !Number.isFinite(close) || close <= 0) continue;
      points.push({
        time: Math.floor(ts / 1000),
        value: close,
      });
    }

    points.sort((a, b) => a.time - b.time);

    /** @type {Array<{ time: number; value: number }>} */
    const deduped = [];
    for (const p of points) {
      const prev = deduped[deduped.length - 1];
      if (prev && prev.time === p.time) prev.value = p.value;
      else deduped.push({ ...p });
    }

    return { points: deduped, source: 'pumpfun' };
  } catch {
    return { points: [], source: 'pumpfun' };
  } finally {
    clearTimeout(timer);
  }
}
