import { INDICATOR_POST } from "../indicatorUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { INDICATOR_PHOTO_SHARE_COPIES } from "./shareCopies/indicatorShareCopies";

const copies = INDICATOR_PHOTO_SHARE_COPIES;

/** Photo-format content for the x402 Indicator API ship log — 15 cards, 15 X posts. */
export const INDICATOR_PHOTO = definePhotoUpdate(INDICATOR_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "x402 · /indicator",
      title: "Indicator API",
      subtitle: "27 TradingView-style indicators from OHLCV. Combinable in one agent call.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "Why this matters",
      headline: "Charts are for humans. Agents need JSON.",
      body: "Autonomous agents cannot parse TradingView screenshots. They need structured latest values, descriptive signals, and optional per-bar series from live candles.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "One candle fetch. Many indicators. One micropayment.",
      narrative: "Combine RSI, MACD, and Bollinger in a single x402 call without refetching OHLCV or paying twice for data.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "Symbol → indicators → x402 → JSON.",
      steps: [
        { step: "01", title: "Pick OHLCV", description: "symbol=BTCUSDT, source=binance, interval=1h, limit=200." },
        { step: "02", title: "List indicators", description: "indicators=rsi,macd or POST JSON array with params." },
        { step: "03", title: "Pay x402", description: "402 → sign → retry with PAYMENT-SIGNATURE." },
        { step: "04", title: "Read output", description: "latest, signal, and optional series per indicator." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Request flow",
      headline: "From catalog to combined analytics.",
      steps: [
        { step: "01", title: "Catalog (free)", description: "GET /indicator/catalog lists all 27 ids and params." },
        { step: "02", title: "Configure", description: "Dotted GET params or POST JSON for complex combos." },
        { step: "03", title: "Settle", description: "x402 v2 payment on Solana, Base, or BSC." },
        { step: "04", title: "Consume", description: "Agent reads signals like overbought or bullish_momentum." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four indicator families.",
      cards: [
        { title: "Momentum", subtitle: "RSI · MACD", detail: "RSI, MACD, Stochastic, StochRSI, Williams %R, CCI, ROC, TRIX, KST, AO.", accent: "gold" },
        { title: "Trend", subtitle: "MA · ADX", detail: "SMA, EMA, WMA, WEMA, ADX, PSAR, Ichimoku Cloud.", accent: "gold" },
        { title: "Volatility", subtitle: "Bands · ATR", detail: "Bollinger, ATR, True Range, Keltner, Chandelier Exit." },
        { title: "Volume", subtitle: "Flow · VWAP", detail: "MFI, OBV, ADL, Force Index, VWAP." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Indicator API is live.",
      highlights: [
        "GET + POST /indicator (x402 gated)",
        "Combine multiple indicators per call",
        "latest + signal by default",
        "series=true for full per-bar arrays",
        "10 CEX OHLCV sources supported",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Built for agent pipelines.",
      stats: [
        { value: "27", label: "Indicators" },
        { value: "10", label: "CEX sources" },
        { value: "1", label: "Fetch per call" },
      ],
      narrative: "Momentum, trend, volatility, and volume metrics from the same candle series in one checkout.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Combine freely.",
      stats: [{ value: "2+", label: "Indicators per request" }],
      narrative: "Request rsi,macd,bollinger together. Each returns its own latest, signal, and resolved params.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Before vs now.",
      compareLeft: {
        title: "Before",
        body: "Custom TA per agent. Chart scraping. One indicator per fetch. Fragile parsing.",
      },
      compareRight: {
        title: "Now",
        body: "One x402 endpoint. 27 indicators. Structured JSON. Free catalog for discovery.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · 27 indicators · x402",
      partnerName: "TradingView",
      partnerLogo: "/images/partners/tradingview.png",
      headline: "Syra × TradingView-class TA",
      subtitle: "Agent-readable indicators from OHLCV. Combinable in one x402 call.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "API contract.",
      items: [
        "GET ?symbol=BTCUSDT&indicators=rsi,macd&rsi.period=21",
        "POST { symbol, interval, indicators: [{ id, ...params }] }",
        "Response: { success, data: { indicators, candleCount, lastClose } }",
        "Signals: descriptive only (overbought, bullish_momentum, etc.)",
        "Registered on x402 + MPP discovery catalogs",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Two formats",
      headline: "GET for agents. POST for complex combos.",
      body: "Dotted query params are URL-friendly for simple multi-indicator calls. POST JSON handles nested param objects and longer indicator lists.",
      highlights: [
        "GET: indicators=rsi,macd&macd.fastPeriod=12",
        "POST: indicators array with per-id params",
        "series=true adds aligned time series",
        "source=binance|okx|coinbase|…",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Combined RSI + MACD request.",
      terminalLines: [
        "$ curl api.syraa.fun/indicator \\",
        "    ?symbol=BTCUSDT&interval=1h \\",
        "    &indicators=rsi,macd&rsi.period=14",
        "< HTTP/402 Payment Required",
        "$ curl -H 'PAYMENT-SIGNATURE: …' …",
        "> rsi.latest: 58.21  signal: neutral",
        "> macd.latest: { MACD: 142.3, signal: 138.1 }",
        "< HTTP/200 OK",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Give your agents readable indicators.",
      subtitle: "Explore the catalog, then wire /indicator into your x402 agent stack.",
      links: [
        { label: "Catalog", value: "api.syraa.fun/indicator/catalog", href: "https://api.syraa.fun/indicator/catalog" },
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "Example", value: "rsi + macd", href: "https://api.syraa.fun/indicator?symbol=BTCUSDT&indicators=rsi,macd" },
      ],
    }),
  },
]);
