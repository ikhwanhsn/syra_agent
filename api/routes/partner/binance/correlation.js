import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_USD } from "../../../config/x402Pricing.js";
import { fetchBinanceOhlcBatch } from "../../../libs/binanceOhlcBatch.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

// ---------- HELPERS ----------

// Convert string OHLC to numbers
function normalizeOHLC(data) {
  if (!Array.isArray(data)) return [];
  return data.map((c) => ({
    time: c.time,
    close: parseFloat(c.close),
  }));
}

// Compute log returns
function calculateReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const r = Math.log(prices[i].close / prices[i - 1].close);
    returns.push({ time: prices[i].time, value: r });
  }
  return returns;
}

// Align multiple return series by timestamp
function alignSeries(seriesMap) {
  const keys = Object.keys(seriesMap);
  if (keys.length === 0) return {};
  const firstSeries = seriesMap[keys[0]];
  if (!Array.isArray(firstSeries)) return {};
  const timestamps = firstSeries.map((p) => p.time);
  const aligned = {};

  for (const [symbol, series] of Object.entries(seriesMap)) {
    const map = new Map(series.map((p) => [p.time, p.value]));
    aligned[symbol] = timestamps
      .map((t) => map.get(t))
      .filter((v) => v !== undefined);
  }

  return aligned;
}

// Pearson correlation
function pearsonCorrelation(x, y) {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  return num / Math.sqrt(denX * denY);
}

// Build correlation matrix
function buildCorrelationMatrix(returnsMap) {
  const tokens = Object.keys(returnsMap);
  const matrix = {};

  for (let i = 0; i < tokens.length; i++) {
    const t1 = tokens[i];
    matrix[t1] = {};

    for (let j = i; j < tokens.length; j++) {
      const t2 = tokens[j];
      const corr =
        t1 === t2 ? 1 : pearsonCorrelation(returnsMap[t1], returnsMap[t2]);

      matrix[t1][t2] = +corr.toFixed(4);
      if (!matrix[t2]) matrix[t2] = {};
      matrix[t2][t1] = +corr.toFixed(4);
    }
  }

  return matrix;
}

// ---------- CORE PIPELINE ----------

/** Default ticker list for correlation (exported for summary/fetchers). */
export const BINANCE_CORRELATION_TICKER =
  "BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,XRPUSDT,ADAUSDT,AVAXUSDT,DOGEUSDT,DOTUSDT,LINKUSDT,MATICUSDT,OPUSDT,ARBUSDT,NEARUSDT,ATOMUSDT,FTMUSDT,INJUSDT,SUIUSDT,SEIUSDT,APTUSDT,RNDRUSDT,FETUSDT,UNIUSDT,AAVEUSDT,LDOUSDT,PENDLEUSDT,MKRUSDT,SNXUSDT,LTCUSDT,BCHUSDT,ETCUSDT,TRXUSDT,XLMUSDT,SHIBUSDT,PEPEUSDT,TIAUSDT,ORDIUSDT,STXUSDT,FILUSDT,ICPUSDT,HBARUSDT,VETUSDT,GRTUSDT,THETAUSDT,EGLDUSDT,ALGOUSDT,FLOWUSDT,SANDUSDT,MANAUSDT,AXSUSDT";

export function computeCorrelationFromOHLC(ohlcPayload) {
  const results = ohlcPayload?.results;
  if (!Array.isArray(results)) return null;

  const seriesMap = {};
  for (const item of results) {
    if (!item || !item.success || !item.data) continue;
    const prices = normalizeOHLC(item.data);
    if (prices.length < 2) continue; // need at least 2 points for returns
    const returns = calculateReturns(prices);
    seriesMap[item.symbol] = returns;
  }

  const alignedReturns = alignSeries(seriesMap);
  const tokens = Object.keys(alignedReturns);
  if (tokens.length === 0) return null;

  return buildCorrelationMatrix(alignedReturns);
}

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

  // GET /v2/binance and GET /v2/binance?symbol=X (same as /correlation)
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Correlation for a symbol (default BTCUSDT)",
      method: "GET",
      discoverable: true,
      resource: "/v2/binance/correlation",
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
      resource: "/v2/binance/correlation",
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
