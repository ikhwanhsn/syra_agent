import {
  Bitcoin,
  Crosshair,
  Droplets,
  Layers,
  RefreshCw,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type {
  EarnDenom,
  EarnRiskLevel,
  EarnYieldProduct,
  EarnYieldProductStats,
} from "@/lib/earnYieldApi";

/** Plain-language glossary for Earn yield UI (no jargon without a tooltip). */
export const EARN_GLOSSARY = {
  winRate:
    "Share of closed trades that made money. Past results do not guarantee future ones.",
  profitLoss:
    "Profit or loss: how much money the strategy made or lost after fees.",
  realized:
    "Locked in from closed trades. This amount will not change.",
  unrealized:
    "Still open and can go up or down until the trade closes.",
  trackRecord:
    "Results across all Syra users of this strategy, not your personal wallet.",
  reliability:
    "How often on-chain settlements completed successfully in the last 24 hours.",
  performanceFee:
    "Syra only charges when you make a profit. No fee on losses.",
  nonCustodial:
    "Your funds stay in your own agent wallet. Syra runs the strategy; you can stop anytime.",
  strategyDeposit:
    "The amount you allocated to this strategy when you started or last updated it. This is not the same as your full agent wallet balance.",
  walletTotal:
    "Everything currently in this strategy's agent wallet: open positions plus liquid balance. Can be higher than your deposit if the wallet already had funds.",
  waitingToInvest:
    "Cash in your agent wallet that is not in an open position yet. The strategy deploys it on the next cycle when a good opportunity exists.",
  inOpenPositions:
    "Capital currently locked in live positions for this strategy. It moves back to your wallet when positions close.",
  depositLimit:
    "How much you are allowed to allocate to this strategy in beta. Set your deposit within this range.",
  sol: "SOL: the main coin on Solana. This is what you deposit for this strategy.",
  usdc: "USDC: a dollar-pegged stablecoin. One USDC is meant to equal about one US dollar.",
} as const;

export type EarnGlossaryKey = keyof typeof EARN_GLOSSARY;

export function denomHelp(denom: EarnDenom): string {
  return denom === "USDC" ? EARN_GLOSSARY.usdc : EARN_GLOSSARY.sol;
}

/**
 * One friendly sentence for a product's lab/platform track record.
 * Safe for beginners: never dumps raw W/L codes.
 */
export function summarizeTrackRecord(
  stats: EarnYieldProductStats | null | undefined,
  _denom: EarnDenom = "SOL",
): string {
  if (!stats) return "Still building a track record.";

  if (stats.winRatePct != null && Number.isFinite(stats.winRatePct)) {
    const wins = stats.wins ?? 0;
    const losses = stats.losses ?? 0;
    const total = wins + losses;
    if (total > 0) {
      return `${stats.winRatePct.toFixed(0)}% of trades made money across all Syra users (${wins} wins, ${losses} losses).`;
    }
    return `${stats.winRatePct.toFixed(0)}% of trades made money across all Syra users.`;
  }

  if (stats.returnPct != null && Number.isFinite(stats.returnPct)) {
    const sign = stats.returnPct > 0 ? "+" : "";
    return `Return so far: ${sign}${stats.returnPct.toFixed(1)}% across all Syra users.`;
  }

  const wins = stats.wins ?? 0;
  const losses = stats.losses ?? 0;
  if (wins + losses > 0) {
    return `${wins} wins and ${losses} losses across all Syra users so far.`;
  }

  return "Still building a track record.";
}

export function fmtEarnAmount(n: number | null | undefined, denom: EarnDenom = "SOL") {
  if (n == null || !Number.isFinite(n)) return "-";
  const sign = n > 0 ? "+" : "";
  if (denom === "USDC") return `${sign}$${n.toFixed(2)}`;
  return `${sign}${n.toFixed(3)} ${denom}`;
}

/** Absolute balance / deposit (no + sign — that reads as profit). */
export function fmtEarnBalance(n: number | null | undefined, denom: EarnDenom = "SOL") {
  if (n == null || !Number.isFinite(n)) return "-";
  if (denom === "USDC") return `$${Math.abs(n).toFixed(2)}`;
  return `${Math.abs(n).toFixed(3)} ${denom}`;
}

export function fmtEarnUsd(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "-";
  const sign = n > 0 ? "+" : "";
  return `${sign}$${n.toFixed(2)}`;
}

/** Map API readiness codes → short, user-facing reasons (no snake_case dumps). */
export function humanizeReadinessBlocker(code: string): string | null {
  const raw = code.trim();
  if (!raw) return null;

  let m = raw.match(/^insufficient_real_sample_(\d+)_need_(\d+)$/);
  if (m) {
    const have = Number(m[1]);
    const need = Number(m[2]);
    if (have <= 0) return `Needs ${need} real lab trades before deposits open`;
    return `Lab progress: ${have} of ${need} real trades completed`;
  }

  m = raw.match(/^paper_sample_(\d+)_need_(\d+)$/);
  if (m) {
    return `Paper lab progress: ${m[1]} of ${m[2]} trades`;
  }

  m = raw.match(/^error_rate_([\d.]+)pct_above_([\d.]+)pct$/);
  if (m) return "Lab error rate is still above the safety limit";

  m = raw.match(/^solana_settlement_success_([\d.]+)pct_below_([\d.]+)pct$/);
  if (m) return "On-chain settlement reliability needs to improve";

  m = raw.match(/^drawdown_([\d.]+)pct_above_([\d.]+)pct$/);
  if (m) return "Lab drawdown is above the safety limit";

  switch (raw) {
    case "realized_net_pnl_not_positive":
      return "Waiting for a net-positive lab track record";
    case "error_rate_kill_threshold":
      return "Temporarily paused while reliability improves";
    case "paper_expectancy_not_positive":
      return "Paper lab still needs positive results";
    case "paper_graduation_failed":
      return "Paper lab has not graduated yet";
    default:
      // Skip opaque internal codes rather than dumping them to users
      if (/^[a-z0-9_]+$/i.test(raw)) return null;
      return raw;
  }
}

export function readinessReasons(blockers: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const code of blockers || []) {
    const text = humanizeReadinessBlocker(code);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

export function humanizeAgentNote(lastError: string | null | undefined): string | null {
  if (!lastError) return null;
  if (lastError.startsWith("auto_pause:")) {
    const reasons = readinessReasons(lastError.slice("auto_pause:".length).split(","));
    if (reasons.length === 0) return "Deposits are paused until the lab clears safety checks.";
    return reasons.join(" · ");
  }
  if (/^[a-z0-9_,:.-]+$/i.test(lastError) && lastError.includes("_")) {
    const reasons = readinessReasons(lastError.split(","));
    return reasons.length > 0 ? reasons.join(" · ") : null;
  }
  return lastError;
}

export function earnProductIcon(product: Pick<EarnYieldProduct, "id">): LucideIcon {
  if (product.id === "lp_meteora_dlmm") return Droplets;
  if (product.id === "cbbtc_onchain_signal") return Bitcoin;
  if (product.id === "momentum_rotator") return RefreshCw;
  if (product.id === "lst_loop") return Layers;
  if (product.id === "alpha_sniper") return Crosshair;
  return Shield;
}

export function riskLevelLabel(level: EarnRiskLevel | null | undefined): string {
  switch (level) {
    case "lower":
      return "Lower risk";
    case "moderate":
      return "Moderate risk";
    case "higher":
      return "Higher risk";
    case "extreme":
      return "Extreme risk";
    default:
      return "Risk varies";
  }
}

export function formatEvidenceEntries(evidence: Record<string, unknown> | undefined): string[] {
  if (!evidence) return [];
  const out: string[] = [];
  for (const [key, value] of Object.entries(evidence)) {
    if (value == null || value === "") continue;
    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
    out.push(`${label}: ${String(value)}`);
  }
  return out;
}
