import type { LpAgentStats } from "@/lib/lpAgentExperimentApi";
import type { UserCustomStrategyAgentStats } from "@/lib/tradingExperimentApi";
import {
  cellKey,
  PUMPFUN_EXPERIMENT_EXIT_COUNT,
  PUMPFUN_EXPERIMENT_PERSONALITY_COUNT,
  PUMPFUN_EXPERIMENT_START_SOL,
  totalEquitySol,
  type PumpfunExperimentPersisted,
} from "@/lib/pumpfunExperimentModel";
import {
  agentEquitySol,
  RISE_EXPERIMENT_START_SOL,
  type RiseExperimentAgentId,
  type RiseExperimentPersisted,
} from "@/lib/riseExperimentModel";
import type { XProjectsBatchItem } from "@/lib/xProjectsAnalyzeApi";

export function sortXBatchByScore(items: XProjectsBatchItem[]): XProjectsBatchItem[] {
  return [...items].sort((a, b) => {
    const sa = a.ok ? a.analysis.score : Number.NEGATIVE_INFINITY;
    const sb = b.ok ? b.analysis.score : Number.NEGATIVE_INFINITY;
    if (sb !== sa) return sb - sa;
    return a.username.localeCompare(b.username, undefined, { sensitivity: "base" });
  });
}

export function aggregatePumpfunExperiment(persisted: PumpfunExperimentPersisted) {
  const rows: Array<{ key: string; equity: number; retPct: number; openCount: number }> = [];
  let openPositions = 0;
  let closedTrades = 0;

  for (let p = 0; p < PUMPFUN_EXPERIMENT_PERSONALITY_COUNT; p++) {
    for (let e = 0; e < PUMPFUN_EXPERIMENT_EXIT_COUNT; e++) {
      const key = cellKey(p, e);
      const cell = persisted.cells[key];
      if (!cell) continue;
      const equity = totalEquitySol(cell, persisted.mcByMint);
      openPositions += cell.open.length;
      closedTrades += cell.closed.length;
      rows.push({
        key,
        equity,
        retPct: (equity / PUMPFUN_EXPERIMENT_START_SOL - 1) * 100,
        openCount: cell.open.length,
      });
    }
  }

  rows.sort((a, b) => b.equity - a.equity);
  const totalEquity = rows.reduce((s, r) => s + r.equity, 0);
  const winners = rows.filter((r) => r.retPct > 0).length;

  return {
    activeCells: rows.length,
    totalEquity,
    avgReturnPct: rows.length ? (totalEquity / rows.length / PUMPFUN_EXPERIMENT_START_SOL - 1) * 100 : 0,
    winners,
    openPositions,
    closedTrades,
    discoveries: persisted.discoveries.length,
    topDesk: rows[0] ?? null,
  };
}

export function aggregateRiseExperiment(persisted: RiseExperimentPersisted) {
  const agentIds: RiseExperimentAgentId[] = ["universal", "riseAlpha"];
  const byAgent = agentIds.map((id) => {
    const agent = persisted.agents[id];
    const equity = agentEquitySol(agent, persisted.mcByMint);
    const retPct = (equity / RISE_EXPERIMENT_START_SOL - 1) * 100;
    return {
      id,
      equity,
      retPct,
      openCount: agent.open.length,
      closedCount: agent.closed.length,
      borrowedSol: agent.borrowedPrincipalSol,
    };
  });
  const totalEquity = byAgent.reduce((s, a) => s + a.equity, 0);
  const openPositions = byAgent.reduce((s, a) => s + a.openCount, 0);
  return { byAgent, totalEquity, openPositions, discoveries: persisted.discoveries.length };
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

export function aggregateUserCustomTrading(agents: UserCustomStrategyAgentStats[]) {
  let wins = 0;
  let losses = 0;
  let open = 0;
  for (const a of agents) {
    wins += a.wins ?? 0;
    losses += a.losses ?? 0;
    open += a.openPositions ?? 0;
  }
  const sorted = [...agents].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0));
  return { wins, losses, open, agentCount: agents.length, topAgent: sorted[0] ?? null };
}

export function aggregateTradingAgents(
  agents: Array<{ name?: string; wins?: number; losses?: number; openPositions?: number }>,
) {
  let wins = 0;
  let losses = 0;
  let open = 0;
  for (const a of agents) {
    wins += a.wins ?? 0;
    losses += a.losses ?? 0;
    open += a.openPositions ?? 0;
  }
  const sorted = [...agents].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0));
  return { wins, losses, open, agentCount: agents.length, topAgent: sorted[0] ?? null };
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
