export interface EquityHistoryPoint {
  at: number;
  value: number;
  label: string;
}

export interface ClosedTradeForHistory {
  closedAtMs: number;
  pnlSol: number;
}

function formatShortLabel(tsMs: number): string {
  try {
    return new Date(tsMs).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

/** Build a stepped equity curve from realized closes, ending at current mark-to-market equity. */
export function buildEquityHistoryFromCell(args: {
  startSol: number;
  closedTrades: readonly ClosedTradeForHistory[];
  currentEquitySol: number;
  nowMs?: number;
  maxPoints?: number;
}): EquityHistoryPoint[] {
  const { startSol, closedTrades, currentEquitySol, nowMs = Date.now(), maxPoints = 40 } = args;
  const sorted = [...closedTrades].sort((a, b) => a.closedAtMs - b.closedAtMs);

  if (sorted.length === 0) {
    return [
      { at: nowMs - 3_600_000, value: startSol, label: "Start" },
      { at: nowMs, value: currentEquitySol, label: "Now" },
    ];
  }

  const firstMs = Math.max(sorted[0].closedAtMs - 60_000, sorted[0].closedAtMs);
  const points: EquityHistoryPoint[] = [
    { at: firstMs, value: startSol, label: "Start" },
  ];

  let running = startSol;
  for (const trade of sorted) {
    running += trade.pnlSol;
    points.push({
      at: trade.closedAtMs,
      value: running,
      label: formatShortLabel(trade.closedAtMs),
    });
  }

  const last = points[points.length - 1];
  if (Math.abs(last.value - currentEquitySol) > 1e-6 || last.at !== nowMs) {
    points.push({ at: nowMs, value: currentEquitySol, label: "Now" });
  }

  if (points.length <= maxPoints) return points;

  const sampled: EquityHistoryPoint[] = [points[0]];
  const step = (points.length - 2) / (maxPoints - 2);
  for (let i = 1; i < maxPoints - 1; i++) {
    const idx = Math.round(i * step);
    sampled.push(points[Math.min(idx, points.length - 2)]);
  }
  sampled.push(points[points.length - 1]);
  return sampled;
}

export function formatExperimentSol(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })} SOL`;
}

export function formatExperimentPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function formatExperimentUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatExperimentSpreadPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(4)}%`;
}

/** Map resolved experiment runs into an equity curve. */
export function buildEquityHistoryFromRuns(args: {
  startBalance: number;
  currentBalance: number;
  runs: ReadonlyArray<{
    status: string;
    resolvedAt?: string | null;
    pnl: number | null | undefined;
  }>;
  nowMs?: number;
  maxPoints?: number;
}): EquityHistoryPoint[] {
  const closedTrades: ClosedTradeForHistory[] = args.runs
    .filter(
      (r) =>
        r.status !== "open" &&
        r.resolvedAt &&
        r.pnl != null &&
        Number.isFinite(Number(r.pnl)),
    )
    .map((r) => ({
      closedAtMs: new Date(r.resolvedAt!).getTime(),
      pnlSol: Number(r.pnl),
    }));

  return buildEquityHistoryFromCell({
    startSol: args.startBalance,
    closedTrades,
    currentEquitySol: args.currentBalance,
    nowMs: args.nowMs,
    maxPoints: args.maxPoints,
  });
}
