import express from "express";
import fs from "fs";
import { getX402Handler, requirePayment } from "../../../utils/x402Payment.js";
import { saveToLeaderboard } from "../../../../scripts/saveToLeaderboard.js";

// ---------- HELPERS ----------

// Convert string OHLC to numbers
function normalizeOHLC(data) {
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
  const timestamps = seriesMap[Object.keys(seriesMap)[0]].map((p) => p.time);
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

function computeCorrelationFromOHLC(ohlcPayload) {
  const seriesMap = {};

  for (const item of ohlcPayload.results) {
    if (!item.success) continue;

    const prices = normalizeOHLC(item.data);
    const returns = calculateReturns(prices);
    seriesMap[item.symbol] = returns;
  }

  const alignedReturns = alignSeries(seriesMap);
  const matrix = buildCorrelationMatrix(alignedReturns);

  return matrix;
}

export async function createBinanceCorrelationRouter() {
  const router = express.Router();
  const PRICE_USD = 0.15;
  const BASE_URL = process.env.BASE_URL;
  const ticker =
    "BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,XRPUSDT,ADAUSDT,AVAXUSDT,DOGEUSDT,DOTUSDT,LINKUSDT,MATICUSDT,OPUSDT,ARBUSDT,NEARUSDT,ATOMUSDT,FTMUSDT,INJUSDT,SUIUSDT,SEIUSDT,APTUSDT,RNDRUSDT,FETUSDT,UNIUSDT,AAVEUSDT,LDOUSDT,PENDLEUSDT,MKRUSDT,SNXUSDT,LTCUSDT,BCHUSDT,ETCUSDT,TRXUSDT,XLMUSDT,SHIBUSDT,PEPEUSDT,TIAUSDT,ORDIUSDT,STXUSDT,FILUSDT,ICPUSDT,HBARUSDT,VETUSDT,GRTUSDT,THETAUSDT,EGLDUSDT,ALGOUSDT,FLOWUSDT,SANDUSDT,MANAUSDT,AXSUSDT";
  router.get(
    "/correlation-matrix",
    requirePayment({
      price: PRICE_USD,
      description: "Correlation matrix for all tokens",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/correlation-matrix",
    }),
    async (req, res) => {
      const ohlc = await fetch(
        `${BASE_URL}/binance/ohlc/batch?symbols=${ticker}&interval=1m`,
      );
      const ohlcJson = await ohlc.json();
      const data = await computeCorrelationFromOHLC(ohlcJson);

      if (!data) {
        return res.status(404).json({ error: "Correlation matrix not found" });
      }

      // Settle payment ONLY on success
      const paymentResult = await getX402Handler().settlePayment(
        req.x402Payment.paymentHeader,
        req.x402Payment.paymentRequirements,
      );

      // Save to leaderboard
      await saveToLeaderboard({
        wallet: paymentResult.payer,
        volume: PRICE_USD,
      });

      res.json({
        interval: ohlcJson.interval,
        count: ohlcJson.count,
        tokens: Object.keys(data),
        data,
      });
    },
  );

  router.post(
    "/correlation-matrix",
    requirePayment({
      price: PRICE_USD,
      description: "Correlation matrix for all tokens",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/correlation-matrix",
    }),
    async (req, res) => {
      const ohlc = await fetch(
        `${BASE_URL}/binance/ohlc/batch?symbols=${ticker}&interval=1m`,
      );
      const ohlcJson = await ohlc.json();
      const data = await computeCorrelationFromOHLC(ohlcJson);
      if (!data) {
        return res.status(404).json({ error: "Correlation matrix not found" });
      }
      // Settle payment ONLY on success
      const paymentResult = await getX402Handler().settlePayment(
        req.x402Payment.paymentHeader,
        req.x402Payment.paymentRequirements,
      );

      // Save to leaderboard
      await saveToLeaderboard({
        wallet: paymentResult.payer,
        volume: PRICE_USD,
      });
      res.json({
        interval: ohlcJson.interval,
        count: ohlcJson.count,
        tokens: Object.keys(data),
        data,
      });
    },
  );

  router.get(
    "/correlation",
    requirePayment({
      price: PRICE_USD,
      description: "Correlation matrix for a symbol",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/correlation",
      inputSchema: {
        queryParams: {
          symbol: {
            type: "string",
            required: false,
            description: "Symbol name for the correlation",
          },
        },
      },
    }),
    async (req, res) => {
      const symbol = req.query.symbol || "BTCUSDT";
      const limit = parseInt(req.query.limit || "10");
      const ohlc = await fetch(
        `${BASE_URL}/binance/ohlc/batch?symbols=${ticker}&interval=1m`,
      );
      const ohlcJson = await ohlc.json();

      const matrix = computeCorrelationFromOHLC(ohlcJson);

      if (!matrix[symbol]) {
        return res.status(404).json({ error: "Symbol not found" });
      }

      const ranked = Object.entries(matrix[symbol])
        .filter(([s]) => s !== symbol)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, limit);

      if (ranked.length === 0) {
        return res.status(404).json({ error: "No correlation found" });
      }

      // Settle payment ONLY on success
      const paymentResult = await getX402Handler().settlePayment(
        req.x402Payment.paymentHeader,
        req.x402Payment.paymentRequirements,
      );

      // Save to leaderboard
      await saveToLeaderboard({
        wallet: paymentResult.payer,
        volume: PRICE_USD,
      });

      res.json({
        symbol,
        top: ranked.map(([s, v]) => ({ symbol: s, correlation: v })),
      });
    },
  );

  router.post(
    "/correlation",
    requirePayment({
      price: PRICE_USD,
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
      const symbol = req.body.symbol || "BTCUSDT";
      const limit = parseInt(req.query.limit || "10");
      const ohlc = await fetch(
        `${BASE_URL}/binance/ohlc/batch?symbols=${ticker}&interval=1m`,
      );
      const ohlcJson = await ohlc.json();

      const matrix = computeCorrelationFromOHLC(ohlcJson);

      if (!matrix[symbol]) {
        return res.status(404).json({ error: "Symbol not found" });
      }

      const ranked = Object.entries(matrix[symbol])
        .filter(([s]) => s !== symbol)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, limit);

      if (ranked.length === 0) {
        return res.status(404).json({ error: "No correlation found" });
      }

      // Settle payment ONLY on success
      const paymentResult = await getX402Handler().settlePayment(
        req.x402Payment.paymentHeader,
        req.x402Payment.paymentRequirements,
      );

      // Save to leaderboard
      await saveToLeaderboard({
        wallet: paymentResult.payer,
        volume: PRICE_USD,
      });

      res.json({
        symbol,
        top: ranked.map(([s, v]) => ({ symbol: s, correlation: v })),
      });
    },
  );
  return router;
}
