import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Coins,
  Cpu,
  Layers,
  MessageSquare,
  Network,
  Shield,
  Sparkles,
  Terminal,
  TrendingUp,
  Wallet,
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
    subtitle: "Machine money for AI agents on Solana",
    footnote: "Autonomous revenue · Treasury · DeFi · Non-custodial",
  },
  {
    id: "problem",
    kind: "statement",
    label: "Problem",
    kicker: "The gap",
    headline: "Agents can reason — but they cannot own capital",
    body: "AI agents are becoming capable of research, automation, and complex workflows. Most still cannot autonomously earn, manage, invest, or spend onchain without humans handling treasury and economic coordination.",
    bullets: [
      "Agents create value but lack native financial infrastructure",
      "Treasury management stays manual — a bottleneck on every deployment",
      "No standard layer for machines to earn, hold, and deploy capital at scale",
      "The agent economy cannot scale until money moves as autonomously as intelligence",
    ],
  },
  {
    id: "solution",
    kind: "statement",
    label: "Solution",
    kicker: "Our answer",
    headline: "Machine money infrastructure on Solana",
    body: "Syra is the financial operating layer for autonomous agents — revenue generation, treasury management, DeFi participation, rewards distribution, and real-time value coordination on Solana.",
    bullets: [
      "Syra is not building another AI agent — we build the economic layer agents run on",
      "Solana: low latency, high throughput, composable financial primitives",
      "Non-custodial: operators keep keys; Syra coordinates intelligence and flows",
    ],
  },
  {
    id: "product",
    kind: "flow",
    label: "Product",
    kicker: "How Syra works",
    headline: "From autonomous work to onchain economics",
    steps: [
      {
        step: "01",
        title: "Earn",
        description:
          "Agents capture revenue from work they perform — integrations and onchain paths built for machines, not manual ops teams.",
      },
      {
        step: "02",
        title: "Manage",
        description:
          "Treasury balances, allocations, and policy-aware movement of agent-held assets with explicit, auditable controls.",
      },
      {
        step: "03",
        title: "Deploy",
        description:
          "DeFi strategies, rewards distribution, and coordinated settlement — agents act as independent economic actors on Solana.",
      },
    ],
  },
  {
    id: "pillars",
    kind: "pillars",
    label: "Platform",
    kicker: "Core pillars",
    headline: "Built for the machine economy",
    pillars: [
      {
        icon: Coins,
        title: "Autonomous revenue",
        description: "Agents generate and route income onchain without manual treasury babysitting.",
      },
      {
        icon: Wallet,
        title: "Treasury management",
        description: "Hold, allocate, and monitor agent capital with explicit, auditable controls.",
      },
      {
        icon: TrendingUp,
        title: "DeFi participation",
        description: "Liquidity, yield, and protocol surfaces where agents deploy capital with clear risk context.",
      },
      {
        icon: Cpu,
        title: "Agent-native stack",
        description: "APIs, tools, and workflows designed for autonomous actors — not human dashboards.",
      },
      {
        icon: Zap,
        title: "Real-time on Solana",
        description: "Low-fee, high-throughput execution so many agents coordinate economically in parallel.",
      },
      {
        icon: Shield,
        title: "Non-custodial",
        description: "Operators keep keys. Syra never custodies wallets or signs without authorization.",
      },
    ],
  },
  {
    id: "capabilities",
    kind: "capabilities",
    label: "Capabilities",
    kicker: "What agents can do",
    headline: "Financial primitives for autonomous actors",
    rows: [
      {
        title: "Earn onchain",
        description: "Revenue paths and integrations so agents capture value from work they perform.",
      },
      {
        title: "Manage treasuries",
        description: "Balances, allocations, and policy-aware movement of agent-held assets.",
      },
      {
        title: "Participate in DeFi",
        description: "Liquidity, yield, and protocol surfaces with structured risk context.",
      },
      {
        title: "Distribute rewards",
        description: "Value flows back to operators, stakeholders, and communities agents serve.",
      },
      {
        title: "Pay per capability",
        description: "x402 and composable HTTP payments — agents discover and fund tools autonomously.",
      },
      {
        title: "Coordinate at scale",
        description: "Machine-to-machine settlement without a human on every transaction.",
      },
    ],
  },
  {
    id: "stack",
    kind: "stack",
    label: "Infrastructure",
    kicker: "Technical stack",
    headline: "Solana as the economic layer for agents",
    layers: [
      {
        label: "Experience",
        items: [
          "Web agent · agent.syraa.fun",
          "Telegram · @syra_trading_bot",
          "Docs & operator guides · docs.syraa.fun",
        ],
      },
      {
        label: "Machine money API",
        items: [
          "Treasury workflows, agent tools, partner integrations",
          "Signals, research, on-chain data where agents need context",
          "OpenAPI + x402 discovery at api.syraa.fun",
        ],
      },
      {
        label: "Agent rails",
        items: [
          "HTTP 402 micropayments (USDC on Solana)",
          "MPP / AgentCash discovery for composable tool graphs",
          "Agent registry (8004) for discoverability and reputation",
        ],
      },
      {
        label: "Capital & execution",
        items: [
          "Non-custodial wallets (Privy, Solana adapters)",
          "DeFi participation, staking, experiment surfaces",
          "Real-time settlement aligned with Solana performance",
        ],
      },
    ],
  },
  {
    id: "market",
    kind: "market",
    label: "Market",
    kicker: "Opportunity",
    headline: "The machine economy is inevitable",
    stats: [
      { value: "Millions", label: "AI agents ahead", detail: "Expected scale of the autonomous agent economy" },
      { value: "Solana", label: "Settlement layer", detail: "Speed, fees, and DeFi depth for agent coordination" },
      { value: "2025", label: "Founded & shipping", detail: "Live product — not a concept deck" },
    ],
    narrative:
      "As AI becomes more autonomous, demand for machine-native financial systems becomes unavoidable. The long-term winner will not be the agent with the highest intelligence — it will be the stack that lets agents generate, manage, and deploy capital efficiently.",
  },
  {
    id: "business",
    kind: "business",
    label: "Business model",
    kicker: "Path to scale",
    headline: "Revenue aligned with the agent economy",
    streams: [
      {
        title: "Agent infrastructure",
        description:
          "Core platform fees for treasury tooling, coordination, and production agent deployments.",
      },
      {
        title: "Transaction & API usage",
        description:
          "x402 micropayments and per-call routes as agents consume data, tools, and partner surfaces.",
      },
      {
        title: "DeFi & treasury services",
        description:
          "Premium automation, strategy integrations, and managed flows for agent-held capital.",
      },
      {
        title: "Enterprise agents",
        description:
          "Custom deployments, SLAs, and white-label machine-money stacks for funds and platforms.",
      },
    ],
  },
  {
    id: "traction",
    kind: "traction",
    label: "Traction",
    kicker: "Live today",
    headline: "Shipping machine money in the open",
    items: [
      {
        icon: Bot,
        title: "Web agent",
        description: "Research, treasury workflows, and onchain actions at agent.syraa.fun.",
        href: "https://agent.syraa.fun",
      },
      {
        icon: MessageSquare,
        title: "Telegram",
        description: "Agent access and community on the go.",
        href: "https://t.me/syra_trading_bot",
      },
      {
        icon: Terminal,
        title: "API gateway",
        description: "Production x402 surface with OpenAPI and partner tool integrations.",
        href: "https://api.syraa.fun",
      },
      {
        icon: Sparkles,
        title: "Ecosystem presence",
        description: "Active community, x402/agent discovery listings, and Solana partner integrations.",
        href: "https://x.com/syra_agent",
      },
      {
        icon: Layers,
        title: "Full-stack velocity",
        description:
          "Web, API, docs, playground, and agent experiments shipping in parallel — bootstrapped, founder-led.",
      },
      {
        icon: Network,
        title: "Partner graph",
        description: "Nansen, GMGN, Bankr, Neynar, Streamflow, and more via unified agent tools.",
      },
    ],
  },
  {
    id: "roadmap",
    kind: "roadmap",
    label: "Roadmap",
    kicker: "2025–2026",
    headline: "Scaling the agent financial layer",
    quarters: [
      {
        period: "Now",
        items: [
          "Autonomous revenue generation and treasury management",
          "DeFi participation and agent coordination on Solana",
        ],
      },
      {
        period: "H1 2026",
        items: [
          "Deeper Solana infrastructure and protocol integrations",
          "Enterprise agent deployments and premium automation tiers",
        ],
      },
      {
        period: "H2 2026",
        items: [
          "Multi-agent economic coordination at scale",
          "Solana Mobile exploration for native financial agents",
        ],
      },
      {
        period: "Beyond",
        items: [
          "Financial OS for a growing share of the autonomous agent economy",
          "Eight-figure revenue path as agent count and onchain activity compound",
        ],
      },
    ],
  },
  {
    id: "moat",
    kind: "moat",
    label: "Moat",
    kicker: "Defensibility",
    headline: "We build the financial layer — not another chatbot",
    rows: [
      {
        dimension: "Category focus",
        syra: "Economic autonomy for agents — not intelligence theater or generic UI",
      },
      {
        dimension: "Solana-native economics",
        syra: "Real-time settlement and composable DeFi for machines acting in parallel",
      },
      {
        dimension: "Agent-native payments",
        syra: "x402 / HTTP 402 — discover, pay, and compose APIs without human billing ops",
      },
      {
        dimension: "Production stack",
        syra: "Live web agent, API gateway, and ecosystem integrations — shipping since 2025",
      },
      {
        dimension: "Founder-market fit",
        syra: "Built at the intersection of AI, Web3, and developer infrastructure — for the machine economy",
      },
    ],
  },
  {
    id: "closing",
    kind: "closing",
    label: "Contact",
    headline: "Let's build machine money for the agent economy",
    subline: "Syra — enabling AI agents to become independent economic actors on Solana.",
    contacts: [
      { label: "Website", value: "syraa.fun", href: "https://syraa.fun" },
      { label: "Product", value: "agent.syraa.fun", href: "https://agent.syraa.fun" },
      { label: "API", value: "api.syraa.fun", href: "https://api.syraa.fun" },
      { label: "Docs", value: "docs.syraa.fun", href: "https://docs.syraa.fun" },
      { label: "Email", value: "support@syraa.fun", href: "mailto:support@syraa.fun" },
      { label: "X", value: "@syra_agent", href: "https://x.com/syra_agent" },
    ],
    disclaimer:
      "This deck is for informational purposes only. Syra provides infrastructure and intelligence tools for autonomous agents — not financial advice, guaranteed returns, or custody of your keys. Onchain activity carries risk.",
  },
];

export const DECK_SLIDE_COUNT = SYRA_PITCH_DECK.length;
