import type { LucideIcon } from "lucide-react";
import { ArrowLeftRight, Droplets, LineChart, MessageSquareText } from "lucide-react";

/** Active agent treasury roles (fundable today). */
export type AgentWalletPurpose = "chat" | "lp";

/** Planned treasuries shown on the wallet page before launch. */
export type AgentWalletComingSoonId = "trading" | "arbitrage";

export interface AgentWalletSlotMeta {
  id: AgentWalletPurpose;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const AGENT_WALLET_SLOTS: readonly AgentWalletSlotMeta[] = [
  {
    id: "chat",
    label: "Chat agent",
    shortLabel: "Chat",
    description: "Tools, x402, research",
    icon: MessageSquareText,
  },
  {
    id: "lp",
    label: "LP agent",
    shortLabel: "LP",
    description: "Meteora LP treasury",
    icon: Droplets,
  },
] as const;

export interface AgentWalletComingSoonMeta {
  id: AgentWalletComingSoonId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const AGENT_WALLET_COMING_SOON_SLOTS: readonly AgentWalletComingSoonMeta[] = [
  {
    id: "trading",
    label: "Trading agent",
    shortLabel: "Trading",
    description: "Strategy execution & perps treasury",
    icon: LineChart,
  },
  {
    id: "arbitrage",
    label: "Arbitrage agent",
    shortLabel: "Arbitrage",
    description: "Cross-venue arb & execution wallet",
    icon: ArrowLeftRight,
  },
] as const;

export function getAgentWalletComingSoonSlot(id: AgentWalletComingSoonId): AgentWalletComingSoonMeta {
  const slot = AGENT_WALLET_COMING_SOON_SLOTS.find((s) => s.id === id);
  if (!slot) throw new Error(`unknown_agent_wallet_coming_soon:${id}`);
  return slot;
}

export function getAgentWalletSlot(id: AgentWalletPurpose): AgentWalletSlotMeta {
  const slot = AGENT_WALLET_SLOTS.find((s) => s.id === id);
  if (!slot) throw new Error(`unknown_agent_wallet_purpose:${id}`);
  return slot;
}

/** Visual accent per wallet role — keeps chat / LP / future roles consistent. */
export const AGENT_WALLET_ACCENT: Record<
  AgentWalletPurpose,
  {
    icon: string;
    border: string;
    borderActive: string;
    bg: string;
    bgActive: string;
    glow: string;
    pill: string;
  }
> = {
  chat: {
    icon: "text-primary",
    border: "border-primary/20",
    borderActive: "border-primary/35",
    bg: "bg-primary/[0.04]",
    bgActive: "bg-primary/[0.09]",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--primary)/0.45)]",
    pill: "bg-primary/10 text-primary",
  },
  lp: {
    icon: "text-violet-500 dark:text-violet-400",
    border: "border-violet-500/20",
    borderActive: "border-violet-500/35",
    bg: "bg-violet-500/[0.04]",
    bgActive: "bg-violet-500/[0.09]",
    glow: "shadow-[0_0_24px_-8px_rgba(139,92,246,0.35)]",
    pill: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
};

export const AGENT_WALLET_COMING_SOON_ACCENT: Record<
  AgentWalletComingSoonId,
  {
    icon: string;
    border: string;
    bgActive: string;
    pill: string;
  }
> = {
  trading: {
    icon: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    bgActive: "bg-emerald-500/[0.07]",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  arbitrage: {
    icon: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    bgActive: "bg-amber-500/[0.07]",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
};

export function shortenAgentAddress(addr: string | null | undefined): string {
  if (!addr) return "—";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
