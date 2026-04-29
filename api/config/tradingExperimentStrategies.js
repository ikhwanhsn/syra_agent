/**
 * Binance spot OHLC + CryptoAnalysisEngine variants for trading experiment lab.
 * Each row is one "agent"; cron/run-cycle evaluates all.
 *
 * lookAheadBars: max forward candles to check for TP/SL after signal anchor.
 *
 * experimentGate (optional): only persist BUY when engine confidence meets minConfidence
 * (LOW ≤ MEDIUM ≤ HIGH). Omit for legacy “any BUY with valid levels” behavior.
 *
 * indicatorFilter (optional): extra BUY filters using engine technicalIndicators — rsiBand,
 * macd mode, emaStack (golden/death cross), priceVsMa vs SMA20/SMA50.
 */
export const EXPERIMENT_SUITE_PRIMARY = "primary";
export const EXPERIMENT_SUITE_SECONDARY = "secondary";
/** Binance-only multi-timeframe BTC (1m–1d); same engine as primary; isolated ledger. */
export const EXPERIMENT_SUITE_MULTI_RESOURCE = "multi_resource";
/** Wallet-owned custom strategies; isolated ledger + runs reference {@link UserCustomStrategy}. */
export const EXPERIMENT_SUITE_USER_CUSTOM = "user_custom";

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
  // Smart batch v2: distinct assets × bars × windows × confidence gates (compare win rates).
  {
    id: 10,
    name: "BTC sniper 1h",
    token: "bitcoin",
    bar: "1h",
    limit: 220,
    lookAheadBars: 36,
    experimentGate: { minConfidence: "HIGH" },
  },
  {
    id: 11,
    name: "ETH balanced 4h",
    token: "ethereum",
    bar: "4h",
    limit: 200,
    lookAheadBars: 48,
    experimentGate: { minConfidence: "MEDIUM" },
  },
  {
    id: 12,
    name: "SOL scout 15m",
    token: "solana",
    bar: "15m",
    limit: 240,
    lookAheadBars: 160,
    experimentGate: { minConfidence: "LOW" },
  },
  {
    id: 13,
    name: "BTC deep 30m",
    token: "bitcoin",
    bar: "30m",
    limit: 280,
    lookAheadBars: 80,
    experimentGate: { minConfidence: "HIGH" },
  },
  {
    id: 14,
    name: "BNB core 1h",
    token: "bnb",
    bar: "1h",
    limit: 200,
    lookAheadBars: 52,
    experimentGate: { minConfidence: "MEDIUM" },
  },
  {
    id: 15,
    name: "LINK macro 4h",
    token: "chainlink",
    bar: "4h",
    limit: 240,
    lookAheadBars: 72,
    experimentGate: { minConfidence: "HIGH" },
  },
  {
    id: 16,
    name: "AVAX impulse 1h",
    token: "avalanche",
    bar: "1h",
    limit: 140,
    lookAheadBars: 44,
    experimentGate: { minConfidence: "HIGH" },
  },
  {
    id: 17,
    name: "MATIC steady 1h",
    token: "polygon",
    bar: "1h",
    limit: 200,
    lookAheadBars: 56,
    experimentGate: { minConfidence: "MEDIUM" },
  },
  {
    id: 18,
    name: "DOT rhythm 2h",
    token: "polkadot",
    bar: "2h",
    limit: 200,
    lookAheadBars: 64,
    experimentGate: { minConfidence: "MEDIUM" },
  },
  {
    id: 19,
    name: "LTC slow 1d",
    token: "litecoin",
    bar: "1d",
    limit: 160,
    lookAheadBars: 40,
    experimentGate: { minConfidence: "HIGH" },
  },
  // Batch v3: ten extra Binance spot agents (ids 20–29) for faster win-rate discovery.
  {
    id: 20,
    name: "XRP velocity 15m",
    token: "xrp",
    bar: "15m",
    limit: 220,
    lookAheadBars: 140,
    experimentGate: { minConfidence: "MEDIUM" },
  },
  {
    id: 21,
    name: "DOGE wave 30m",
    token: "dogecoin",
    bar: "30m",
    limit: 200,
    lookAheadBars: 80,
    experimentGate: { minConfidence: "LOW" },
  },
  {
    id: 22,
    name: "ADA structure 4h",
    token: "cardano",
    bar: "4h",
    limit: 200,
    lookAheadBars: 30,
    experimentGate: { minConfidence: "HIGH" },
  },
  {
    id: 23,
    name: "TRX flow 1h",
    token: "tron",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    experimentGate: { minConfidence: "MEDIUM" },
  },
  {
    id: 24,
    name: "SHIB micro 15m",
    token: "shib",
    bar: "15m",
    limit: 260,
    lookAheadBars: 200,
    experimentGate: { minConfidence: "LOW" },
  },
  {
    id: 25,
    name: "BNB sprint 15m",
    token: "bnb",
    bar: "15m",
    limit: 200,
    lookAheadBars: 100,
    experimentGate: { minConfidence: "HIGH" },
  },
  {
    id: 26,
    name: "BTC pulse 2h",
    token: "bitcoin",
    bar: "2h",
    limit: 200,
    lookAheadBars: 48,
  },
  {
    id: 27,
    name: "ETH glide 30m",
    token: "ethereum",
    bar: "30m",
    limit: 260,
    lookAheadBars: 90,
    experimentGate: { minConfidence: "HIGH" },
  },
  {
    id: 28,
    name: "SOL drift 2h",
    token: "solana",
    bar: "2h",
    limit: 180,
    lookAheadBars: 56,
    experimentGate: { minConfidence: "MEDIUM" },
  },
  {
    id: 29,
    name: "LINK snap 15m",
    token: "chainlink",
    bar: "15m",
    limit: 220,
    lookAheadBars: 120,
    experimentGate: { minConfidence: "HIGH" },
  },
  // Batch v4 (ids 30–59): indicator-filter matrix on top of gates — broader search for best signal.
  {
    id: 30,
    name: "BTC oversold 1h",
    token: "bitcoin",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { rsiBand: { max: 35 }, macd: "BULL_HIST" },
  },
  {
    id: 31,
    name: "ETH momo 1h",
    token: "ethereum",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    experimentGate: { minConfidence: "MEDIUM" },
    indicatorFilter: { rsiBand: { min: 55 }, emaStack: "GOLDEN", priceVsMa: "ABOVE_SMA50" },
  },
  {
    id: 32,
    name: "SOL pullback 30m",
    token: "solana",
    bar: "30m",
    limit: 240,
    lookAheadBars: 72,
    indicatorFilter: { rsiBand: { max: 40 }, emaStack: "GOLDEN" },
  },
  {
    id: 33,
    name: "BNB trend 4h",
    token: "bnb",
    bar: "4h",
    limit: 200,
    lookAheadBars: 28,
    indicatorFilter: { macd: "BULL_CROSS", priceVsMa: "ABOVE_SMA20" },
  },
  {
    id: 34,
    name: "LINK squeeze 4h",
    token: "chainlink",
    bar: "4h",
    limit: 220,
    lookAheadBars: 56,
    experimentGate: { minConfidence: "HIGH" },
    indicatorFilter: { rsiBand: { min: 58 }, macd: "BULL_HIST" },
  },
  {
    id: 35,
    name: "AVAX rip 1h",
    token: "avalanche",
    bar: "1h",
    limit: 180,
    lookAheadBars: 44,
    indicatorFilter: { rsiBand: { min: 50 }, macd: "BULL_HIST" },
  },
  {
    id: 36,
    name: "MATIC base 2h",
    token: "polygon",
    bar: "2h",
    limit: 200,
    lookAheadBars: 52,
    indicatorFilter: { priceVsMa: "ABOVE_SMA50", emaStack: "GOLDEN" },
  },
  {
    id: 37,
    name: "DOT reclaim 1h",
    token: "polkadot",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { rsiBand: { max: 38 }, priceVsMa: "ABOVE_SMA20" },
  },
  {
    id: 38,
    name: "LTC cushion 1d",
    token: "litecoin",
    bar: "1d",
    limit: 160,
    lookAheadBars: 36,
    indicatorFilter: { macd: "BULL_CROSS" },
  },
  {
    id: 39,
    name: "XRP burst 15m",
    token: "xrp",
    bar: "15m",
    limit: 240,
    lookAheadBars: 130,
    indicatorFilter: { rsiBand: { min: 52 }, macd: "BULL_CROSS" },
  },
  {
    id: 40,
    name: "DOGE wave momo 30m",
    token: "dogecoin",
    bar: "30m",
    limit: 200,
    lookAheadBars: 88,
    experimentGate: { minConfidence: "LOW" },
    indicatorFilter: { emaStack: "GOLDEN", macd: "BULL_HIST" },
  },
  {
    id: 41,
    name: "ADA structure 1h",
    token: "cardano",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { priceVsMa: "ABOVE_SMA50", macd: "BULL_CROSS" },
  },
  {
    id: 42,
    name: "TRX flow 4h",
    token: "tron",
    bar: "4h",
    limit: 200,
    lookAheadBars: 32,
    indicatorFilter: { rsiBand: { max: 42 }, emaStack: "GOLDEN" },
  },
  {
    id: 43,
    name: "SHIB micro momo 15m",
    token: "shib",
    bar: "15m",
    limit: 260,
    lookAheadBars: 180,
    indicatorFilter: { rsiBand: { min: 54 }, priceVsMa: "ABOVE_SMA20" },
  },
  {
    id: 44,
    name: "BTC dip 4h",
    token: "bitcoin",
    bar: "4h",
    limit: 200,
    lookAheadBars: 22,
    experimentGate: { minConfidence: "MEDIUM" },
    indicatorFilter: { rsiBand: { max: 36 }, priceVsMa: "BELOW_SMA20" },
  },
  {
    id: 45,
    name: "ETH stretch 2h",
    token: "ethereum",
    bar: "2h",
    limit: 200,
    lookAheadBars: 56,
    indicatorFilter: { macd: "BULL_HIST", emaStack: "GOLDEN" },
  },
  {
    id: 46,
    name: "SOL scalp 15m",
    token: "solana",
    bar: "15m",
    limit: 220,
    lookAheadBars: 140,
    experimentGate: { minConfidence: "HIGH" },
    indicatorFilter: { rsiBand: { min: 56 }, macd: "BULL_CROSS" },
  },
  {
    id: 47,
    name: "BNB defense 1h",
    token: "bnb",
    bar: "1h",
    limit: 200,
    lookAheadBars: 50,
    indicatorFilter: { rsiBand: { max: 33 }, emaStack: "GOLDEN" },
  },
  {
    id: 48,
    name: "LINK drift 30m",
    token: "chainlink",
    bar: "30m",
    limit: 260,
    lookAheadBars: 84,
    indicatorFilter: { priceVsMa: "ABOVE_SMA20", macd: "BULL_HIST" },
  },
  {
    id: 49,
    name: "AVAX tight 15m",
    token: "avalanche",
    bar: "15m",
    limit: 200,
    lookAheadBars: 110,
    indicatorFilter: { rsiBand: { min: 51 }, emaStack: "GOLDEN" },
  },
  {
    id: 50,
    name: "MATIC relief 4h",
    token: "polygon",
    bar: "4h",
    limit: 200,
    lookAheadBars: 40,
    experimentGate: { minConfidence: "MEDIUM" },
    indicatorFilter: { rsiBand: { max: 39 }, macd: "BULL_CROSS" },
  },
  {
    id: 51,
    name: "DOT swing 2h",
    token: "polkadot",
    bar: "2h",
    limit: 200,
    lookAheadBars: 60,
    indicatorFilter: { macd: "BULL_CROSS", priceVsMa: "ABOVE_SMA50" },
  },
  {
    id: 52,
    name: "LTC grind 1h",
    token: "litecoin",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { rsiBand: { min: 48 }, priceVsMa: "ABOVE_SMA20" },
  },
  {
    id: 53,
    name: "XRP rail 1h",
    token: "xrp",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { emaStack: "GOLDEN", macd: "BULL_HIST" },
  },
  {
    id: 54,
    name: "DOGE bounce 4h",
    token: "dogecoin",
    bar: "4h",
    limit: 200,
    lookAheadBars: 26,
    indicatorFilter: { rsiBand: { max: 37 }, priceVsMa: "ABOVE_SMA50" },
  },
  {
    id: 55,
    name: "ADA soak 30m",
    token: "cardano",
    bar: "30m",
    limit: 240,
    lookAheadBars: 76,
    experimentGate: { minConfidence: "HIGH" },
    indicatorFilter: { rsiBand: { min: 57 }, macd: "BULL_HIST" },
  },
  {
    id: 56,
    name: "TRX steady 1h",
    token: "tron",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { macd: "BULL_CROSS", emaStack: "GOLDEN" },
  },
  {
    id: 57,
    name: "SHIB fade guard 30m",
    token: "shib",
    bar: "30m",
    limit: 260,
    lookAheadBars: 96,
    indicatorFilter: { rsiBand: { max: 41 }, macd: "BULL_HIST" },
  },
  {
    id: 58,
    name: "BTC power 2h",
    token: "bitcoin",
    bar: "2h",
    limit: 200,
    lookAheadBars: 52,
    experimentGate: { minConfidence: "HIGH" },
    indicatorFilter: { rsiBand: { min: 60 }, priceVsMa: "ABOVE_SMA50", macd: "BULL_CROSS" },
  },
  {
    id: 59,
    name: "ETH mean 1d",
    token: "ethereum",
    bar: "1d",
    limit: 180,
    lookAheadBars: 30,
    indicatorFilter: { rsiBand: { max: 35 }, emaStack: "GOLDEN" },
  },
  // Batch v5 (ids 60–79): extended catalog — Bollinger, VWAP, ADX, MFI, volatility, proximity, multi-filter stacks.
  {
    id: 60,
    name: "BTC BB lower scalp 1h",
    token: "bitcoin",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { bollingerPosition: "LOWER", macdHist: "BULL_HIST" },
  },
  {
    id: 61,
    name: "ETH VWAP ride 4h",
    token: "ethereum",
    bar: "4h",
    limit: 200,
    lookAheadBars: 28,
    indicatorFilter: { priceVsVwap: "ABOVE", smaStack: "BULL" },
  },
  {
    id: 62,
    name: "SOL ADX trend 1h",
    token: "solana",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { adxTrendStrength: "STRONG", adxDiStack: "BULL" },
  },
  {
    id: 63,
    name: "BNB MFI div 30m",
    token: "bnb",
    bar: "30m",
    limit: 220,
    lookAheadBars: 80,
    indicatorFilter: { mfiDivergence: "BULLISH DIVERGENCE", rsiOversold: true },
  },
  {
    id: 64,
    name: "LINK ATR regime 2h",
    token: "chainlink",
    bar: "2h",
    limit: 200,
    lookAheadBars: 52,
    indicatorFilter: { atrPercentBand: { min: 1.2, max: 8 }, volatilityLevel: "MODERATE" },
  },
  {
    id: 65,
    name: "AVAX volume thrust 15m",
    token: "avalanche",
    bar: "15m",
    limit: 200,
    lookAheadBars: 110,
    indicatorFilter: { volumePressure: "STRONG BUYING PRESSURE", macdCross: "BULL_CROSS" },
  },
  {
    id: 66,
    name: "MATIC BB squeeze 1h",
    token: "polygon",
    bar: "1h",
    limit: 200,
    lookAheadBars: 50,
    indicatorFilter: { bbWidthBand: { min: 3, max: 9 }, bollingerPosition: "INSIDE" },
  },
  {
    id: 67,
    name: "DOT trend+momentum 4h",
    token: "polkadot",
    bar: "4h",
    limit: 200,
    lookAheadBars: 36,
    indicatorFilter: { trendClearSignal: "BUY", momentumClearSignal: "BUY" },
  },
  {
    id: 68,
    name: "LTC near support 1h",
    token: "litecoin",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { supportProximityPct: 1.8, emaStack: "GOLDEN" },
  },
  {
    id: 69,
    name: "XRP near resistance 15m",
    token: "xrp",
    bar: "15m",
    limit: 240,
    lookAheadBars: 120,
    indicatorFilter: { resistanceProximityPct: 1.5, macdHist: "BEAR_HIST" },
  },
  {
    id: 70,
    name: "DOGE RSI neutral 30m",
    token: "dogecoin",
    bar: "30m",
    limit: 200,
    lookAheadBars: 84,
    indicatorFilter: { rsiBullishZone: true, priceVsMa: "ABOVE_SMA20" },
  },
  {
    id: 71,
    name: "ADA MACD zero 1h",
    token: "cardano",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { macdZeroLine: "ABOVE", priceVsEma12: "ABOVE" },
  },
  {
    id: 72,
    name: "TRX DI crossover 4h",
    token: "tron",
    bar: "4h",
    limit: 200,
    lookAheadBars: 32,
    indicatorFilter: { adxDiCrossover: "BULLISH CROSS", adxTrendDirection: "BULLISH" },
  },
  {
    id: 73,
    name: "SHIB 24h drift 1h",
    token: "shib",
    bar: "1h",
    limit: 240,
    lookAheadBars: 48,
    indicatorFilter: { priceChange24hBand: { min: -5, max: 15 }, confidenceFloor: "MEDIUM" },
  },
  {
    id: 74,
    name: "BTC MACD-only probe 1h",
    token: "bitcoin",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { macdHist: "BULL_HIST" },
  },
  {
    id: 75,
    name: "ETH MACD+RSI stack 2h",
    token: "ethereum",
    bar: "2h",
    limit: 200,
    lookAheadBars: 52,
    indicatorFilter: { macdCross: "BULL_CROSS", rsiBand: { min: 48, max: 62 } },
  },
  {
    id: 76,
    name: "SOL triple filter 15m",
    token: "solana",
    bar: "15m",
    limit: 220,
    lookAheadBars: 130,
    indicatorFilter: { macdHist: "BULL_HIST", priceVsEma26: "ABOVE", bollingerPosition: "INSIDE" },
  },
  {
    id: 77,
    name: "LINK BB position band 30m",
    token: "chainlink",
    bar: "30m",
    limit: 260,
    lookAheadBars: 82,
    indicatorFilter: { bbPositionBand: { min: 25, max: 75 }, mfiBand: { min: 35, max: 75 } },
  },
  {
    id: 78,
    name: "BNB ADX value band 4h",
    token: "bnb",
    bar: "4h",
    limit: 200,
    lookAheadBars: 30,
    indicatorFilter: { adxValueBand: { min: 18, max: 42 }, smaStack: "BULL" },
  },
  {
    id: 79,
    name: "AVAX MFI overbought guard 1h",
    token: "avalanche",
    bar: "1h",
    limit: 200,
    lookAheadBars: 46,
    indicatorFilter: { mfiOverbought: true, rsiOverbought: true },
  },
]);

