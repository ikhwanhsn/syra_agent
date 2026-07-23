import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Droplets,
  Landmark,
  PiggyBank,
  Sprout,
  Wallet,
} from "lucide-react";

/** Active pillar treasury roles (fundable today). */
export type AgentWalletPurpose = "spend" | "earn" | "treasury" | "invest" | "grow" | "lp";

/** Primary spend wallet (chat/x402 uses this base anonymousId). */
export type AgentWalletPrimaryPurpose = "spend";

export interface AgentWalletSlotMeta {
  id: AgentWalletPurpose;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  /** Internal-team only (LP experiments). */
  internalOnly?: boolean;
}

export const AGENT_WALLET_SLOTS: readonly AgentWalletSlotMeta[] = [
  {
    id: "spend",
    label: "Spend agent",
    shortLabel: "Spend",
    description: "Chat, x402, tools & research",
    icon: Wallet,
  },
  {
    id: "earn",
    label: "Earn agent",
    shortLabel: "Earn",
    description: "Skill monetization & payouts",
    icon: PiggyBank,
  },
  {
    id: "treasury",
    label: "Treasury agent",
    shortLabel: "Treasury",
    description: "Capital allocation & reserves",
    icon: Landmark,
  },
  {
    id: "invest",
    label: "Invest agent",
    shortLabel: "Invest",
    description: "Deploy capital & positions",
    icon: ArrowUpRight,
  },
  {
    id: "grow",
    label: "Grow agent",
    shortLabel: "Grow",
    description: "Portfolio growth & rebalancing",
    icon: Sprout,
  },
  {
    id: "lp",
    label: "LP agent",
    shortLabel: "LP",
    description: "Meteora DLMM auto-LP (Earn Yield)",
    icon: Droplets,
  },
] as const;

export const PILLAR_WALLET_PURPOSES = ["spend", "earn", "treasury", "invest", "grow"] as const;
export type PillarWalletPurpose = (typeof PILLAR_WALLET_PURPOSES)[number];

export function getAgentWalletSlot(id: AgentWalletPurpose): AgentWalletSlotMeta {
  const slot = AGENT_WALLET_SLOTS.find((s) => s.id === id);
  if (!slot) throw new Error(`unknown_agent_wallet_purpose:${id}`);
  return slot;
}

export function isPillarWalletPurpose(id: string): id is PillarWalletPurpose {
  return (PILLAR_WALLET_PURPOSES as readonly string[]).includes(id);
}

/** Resolved agent treasury used by deposit / withdraw flows. */
export type AgentWalletFundTarget = {
  agentAddress: string;
  anonymousId: string;
  solBalance?: number | null;
  usdcBalance?: number | null;
};

/** Visual accent per wallet role. */
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
  spend: {
    icon: "text-primary",
    border: "border-primary/20",
    borderActive: "border-primary/35",
    bg: "bg-primary/[0.04]",
    bgActive: "bg-primary/[0.09]",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--primary)/0.45)]",
    pill: "bg-primary/10 text-primary",
  },
  earn: {
    icon: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    borderActive: "border-emerald-500/35",
    bg: "bg-emerald-500/[0.04]",
    bgActive: "bg-emerald-500/[0.09]",
    glow: "shadow-[0_0_24px_-8px_rgba(16,185,129,0.35)]",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  treasury: {
    icon: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    borderActive: "border-amber-500/35",
    bg: "bg-amber-500/[0.04]",
    bgActive: "bg-amber-500/[0.09]",
    glow: "shadow-[0_0_24px_-8px_rgba(245,158,11,0.35)]",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  invest: {
    icon: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/20",
    borderActive: "border-sky-500/35",
    bg: "bg-sky-500/[0.04]",
    bgActive: "bg-sky-500/[0.09]",
    glow: "shadow-[0_0_24px_-8px_rgba(14,165,233,0.35)]",
    pill: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  grow: {
    icon: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
    borderActive: "border-violet-500/35",
    bg: "bg-violet-500/[0.04]",
    bgActive: "bg-violet-500/[0.09]",
    glow: "shadow-[0_0_24px_-8px_rgba(139,92,246,0.35)]",
    pill: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  lp: {
    icon: "text-fuchsia-600 dark:text-fuchsia-400",
    border: "border-fuchsia-500/20",
    borderActive: "border-fuchsia-500/35",
    bg: "bg-fuchsia-500/[0.04]",
    bgActive: "bg-fuchsia-500/[0.09]",
    glow: "shadow-[0_0_24px_-8px_rgba(217,70,239,0.35)]",
    pill: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400",
  },
};

export function shortenAgentAddress(addr: string | null | undefined): string {
  if (!addr) return "—";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

/** @deprecated Use spend — chat wallet is now the spend pillar treasury. */
export type LegacyAgentWalletPurpose = "chat";

export function normalizeAgentWalletPurpose(value: string | null | undefined): AgentWalletPurpose {
  if (!value || value === "chat") return "spend";
  if (value === "lp") return "lp";
  if (isPillarWalletPurpose(value)) return value;
  return "spend";
}
