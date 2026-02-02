/**
 * CoinGecko coin list routes.
 * Uses https://api.coingecko.com/api/v3/coins/list for ticker/token name resolution.
 */
import express from 'express';
import { getCoinList, getCoinBySymbol, getCoinById, searchCoins } from '../utils/coingeckoAPI.js';

export async function createCoingeckoRouter() {
  const router = express.Router();

  /**
   * GET /coingecko/coins/list
   * Returns the full CoinGecko coin list (id, symbol, name). Cached 24h.
   */
  router.get('/coins/list', async (req, res) => {
    try {
      const list = await getCoinList();
      return res.status(200).json({ success: true, data: list, count: list.length });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message || 'Failed to fetch CoinGecko list' });
    }
  });

  /**
   * GET /coingecko/coins/search?q=bitcoin
   * Search coins by id, symbol, or name.
   */
  router.get('/coins/search', async (req, res) => {
    const q = req.query.q;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({ success: false, error: 'Query "q" is required' });
    }
    try {
      const results = await searchCoins(q.trim(), limit);
      return res.status(200).json({ success: true, data: results, count: results.length });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message || 'Search failed' });
    }
  });

  /**
   * GET /coingecko/coins/symbol/:symbol
   * Resolve ticker symbol to CoinGecko coin (e.g. BTC -> bitcoin).
   */
  router.get('/coins/symbol/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Symbol is required' });
    }
    try {
      const coin = await getCoinBySymbol(symbol);
      if (!coin) {
        return res.status(404).json({ success: false, error: `No CoinGecko coin for symbol: ${symbol}` });
      }
      return res.status(200).json({ success: true, data: coin });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message || 'Lookup failed' });
    }
  });

  /**
   * GET /coingecko/coins/id/:id
   * Get coin by CoinGecko id (e.g. bitcoin, ethereum).
   */
  router.get('/coins/id/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Id is required' });
    }
    try {
      const coin = await getCoinById(id);
      if (!coin) {
        return res.status(404).json({ success: false, error: `No CoinGecko coin for id: ${id}` });
      }
      return res.status(200).json({ success: true, data: coin });
    } catch (err) {
      return res.status(502).json({ success: false, error: err.message || 'Lookup failed' });
    }
  });

  return router;
}