/** Second isolated experiment: own win rate ledger; same Binance + engine + hourly/10s mechanics. */
export const TRADING_EXPERIMENT_STRATEGIES_SECONDARY = Object.freeze([
  { id: 0, name: "BTC tight 1h", token: "bitcoin", bar: "1h", limit: 150, lookAheadBars: 36 },
  { id: 1, name: "ETH 15m pulse", token: "ethereum", bar: "15m", limit: 200, lookAheadBars: 120 },
  { id: 2, name: "SOL 30m", token: "solana", bar: "30m", limit: 200, lookAheadBars: 72 },
  { id: 3, name: "XRP 1h", token: "xrp", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 4, name: "DOGE 1h", token: "dogecoin", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 5, name: "BTC 4h swing", token: "bitcoin", bar: "4h", limit: 200, lookAheadBars: 18 },
  { id: 6, name: "ETH 1h deep", token: "ethereum", bar: "1h", limit: 280, lookAheadBars: 48 },
  { id: 7, name: "ADA 1h", token: "cardano", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 8, name: "LINK 1h", token: "chainlink", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 9, name: "AVAX 1h", token: "avalanche", bar: "1h", limit: 200, lookAheadBars: 48 },
  {
    id: 10,
    name: "BTC scalp filter 15m",
    token: "bitcoin",
    bar: "15m",
    limit: 240,
    lookAheadBars: 100,
    indicatorFilter: { rsiBand: { max: 34 }, macd: "BULL_HIST" },
  },
  {
    id: 11,
    name: "ETH trend 2h",
    token: "ethereum",
    bar: "2h",
    limit: 200,
    lookAheadBars: 56,
    indicatorFilter: { emaStack: "GOLDEN", priceVsMa: "ABOVE_SMA50" },
  },
  {
    id: 12,
    name: "SOL vol 4h",
    token: "solana",
    bar: "4h",
    limit: 200,
    lookAheadBars: 24,
    experimentGate: { minConfidence: "MEDIUM" },
    indicatorFilter: { macd: "BULL_CROSS" },
  },
  {
    id: 13,
    name: "XRP snap 15m",
    token: "xrp",
    bar: "15m",
    limit: 220,
    lookAheadBars: 128,
    indicatorFilter: { rsiBand: { min: 53 }, macd: "BULL_HIST" },
  },
  {
    id: 14,
    name: "DOGE wide 30m",
    token: "dogecoin",
    bar: "30m",
    limit: 200,
    lookAheadBars: 80,
    indicatorFilter: { priceVsMa: "ABOVE_SMA20", emaStack: "GOLDEN" },
  },
  {
    id: 15,
    name: "BNB core alt 1h",
    token: "bnb",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { rsiBand: { max: 40 }, macd: "BULL_CROSS" },
  },
  {
    id: 16,
    name: "LINK macro 2h",
    token: "chainlink",
    bar: "2h",
    limit: 220,
    lookAheadBars: 52,
    experimentGate: { minConfidence: "HIGH" },
    indicatorFilter: { rsiBand: { min: 56 }, priceVsMa: "ABOVE_SMA50" },
  },
  {
    id: 17,
    name: "MATIC mesh 1h",
    token: "polygon",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { macd: "BULL_HIST", rsiBand: { max: 42 } },
  },
  {
    id: 18,
    name: "DOT rail 4h",
    token: "polkadot",
    bar: "4h",
    limit: 200,
    lookAheadBars: 28,
    indicatorFilter: { emaStack: "GOLDEN", macd: "BULL_CROSS" },
  },
  {
    id: 19,
    name: "LTC patient 1d",
    token: "litecoin",
    bar: "1d",
    limit: 160,
    lookAheadBars: 34,
    indicatorFilter: { rsiBand: { min: 48 }, priceVsMa: "ABOVE_SMA20" },
  },
  {
    id: 20,
    name: "TRX rhythm 1h",
    token: "tron",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    indicatorFilter: { rsiBand: { max: 36 }, emaStack: "GOLDEN" },
  },
  {
    id: 21,
    name: "SHIB spray 15m",
    token: "shib",
    bar: "15m",
    limit: 280,
    lookAheadBars: 160,
    experimentGate: { minConfidence: "LOW" },
    indicatorFilter: { macd: "BULL_HIST" },
  },
  {
    id: 22,
    name: "ADA grind 30m",
    token: "cardano",
    bar: "30m",
    limit: 240,
    lookAheadBars: 70,
    indicatorFilter: { rsiBand: { max: 39 }, priceVsMa: "ABOVE_SMA50" },
  },
  {
    id: 23,
    name: "AVAX sprint 15m",
    token: "avalanche",
    bar: "15m",
    limit: 200,
    lookAheadBars: 112,
    indicatorFilter: { rsiBand: { min: 55 }, macd: "BULL_CROSS" },
  },
  {
    id: 24,
    name: "BTC defend 30m",
    token: "bitcoin",
    bar: "30m",
    limit: 260,
    lookAheadBars: 68,
    indicatorFilter: { rsiBand: { max: 37 }, priceVsMa: "BELOW_SMA50", macd: "BULL_HIST" },
  },
]);

