/**
 * Agent UI chart data — CoinGecko USD OHLC (server-side; avoids browser CORS / optional API key).
 * GET /agent/chart/ohlc?range=1D|1W|1M|1Y
 *   Either mint=<Solana base58> OR coinId=<CoinGecko coin id, e.g. bitcoin, solana>
 */
import express from 'express';
import { getCoingeckoDataApiBaseUrl, coingeckoDataApiHeaders } from '../../utils/coingeckoAPI.js';
import { fetchPumpfunChartSeries } from '../../libs/pumpfunChartService.js';

const WSOL_MINT = 'So11111111111111111111111111111111111111112';

/** CoinGecko /ohlc accepts: 1 | 7 | 14 | 30 | 90 | 180 | 365 | max */
function rangeToDays(range) {
  const r = String(range || '').trim().toUpperCase();
  if (r === '1D') return 1;
  if (r === '1W') return 7;
  if (r === '1M') return 30;
  if (r === '1Y') return 365;
  return 7;
}

/**
 * @returns {Promise<string|null>}
 */
async function resolveCoingeckoIdFromMint(mint) {
  if (mint === WSOL_MINT) return 'solana';
  const base = getCoingeckoDataApiBaseUrl();
  const url = `${base}/coins/solana/contract/${encodeURIComponent(mint)}`;
  const res = await fetch(url, { headers: coingeckoDataApiHeaders() });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data || typeof data !== 'object' || typeof data.id !== 'string' || !data.id.trim()) {
    return null;
  }
  return data.id.trim();
}

/** CoinGecko coin id slug (signal tool, etc.) */
function normalizeCoinIdParam(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  if (!s || s.length > 80) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return null;
  return s;
}

export function createAgentChartRouter() {
  const router = express.Router();

  router.get('/pumpfun', async (req, res) => {
    const mint = typeof req.query.mint === 'string' ? req.query.mint.trim() : '';
    const rangeRaw = typeof req.query.range === 'string' ? req.query.range.trim() : '1D';
    const allowed = new Set(['1D', '1W', '1M', '1Y']);
    const range = allowed.has(rangeRaw.toUpperCase()) ? rangeRaw.toUpperCase() : '1D';

    if (!mint || mint.length < 32 || mint.length > 64) {
      return res.status(400).json({ success: false, error: 'Provide a valid Solana mint via ?mint=' });
    }

    try {
      const { points, source } = await fetchPumpfunChartSeries(mint, range);
      return res.json({
        success: true,
        points,
        source,
        listed: points.length > 0,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Pump.fun chart error';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  router.get('/ohlc', async (req, res) => {
    const mint = typeof req.query.mint === 'string' ? req.query.mint.trim() : '';
    const coinIdRaw = typeof req.query.coinId === 'string' ? req.query.coinId.trim() : '';
    const rangeRaw = typeof req.query.range === 'string' ? req.query.range.trim() : '1W';

    const allowed = new Set(['1D', '1W', '1M', '1Y']);
    const range = allowed.has(rangeRaw.toUpperCase()) ? rangeRaw.toUpperCase() : '1W';
    const days = rangeToDays(range);

    const coinIdParam = normalizeCoinIdParam(coinIdRaw);

    try {
      let coinId = null;

      if (coinIdParam) {
        coinId = coinIdParam;
      } else if (mint && mint.length >= 32 && mint.length <= 64) {
        coinId = await resolveCoingeckoIdFromMint(mint);
        if (!coinId) {
          return res.json({
            success: true,
            points: [],
            source: 'coingecko',
            listed: false,
            message: 'Token not on CoinGecko; client may fall back to DEX OHLC',
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Provide mint (Solana token) or coinId (e.g. bitcoin, solana)',
        });
      }

      const ohlcBase = getCoingeckoDataApiBaseUrl();
      const ohlcUrl = `${ohlcBase}/coins/${encodeURIComponent(coinId)}/ohlc?vs_currency=usd&days=${days}`;
      const ohlcRes = await fetch(ohlcUrl, { headers: coingeckoDataApiHeaders() });
      const body = await ohlcRes.json().catch(() => null);

      if (!ohlcRes.ok) {
        const msg =
          body && typeof body === 'object'
            ? body.error || body.status?.error_message || ohlcRes.statusText
            : ohlcRes.statusText;
        return res.json({
          success: true,
          points: [],
          source: 'coingecko',
          coinId,
          days,
          upstreamStatus: ohlcRes.status,
          message: typeof msg === 'string' ? msg : 'CoinGecko OHLC request failed',
        });
      }

      if (!Array.isArray(body)) {
        return res.json({ success: true, points: [], source: 'coingecko', coinId, days });
      }

      const points = body
        .map((row) => {
          if (!Array.isArray(row) || row.length < 5) return null;
          const ts = Number(row[0]);
          const c = Number(row[4]);
          if (!Number.isFinite(ts) || !Number.isFinite(c) || c <= 0) return null;
          return { time: Math.floor(ts / 1000), value: c };
        })
        .filter(Boolean)
        .sort((a, b) => a.time - b.time);

      return res.json({
        success: true,
        points,
        source: 'coingecko',
        coinId,
        days,
        listed: true,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Chart OHLC error';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  return router;
}
