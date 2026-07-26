import {
  Bitcoin,
  Crosshair,
  Droplets,
  Layers,
  RefreshCw,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { EarnDenom, EarnRiskLevel, EarnYieldProduct } from "@/lib/earnYieldApi";

export function fmtEarnAmount(n: number | null | undefined, denom: EarnDenom = "SOL") {
  if (n == null || !Number.isFinite(n)) return "-";
  const sign = n > 0 ? "+" : "";
  if (denom === "USDC") return `${sign}$${n.toFixed(2)}`;
  return `${sign}${n.toFixed(3)} ${denom}`;
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