/** Trading experiment lab uses Binance spot data only (no other venues). */
const MULTI_RESOURCE_CEX_SOURCES = Object.freeze(["binance"]);

const MULTI_RESOURCE_BARS = Object.freeze(["1m", "5m", "15m", "30m", "1h", "2h", "4h", "1d"]);

function buildMultiResourceStrategies() {
  /** @type {object[]} */
  const out = [];
  let id = 0;
  for (const source of MULTI_RESOURCE_CEX_SOURCES) {
    for (const bar of MULTI_RESOURCE_BARS) {
      const limit =
        bar === "1m"
          ? 400
          : bar === "5m"
            ? 360
            : bar === "15m"
              ? 320
              : bar === "30m"
                ? 280
                : bar === "1h"
                  ? 220
                  : bar === "2h"
                    ? 200
                    : bar === "4h"
                      ? 200
                      : 180;
      const lookAheadBars =
        bar === "1m"
          ? 720
          : bar === "5m"
            ? 576
            : bar === "15m"
              ? 384
              : bar === "30m"
                ? 240
                : bar === "1h"
                  ? 168
                  : bar === "2h"
                    ? 144
                    : bar === "4h"
                      ? 120
                      : 90;
      out.push({
        id: id++,
        name: `${source} BTC ${bar}`,
        token: "bitcoin",
        bar,
        limit,
        lookAheadBars,
        source,
      });
    }
  }
  return Object.freeze(out);
}

