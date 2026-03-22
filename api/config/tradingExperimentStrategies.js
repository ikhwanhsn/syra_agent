/**
 * Ten Binance spot OHLC + CryptoAnalysisEngine variants for trading experiment lab.
 * Each row is one "agent"; cron/run-cycle evaluates all.
 *
 * lookAheadBars: max forward candles to check for TP/SL after signal anchor.
 */
export const TRADING_EXPERIMENT_STRATEGIES = Object.freeze([
  { id: 0, name: "BTC swing 1h", token: "bitcoin", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 1, name: "BTC trend 4h", token: "bitcoin", bar: "4h", limit: 200, lookAheadBars: 24 },
  { id: 2, name: "BTC scalp 15m", token: "bitcoin", bar: "15m", limit: 200, lookAheadBars: 96 },
  { id: 3, name: "ETH swing 1h", token: "ethereum", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 4, name: "SOL swing 1h", token: "solana", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 5, name: "BTC compact 1h", token: "bitcoin", bar: "1h", limit: 100, lookAheadBars: 48 },
  { id: 6, name: "BTC deep 1h", token: "bitcoin", bar: "1h", limit: 300, lookAheadBars: 48 },
  { id: 7, name: "BTC 30m", token: "bitcoin", bar: "30m", limit: 200, lookAheadBars: 72 },
  { id: 8, name: "ETH 4h", token: "ethereum", bar: "4h", limit: 200, lookAheadBars: 24 },
  { id: 9, name: "SOL 4h", token: "solana", bar: "4h", limit: 200, lookAheadBars: 24 },
]);
