import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Coins,
  Cpu,
  MessageSquare,
  Shield,
  Sparkles,
  Terminal,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

export const SYRA_TAGLINE = "Machine money for AI trading agents";
export const SYRA_MISSION =
  "Syra enables autonomous agents to generate revenue, hold treasury assets, participate in DeFi, and distribute value on Solana — so agents become independent economic actors, not tools waiting on humans for every financial decision.";

export const SYRA_VISION =
  "Our vision is an economy where millions of AI agents become productive economic actors powered by Solana — reasoning, earning, managing capital, and coordinating value in real time.";

export const SYRA_HIGHLIGHT =
  "Syra is not building another chatbot. We are building machine money for AI trading agents — x402 pay-per-call APIs plus agent wallets and treasury policy — so autonomous agents think, pay, and trade on Solana without glue code.";

export interface SyraStat {
  label: string;
  value: string;
  detail?: string;
}

export const SYRA_STATS: SyraStat[] = [
  { label: "Founded", value: "2025" },
  { label: "Chain", value: "Solana", detail: "Settlement layer for agent economies" },
  { label: "Stage", value: "Live", detail: "Product, community & ecosystem integrations" },
  { label: "Team", value: "2–5", detail: "Full-time builders on agent finance" },
  { label: "Funding", value: "Bootstrapped", detail: "Founder-led, no external round" },
];

export const SYRA_PROBLEM = {
  title: "Agents can think — but they cannot own capital",
  body: [
    "AI agents are becoming capable of research, automation, and complex workflows — yet most still cannot autonomously earn, manage, invest, or spend onchain without a human in the loop for treasury and coordination.",
    "The missing layer is native financial infrastructure: ownership of capital, treasury management, and machine-to-machine economic coordination at scale.",
  ],
};

export const SYRA_SOLUTION = {
  title: "Machine money on Solana",
  body: [
    "Syra is machine money for autonomous agents — revenue generation, asset custody patterns, DeFi participation, rewards distribution, and coordinated value transfer.",
    "Agents use Solana's speed and composability to hold assets, execute strategies, and interact economically in real time — not as demos, but as production infrastructure.",
  ],
};

export const SYRA_WHY_SOLANA = {
  title: "Why Solana",
  body: [
    "Solana is Syra's economic layer: low latency, high throughput, and a deep stack of financial primitives make it the natural settlement network for large numbers of autonomous agents acting in parallel.",
    "We build with TypeScript, Node.js, Solana SDKs, and agent-native payment rails (including x402) so machine economies stay composable with the rest of the ecosystem.",
  ],
};

export const SYRA_DIFFERENTIATION = {
  headline: "We build the financial layer — not another chatbot",
  body: "Most AI-agent projects optimize for intelligence, workflows, or user interfaces. Syra focuses on economic autonomy: the long-term winner in the agent market will be the stack that lets agents generate, manage, and deploy capital efficiently — not the agent with the slickest UI.",
};

export const SYRA_PRODUCT_FLOW = [
  {
    step: "01",
    title: "Earn",
    description: "Agents capture revenue from work they perform — onchain paths built for machines.",
  },
  {
    step: "02",
    title: "Manage",
    description: "Treasury balances, allocations, and auditable movement of agent-held assets.",
  },
  {
    step: "03",
    title: "Deploy",
    description: "DeFi, rewards, and coordinated settlement as independent economic actors.",
  },
] as const;

export interface SyraPillar {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const SYRA_PILLARS: SyraPillar[] = [
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
    description: "Strategies, liquidity, and ecosystem integrations where agents can deploy capital.",
  },
  {
    icon: Cpu,
    title: "Agent-native stack",
    description: "Built for autonomous actors — APIs, tools, and workflows machines can run end to end.",
  },
  {
    icon: Zap,
    title: "Real-time on Solana",
    description: "Low-fee, high-throughput execution so many agents can coordinate economically at once.",
  },
  {
    icon: Shield,
    title: "Non-custodial by design",
    description: "You keep the keys. Syra coordinates intelligence and flows — it does not custody user wallets.",
  },
];

export interface SyraCapability {
  title: string;
  description: string;
}

export const SYRA_CAPABILITIES: SyraCapability[] = [
  {
    title: "Earn onchain",
    description: "Revenue paths and integrations so agents can capture value from work they perform.",
  },
  {
    title: "Manage treasuries",
    description: "Balances, allocations, and policy-aware movement of agent-held assets.",
  },
  {
    title: "Participate in DeFi",
    description: "Liquidity, yield, and protocol surfaces agents can use with clear risk context.",
  },
  {
    title: "Distribute rewards",
    description: "Value flows back to operators, stakeholders, and communities agents serve.",
  },
  {
    title: "Pay per capability",
    description: "x402 and composable HTTP payments so agents discover and fund tools autonomously.",
  },
  {
    title: "Coordinate at scale",
    description: "Machine-to-machine settlement and handoffs without human bottlenecks on every tx.",
  },
];

export interface SyraTractionItem {
  title: string;
  description: string;
}

export const SYRA_TRACTION: SyraTractionItem[] = [
  {
    title: "Live product",
    description: "Web agent, APIs, and ongoing capability deployments — not a slide-deck prototype.",
  },
  {
    title: "Active community",
    description: "Hundreds of early members and operators as interest in autonomous finance accelerates.",
  },
  {
    title: "Ecosystem integrations",
    description: "Partners and protocol surfaces across Solana for data, execution, and agent tooling.",
  },
  {
    title: "Current focus",
    description: "Autonomous revenue, DeFi participation, treasury management, and agent coordination.",
  },
];

export interface SyraPlatform {
  icon: LucideIcon;
  name: string;
  description: string;
  href: string;
  external?: boolean;
}

export const SYRA_PLATFORMS: SyraPlatform[] = [
  {
    icon: Bot,
    name: "Web agent",
    description: "Research, tools, treasury workflows, and onchain actions at syraa.fun.",
    href: "/",
    external: false,
  },
  {
    icon: MessageSquare,
    name: "Telegram",
    description: "Agent access and updates on the go via @syra_trading_bot.",
    href: "https://t.me/syra_trading_bot",
    external: true,
  },
  {
    icon: Terminal,
    name: "API gateway",
    description: "x402 pay-per-use routes, OpenAPI specs, and partner integrations for machines.",
    href: "https://api.syraa.fun",
    external: true,
  },
  {
    icon: Sparkles,
    name: "Documentation",
    description: "Guides for agents, APIs, staking, experiments, and developer workflows.",
    href: "https://docs.syraa.fun",
    external: true,
  },
];

export interface SyraCommunityLink {
  label: string;
  href: string;
  description: string;
}

export const SYRA_COMMUNITY_LINKS: SyraCommunityLink[] = [
  {
    label: "Website",
    href: "https://syraa.fun",
    description: "Product overview and updates",
  },
  {
    label: "Documentation",
    href: "https://docs.syraa.fun",
    description: "Developer and operator guides",
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/syra_agent",
    description: "Announcements and product news",
  },
  {
    label: "Telegram",
    href: "https://t.me/syra_ai",
    description: "Community and support",
  },
  {
    label: "Support",
    href: "mailto:support@syraa.fun",
    description: "support@syraa.fun",
  },
];

export const SYRA_DISCLAIMER =
  "Syra provides infrastructure and intelligence tools for autonomous agents — not financial advice, guaranteed returns, or custody of your keys. Onchain activity carries risk. You are responsible for your own compliance, configuration, and execution.";