export const TRADING_EXPERIMENT_STRATEGIES_MULTI_RESOURCE = buildMultiResourceStrategies();

/**
 * @param {string | undefined | null} input
 * @returns {typeof EXPERIMENT_SUITE_PRIMARY | typeof EXPERIMENT_SUITE_SECONDARY | typeof EXPERIMENT_SUITE_MULTI_RESOURCE}
 */
export function normalizeSuite(input) {
  const x = String(input ?? EXPERIMENT_SUITE_PRIMARY)
    .trim()
    .toLowerCase();
  if (
    x === EXPERIMENT_SUITE_MULTI_RESOURCE ||
    x === "3" ||
    x === "c" ||
    x === "multi" ||
    x === "multiresource" ||
    x === "all_cex" ||
    x === "all-resources" ||
    x === "resources"
  ) {
    return EXPERIMENT_SUITE_MULTI_RESOURCE;
  }
  if (
    x === EXPERIMENT_SUITE_SECONDARY ||
    x === "2" ||
    x === "b" ||
    x === "experiment-2" ||
    x === "second"
  ) {
    return EXPERIMENT_SUITE_SECONDARY;
  }
  return EXPERIMENT_SUITE_PRIMARY;
}

/**
 * @param {string | undefined | null} suite
 */
export function getStrategiesForSuite(suite) {
  const s = normalizeSuite(suite);
  if (s === EXPERIMENT_SUITE_SECONDARY) return TRADING_EXPERIMENT_STRATEGIES_SECONDARY;
  if (s === EXPERIMENT_SUITE_MULTI_RESOURCE) return TRADING_EXPERIMENT_STRATEGIES_MULTI_RESOURCE;
  return TRADING_EXPERIMENT_STRATEGIES;
}

export const EXPERIMENT_SUITES_META = Object.freeze([
  {
    id: EXPERIMENT_SUITE_PRIMARY,
    title: "Experiment 1 — original",
    description:
      "80 Binance agents (ids 0–79): extended indicator catalog (RSI/MACD/BB/VWAP/ADX/MFI/volatility/proximity/trend) + random evolution combos.",
  },
  {
    id: EXPERIMENT_SUITE_SECONDARY,
    title: "Experiment 2 — parallel",
    description:
      "25 isolated agents (ids 0–24); alternate bars and indicator-filter variants. Same hourly signal + 10s 1m validation.",
  },
  {
    id: EXPERIMENT_SUITE_MULTI_RESOURCE,
    title: "Experiment 3 — Binance BTC timeframes",
    description:
      "Binance spot BTC across bars 1m, 5m, 15m, 30m, 1h, 2h, 4h, 1d. Hourly samples + 10s TP/SL validation on Binance 1m data.",
  },
]);
