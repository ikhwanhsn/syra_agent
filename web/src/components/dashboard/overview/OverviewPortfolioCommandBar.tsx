import type { ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";

export interface OverviewPortfolioCommandBarProps {
  walletLabel?: string;
  liveSignals?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function OverviewPortfolioCommandBar({
  walletLabel,
  liveSignals,
  onRefresh,
  refreshing,
  isLoading,
  className,
}: OverviewPortfolioCommandBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <p className={overviewKickerClass}>Dashboard</p>
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Portfolio overview
        </h1>
        {walletLabel ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Connected{" "}
            <span className="font-mono text-[13px] text-foreground/90">{walletLabel}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {liveSignals}
        {onRefresh && walletLabel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            disabled={refreshing || isLoading}
            onClick={() => void onRefresh()}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Refresh
          </Button>
        ) : null}
      </div>
    </div>
  );
}
