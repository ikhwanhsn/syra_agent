"use client";

import { ArrowUpRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-sm sm:text-[11px]">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/50 opacity-75" />
              <span className="relative inline-flex h-full w-full rounded-full bg-success" />
            </span>
            {networkLabel}
          </span>
          <span className="rounded-full border border-border/50 bg-muted/25 px-2.5 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur-sm sm:text-[11px]">
            {lockDurationLabel} lock
          </span>
          <a
            href="https://streamflow.finance/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/25 px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition hover:border-border/70 hover:text-foreground sm:text-[11px]"
          >
            Streamflow
            <ArrowUpRight className="h-3 w-3 opacity-70" aria-hidden />
          </a>
        </div>

        <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/55 bg-background/50 shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.05)] backdrop-blur-sm sm:h-12 sm:w-12">
            <Lock className="h-5 w-5 text-foreground sm:h-6 sm:w-6" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[2.125rem] lg:leading-tight">
              Lock <span className="gold-text">{symbol}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Non-custodial on-chain locks with automatic vesting to your wallet.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/[0.06] p-4 text-sm leading-relaxed text-destructive break-words"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </header>
  );
}
