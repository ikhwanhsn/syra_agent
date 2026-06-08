import { useEffect, useState } from "react";
import type { EquityHistoryPoint } from "@/lib/experimentEquityHistory";

function formatShortLabel(tsMs: number): string {
  try {
    return new Date(tsMs).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** Accumulate best-spread readings across refreshes for a session trend chart. */
export function useArbitrageSpreadHistory(
  spreadPct: number | null | undefined,
  tokenLabel: string | null | undefined,
): EquityHistoryPoint[] {
  const [history, setHistory] = useState<EquityHistoryPoint[]>([]);

  useEffect(() => {
    if (spreadPct == null || !Number.isFinite(spreadPct) || !tokenLabel) return;

    setHistory((prev) => {
      const now = Date.now();
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.value - spreadPct) < 0.000_05 && now - last.at < 4_000) {
        return prev;
      }
      const next = [
        ...prev,
        { at: now, value: spreadPct, label: tokenLabel },
      ].slice(-32);
      if (next.length === 1) {
        return [
          { at: now - 60_000, value: spreadPct, label: "Start" },
          next[0],
        ];
      }
      return next.map((p, i) =>
        i === 0 && p.label !== "Start" ? { ...p, label: "Start" } : { ...p, label: p.label || formatShortLabel(p.at) },
      );
    });
  }, [spreadPct, tokenLabel]);

  return history;
}
