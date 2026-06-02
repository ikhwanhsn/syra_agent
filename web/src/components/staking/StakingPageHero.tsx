"use client";

import { ArrowUpRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import {
  stakingCardBody,
  stakingHeroCard,
  stakingInsetCard,
  stakingKicker,
} from "@/components/staking/stakingStyles";

export interface StakingPageHeroProps {
  symbol: string;
  lockDurationLabel: string;
  networkLabel: string;
  error?: string | null;
  className?: string;
}

export function StakingPageHero({
  symbol,
  lockDurationLabel,
  networkLabel,
  error,
  className,
}: StakingPageHeroProps) {
  return (
    <header className={cn("w-full min-w-0 space-y-4", className)}>
      <div className={stakingHeroCard}>
        <div
          className={overviewCardGlow}
          style={{ background: overviewAccentBackground("marketplace") }}
          aria-hidden
        />

        <div className={stakingCardBody}>
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/50 opacity-75" />
                  <span className="relative inline-flex h-full w-full rounded-full bg-success" />
                </span>
                {networkLabel}
              </span>
              <span className="rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                {lockDurationLabel}
              </span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/55 bg-background/55 shadow-inner sm:h-12 sm:w-12">
                  <Lock
                    className="h-5 w-5 text-foreground sm:h-6 sm:w-6"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={overviewKickerClass}>Staking</p>
                  <h1 className="text-balance mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                    Lock <span className="gradient-text-primary">{symbol}</span>
                  </h1>
                  <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    On-chain locks via{" "}
                    <a
                      href="https://streamflow.finance/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium text-foreground underline decoration-border/70 underline-offset-4 hover:decoration-foreground/40"
                    >
                      Streamflow
                      <ArrowUpRight className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                    </a>
                    . Vested tokens settle to your wallet automatically.
                  </p>
                </div>
              </div>

              <div className={cn(stakingInsetCard, "w-full shrink-0 sm:w-auto sm:min-w-[9.5rem]")}>
                <p className={stakingKicker}>Asset</p>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums text-foreground sm:text-lg">
                  {symbol}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div
          className={cn(
            stakingInsetCard,
            "border-destructive/30 bg-destructive/[0.06] text-sm leading-relaxed text-destructive break-words",
          )}
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </header>
  );
}
