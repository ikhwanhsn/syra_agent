import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Brain,
  Globe,
  Layers,
  Lock,
  MessageSquare,
  Network,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

export type DeckSlideKind =
  | "cover"
  | "statement"
  | "pillars"
  | "flow"
  | "capabilities"
  | "stack"
  | "market"
  | "business"
  | "traction"
  | "roadmap"
  | "moat"
  | "closing";

export interface DeckSlideBase {
  id: string;
  kind: DeckSlideKind;
  label: string;
}

export interface DeckCoverSlide extends DeckSlideBase {
  kind: "cover";
  eyebrow: string;
  title: string;
  subtitle: string;
  footnote: string;
}

export interface DeckStatementSlide extends DeckSlideBase {
  kind: "statement";
  kicker: string;
  headline: string;
  body: string;
  bullets?: string[];
}

export interface DeckPillar {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface DeckPillarsSlide extends DeckSlideBase {
  kind: "pillars";
  kicker: string;
  headline: string;
  pillars: DeckPillar[];
}

export interface DeckFlowStep {
  step: string;
  title: string;
  description: string;
}

export interface DeckFlowSlide extends DeckSlideBase {
  kind: "flow";
  kicker: string;
  headline: string;
  steps: DeckFlowStep[];
}

export interface DeckCapabilityRow {
  title: string;
  description: string;
}

export interface DeckCapabilitiesSlide extends DeckSlideBase {
  kind: "capabilities";
  kicker: string;
  headline: string;
  rows: DeckCapabilityRow[];
}

export interface DeckStackLayer {
  label: string;
  items: string[];
}

export interface DeckStackSlide extends DeckSlideBase {
  kind: "stack";
  kicker: string;
  headline: string;
  layers: DeckStackLayer[];
}

export interface DeckStat {
  value: string;
  label: string;
  detail?: string;
}

export interface DeckMarketSlide extends DeckSlideBase {
  kind: "market";
  kicker: string;
  headline: string;
  stats: DeckStat[];
  narrative: string;
}

export interface DeckRevenueStream {
  title: string;
  description: string;
}

export interface DeckBusinessSlide extends DeckSlideBase {
  kind: "business";
  kicker: string;
  headline: string;
  streams: DeckRevenueStream[];
}

export interface DeckTractionItem {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
}

export interface DeckTractionSlide extends DeckSlideBase {
  kind: "traction";
  kicker: string;
  headline: string;
  items: DeckTractionItem[];
}

export interface DeckRoadmapQuarter {
  period: string;
  items: string[];
}

export interface DeckRoadmapSlide extends DeckSlideBase {
  kind: "roadmap";
  kicker: string;
  headline: string;
  quarters: DeckRoadmapQuarter[];
}

export interface DeckMoatRow {
  dimension: string;
  syra: string;
}

export interface DeckMoatSlide extends DeckSlideBase {
  kind: "moat";
  kicker: string;
  headline: string;
  rows: DeckMoatRow[];
}

export interface DeckClosingSlide extends DeckSlideBase {
  kind: "closing";
  headline: string;
  subline: string;
  contacts: { label: string; value: string; href: string }[];
  disclaimer: string;
}

export type DeckSlide =
  | DeckCoverSlide
  | DeckStatementSlide
  | DeckPillarsSlide
  | DeckFlowSlide
  | DeckCapabilitiesSlide
  | DeckStackSlide
  | DeckMarketSlide
  | DeckBusinessSlide
  | DeckTractionSlide
  | DeckRoadmapSlide
  | DeckMoatSlide
  | DeckClosingSlide;

export const SYRA_PITCH_DECK: DeckSlide[] = [
  {
    id: "cover",
    kind: "cover",
    label: "Cover",
    eyebrow: "Investor overview · Confidential",
    title: "Syra",
    subtitle: "The intelligence layer for autonomous trading agents on Solana",
    footnote: "Research-driven · Risk-aware · Non-custodial",
  },
  {
    id: "problem",
    kind: "statement",
    label: "Problem",
    kicker: "The gap",
    headline: "Agents are shipping capital faster than intelligence",
    body: "Autonomous trading agents need live market context, on-chain flow, and narrative signal in one auditable stack. Today that data is fragmented across dashboards, bots, and paywalled APIs with no composable payment rail.",
    bullets: [
      "Generic LLMs lack trading-specific grounding and risk framing",
      "Data vendors are siloed — high integration cost per agent",
      "No standard for agents to discover, pay for, and compose APIs at runtime",
      "Operators cannot audit what an agent saw before it moved size",
    ],
  },
  {
    id: "solution",
    kind: "statement",
    label: "Solution",
    kicker: "Our answer",
    headline: "Trader-grade intelligence built for agents that execute",
    body: "Syra unifies research, signals, and tool access into a single intelligence layer on Solana — with HTTP 402 micropayments so agents pay per call and stay composable.",
    bullets: [
      "Structured outputs: market overview, technicals, risk context, AI insights",
      "Agent tools via API gateway — signals, research, news, on-chain partners",
      "Non-custodial by design: Syra never holds keys or moves funds without sign-off",
    ],
  },
  {
    id: "product",
    kind: "flow",
    label: "Product",
    kicker: "How Syra works",
    headline: "From question to actionable context in three layers",
    steps: [
      {
        step: "01",
        title: "Ingest",
        description:
          "Real-time market data, on-chain flows, news, and sentiment from integrated partners and Syra models.",
      },
      {
        step: "02",
        title: "Reason",
        description:
          "Trading-tuned workflows produce structured research — levels, momentum bias, scenarios, and confidence framing.",
      },
      {
        step: "03",
        title: "Act",
        description:
          "Humans and agents consume via web, Telegram, or API — with x402 settlement when external tools are invoked.",
      },
    ],
  },
  {
    id: "pillars",
    kind: "pillars",
    label: "Platform",
    kicker: "Why operators choose Syra",
    headline: "Six pillars of agent-grade market intelligence",
    pillars: [
      {
        icon: Brain,
        title: "Agent-grade intelligence",
        description: "Models and workflows tuned for trading decisions — not generic chat.",
      },
      {
        icon: Shield,
        title: "Security for agent capital",
        description: "Explicit approvals, auditable tool use, and conservative defaults when funds move.",
      },
      {
        icon: Zap,
        title: "Solana-native speed",
        description: "Low-latency reads and execution paths on Solana DEXs with x402 for paid tools.",
      },
      {
        icon: Globe,
        title: "Agentic payments",
        description: "HTTP 402 + x402 / MPP — discover APIs, pay per call, remain composable.",
      },
      {
        icon: Lock,
        title: "Non-custodial",
        description: "Users keep keys; Syra never custodies wallets or signs without authorization.",
      },
      {
        icon: BarChart3,
        title: "Live market surface",
        description: "Dashboards, alpha feeds, and signals for operators who ship size.",
      },
    ],
  },
  {
    id: "capabilities",
    kind: "capabilities",
    label: "Capabilities",
    kicker: "Intelligence surface",
    headline: "Structured research output on every read",
    rows: [
      {
        title: "Market overview",
        description: "Price, volume, volatility, and trend strength in one view.",
      },
      {
        title: "Technical indicators",
        description: "RSI, MACD, moving averages, Bollinger Bands with contextual framing.",
      },
      {
        title: "Action perspectives",
        description: "Key levels, momentum bias, and scenario outlooks — not certainty theater.",
      },
      {
        title: "Risk context",
        description: "Reward-to-risk awareness and exposure considerations baked in.",
      },
      {
        title: "AI insights",
        description: "Confidence and sentiment interpretation grounded in live data.",
      },
      {
        title: "On-chain signals",
        description: "Smart money, DEX activity, and token-level research where APIs exist.",
      },
    ],
  },
  {
    id: "stack",
    kind: "stack",
    label: "Infrastructure",
    kicker: "Technical stack",
    headline: "Composable agent infrastructure on Solana",
    layers: [
      {
        label: "Experience",
        items: [
          "Web agent · agent.syraa.fun",
          "Telegram bot · @syra_trading_bot",
          "API Playground · payment-gated workspace",
        ],
      },
      {
        label: "Intelligence API",
        items: [
          "Signals, research, news, sentiment, gems, KOL flows",
          "Partner tools: Nansen, GMGN, Tokens.xyz, Bankr, Neynar",
          "OpenAPI + x402 discovery at api.syraa.fun",
        ],
      },
      {
        label: "Agent rails",
        items: [
          "HTTP 402 micropayments (USDC on Solana)",
          "MPP discovery metadata for AgentCash / MPPscan",
          "ERC-8004 / Solana agent registry (8004) for discoverability",
        ],
      },
      {
        label: "Execution & capital",
        items: [
          "Non-custodial wallets (Privy, Solana adapters)",
          "Staking & token utilities via Streamflow",
          "Experiment surfaces: arena, vibe trading, LP agents",
        ],
      },
    ],
  },
  {
    id: "market",
    kind: "market",
    label: "Market",
    kicker: "Opportunity",
    headline: "The agentic finance stack is forming on Solana",
    stats: [
      { value: "$180B+", label: "Solana DeFi TVL", detail: "High-velocity venue for agent execution" },
      { value: "1,000+", label: "Target autonomous agents", detail: "Roadmap scale by Q4 2026" },
      { value: "402", label: "HTTP payment standard", detail: "Pay-per-call API economy for agents" },
    ],
    narrative:
      "As autonomous agents manage more on-chain capital, demand grows for intelligence APIs that are discoverable, metered, and auditable — not another opaque signal Telegram channel.",
  },
  {
    id: "business",
    kind: "business",
    label: "Business model",
    kicker: "Monetization",
    headline: "Usage-based revenue aligned with agent activity",
    streams: [
      {
        title: "x402 API consumption",
        description:
          "Per-route micropayments in USDC on Solana across signals, research, partner tools, and premium endpoints.",
      },
      {
        title: "Volume & token incentives",
        description:
          "$SYRA staking discounts on API fees; fee share routed to community airdrops and treasury buybacks.",
      },
      {
        title: "Enterprise & white-label",
        description:
          "Custom SLAs, compliance-aware intelligence APIs, and white-label stacks for funds and platforms (2026+).",
      },
      {
        title: "Agent marketplace",
        description:
          "Performance leaderboards, reputation scoring, and grant programs as the agent network scales.",
      },
    ],
  },
  {
    id: "traction",
    kind: "traction",
    label: "Traction",
    kicker: "Live today",
    headline: "Multi-surface product already in market",
    items: [
      {
        icon: Bot,
        title: "Web agent",
        description: "Full research and trading workflows at agent.syraa.fun.",
        href: "https://agent.syraa.fun",
      },
      {
        icon: MessageSquare,
        title: "Telegram",
        description: "Chat-native market analysis for mobile operators.",
        href: "https://t.me/syra_trading_bot",
      },
      {
        icon: Terminal,
        title: "API gateway",
        description: "Production x402 surface with OpenAPI and MPP catalogs.",
        href: "https://api.syraa.fun",
      },
      {
        icon: Sparkles,
        title: "x402scan agent",
        description: "Listed autonomous agent on the x402 discovery ecosystem.",
        href: "https://x.com/syra_agent",
      },
      {
        icon: Layers,
        title: "Monorepo velocity",
        description:
          "Web app, API, playground, docs, prediction game, and internal agent experiments shipping in parallel.",
      },
      {
        icon: Network,
        title: "Partner integrations",
        description: "Nansen, GMGN, Tokens.xyz, Bankr, Neynar, Streamflow, and more via agent tools.",
      },
    ],
  },
  {
    id: "roadmap",
    kind: "roadmap",
    label: "Roadmap",
    kicker: "2025–2026",
    headline: "Shipping the intelligence flywheel",
    quarters: [
      {
        period: "Q4 2025",
        items: [
          "Sentiment, risk scoring, whale tracker APIs",
          "x402scan directory launch · first 10–20 autonomous agents",
        ],
      },
      {
        period: "Q1 2026",
        items: [
          "Regime detection, correlation matrix, exit timing APIs",
          "$SYRA staking discounts · x402 revenue → buyback & airdrops",
        ],
      },
      {
        period: "Q2 2026",
        items: [
          "Custom model training & backtesting APIs",
          "Multi-chain expansion · enterprise white-label tier",
        ],
      },
      {
        period: "H2 2026",
        items: [
          "Institutional SLAs · public agent performance leaderboard",
          "Scale to 1,000+ autonomous agents · grant program",
        ],
      },
    ],
  },
  {
    id: "moat",
    kind: "moat",
    label: "Moat",
    kicker: "Defensibility",
    headline: "Built for the agent economy, not the dashboard economy",
    rows: [
      {
        dimension: "Payment-native APIs",
        syra: "HTTP 402 + x402 / MPP — agents pay per call without subscriptions",
      },
      {
        dimension: "Trading-specific intelligence",
        syra: "Risk-aware structured output, not generic summarization",
      },
      {
        dimension: "Composable tool graph",
        syra: "Single agent gateway to partners with unified settlement",
      },
      {
        dimension: "Solana execution path",
        syra: "Low-latency venue alignment for agents that actually trade",
      },
      {
        dimension: "Data flywheel",
        syra: "Cross-agent learning, reputation, and leaderboard (roadmap)",
      },
    ],
  },
  {
    id: "closing",
    kind: "closing",
    label: "Contact",
    headline: "Let's build the intelligence layer for autonomous finance",
    subline: "Syra — smart intelligence for traders and the agents that serve them.",
    contacts: [
      { label: "Website", value: "syraa.fun", href: "https://syraa.fun" },
      { label: "Product", value: "agent.syraa.fun", href: "https://agent.syraa.fun" },
      { label: "API", value: "api.syraa.fun", href: "https://api.syraa.fun" },
      { label: "Docs", value: "docs.syraa.fun", href: "https://docs.syraa.fun" },
      { label: "Email", value: "support@syraa.fun", href: "mailto:support@syraa.fun" },
      { label: "X", value: "@syra_agent", href: "https://x.com/syra_agent" },
    ],
    disclaimer:
      "This deck is for informational purposes only. Syra provides research and intelligence tools — not financial advice or guaranteed returns. Past product milestones do not guarantee future performance.",
  },
];

export const DECK_SLIDE_COUNT = SYRA_PITCH_DECK.length;
