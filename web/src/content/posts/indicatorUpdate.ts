import { BarChart3, Bot, Layers, LineChart, Terminal } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: x402 /indicator API — agent-readable technical indicators from OHLCV.
 */
export const INDICATOR_POST: PostUpdate = {
  meta: {
    updateNumber: 8,
    id: "x402-indicator-api",
    title: "x402 Indicator API",
    published: "June 2026",
    tagline: "27 TradingView-style indicators, combinable in one agent call",
    shareCopyVideo: `SHIP LOG · Syra just shipped the x402 Indicator API.

Agents can now request RSI, MACD, EMA, Bollinger Bands, and 23 more indicators from live OHLCV candles. Combine multiple in one paid call. GET with dotted params or POST JSON.

→ GET/POST /indicator (x402)
→ 27 indicators: momentum, trend, volatility, volume
→ Combine rsi,macd in one request
→ latest + signal by default, series=true for full arrays
→ 10 CEX sources: Binance, OKX, Coinbase, and more
→ Free catalog at /indicator/catalog

TradingView math. Agent-readable JSON. Pay per call.

Full breakdown in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · x402 Indicator API is live on Syra.

27 technical indicators from OHLCV candles. RSI, MACD, EMA, Bollinger, ADX, ATR, Ichimoku, VWAP, and more. Request 2+ indicators in one call.

GET ?indicators=rsi,macd&rsi.period=21
POST JSON for complex combos
Free catalog lists every param

Agents read signals. Not guesswork.

Try it → api.syraa.fun/indicator/catalog`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-spotlight",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Indicator API",
      subtitle: "27 TradingView-style indicators from OHLCV candles. Combinable in one x402 call. Built for agents.",
      badge: "x402 · /indicator",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-accent-bar",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agents need indicators they can parse.",
      body: "TradingView charts are for humans. Autonomous agents need structured JSON: latest values, descriptive signals, and optional per-bar series. One candle fetch, many indicators, one micropayment.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-split",
      label: "Shipped",
      kicker: "What we built",
      headline: "GET/POST /indicator on Syra API",
      body: "x402-gated endpoint that fetches OHLCV from major CEX sources, computes indicators via the technicalindicators library, and returns agent-readable output with params, latest, signal, and optional series arrays.",
      highlights: [
        "27 indicators across momentum, trend, volatility, volume",
        "Combine multiple indicators in one call (one candle fetch)",
        "Free GET /indicator/catalog for discovery without payment",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-timeline",
      label: "Flow",
      kicker: "How it works",
      headline: "Four steps. One checkout.",
      steps: [
        {
          step: "01",
          title: "Pick symbol + interval",
          description: "BTCUSDT on Binance, 1h candles, limit 200. Or POST JSON with the same fields.",
        },
        {
          step: "02",
          title: "List indicators",
          description: "GET: indicators=rsi,macd&rsi.period=21. POST: [{ id: \"rsi\", period: 21 }, { id: \"macd\" }].",
        },
        {
          step: "03",
          title: "Pay via x402",
          description: "HTTP 402 → sign with your agent wallet → retry with PAYMENT-SIGNATURE header.",
        },
        {
          step: "04",
          title: "Read structured output",
          description: "Each indicator returns latest value, descriptive signal, and series when series=true.",
        },
      ],
    },
    {
      id: "indicators",
      kind: "cards",
      layout: "cards-bento",
      label: "Indicators",
      kicker: "27 available",
      headline: "TradingView-class coverage",
      cards: [
        {
          title: "Momentum",
          subtitle: "RSI · MACD · Stoch",
          detail: "RSI, MACD, Stochastic, StochRSI, Williams %R, CCI, ROC, TRIX, KST, Awesome Oscillator.",
          accent: "gold",
        },
        {
          title: "Trend",
          subtitle: "MA · ADX · SAR",
          detail: "SMA, EMA, WMA, WEMA, ADX, PSAR, Ichimoku Cloud.",
          accent: "gold",
        },
        {
          title: "Volatility",
          subtitle: "Bands · ATR",
          detail: "Bollinger Bands, ATR, True Range, Keltner Channels, Chandelier Exit.",
        },
        {
          title: "Volume",
          subtitle: "Flow · VWAP",
          detail: "MFI, OBV, ADL, Force Index, VWAP.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-list",
      label: "Product",
      kicker: "Where you'll use it",
      headline: "Built for agent workflows",
      items: [
        {
          icon: Terminal,
          title: "API Playground",
          description: "Test 402 → pay → 200 flows and inspect indicator JSON before wiring agents.",
          href: "https://www.syraa.fun/playground",
        },
        {
          icon: LineChart,
          title: "GET /indicator",
          description: "Dotted query params: symbol, source, interval, indicators=rsi,macd, rsi.period=21.",
          href: "https://api.syraa.fun/indicator/catalog",
        },
        {
          icon: Layers,
          title: "POST /indicator",
          description: "JSON body for complex multi-indicator requests with per-indicator params.",
        },
        {
          icon: Bot,
          title: "Autonomous agents",
          description: "Structured signals (overbought, bullish_momentum, etc.) agents can reason over without parsing charts.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-featured-stat",
      label: "Impact",
      kicker: "For builders",
      headline: "One call. Many indicators.",
      stats: [
        { value: "27", label: "Indicators available" },
        { value: "10", label: "CEX OHLCV sources" },
        { value: "1", label: "Candle fetch per call" },
      ],
      narrative:
        "Request RSI and MACD together without double-fetching candles or double-paying for data. Signals are descriptive analytics only, never trade directives. Agents get probabilistic context, not certainty.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "Explore the catalog. Pay per call.",
      subline: "Browse all 27 indicators and params for free, then hit /indicator with x402 when your agent is ready.",
      links: [
        { label: "Catalog", value: "api.syraa.fun/indicator/catalog", href: "https://api.syraa.fun/indicator/catalog" },
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "Example", value: "rsi + macd GET", href: "https://api.syraa.fun/indicator?symbol=BTCUSDT&indicators=rsi,macd" },
      ],
    },
  ],
};
