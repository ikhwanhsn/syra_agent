// import express from "express";

// export async function getOhlc(req) {
//   const { symbol = "BTCUSDT", interval = "1m" } = req.query;
//   const response = await fetch(
//     `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}`,
//   );
//   const data = await response.json();
//   return data;
// }

// export async function createBinanceOHLCRouter() {
//   const router = express.Router();
//   router.get("/", async (req, res) => {
//     const data = await getOhlc(req);
//     res.json(data);
//   });
//   return router;
// }

import express from "express";
import pLimit from "p-limit";

const app = express();
const PORT = 3000;

// Limit active requests to 5 at a time to keep Destriani's infra safe & avoid Binance bans
const limit = pLimit(5);

/**
 * Utility: Fetch all active USDT symbols from Binance
 */
async function getActiveSymbols() {
  const resp = await fetch("https://api.binance.com/api/v3/exchangeInfo");
  const data = await resp.json();
  return data.symbols
    .filter((s) => s.status === "TRADING" && s.quoteAsset === "USDT")
    .map((s) => s.symbol);
}

/**
 * Worker: Fetch OHLC for one symbol with error handling
 */
async function fetchOhlc(symbol, interval) {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`;
    const response = await fetch(url);

    // Check Binance Weight (Limit is 1200/min)
    const weight = response.headers.get("x-mbx-used-weight-1m");
    if (weight > 1000) console.warn(`🚨 Rate limit weight high: ${weight}`);

    if (!response.ok) throw new Error(`Binance Error: ${response.statusText}`);

    const rawData = await response.json();

    // Format into readable OHLC objects
    const formatted = rawData.map((d) => ({
      time: d[0],
      open: d[1],
      high: d[2],
      low: d[3],
      close: d[4],
      volume: d[5],
    }));

    return { symbol, success: true, data: formatted };
  } catch (err) {
    return { symbol, success: false, error: err.message };
  }
}

/**
 * Router Implementation
 */
export async function createBinanceOHLCRouter() {
  const router = express.Router();

  // Endpoint: /ohlc/batch?symbols=BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,XRPUSDT,ADAUSDT,AVAXUSDT,DOGEUSDT,DOTUSDT,LINKUSDT or /ohlc/batch?symbols=ALL
  router.get("/batch", async (req, res) => {
    let { symbols, interval = "1m" } = req.query;

    if (!symbols) return res.status(400).json({ error: "No symbols provided" });

    try {
      let tickerList =
        symbols.toUpperCase() === "ALL"
          ? await getActiveSymbols()
          : symbols.split(",");

      // Safety: Cap "ALL" to the top 50 to prevent timeout on a single request
      if (symbols.toUpperCase() === "ALL") {
        tickerList = tickerList.slice(0, 50);
      }

      // Parallel execution with Concurrency Limit
      const tasks = tickerList.map((s) => limit(() => fetchOhlc(s, interval)));
      const results = await Promise.all(tasks);

      res.json({
        count: results.length,
        interval,
        timestamp: Date.now(),
        results,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
