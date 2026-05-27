import { cn } from "@/lib/utils";
import type { LpRealPosition } from "@/lib/lpAgentRealApi";
import { formatPoolPairLabel, lpPositionStatusLabel } from "@/lib/lpRealDisplay";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

function pnlClass(value: number) {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-foreground";
}

export function LpRealSimplePositions({
  positions,
  solUsd,
}: {
  positions: LpRealPosition[];
  solUsd?: number;
}) {
  if (positions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Active pools</p>
      <div className="space-y-2">
        {positions.slice(0, 5).map((p) => {
          const pnl = Number(p.realNetPnlSol ?? 0);
          const usd =
            solUsd != null && Number.isFinite(solUsd) && Number.isFinite(pnl) ? pnl * solUsd : null;
          return (
            <div
              key={p.id}
              className={cn(overviewCardShell, "flex items-center gap-3 rounded-xl px-4 py-3")}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{formatPoolPairLabel(p)}</p>
                <p className="text-xs text-muted-foreground">{lpPositionStatusLabel(p)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={cn("text-sm font-semibold tabular-nums", pnlClass(pnl))}>
                  {pnl >= 0 ? "+" : ""}
                  {pnl.toFixed(3)} SOL
                </p>
                {usd != null ? (
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {usd >= 0 ? "+" : ""}${Math.abs(usd).toFixed(2)}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {positions.length > 5 ? (
        <p className="text-xs text-muted-foreground">+{positions.length - 5} more — switch to Pro view for full history.</p>
      ) : null}
    </div>
  );
}
