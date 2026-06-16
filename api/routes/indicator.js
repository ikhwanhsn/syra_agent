/**
 * x402 paid route — agent-readable technical indicators from OHLCV candles.
 * Supports combining multiple indicators in one call (GET dotted params or POST JSON).
 */
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_INDICATOR_USD } from "../config/x402Pricing.js";
import { buildIndicatorResponse, parseIndicatorRequest } from "../libs/indicators/indicatorEngine.js";
import { getIndicatorCatalog } from "../libs/indicators/registry.js";
import { SIGNAL_CEX_SOURCES } from "../libs/indicators/candleSource.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const outputSchema = {
  symbol: { type: "string" },
  source: { type: "string" },
  interval: { type: "string" },
  limit: { type: "integer" },
  candleCount: { type: "integer" },
  lastClose: { type: "number", nullable: true },
  asOf: { type: "string" },
  indicators: { type: "object" },
  disclaimer: { type: "string" },
};

const inputSchema = {
  symbol: { type: "string", description: "Trading pair e.g. BTCUSDT, BTC-USDT, bitcoin" },
  source: { type: "string", description: `CEX data source (default binance). Supported: ${SIGNAL_CEX_SOURCES.join(", ")}` },
  interval: { type: "string", description: "Candle interval e.g. 1m, 1h, 4h, 1d (default 1h)" },
  limit: { type: "integer", description: "Number of candles (default 200, max 1000)" },
  series: { type: "boolean", description: "Include full per-bar series arrays (default false)" },
  indicators: {
    type: "string",
    description: "Comma-separated indicator ids e.g. rsi,macd. Per-indicator params via dotted keys: rsi.period=21",
  },
};

/**
 * @param {'GET' | 'POST'} method
 */
function paidHandler(method) {
  return [
    (req, res, next) =>
      requirePayment({
        price: X402_API_PRICE_INDICATOR_USD,
        description:
          "Technical indicators from OHLCV candles — combine multiple indicators (RSI, MACD, EMA, Bollinger, etc.) in one agent-readable call",
        method,
        discoverable: true,
        resource: "/indicator",
        inputSchema,
        outputSchema,
      })(req, res, next),
    async (req, res) => {
      try {
        const parsed = parseIndicatorRequest({
          method: req.method,
          query: req.query,
          body: req.body,
        });
        const data = await buildIndicatorResponse(parsed, { signal: req.signal });
        await settlePaymentAndSetResponse(res, req);
        res.json({ success: true, data });
      } catch (error) {
        const msg = error?.message || "Server error";
        const status = /unknown indicator|invalid/i.test(msg) ? 400 : 500;
        res.status(status).json({ success: false, error: msg });
      }
    },
  ];
}

export async function createIndicatorRouter() {
  const router = express.Router();

  router.get("/catalog", (_req, res) => {
    res.json({
      success: true,
      data: {
        indicators: getIndicatorCatalog(),
        supportedSources: [...SIGNAL_CEX_SOURCES],
        combineExamples: {
          get: "/indicator?symbol=BTCUSDT&interval=1h&indicators=rsi,macd&rsi.period=21&macd.fastPeriod=12",
          post: {
            symbol: "BTCUSDT",
            interval: "1h",
            indicators: [{ id: "rsi", period: 21 }, { id: "macd" }],
          },
        },
      },
    });
  });

  router.get("/", ...paidHandler("GET"));
  router.post("/", express.json(), ...paidHandler("POST"));

  return router;
}
