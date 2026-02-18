/**
 * Proxy for Binance GET /api/v3/ticker/price.
 * Used by the landing page (DashboardPreview) so the browser does not call api.binance.com
 * directly, avoiding ERR_CERT_AUTHORITY_INVALID and ERR_CONNECTION_TIMED_OUT in some
 * production environments (corporate proxies, strict SSL).
 * GET /v1/regular/binance-ticker → same response as https://api.binance.com/api/v3/ticker/price
 */
import express from "express";

const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/price";

export async function createBinanceTickerPriceRouter() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const response = await fetch(BINANCE_TICKER_URL);
      const data = await response.json();
      if (!response.ok) {
        res.status(response.status).json(data);
        return;
      }
      res.setHeader("Cache-Control", "public, max-age=5");
      res.json(data);
    } catch (err) {
      res.status(502).json({
        error: "Binance ticker proxy failed",
        message: err.message || String(err),
      });
    }
  });

  return router;
}
