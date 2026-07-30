import { BookOpen, Bot, Coins, Layers, Search, Terminal } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Yield.xyz AgentKit yield discovery for Syra Invest agents.
 */
export const YIELD_XYZ_INTEGRATION_POST = defineVideoUpdate(
  {
    updateNumber: 44,
    id: "yield-xyz-integration",
    title: "Yield.xyz Discovery",
    published: "July 2026",
    tagline:
      "Search 3,000+ onchain yields across 80+ networks through Syra. Compare rates, check risk, then decide. Pay per call.",
    shareCopyVideo: `SHIP LOG · Syra × Yield.xyz is live.

Agents can now search thousands of onchain yields in one place: lending, vaults, staking, RWAs, and liquid staking across 80+ networks.

Find opportunities. Compare APY and TVL history. Read risk ratings before you commit capital.
Pay per call with x402 or MCP. Discovery and diligence only for now.

syraa.fun`,
    shareCopyPhoto: `SHIP LOG · Syra × Yield.xyz yield discovery.

Eight new Invest tools: find, get, networks, providers, risk, reward history, TVL history, and wallet balances.
3,000+ opportunities. 80+ networks. Pay per call.

syraa.fun · docs.yield.xyz`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-spotlight",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Yield.xyz × Syra",
      subtitle:
        "One ask for yields across chains. Compare rates, check risk, track positions. Pay per call.",
      badge: "Invest · 8 tools",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-accent-bar",
      label: "Context",
      kicker: "Why this matters",
      headline: "Yield is fragmented by design.",
      body: "Every protocol has its own app, docs, and risk profile. Agents should not stitch together 50 dashboards to find where USDC earns more. Yield.xyz aggregates 3,000+ opportunities across 80+ networks. Syra now wraps that discovery so agents can search, compare, and diligence in one paid call path.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-checklist",
      label: "Shipped",
      kicker: "What we built",
      headline: "Eight Yield Invest tools",
      body: "Read-only discovery and diligence are live behind agent tools and MCP. Agents pay Syra per call and get structured JSON: opportunities, risk, history, and balances. No deposit or withdraw tools in this release.",
      highlights: [
        "yield-find, search and filter opportunities",
        "yield-get, full metadata for one yield",
        "yield-risk, letter grade and score",
        "yield-reward-history and yield-tvl-history",
        "yield-balances, positions and claimable rewards",
        "yield-networks and yield-providers for coverage",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-pipeline",
      label: "Flow",
      kicker: "How it works",
      headline: "Ask → compare → decide",
      steps: [
        {
          step: "01",
          title: "Search yields",
          description: "Call yield-find with a token, network, or type like lending or vault.",
        },
        {
          step: "02",
          title: "Diligence",
          description: "Open yield-get, yield-risk, and history tools on the best candidates.",
        },
        {
          step: "03",
          title: "Pay per call",
          description: "x402 USDC or agent wallet. Same Syra payment path as other Invest tools.",
        },
        {
          step: "04",
          title: "Track wallets",
          description: "Use yield-balances to see positions and pending actions across a network.",
        },
      ],
    },
    {
      id: "tools",
      kind: "cards",
      layout: "cards-bento",
      label: "Tools",
      kicker: "What you get",
      headline: "Discovery that agents can use.",
      cards: [
        {
          title: "Find",
          subtitle: "Search",
          detail: "Filter 3,000+ yields by token, network, type, and sort by reward rate.",
          accent: "gold",
        },
        {
          title: "Risk",
          subtitle: "Diligence",
          detail: "Letter grade and score so agents do not chase APY blind.",
          accent: "gold",
        },
        {
          title: "History",
          subtitle: "Trends",
          detail: "Reward-rate and TVL history before you size a position.",
        },
        {
          title: "Balances",
          subtitle: "Track",
          detail: "Active positions, pending actions, and claimable rewards for a wallet.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live for agents and builders",
      items: [
        {
          icon: Bot,
          title: "Agent chat / MCP",
          description: "syra_invest_yield_find and friends in the curated MCP profile.",
          href: "https://www.syraa.fun/chat",
        },
        {
          icon: Terminal,
          title: "Agent tools",
          description: "Call yield-find via POST /agent/tools/call with pay-per-call.",
        },
        {
          icon: Search,
          title: "Yield research",
          description: "Compare Base USDC vaults, Ethereum staking, and more in one loop.",
        },
        {
          icon: Coins,
          title: "Invest pillar",
          description: "Discovery rail for capital deployment research, not Spend market data.",
        },
        {
          icon: Layers,
          title: "Yield.xyz",
          description: "AgentKit across 80+ networks. Learn more at docs.yield.xyz.",
          href: "https://docs.yield.xyz/docs/agents-overview",
        },
        {
          icon: BookOpen,
          title: "Scope",
          description: "Read-only now. Enter, exit, and rebalance stay for a later release.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Coverage",
      headline: "Yield without protocol homework",
      stats: [
        { value: "3K+", label: "Opportunities" },
        { value: "80+", label: "Networks" },
        { value: "8", label: "Agent tools" },
      ],
      narrative:
        "Yield.xyz supplies the catalog. Syra packages it for agents with pay-per-call pricing. You get search, risk, and history, not another single-protocol wrapper.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "Ask Syra for better yields.",
      subline:
        "Try yield-find on USDC Base or ETH staking. Discovery and diligence only. Syra does not build or broadcast deposit transactions in this release.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        {
          label: "MCP",
          value: "syra_invest_yield_find",
          href: "https://www.syraa.fun/chat",
        },
        {
          label: "Yield.xyz",
          value: "docs.yield.xyz",
          href: "https://docs.yield.xyz/docs/agents-overview",
        },
      ],
    },
  ],
);
