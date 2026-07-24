import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for x402 Indicator API photo deck: 15 distinct topics. */
export const INDICATOR_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces the new Indicator API.

It turns 27 technical analysis indicators, including RSI, MACD, and Bollinger Bands, into agent-readable JSON behind a single x402 call.

api.syraa.fun/indicator/catalog`,

  thesis: `This card states the gap the Indicator API closes.

Autonomous agents need structured latest values, descriptive signals, and optional per-bar series, not TradingView pixels. One candle fetch can now feed many indicators through a single micropayment.

api.syraa.fun/indicator/catalog`,

  quote: `This card carries the line behind the API: one candle fetch, many indicators, one checkout.

RSI, MACD, and Bollinger Bands can combine in a single x402 call, so agents never double-fetch OHLCV data or pay twice for the same candles.

api.syraa.fun/indicator/catalog`,

  flow: `This image walks through calling the Indicator API, in four steps.

1. Pick the OHLCV source, for example symbol BTCUSDT, source binance, interval 1h, limit 200
2. List the indicators, either as a comma-separated query string or a POST body with parameters
3. Pay through x402: a 402 response, a signature, then a retry
4. Read the output, which includes a latest value, a signal, and an optional full series per indicator

api.syraa.fun/indicator/catalog`,

  timeline: `This timeline traces a request from catalog to combined analytics.

1. A free GET to the catalog endpoint lists all 27 indicator ids and their parameters
2. Dotted GET parameters or a POST JSON body configure more complex combinations
3. An x402 v2 payment settles on Solana, Base, or BSC
4. The agent reads descriptive signals like overbought or bullish momentum from the response

api.syraa.fun/indicator/catalog`,

  pillars: `This bento layout shows the four indicator families behind the API.

Momentum covers RSI, MACD, Stochastic, StochRSI, Williams %R, CCI, ROC, TRIX, KST, and Awesome Oscillator. Trend covers SMA, EMA, WMA, WEMA, ADX, PSAR, and Ichimoku Cloud. Volatility covers Bollinger Bands, ATR, True Range, Keltner Channels, and Chandelier Exit. Volume covers MFI, OBV, ADL, Force Index, and VWAP.

api.syraa.fun/indicator/catalog`,

  checklist: `This checklist covers what's live on the Indicator API.

1. GET and POST both work on the x402-gated indicator endpoint
2. Multiple indicators can combine in a single call
3. Latest value and signal come back by default
4. Setting series to true returns the full per-bar array
5. Ten CEX sources are supported for OHLCV data

api.syraa.fun/indicator/catalog`,

  metrics: `This card lists the numbers behind the Indicator API.

27 indicators are available across momentum, trend, volatility, and volume. 10 CEX sources supply the underlying OHLCV candles. Every combination still runs on one fetch per call, structured for agent pipelines rather than chart rendering.

api.syraa.fun/indicator/catalog`,

  featured: `This featured card highlights combining indicators in a single request.

Requesting rsi, macd, and bollinger together returns latest values, signals, and resolved parameters for each one. The output stays descriptive, not a trade directive.

api.syraa.fun/indicator/catalog`,

  comparison: `This before and after card compares custom TA with the new API.

Before, agents ran custom technical analysis per indicator or scraped charts, fetching one indicator at a time with fragile parsing. Now, one x402 endpoint covers 27 indicators as structured JSON, with a free catalog for discovery.

api.syraa.fun/indicator/catalog`,

  launch: `This launch card marks the Indicator API as live on Syra.

Agent-readable indicators now compute from live OHLCV data, and multiple indicators can combine in a single x402 call.

api.syraa.fun/indicator/catalog`,

  deepDive: `This deep-dive card lists the API contract for builders.

A GET request can look like symbol BTCUSDT with indicators rsi and macd and rsi.period set to 21. A POST body instead sends a symbol, interval, and an indicators array with per-id parameters. The response returns success, data, indicators, candle count, and last close, with signals staying descriptive only, and the endpoint is registered on both x402 and MPP discovery catalogs.

api.syraa.fun/indicator/catalog`,

  split: `This split card explains the two ways to call the API.

A GET request uses dotted query parameters for simple multi-indicator calls, like indicators set to rsi and macd with macd.fastPeriod set separately. A POST request instead sends an indicators array for nested parameters and longer lists. Either way, setting series to true adds an aligned time series, and source picks between binance, okx, coinbase, and more.

api.syraa.fun/indicator/catalog`,

  terminal: `This terminal card shows an RSI and MACD request end to end.

Calling the indicator endpoint for BTCUSDT on the 1h interval with rsi and macd returns HTTP 402 first. Retrying with a payment signature and an rsi period of 14 comes back HTTP 200, with RSI's latest value at 58.21 marked neutral and MACD's latest values at 142.3 against a signal line of 138.1.

api.syraa.fun/indicator/catalog`,

  cta: `This closing card points to where to wire the Indicator API into an agent.

Browse the free catalog to see all 27 indicators, try a call in the playground, or hit the RSI and MACD example directly to see the response shape.

api.syraa.fun/indicator/catalog
syraa.fun/playground
api.syraa.fun/indicator?symbol=BTCUSDT&indicators=rsi,macd`,
};
