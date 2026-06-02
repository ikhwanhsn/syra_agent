"use client";

import { Clock, ExternalLink, History, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserLockRow } from "@/lib/streamflowStaking";
import { stakingPositionCard } from "@/components/staking/stakingStyles";

function truncateMiddle(s: string, head = 6, tail = 4): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function formatUnlock(unix: number): string {
  return new Date(unix * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export interface LockPositionCardProps {
  row: UserLockRow;
  symbol: string;
  variant: "open" | "history";
  explorerUrl: string;
}

export function LockPositionCard({
  row,
  symbol,
  variant,
  explorerUrl,
}: LockPositionCardProps) {
  const unlockLabel = formatUnlock(row.unlocksAtUnix);

  if (variant === "history") {
    return (
      <article className={stakingPositionCard}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <History className="h-3 w-3 shrink-0" aria-hidden />
                Past
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  row.closed
                    ? "bg-muted text-foreground ring-1 ring-border/60"
                    : "bg-muted/60 text-muted-foreground",
                )}
              >
                {row.closed ? "Settled" : "Released"}
              </span>
            </div>
            <p className="break-all font-mono text-xl font-semibold tabular-nums text-foreground sm:break-normal sm:text-2xl">
              {row.depositedFormatted}
              <span className="ml-1.5 text-sm font-medium text-muted-foreground sm:text-base">
                {symbol}
              </span>
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Unlocked {unlockLabel}
            </p>
          </div>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border/55 bg-background/50 text-xs font-semibold text-foreground transition hover:bg-background sm:w-auto sm:px-3"
          >
            Contract
            <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className={stakingPositionCard}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground ring-1 ring-primary/15">
            <Lock className="h-3 w-3" aria-hidden />
            Active
          </span>
          <p className="break-all font-mono text-xl font-semibold tabular-nums text-foreground sm:break-normal sm:text-2xl">
            {row.depositedFormatted}
            <span className="ml-1.5 text-sm font-medium text-muted-foreground sm:text-base">
              {symbol}
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Unlocks {unlockLabel}
          </p>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border/55 bg-background/50 text-xs font-semibold transition hover:bg-background sm:w-auto sm:px-3"
        >
          Explorer
          <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </a>
      </div>
      <div className="mt-3 flex flex-col gap-1 border-t border-border/40 pt-3 text-[11px] text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:text-xs">
        <span className="min-w-0">
          Vested:{" "}
          <span className="font-mono font-medium text-foreground">{row.unlockedFormatted}</span>{" "}
          {symbol}
        </span>
        <span className="hidden text-border/70 sm:inline">·</span>
        <span className="truncate font-mono">{truncateMiddle(row.id)}</span>
      </div>
    </article>
  );
}
