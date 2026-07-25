import { Bot, Coins, LineChart, Shield, Store, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log / Genesis demo: OKX.AI Finance Copilot — aligned to okx-asp/DEMO-SCRIPT.md.
 * Export from /post/video/40 (Remotion Download) → syra-okxai-genesis-finance-copilot.mp4
 */
export const OKX_GENESIS_FINANCE_POST = defineVideoUpdate(
  {
    updateNumber: 40,
    id: "okx-genesis-finance",
    title: "OKX.AI Genesis",
    published: "July 2026",
    tagline:
      "Finance Copilot for agents on OKX.AI Genesis. Decision-ready crypto intelligence, pay-per-call x402, Syra Brain A2A.",
    shareCopyVideo: `Building for #OKXAI Genesis — Syra Finance Copilot for agents.

Agents don't need another raw price feed. They need decisions they can pay for per call.

→ A2MCP: signals, indicators, sentiment, arbitrage, Bitcoin hub, equity spreads
→ A2A: Syra Brain — natural-language token DD and market briefs
→ x402 live (incl. X Layer) · OpenAPI: api.syraa.fun/openapi.json

Demo in the video (under 90s): agent asks Brain → pay → grounded finance report.

Category: Finance Copilot
syraa.fun

#OKXAI #OKX #XLayer #x402`,
    shareCopyPhoto: `Building for #OKXAI Genesis — Syra Finance Copilot for agents.

Decision-ready crypto intelligence, not raw feeds. Pay per call with x402. Brain for token DD and market briefs.

syraa.fun · api.syraa.fun
#OKXAI`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Hook",
      eyebrow: "OKX.AI Genesis",
      title: "Syra",
      subtitle: "Finance Copilot for agents on OKX.AI. Pay-per-call intelligence that turns market data into decisions.",
      badge: "Finance Copilot · x402 · #OKXAI",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Problem",
      kicker: "Why this matters",
      headline: "Agents don't need another raw price feed.",
      body: "They need decisions — signals, risk, and research they can pay for per call. Syra is the Finance Copilot layer, not another undifferentiated data dump.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Demo",
      kicker: "Live path",
      headline: "Ask Brain. Hit 402. Get the brief.",
      body: "Prompt: Give me a quick BTC market brief — signal, sentiment, and key risks in the last 24h. Syra Brain selects tools server-side and returns grounded markdown with toolUsages.",
      highlights: [
        "HTTP 402 → x402 settle (Solana, Base, or X Layer)",
        "Brain picks news · signal · sentiment",
        "Markdown report — not vibes",
        "Analysis only — not trade execution",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "Ask → 402 → pay → decide",
      steps: [
        {
          step: "01",
          title: "Agent asks",
          description: "BTC brief, token DD, or cross-CEX arb in natural language.",
        },
        {
          step: "02",
          title: "HTTP 402",
          description: "Payment-Required with multi-chain accepts including X Layer.",
        },
        {
          step: "03",
          title: "Pay per call",
          description: "Agentic Wallet or payer signs; Syra unlocks the route.",
        },
        {
          step: "04",
          title: "Grounded brief",
          description: "Markdown + toolUsages[] — decision-ready finance output.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-row",
      label: "Catalog",
      kicker: "Finance bundle",
      headline: "48+ APIs. One Finance Copilot.",
      cards: [
        {
          title: "/signal",
          subtitle: "Trading",
          detail: "AI signal from CEX OHLCV technicals.",
          accent: "gold",
        },
        {
          title: "/indicator",
          subtitle: "TA",
          detail: "RSI, MACD, EMA, Bollinger, and more.",
          accent: "gold",
        },
        {
          title: "/sentiment",
          subtitle: "Narrative",
          detail: "30-day sentiment scores by ticker.",
        },
        {
          title: "/brain",
          subtitle: "A2A",
          detail: "Natural-language research agent.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Routes",
      kicker: "Also live",
      headline: "Finance routes agents call",
      items: [
        {
          icon: LineChart,
          title: "/arbitrage",
          description: "Cross-CEX spread rankings.",
          href: "https://api.syraa.fun/arbitrage",
        },
        {
          icon: Coins,
          title: "/bitcoin",
          description: "Bitcoin hub + taker-flow context.",
          href: "https://api.syraa.fun/bitcoin",
        },
        {
          icon: Store,
          title: "/equity · /spcx",
          description: "Tokenized equity Nasdaq vs on-chain.",
        },
        {
          icon: Zap,
          title: "/jupiter/quote",
          description: "Swap quote before capital moves.",
        },
        {
          icon: Bot,
          title: "Syra Brain A2A",
          description: "Negotiated research on OKX.AI.",
          href: "https://api.syraa.fun/brain",
        },
        {
          icon: Shield,
          title: "OpenAPI",
          description: "api.syraa.fun/openapi.json",
          href: "https://api.syraa.fun/openapi.json",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Proof",
      kicker: "Genesis",
      headline: "Built for Finance Copilot.",
      stats: [
        { value: "48+", label: "x402 resources" },
        { value: "2", label: "A2MCP + A2A" },
        { value: "#OKXAI", label: "Participation tag" },
      ],
      narrative:
        "Syra ASP #2311 · Finance category · pay-per-call x402 including X Layer · Syra Brain for grounded research.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Close",
      headline: "Syra · Finance Copilot for Agents · #OKXAI",
      subline: "Ask Brain. Pay per call. Ship the decision. syraa.fun · api.syraa.fun · docs.syraa.fun",
      links: [
        { label: "Site", value: "syraa.fun", href: "https://syraa.fun" },
        { label: "API", value: "api.syraa.fun", href: "https://api.syraa.fun" },
        {
          label: "Genesis",
          value: "Build X",
          href: "https://web3.okx.com/xlayer/build-x-series",
        },
      ],
    },
  ],
);
