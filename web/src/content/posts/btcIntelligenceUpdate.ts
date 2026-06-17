import { BarChart3, Bitcoin, LineChart, Newspaper, Share2 } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: BTC Intelligence Hub — /btc dashboard with bubblemap, 20 sections, shareable cards.
 */
export const BTC_INTELLIGENCE_POST: PostUpdate = {
  meta: {
    updateNumber: 11,
    id: "btc-intelligence-hub",
    title: "BTC Intelligence Hub",
    published: "June 2026",
    tagline: "One premium BTC command center — flow chart, 15 analysis blocks, and shareable section cards",
    shareCopyVideo: `SHIP LOG · Syra just shipped the BTC Intelligence Hub.

One dashboard page for Bitcoin conviction — not ten scattered tabs.

→ Live overview + cross-exchange compare
→ Flow bubblemap on TradingView Lightweight Charts
→ 15 analysis sections: technicals, funding, OI, sentiment, signal, and more
→ Sticky section nav with smooth scroll
→ Every section is a shareable card — copy, download, or post to X
→ DB-backed snapshots on a rate-limit-aware schedule

Free on the dashboard. Open /btc and scroll the full stack.

Full walkthrough in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · BTC Intelligence Hub is live on Syra.

One page: price overview, exchange compare, flow bubblemap, and 15 analysis sections — technicals, order book, funding, fear & greed, news, sentiment, signal, supply.

Sticky nav. Shareable cards. Server snapshots — no per-visit API hammering.

Try it → syraa.fun/btc`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-tagline-stack",
      label: "Cover",
      eyebrow: "Ship log",
      title: "BTC Intelligence Hub",
      subtitle: "Premium Bitcoin command center on Syra — flow chart, 15 analysis blocks, shareable cards, one scroll.",
      badge: "Dashboard · /btc",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-highlight-line",
      label: "Context",
      kicker: "Why this matters",
      headline: "BTC research was scattered. Now it's one page.",
      body: "Traders bounced between exchange tabs, chart sites, and sentiment feeds. Syra /btc pulls overview, cross-venue pricing, on-chain flow visualization, and fifteen analysis sections into a single premium dashboard — with every block exportable for X.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-numbered-cards",
      label: "Shipped",
      kicker: "What we built",
      headline: "20 sections. One hub.",
      body: "Hero metrics, exchange compare, interactive bubblemap, and a deep dashboard of technicals, derivatives, correlations, news, sentiment, and supply — all backed by precomputed MongoDB snapshots.",
      highlights: [
        "Overview price, dominance, fear & greed, and volume",
        "Flow bubblemap with exchange + interval controls",
        "15 shareable analysis cards with branded export",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-arrow-chain",
      label: "Flow",
      kicker: "How it works",
      headline: "Open. Scroll. Share.",
      steps: [
        {
          step: "01",
          title: "Open /btc",
          description: "Dashboard sidebar → BTC Intelligence. Snapshots load from Syra API — not live provider calls per user.",
        },
        {
          step: "02",
          title: "Scan overview",
          description: "Price, 24h range, dominance, fear & greed, and cross-exchange spot compare in the hero row.",
        },
        {
          step: "03",
          title: "Read the stack",
          description: "Sticky section nav jumps to technicals, funding, OI, correlations, news, sentiment, signal, and more.",
        },
        {
          step: "04",
          title: "Share a card",
          description: "Any section exports a branded dark frame — copy text, download PNG, or native share to X.",
        },
      ],
    },
    {
      id: "sections",
      kind: "cards",
      layout: "cards-mosaic",
      label: "Sections",
      kicker: "Analysis stack",
      headline: "Fifteen blocks, one scroll",
      cards: [
        {
          title: "Technicals",
          subtitle: "RSI · MACD · EMA",
          detail: "Indicator stack on BTCUSDT 1h candles with sparkline context.",
          accent: "gold",
        },
        {
          title: "Derivatives",
          subtitle: "Funding · OI · L/S",
          detail: "Perp funding, open interest, long/short ratio, and taker buy/sell flow.",
          accent: "gold",
        },
        {
          title: "Macro lens",
          subtitle: "Fear & Greed · Market",
          detail: "Sentiment history, market structure, and correlation matrix vs majors.",
        },
        {
          title: "Conviction",
          subtitle: "News · Signal · Supply",
          detail: "Headline feed, trading signal meter, and circulating supply stats.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-featured-trio",
      label: "Stack",
      kicker: "Under the hood",
      headline: "Fast reads, respectful refresh",
      cards: [
        {
          title: "Snapshot store",
          subtitle: "MongoDB",
          detail: "Overview, dashboard, and bubblemap presets precomputed on tiered scheduler intervals.",
          accent: "gold",
        },
        {
          title: "Rate limits",
          subtitle: "Provider budgets",
          detail: "CoinGecko, Binance, and Coinbase fetches respect per-minute ceilings — no hammering on page load.",
          accent: "gold",
        },
        {
          title: "API surface",
          subtitle: "GET /btc/*",
          detail: "GET /btc/overview, /btc/dashboard, /btc/bubblemap — 503 until first snapshot is warm.",
        },
      ],
    },
    {
      id: "compare",
      kind: "statement",
      layout: "compare-columns",
      label: "Compare",
      kicker: "Before vs now",
      headline: "Tabs everywhere vs one command center",
      body: "Before: price on one site, funding on another, sentiment somewhere else. Now: scroll one page, jump with section nav, share any block as a card.",
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-list",
      label: "Product",
      kicker: "What you'll use",
      headline: "Built for researchers and creators",
      items: [
        {
          icon: Bitcoin,
          title: "BTC hub",
          description: "Full intelligence page at syraa.fun/btc with sticky section navigation.",
          href: "https://www.syraa.fun/btc",
        },
        {
          icon: LineChart,
          title: "Flow bubblemap",
          description: "TradingView Lightweight Charts bubblemap — exchange, interval, and variant toggles.",
          href: "https://www.syraa.fun/btc#section-bubblemap",
        },
        {
          icon: BarChart3,
          title: "Dashboard API",
          description: "GET /btc/dashboard returns all fifteen analysis sections in one payload.",
          href: "https://api.syraa.fun/btc/dashboard",
        },
        {
          icon: Share2,
          title: "Shareable cards",
          description: "Every section exports branded PNG + X copy — hero, metrics, chart, and analysis blocks.",
        },
        {
          icon: Newspaper,
          title: "News + sentiment",
          description: "Asset-scoped headlines and sentiment distribution without leaving the BTC page.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-counter-row",
      label: "Impact",
      kicker: "By the numbers",
      headline: "Bitcoin conviction, packaged",
      stats: [
        { value: "20", label: "Page sections" },
        { value: "15", label: "Analysis blocks" },
        { value: "3", label: "API endpoints" },
      ],
      narrative:
        "Researchers get a single scrollable command center. Creators get share-ready cards from every block. The backend refreshes on a schedule — visitors read snapshots, not raw provider quotas.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-banner",
      label: "Try it",
      headline: "Open the BTC Intelligence Hub.",
      subline: "Dashboard → BTC. Scroll the stack, jump sections, share any card to X.",
      links: [
        { label: "BTC hub", value: "syraa.fun/btc", href: "https://www.syraa.fun/btc" },
        { label: "Dashboard API", value: "api.syraa.fun/btc/dashboard", href: "https://api.syraa.fun/btc/dashboard" },
        { label: "Bubblemap API", value: "api.syraa.fun/btc/bubblemap", href: "https://api.syraa.fun/btc/bubblemap" },
      ],
    },
  ],
};
