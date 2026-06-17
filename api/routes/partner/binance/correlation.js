import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_USD } from "../../../config/x402Pricing.js";
import { fetchBinanceOhlcBatch } from "../../../libs/binanceOhlcBatch.js";
import {
  BINANCE_CORRELATION_TICKER,
  computeCorrelationFromOHLC,
} from "../../../libs/btcCorrelationMatrix.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

// Re-export for analytics fetchers
export { BINANCE_CORRELATION_TICKER, computeCorrelationFromOHLC };

export async function createBinanceCorrelationRouter() {
  const router = express.Router();
  const ticker = BINANCE_CORRELATION_TICKER;

  // Shared handler for GET / and GET /correlation (symbol + limit from query)
  const handleCorrelationGet = async (req, res) => {
    try {
      const symbol = (req.query.symbol || "BTCUSDT").toUpperCase();
      const limit = parseInt(req.query.limit || "10", 10) || 10;
      const ohlcPayload = await fetchBinanceOhlcBatch(ticker, "1m");
      const matrix = computeCorrelationFromOHLC(ohlcPayload);
      if (!matrix || typeof matrix !== "object") {
        const results = ohlcPayload?.results || [];
        const succeeded = results.filter((r) => r?.success && r?.data?.length >= 2).length;
        const failed = results.filter((r) => !r?.success);
        const firstError = failed[0]?.error || (results.length === 0 ? "No OHLC results returned" : "All symbols failed or insufficient data");
        return res.status(502).json({
          success: false,
          error: `No correlation data: ${succeeded}/${results.length} symbols had OHLC. ${firstError}`,
        });
      }
      if (!matrix[symbol]) {
        return res.status(404).json({ success: false, error: "Symbol not found" });
      }
      const ranked = Object.entries(matrix[symbol])
        .filter(([s]) => s !== symbol)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, limit);
      if (ranked.length === 0) {
        return res.status(404).json({ success: false, error: "No correlation found" });
      }
      await settlePaymentAndSetResponse(res, req);
      res.json({
        symbol,
        top: ranked.map(([s, v]) => ({ symbol: s, correlation: v })),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || "Failed to compute correlation" });
    }
  };

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      try {
        const symbol = (req.query.symbol || "BTCUSDT").toUpperCase();
        const limit = parseInt(req.query.limit || "10", 10) || 10;
        const ohlcPayload = await fetchBinanceOhlcBatch(ticker, "1m");
        const matrix = computeCorrelationFromOHLC(ohlcPayload);
        if (!matrix || typeof matrix !== "object") {
          const results = ohlcPayload?.results || [];
          const succeeded = results.filter((r) => r?.success && r?.data?.length >= 2).length;
          const firstError = (results.find((r) => !r?.success))?.error || "No OHLC results returned";
          return res.status(502).json({
            success: false,
            error: `No correlation data: ${succeeded}/${results.length} symbols had OHLC. ${firstError}`,
          });
        }
        if (!matrix[symbol]) return res.status(404).json({ success: false, error: "Symbol not found" });
        const ranked = Object.entries(matrix[symbol])
          .filter(([s]) => s !== symbol)
          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
          .slice(0, limit);
        if (ranked.length === 0) return res.status(404).json({ success: false, error: "No correlation found" });
        res.json({
          symbol,
          top: ranked.map(([s, v]) => ({ symbol: s, correlation: v })),
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Failed to compute correlation" });
      }
    });
    router.get("/correlation-matrix/dev", async (_req, res) => {
      try {
        const ohlcPayload = await fetchBinanceOhlcBatch(ticker, "1m");
        const data = computeCorrelationFromOHLC(ohlcPayload);
        if (!data || Object.keys(data).length === 0) {
          const results = ohlcPayload?.results || [];
          const succeeded = results.filter((r) => r?.success && r?.data?.length >= 2).length;
          const firstError = (results.find((r) => !r?.success))?.error || "No OHLC results returned";
          return res.status(502).json({
            success: false,
            error: `Correlation matrix unavailable: ${succeeded}/${results.length} symbols had OHLC. ${firstError}`,
          });
        }
        res.json({
          interval: ohlcPayload.interval,
          count: ohlcPayload.count,
          tokens: Object.keys(data),
          data,
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Failed to compute correlation matrix" });
      }
    });
  }

  // GET /binance and GET /binance?symbol=X (same as /correlation)
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Correlation for a symbol (default BTCUSDT)",
      method: "GET",
      discoverable: true,
      resource: "/binance/correlation",
      inputSchema: {
        queryParams: {
          symbol: { type: "string", required: false, description: "Symbol for correlation" },
          limit: { type: "string", required: false, description: "Max results (default 10)" },
        },
      },
    }),
    handleCorrelationGet,
  );

  router.get(
    "/correlation-matrix",
    requirePayment({
      description: "Correlation matrix for all tokens",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/correlation-matrix",
    }),
    async (req, res) => {
      try {
        const ohlcPayload = await fetchBinanceOhlcBatch(ticker, "1m");
        const data = computeCorrelationFromOHLC(ohlcPayload);

        if (!data || Object.keys(data).length === 0) {
          const results = ohlcPayload?.results || [];
          const succeeded = results.filter((r) => r?.success && r?.data?.length >= 2).length;
          const failed = results.filter((r) => !r?.success);
          const firstError = failed[0]?.error || (results.length === 0 ? "No OHLC results returned" : "All symbols failed or insufficient data");
          return res.status(502).json({
            success: false,
            error: `Correlation matrix unavailable: ${succeeded}/${results.length} symbols had OHLC. ${firstError}`,
          });
        }

        await settlePaymentAndSetResponse(res, req);
        res.json({
          interval: ohlcPayload.interval,
          count: ohlcPayload.count,
          tokens: Object.keys(data),
          data,
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Failed to compute correlation matrix" });
      }
    },
  );

  router.post(
    "/correlation-matrix",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Correlation matrix for all tokens",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/correlation-matrix",
    }),
    async (req, res) => {
      try {
        const ohlcPayload = await fetchBinanceOhlcBatch(ticker, "1m");
        const data = computeCorrelationFromOHLC(ohlcPayload);
        if (!data || Object.keys(data).length === 0) {
          const results = ohlcPayload?.results || [];
          const succeeded = results.filter((r) => r?.success && r?.data?.length >= 2).length;
          const failed = results.filter((r) => !r?.success);
          const firstError = failed[0]?.error || (results.length === 0 ? "No OHLC results returned" : "All symbols failed or insufficient data");
          return res.status(502).json({
            success: false,
            error: `Correlation matrix unavailable: ${succeeded}/${results.length} symbols had OHLC. ${firstError}`,
          });
        }
        await settlePaymentAndSetResponse(res, req);
        res.json({
          interval: ohlcPayload.interval,
          count: ohlcPayload.count,
          tokens: Object.keys(data),
          data,
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Failed to compute correlation matrix" });
      }
    },
  );

  router.get(
    "/correlation",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Correlation matrix for a symbol",
      method: "GET",
      discoverable: true,
      resource: "/binance/correlation",
      inputSchema: {
        queryParams: {
          symbol: { type: "string", required: false, description: "Symbol name for the correlation" },
          limit: { type: "string", required: false, description: "Max results (default 10)" },
        },
      },
    }),
    handleCorrelationGet,
  );

  router.post(
    "/correlation",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Correlation matrix for a symbol",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/correlation",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          symbol: {
            type: "string",
            required: false,
            description: "Symbol name for the correlation",
          },
        },
      },
    }),
    async (req, res) => {
      try {
        const symbol = (req.body?.symbol || "BTCUSDT").toUpperCase();
        const limit = parseInt(req.query.limit || "10", 10) || 10;
        const ohlcPayload = await fetchBinanceOhlcBatch(ticker, "1m");
        const matrix = computeCorrelationFromOHLC(ohlcPayload);
        if (!matrix || typeof matrix !== "object") {
          const results = ohlcPayload?.results || [];
          const succeeded = results.filter((r) => r?.success && r?.data?.length >= 2).length;
          const failed = results.filter((r) => !r?.success);
          const firstError = failed[0]?.error || (results.length === 0 ? "No OHLC results returned" : "All symbols failed or insufficient data");
          return res.status(502).json({
            success: false,
            error: `No correlation data: ${succeeded}/${results.length} symbols had OHLC. ${firstError}`,
          });
        }
        if (!matrix[symbol]) {
          return res.status(404).json({ success: false, error: "Symbol not found" });
        }
        const ranked = Object.entries(matrix[symbol])
          .filter(([s]) => s !== symbol)
          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
          .slice(0, limit);
        if (ranked.length === 0) {
          return res.status(404).json({ success: false, error: "No correlation found" });
        }
        await settlePaymentAndSetResponse(res, req);
        res.json({
          symbol,
          top: ranked.map(([s, v]) => ({ symbol: s, correlation: v })),
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message || "Failed to compute correlation" });
      }
    },
  );
  return router;
}
