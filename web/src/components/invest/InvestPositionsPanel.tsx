import { ArrowRight } from "lucide-react";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { InvestPosition } from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

const solFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

function formatSol(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${solFmt.format(n)} SOL`;
}

type InvestPositionsPanelProps = {
  positions: InvestPosition[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onDepositFirst?: () => void;
  className?: string;
};

export function InvestPositionsPanel({
  positions,
  isLoading,
  isError,
  onRetry,
  onDepositFirst,
  className,
}: InvestPositionsPanelProps) {
  return (
    <section className={cn(overviewCardShell, className)}>
      <div
        className={overviewCardGlow}
        style={{ background: overviewAccentBackground("alpha") }}
        aria-hidden
      />
      <div className="relative z-[1] p-4 sm:p-6">
        <p className={overviewKickerClass}>Your positions</p>

        {isLoading ? (
          <div className="mt-4 space-y-3" aria-busy="true" aria-label="Loading positions">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Could not load positions.
            </p>
            {onRetry ? (
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full"
                onClick={onRetry}
              >
                Retry
              </Button>
            ) : null}
          </div>
        ) : positions.length === 0 ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              No deposits yet. Stake SOL in-app via Marinade or Jito to open a position.
            </p>
            {onDepositFirst ? (
              <Button className="h-10 w-full rounded-full sm:h-9" onClick={onDepositFirst}>
                Deposit first
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {positions.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/30 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium tracking-tight text-foreground capitalize">
                    {p.adapter}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.status?.trim() || "open"}
                    {p.pool ? ` · ${p.pool}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm tabular-nums text-foreground">
                  {formatSol(p.deployedSol)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
