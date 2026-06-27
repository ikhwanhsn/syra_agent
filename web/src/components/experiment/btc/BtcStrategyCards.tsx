import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { BtcQuantStrategyCardsSkeleton } from "@/components/experiment/btc/BtcExperimentSkeletons";
import type { BtcQuantStrategy } from "@/lib/btcQuantApi";

export interface BtcStrategyCardsProps {
  strategies: BtcQuantStrategy[];
  loading?: boolean;
}

export function BtcStrategyCards({ strategies, loading }: BtcStrategyCardsProps) {
  if (loading && strategies.length === 0) {
    return <BtcQuantStrategyCardsSkeleton />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {strategies.map((s) => (
        <article key={s.id} className={cn(overviewCardShell, "rounded-2xl p-4")}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Agent #{s.id}</p>
              <h3 className="mt-0.5 text-sm font-semibold tracking-tight">{s.name}</h3>
            </div>
            <Badge variant="outline" className="shrink-0 rounded-md text-[10px] uppercase">
              {s.bar}
            </Badge>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.notes ?? "—"}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-medium">
              {s.dataSource.replace(/_/g, " ")}
            </Badge>
            <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-medium">
              Solana DEX
            </Badge>
            <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-medium">
              spot long
            </Badge>
            <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-medium">
              cbBTC
            </Badge>
          </div>
        </article>
      ))}
    </div>
  );
}
