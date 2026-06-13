"use client";

import { Loader2, Sparkles } from "lucide-react";
import { formatCompactAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SyraBuyButton } from "@/components/syra/SyraBuyButton";

type SyraHolderProgressCardProps = {
  balance: number | null;
  loading: boolean;
  progressPct: number;
  isEligible: boolean;
  threshold: number;
  className?: string;
};

export function SyraHolderProgressCard({
  balance,
  loading,
  progressPct,
  isEligible,
  threshold,
  className,
}: SyraHolderProgressCardProps) {
  const balanceLabel =
    balance == null ? "—" : formatCompactAmount(balance);
  const thresholdLabel = formatCompactAmount(threshold);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card/80 px-3.5 py-3 ring-1 ring-inset ring-white/[0.04]",
        isEligible && "border-success/30 bg-success/[0.04]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            $SYRA holder
          </p>
          {loading ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking balance…
            </div>
          ) : isEligible ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-success">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              1M+ holder — free agent tools
            </p>
          ) : (
            <>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
                {balanceLabel}
                <span className="text-muted-foreground"> / {thresholdLabel}</span>
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                Hold 1M $SYRA — treasury covers your agent tool fees.
              </p>
            </>
          )}
        </div>
      </div>

      {!loading && !isEligible ? (
        <>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted/50"
            role="progressbar"
            aria-valuenow={Math.round(progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress toward 1M SYRA holder tier"
          >
            <div
              className="h-full rounded-full bg-neon-gold/80 transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <SyraBuyButton variant="default" fullWidth className="mt-3 h-9" />
        </>
      ) : null}
    </div>
  );
}
