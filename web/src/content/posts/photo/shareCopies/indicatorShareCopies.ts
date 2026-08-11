import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for x402 Indicator API photo deck. Proof-first, no meta card talk. */
export const INDICATOR_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `The Indicator API is live on Syra.

It turns 27 technical analysis indicators, including RSI, MACD, and Bollinger Bands, into agent-readable JSON. One x402 call (pay only when you call) covers the stack.

api.syraa.fun/indicator/catalog`,

  thesis: `Agents cannot read chart screenshots.

Autonomous agents need structured latest values, descriptive signals, and optional per-bar series, not TradingView pixels. One candle fetch now feeds many indicators through a single micropayment.

api.syraa.fun/indicator/catalog`,

  quote: `One candle fetch, many indicators, one checkout.

Combine RSI, MACD, and Bollinger in a single x402 call. No double-fetching OHLCV (the open, high, low, close, volume candles). No paying twice for the same candles.

api.syraa.fun/indicator/catalog`,

  flow: `Calling the Indicator API is four steps.

1. Pick the OHLCV source, for example symbol BTCUSDT, source binance, interval 1h, limit 200
2. List the indicators as a comma-separated query or a POST body with parameters
3. Pay through x402: a 402 response, a signature, then a retry
4. Read latest value, a descriptive signal, and an optional full series per indicator

api.syraa.fun/indicator/catalog`,

  timeline: `A request runs from catalog to combined analytics.

1. A free GET to the catalog lists all 27 indicator ids and their parameters
2. Dotted GET parameters or a POST JSON body configure more complex combinations
3. An x402 v2 payment settles on Solana, Base, or BSC
4. The agent reads descriptive signals like overbought or bullish momentum

api.syraa.fun/indicator/catalog`,

  pillars: `Twenty-seven indicators sit in four families.

Momentum covers RSI, MACD, Stochastic, StochRSI, Williams %R, CCI, ROC, TRIX, KST, and Awesome Oscillator. Trend covers SMA, EMA, WMA, WEMA, ADX, PSAR, and Ichimoku Cloud. Volatility covers Bollinger Bands, ATR, True Range, Keltner Channels, and Chandelier Exit. Volume covers MFI, OBV, ADL, Force Index, and VWAP.

api.syraa.fun/indicator/catalog`,

  checklist: `The Indicator API is live now.

1. GET and POST both work on the x402-gated /indicator endpoint
2. Multiple indicators can combine in a single call
3. Latest value and signal come back by default
4. Setting series to true returns the full per-bar array
5. Ten CEX sources are supported for OHLCV data

api.syraa.fun/indicator/catalog`,

  metrics: `One fetch covers the full TA stack.

27 indicators. 10 CEX sources. 1 fetch per call.

Momentum, trend, volatility, and volume come from the same candle series, structured for agent pipelines rather than chart rendering.

api.syraa.fun/indicator/catalog`,

  featured: `Stack indicators in one request.

Ask for rsi, macd, and bollinger together. Each returns latest value, signal, and resolved parameters. The output stays descriptive. It is not a trade directive.

api.syraa.fun/indicator/catalog`,

  comparison: `Custom technical analysis used to mean one indicator per fetch.

Before, agents ran custom TA, scraped charts, and parsed fragile output. Now one x402 endpoint covers 27 indicators as structured JSON, with a free catalog for discovery.

api.syraa.fun/indicator/catalog`,

  launch: `TradingView-class technical analysis is now agent-readable on Syra.

Indicators compute from live OHLCV. Multiple indicators combine in a single x402 call.

api.syraa.fun/indicator/catalog`,

  deepDive: `The API contract is built for agents.

A GET can look like symbol BTCUSDT with indicators rsi and macd and rsi.period set to 21. A POST body sends a symbol, interval, and an indicators array with per-id parameters. The response returns success, data, indicators, candle count, and last close. Signals stay descriptive only (overbought, bullish momentum, and the like). The endpoint is registered on both x402 and MPP discovery catalogs.

api.syraa.fun/indicator/catalog`,

  split: `GET handles simple calls. POST handles nested parameters and longer lists.

Dotted query parameters work for multi-indicator calls, like indicators set to rsi and macd with macd.fastPeriod set separately. A POST sends an indicators array for nested parameters. Either way, series=true adds an aligned time series, and source picks binance, okx, coinbase, and more.

api.syraa.fun/indicator/catalog`,

  terminal: `RSI and MACD in one paid request.

Call the indicator endpoint for BTCUSDT on the 1h interval with rsi and macd. The first response is HTTP 402. Retry with a payment signature and rsi.period 14. You get HTTP 200: RSI latest 58.21, signal neutral, MACD latest 142.3 against a signal line of 138.1.

api.syraa.fun/indicator/catalog`,

  cta: `Wire technical analysis into an agent stack.

Browse the free catalog of 27 indicators, try a call in the playground, or hit the RSI and MACD example to see the response shape. Pay per call via x402.

api.syraa.fun/indicator/catalog
syraa.fun/playground
api.syraa.fun/indicator?symbol=BTCUSDT&indicators=rsi,macd`,
};
