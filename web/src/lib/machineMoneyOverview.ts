import type { PillarId } from "@/lib/pillarsApi";

export type PillarOverviewMeta = {
  step: number;
  accent: string;
  iconRing: string;
  iconGlow: string;
  borderHover: string;
  features: readonly string[];
};

export const PILLAR_OVERVIEW_META: Record<PillarId, PillarOverviewMeta> = {
  earn: {
    step: 1,
    accent: "text-amber-600 dark:text-amber-400",
    iconRing: "border-amber-500/30 bg-amber-500/10",
    iconGlow: "from-amber-500/15 to-transparent",
    borderHover: "hover:border-amber-500/35",
    features: ["Skill registry", "KOL campaigns", "Paid call attribution"],
  },
  treasury: {
    step: 2,
    accent: "text-violet-600 dark:text-violet-400",
    iconRing: "border-violet-500/30 bg-violet-500/10",
    iconGlow: "from-violet-500/15 to-transparent",
    borderHover: "hover:border-violet-500/35",
    features: ["Multi-wallet allocation", "Policy caps", "Agent reserves"],
  },
  invest: {
    step: 3,
    accent: "text-sky-600 dark:text-sky-400",
    iconRing: "border-sky-500/30 bg-sky-500/10",
    iconGlow: "from-sky-500/15 to-transparent",
    borderHover: "hover:border-sky-500/35",
    features: ["Giza yield", "Meteora LP", "Jupiter + RISE"],
  },
  spend: {
    step: 4,
    accent: "text-cyan-600 dark:text-cyan-400",
    iconRing: "border-cyan-500/30 bg-cyan-500/10",
    iconGlow: "from-cyan-500/15 to-transparent",
    borderHover: "hover:border-cyan-500/35",
    features: ["x402 micropayments", "Pay-per-call APIs", "MCP + OpenAPI"],
  },
  grow: {
    step: 5,
    accent: "text-emerald-600 dark:text-emerald-400",
    iconRing: "border-emerald-500/30 bg-emerald-500/10",
    iconGlow: "from-emerald-500/15 to-transparent",
    borderHover: "hover:border-emerald-500/35",
    features: ["Portfolio analysis", "Yield recommendations", "Confirm-gated moves"],
  },
};

export const MACHINE_MONEY_FLOW_COPY =
  "Wealth is the narrative — agents earn revenue, allocate treasury, deploy capital, pay for intelligence via x402, and compound yield. Payments are one module, not the whole product.";

export const MACHINE_MONEY_STEPS: readonly { pillar: PillarId; action: string }[] = [
  { pillar: "earn", action: "Capture revenue from skills and onchain work" },
  { pillar: "treasury", action: "Allocate capital across agent wallets with policy" },
  { pillar: "invest", action: "Deploy into yield, LP, and execution surfaces" },
  { pillar: "spend", action: "Pay per capability — x402 APIs agents discover autonomously" },
  { pillar: "grow", action: "Optimize portfolio and compound returns over time" },
];
