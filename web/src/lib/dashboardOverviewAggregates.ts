import type { LpAgentStats } from "@/lib/lpAgentExperimentApi";
import type { XProjectsBatchItem } from "@/lib/xProjectsAnalyzeApi";

export function sortXBatchByScore(items: XProjectsBatchItem[]): XProjectsBatchItem[] {
  return [...items].sort((a, b) => {
    const sa = a.ok ? a.analysis.score : Number.NEGATIVE_INFINITY;
    const sb = b.ok ? b.analysis.score : Number.NEGATIVE_INFINITY;
    if (sb !== sa) return sb - sa;
    return a.username.localeCompare(b.username, undefined, { sensitivity: "base" });
  });
}

export function aggregateLpAgents(agents: LpAgentStats[]) {
  let wins = 0;
  let losses = 0;
  let open = 0;
  let expired = 0;
  for (const a of agents) {
    wins += a.wins ?? 0;
    losses += a.losses ?? 0;
    open += a.openPositions ?? 0;
    expired += a.expired ?? 0;
  }
  const sorted = [...agents].sort((a, b) => {
    const ar = a.winRatePct ?? -1;
    const br = b.winRatePct ?? -1;
    if (br !== ar) return br - ar;
    return (b.wins ?? 0) - (a.wins ?? 0);
  });
  return { wins, losses, open, expired, agentCount: agents.length, topAgent: sorted[0] ?? null };
}

export function formatCompactUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `$${Math.round(n / 1000)}k`;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatSol(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "−" : "";
  const v = Math.abs(n);
  return `${sign}${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;
}

export function formatPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}
