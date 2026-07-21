import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Coins,
  Cpu,
  Shield,
  Sparkles,
  Terminal,
  TrendingUp,
  Wallet,
  Zap,
  Sprout,
  Activity,
} from "lucide-react";
import { SYRA_AGENT_DESCRIPTION, SYRA_LIVE_SUBLINE } from "@/lib/syraBranding";

export { SYRA_TAGLINE, SYRA_LIVE_SUBLINE, SYRA_PILLAR_STATUS } from "@/lib/syraBranding";

export const SYRA_MISSION =
  "Syra is machine money for agents — Earn, Treasury, Invest, Spend, and Grow on Solana. Live today: pay-per-call crypto intelligence over x402, MCP, and a typed SDK.";

export const SYRA_VISION =
  "Our vision is an economy where millions of AI agents hold capital, pay for tools, and coordinate value without human billing ops — machine money as infrastructure.";

export const SYRA_HIGHLIGHT = SYRA_AGENT_DESCRIPTION;

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
  title: "Agents can think — but they cannot pay for tools",
  body: [
    "AI agents run research and automation workflows — yet most still need humans to sign up for API keys, manage vendor accounts, and approve every paid request.",
    "The missing layer is machine-native payments: discover a route, settle USDC on HTTP 402, and call again without human billing ops.",
  ],
};

export const SYRA_SOLUTION = {
  title: "Machine money on Solana — Spend live today",
  body: [
    "Syra is machine money for agents: Earn, Treasury, Invest, Spend, and Grow. Live today is Spend — x402 micropayments, MCP tools, and a typed SDK so agents fund tools autonomously.",
    "One wallet pays many routes: news, sentiment, signals, smart money, and execution — no per-vendor API keys.",
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
  headline: "We build machine money — not another chatbot",
  body: "Most AI-agent projects optimize for chat UIs or orchestration. Syra builds the money layer: agents earn, allocate, invest, spend via x402, and grow capital — with Spend live today and the other pillars graduating as they meet production criteria.",
};

export const SYRA_PRODUCT_FLOW = [
  {
    step: "01",
    title: "Install",
    description: "Add MCP in Cursor/Claude or npm i @syra-ai/sdk — one payer wallet for many tools.",
  },
  {
    step: "02",
    title: "Pay",
    description: "HTTP 402 returns payment terms; the client settles USDC via x402 and retries.",
  },
  {
    step: "03",
    title: "Call",
    description: "News, sentiment, signals, smart money, and execution — structured JSON agents can act on.",
  },
] as const;

export type SyraPillarStatus = "live" | "beta" | "infra" | "roadmap";

export interface SyraPillar {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Omit for non-pillar cards (e.g. policy). */
  status?: SyraPillarStatus;
  id?: string;
}

/** Five pillars + policy note. Status badges keep Machine Money honest. */
export const SYRA_PILLARS: SyraPillar[] = [
  {
    icon: Zap,
    id: "spend",
    title: "Spend",
    status: "live",
    description: "x402 pay-per-call APIs — the live growth wedge for agents and builders.",
  },
  {
    icon: Coins,
    id: "earn",
    title: "Earn",
    status: "beta",
    description: "Agents monetize skills — prompts, KOL campaigns, creator attribution on paid calls.",
  },
  {
    icon: Wallet,
    id: "treasury",
    title: "Treasury",
    status: "infra",
    description: "Allocate and manage capital across chat, LP, and connected wallets with policy caps.",
  },
  {
    icon: TrendingUp,
    id: "invest",
    title: "Invest",
    status: "beta",
    description:
      "Deploy capital onchain via Marinade, Jito, Kamino, marginfi, and Meteora — plus Jupiter swaps.",
  },
  {
    icon: Sprout,
    id: "grow",
    title: "Grow",
    status: "roadmap",
    description: "Yield and portfolio optimization — deterministic recommendations, confirm-gated execution.",
  },
  {
    icon: Shield,
    title: "Policy-gated execution",
    description: "walletBroker + policyEngine enforce caps, allowlists, and explicit confirm for high-risk moves.",
  },
];

export const SYRA_PILLAR_STATUS_LABEL: Record<SyraPillarStatus, string> = {
  live: "Live",
  beta: "Beta",
  infra: "Infra",
  roadmap: "Roadmap",
};

export interface SyraCapability {
  title: string;
  description: string;
}

export const SYRA_CAPABILITIES: SyraCapability[] = [
  {
    title: "Pay per call",
    description: "x402 USDC settlement so agents discover and fund tools without vendor API keys.",
  },
  {
    title: "MCP in the IDE",
    description: "Curated crypto tools in Cursor and Claude — news, signals, research in chat.",
  },
  {
    title: "Typed SDK",
    description: "createSyraPaidClient handles 402 → pay → retry for app and agent code.",
  },
  {
    title: "Agent discovery",
    description:
      "Machine indexes at api.syraa.fun (/.well-known/x402, /agent/tools, OpenAPI). Optional human preview at syraa.fun/marketplace.",
  },
  {
    title: "Agent wallets",
    description: "Optional spend caps and policy so agents pay without babysitting every request.",
  },
  {
    title: "Five pillars",
    description: `${SYRA_LIVE_SUBLINE}. Earn · Treasury · Invest · Grow graduate as they hit production criteria — discover via GET /pillars.`,
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
    description: "x402 paid-call volume, MCP/SDK activation, and crypto intelligence routes agents reuse.",
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
    description: "Research, tools, treasury workflows, and onchain actions at syraa.fun/agent.",
    href: "/agent",
    external: false,
  },
  {
    icon: Activity,
    name: "Live metrics",
    description: "Public x402 traction, paid calls, and USDC settled — the growth home at syraa.fun.",
    href: "/",
    external: false,
  },
  {
    icon: Cpu,
    name: "MCP",
    description: "Install @syra-ai/mcp-server for Cursor, Claude, and agent hosts — pay-per-call tools.",
    href: "https://docs.syraa.fun/docs/build/mcp",
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
    description: "Live metrics and product home",
  },
  {
    label: "Agent",
    href: "https://syraa.fun/agent",
    description: "Reference chat agent",
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

/** Syra agent on SAID Protocol — verified on-chain identity. */
export const SYRA_SAID_AGENT_ID = "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t";

export const SYRA_SAID_PROFILE_URL = `https://www.saidprotocol.com/agents/${SYRA_SAID_AGENT_ID}`;

export const SYRA_SAID_BADGE_URL = `https://api.saidprotocol.com/api/badge/${SYRA_SAID_AGENT_ID}.svg`;
