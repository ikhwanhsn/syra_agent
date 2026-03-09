/**
 * Proxy for Binance GET /api/v3/ticker/price.
 * Used by the landing page (DashboardPreview) so the browser does not call api.binance.com
 * directly, avoiding ERR_CERT_AUTHORITY_INVALID and ERR_CONNECTION_TIMED_OUT in some
 * production environments (corporate proxies, strict SSL).
 * GET /v1/regular/binance-ticker → same response as https://api.binance.com/api/v3/ticker/price
 *
 * Server-side cache (15s TTL) reduces request weight to Binance and avoids IP bans (-1003).
 * Binance recommends WebSocket Streams for live updates; this proxy is for lightweight preview use.
 */
import express from "express";

const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/price";
const CACHE_TTL_MS = 15 * 1000; // 15 seconds

let cache = { data: null, expiresAt: 0 };

export async function createBinanceTickerPriceRouter() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const now = Date.now();
    if (cache.data != null && now < cache.expiresAt) {
      res.setHeader("Cache-Control", "public, max-age=10");
      return res.json(cache.data);
    }

    try {
      const response = await fetch(BINANCE_TICKER_URL);
      const data = await response.json();

      // Binance rate-limit / IP ban (e.g. -1003)
      if (data && typeof data.code === "number" && data.code !== 200) {
        if (cache.data != null) {
          res.setHeader("Cache-Control", "public, max-age=5");
          return res.json(cache.data);
        }
        res.status(429).json({
          error: "Binance rate limit or temporary ban",
          code: data.code,
          msg: data.msg || "Use WebSocket Streams for live updates to avoid bans.",
        });
        return;
      }

      if (!response.ok) {
        res.status(response.status).json(data);
        return;
      }

      cache = { data, expiresAt: now + CACHE_TTL_MS };
      res.setHeader("Cache-Control", "public, max-age=10");
      res.json(data);
    } catch (err) {
      if (cache.data != null) {
        res.setHeader("Cache-Control", "public, max-age=5");
        return res.json(cache.data);
      }
      res.status(502).json({
        error: "Binance ticker proxy failed",
        message: err.message || String(err),
      });
    }
  });

  return router;
}
