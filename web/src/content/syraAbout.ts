import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Brain,
  Globe,
  Lock,
  MessageSquare,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

export const SYRA_TAGLINE = "Smart Intelligence Agent for Traders";
export const SYRA_MISSION =
  "The intelligence layer for autonomous trading agents on Solana — research-driven, risk-aware, and built for operators who ship size, not slides.";

export const SYRA_SUMMARY =
  "Syra helps traders, analysts, and builders interpret markets using structured context and clear explanations. It combines live market data, on-chain signals, narrative intelligence, and AI-driven research into one trader-grade stack — not hype, not blind execution.";

export interface SyraPillar {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const SYRA_PILLARS: SyraPillar[] = [
  {
    icon: Brain,
    title: "Agent-grade intelligence",
    description: "Models and workflows tuned for trading decisions — not generic chat.",
  },
  {
    icon: Shield,
    title: "Security for agent capital",
    description: "Hardened flows with explicit approvals and auditable on-chain actions.",
  },
  {
    icon: Zap,
    title: "Fast on Solana",
    description: "Low-latency reads and execution paths on Solana DEXs, with x402 for paid tools.",
  },
  {
    icon: Globe,
    title: "Agentic payments",
    description: "HTTP 402 + x402 / MPP so agents discover APIs, pay per call, and stay composable.",
  },
  {
    icon: Lock,
    title: "Non-custodial",
    description: "You keep the keys. Syra never custodies wallets or moves funds without sign-off.",
  },
  {
    icon: BarChart3,
    title: "Live market surface",
    description: "Dashboards, alpha feeds, and signals built for serious market operators.",
  },
];

export interface SyraCapability {
  title: string;
  description: string;
}

export const SYRA_CAPABILITIES: SyraCapability[] = [
  {
    title: "Market overview",
    description: "Price, volume, volatility, and trend strength in one structured view.",
  },
  {
    title: "Technical indicators",
    description: "RSI, MACD, SMA, EMA, Bollinger Bands, and contextual chart framing.",
  },
  {
    title: "Action perspectives",
    description: "Key levels, momentum bias, and scenario outlooks — not certainty theater.",
  },
  {
    title: "Risk context",
    description: "Reward-to-risk awareness and exposure considerations on every read.",
  },
  {
    title: "AI insights",
    description: "Confidence framing and sentiment interpretation grounded in data.",
  },
  {
    title: "On-chain signals",
    description: "Smart money flows, DEX activity, and token-level research where APIs exist.",
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
    description: "Chat-based research, tools, and on-chain workflows at agent.syraa.fun.",
    href: "/",
    external: false,
  },
  {
    icon: MessageSquare,
    name: "Telegram bot",
    description: "Market analysis, signals, and docs on the go via @syra_trading_bot.",
    href: "https://t.me/syra_trading_bot",
    external: true,
  },
  {
    icon: Terminal,
    name: "API gateway",
    description: "x402 pay-per-use routes, OpenAPI specs, and partner tool integrations.",
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
    description: "Developer and user guides",
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
  "Syra provides research and intelligence tools — not financial advice or guaranteed returns. Markets carry risk. You are responsible for your own decisions, compliance, and execution.";
