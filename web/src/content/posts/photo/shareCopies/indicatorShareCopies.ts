import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for x402 Indicator API photo deck — 15 distinct topics. */
export const INDICATOR_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `TradingView has dozens of indicators. Agents couldn't read them — until now.

Syra shipped GET/POST /indicator: 27 technical indicators from live OHLCV, combinable in one x402 call.

RSI. MACD. Bollinger. Ichimoku. VWAP. Agent-readable JSON.

Catalog → api.syraa.fun/indicator/catalog`,

  thesis: `Charts are for humans. Agents need structured indicator output.

Syra's x402 Indicator API returns latest values, descriptive signals, and optional per-bar series from 10 CEX sources.

One candle fetch. Many indicators. One micropayment.`,

  quote: `"Request RSI and MACD together without double-fetching candles."

GET ?indicators=rsi,macd&rsi.period=21
POST JSON for complex combos
series=true when you need full arrays

Built for autonomous trading agents.`,

  flow: `How the Indicator API works:

1. Pick symbol + interval (BTCUSDT, 1h)
2. List indicators (rsi, macd, bollinger…)
3. Pay via x402 (402 → sign → retry)
4. Read JSON: latest, signal, optional series

27 indicators. One call. Agent-parseable.`,

  timeline: `Indicator API — step by step:

→ GET /indicator/catalog (free) — discover all 27 ids + params
→ Choose symbol, source, interval, limit
→ Combine indicators=rsi,macd with dotted params
→ x402 payment unlocks structured OHLCV analytics

No chart scraping. No guesswork.`,

  pillars: `4 indicator categories. 27 total:

→ Momentum: RSI, MACD, Stochastic, CCI, ROC…
→ Trend: SMA, EMA, ADX, PSAR, Ichimoku
→ Volatility: Bollinger, ATR, Keltner, Chandelier
→ Volume: MFI, OBV, VWAP, Force Index

All combinable in one /indicator request.`,

  checklist: `What's live on /indicator:

→ 27 TradingView-style indicators
→ GET dotted params + POST JSON body
→ latest + signal by default
→ series=true for full per-bar arrays
→ 10 CEX sources (Binance, OKX, Coinbase…)
→ Free /indicator/catalog discovery`,

  metrics: `27 indicators. 10 CEX sources. 1 candle fetch per call.

Syra Indicator API computes momentum, trend, volatility, and volume metrics from live OHLCV — structured for agents, gated by x402.

Pay per call. Combine freely.`,

  featured: `27 — the number of technical indicators agents can request from one Syra API call.

RSI + MACD + Bollinger in a single x402 checkout. Descriptive signals, not trade directives.

TradingView math. Agent-readable JSON.`,

  comparison: `Before: agents scraped charts or ran custom TA code per indicator. Fragile. Expensive. Hard to combine.

Now: GET/POST /indicator with 27 indicators, combinable params, x402 micropayments, and a free catalog.

Structured analytics without building your own indicator stack.`,

  launch: `SHIP LOG · x402 Indicator API is live.

27 indicators from OHLCV candles. Combine rsi,macd in one call. Free catalog at /indicator/catalog.

Momentum. Trend. Volatility. Volume. Built for agents.

Try it → api.syraa.fun/indicator/catalog`,

  deepDive: `Indicator API — technical surface:

→ GET/POST api.syraa.fun/indicator (x402)
→ technicalindicators library for computation
→ Binance, OKX, Coinbase, Bybit, Kraken + more
→ Response: { success, data: { indicators: { rsi: { latest, signal } } } }
→ MPP + x402 discovery registered`,

  split: `AGENT OUTPUT
latest value + descriptive signal per indicator
Optional series=true for charting pipelines

REQUEST FORMAT
GET: indicators=rsi,macd&rsi.period=21
POST: { indicators: [{ id: "rsi", period: 21 }] }

One endpoint. Many indicators. x402 gated.`,

  terminal: `Indicator API from the terminal:

$ curl "api.syraa.fun/indicator?symbol=BTCUSDT&indicators=rsi,macd"
< HTTP/402 Payment Required

$ curl -H "PAYMENT-SIGNATURE: …" "…&rsi.period=14"
< HTTP/200 OK
{
  "success": true,
  "data": {
    "indicators": {
      "rsi": { "latest": 58.2, "signal": "neutral" },
      "macd": { "latest": { "MACD": 120, "signal": 115 } }
    }
  }
}`,

  cta: `Build agents that read the tape — not screenshots.

→ Catalog: api.syraa.fun/indicator/catalog
→ Playground: syraa.fun/playground
→ Example: ?symbol=BTCUSDT&indicators=rsi,macd

27 indicators. Combinable. x402 pay-per-call.`,
};
