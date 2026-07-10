import { BarChart3, Coins, DollarSign, Layers, TrendingUp, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMmPct, formatMmUsd, type MmLedger } from "@/lib/mmApi";
import { LpStatTile } from "@/components/experiment/lp/LpStatTile";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface MmPnlHeaderProps {
  ledger: MmLedger | undefined;
  creatorFeeBps: number;
  loading?: boolean;
  className?: string;
}

export function MmPnlHeader({ ledger, creatorFeeBps, loading, className }: MmPnlHeaderProps) {
  const pnl = ledger?.realizedPnlUsd ?? 0;
  const pnlTone = pnl > 0 ? "positive" : pnl < 0 ? "negative" : "default";

  return (
    <section className={cn("space-y-4", className)}>
      <article className={cn(overviewCardShell, "relative overflow-hidden rounded-3xl ring-1 ring-violet-500/15")}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            background:
              "radial-gradient(480px 180px at 0% 0%, hsl(270 70% 55% / 0.14), transparent 58%)",
          }}
          aria-hidden
        />

        <div className="relative grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 sm:p-5">
          <LpStatTile
            label="Cumulative volume"
            value={loading ? "…" : formatMmUsd(ledger?.cumulativeVolumeUsd)}
            subValue={
              loading
                ? undefined
                : `Today ${formatMmUsd(ledger?.today.volumeUsd)} · ${ledger?.roundTripsCompleted ?? 0} round trips`
            }
            icon={BarChart3}
            tone="accent"
            highlight
          />
          <LpStatTile
            label="Projected creator fees"
            value={loading ? "…" : formatMmUsd(ledger?.projectedCreatorFeeUsd)}
            subValue={
              loading
                ? undefined
                : `Today ${formatMmUsd(ledger?.today.projectedCreatorFeeUsd)} · ${creatorFeeBps} bps`
            }
            icon={Coins}
            tone="positive"
            highlight
          />
          <LpStatTile
            label="Realized P&L"
            value={loading ? "…" : `${pnl >= 0 ? "+" : ""}${formatMmUsd(pnl)}`}
            subValue={loading ? undefined : formatMmPct(ledger?.returnPct)}
            icon={TrendingUp}
            tone={pnlTone}
          />
          <LpStatTile
            label="Equity"
            value={loading ? "…" : formatMmUsd(ledger?.equityUsd)}
            subValue={loading ? undefined : `${formatMmUsd(ledger?.cashUsd)} free cash`}
            icon={DollarSign}
            tone="default"
          />
          <LpStatTile
            label="SYRA inventory"
            value={loading ? "…" : formatMmUsd(ledger?.inventoryUsd)}
            subValue={
              loading
                ? undefined
                : `${(ledger?.inventoryDriftPct ?? 0).toFixed(0)}% of max band`
            }
            icon={Layers}
            tone={
              (ledger?.inventoryDriftPct ?? 0) > 80
                ? "negative"
                : (ledger?.inventoryDriftPct ?? 0) > 50
                  ? "default"
                  : "positive"
            }
          />
          <LpStatTile
            label="Capital efficiency"
            value={loading ? "…" : `${(ledger?.volumePerDollarBank ?? 0).toFixed(1)}x`}
            subValue={
              loading
                ? undefined
                : `${ledger?.restingOrders ?? 0} resting · ${ledger?.openInventoryLegs ?? 0} open legs`
            }
            icon={Waves}
            tone="default"
          />
        </div>
      </article>
    </section>
  );
}
