"use client";

import { useEffect, useMemo } from "react";
import { Coins, Lock, Users, Wallet } from "lucide-react";
import { useStakingProtocolSummary } from "@/hooks/useStakingProtocolSummary";
import { formatCompactAmount, formatCompactAmountFloor, formatUnits } from "@/lib/format";
import type { UserLockRow } from "@/lib/streamflowStaking";
import { STREAMFLOW_LOCK_SOL_RECOMMENDED } from "@/lib/streamflowStaking";
import { cn } from "@/lib/utils";

function sumLockAmountRaw(locks: UserLockRow[]): bigint {
  let total = BigInt(0);
  for (const row of locks) {
    try {
      total += BigInt(row.depositedRaw || "0");
    } catch {
      // skip invalid
    }
  }
  return total;
}

function MetricCell({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  accent,
}: {
  icon: typeof Lock;
  label: string;
  value: string;
  hint?: string;
  loading?: boolean;
  accent?: "primary" | "neutral";
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/50",
            accent === "primary"
              ? "bg-primary/[0.08] text-primary"
              : "bg-background/50 text-muted-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl",
          loading && "animate-pulse text-muted-foreground/35",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground/90">{hint}</p> : null}
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="glass-card rounded-2xl border border-foreground/[0.08] p-5 sm:p-6" aria-hidden>
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {[0, 1].map((group) => (
          <div key={group} className="grid grid-cols-2 gap-5 sm:gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-7 w-24 rounded bg-muted-foreground/10" />
                <div className="h-8 w-28 rounded bg-muted-foreground/12" />
                <div className="h-3 w-32 rounded bg-muted-foreground/8" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface StakingStatsStripProps {
  symbol: string;
  tokenDecimals: number;
  connected: boolean;
  portfolioLoading: boolean;
  openLocks: UserLockRow[];
  walletBalanceFormatted: string;
  maxLockableFormatted: string;
  solBalanceFormatted?: string;
  refreshNonce?: number;
}

export function StakingStatsStrip({
  symbol,
  tokenDecimals,
  connected,
  portfolioLoading,
  openLocks,
  walletBalanceFormatted,
  maxLockableFormatted,
  solBalanceFormatted,
  refreshNonce = 0,
}: StakingStatsStripProps) {
  const { summary, loading: protocolLoading, refetch } = useStakingProtocolSummary();

  useEffect(() => {
    if (refreshNonce > 0) void refetch();
  }, [refreshNonce, refetch]);

  const myLockedRaw = useMemo(() => sumLockAmountRaw(openLocks), [openLocks]);
  const myLockedFormatted = useMemo(
    () => formatUnits(myLockedRaw, tokenDecimals, 4),
    [myLockedRaw, tokenDecimals],
  );

  const protocolTotalFormatted = useMemo(() => {
    if (!summary?.totalAmountRaw) return null;
    try {
      return formatUnits(BigInt(summary.totalAmountRaw), tokenDecimals, 4);
    } catch {
      return null;
    }
  }, [summary?.totalAmountRaw, tokenDecimals]);

  const loading = protocolLoading || (connected && portfolioLoading);

  if (loading && !summary && openLocks.length === 0) {
    return (
      <section aria-label="Staking overview">
        <MetricsSkeleton />
      </section>
    );
  }

  const totalLockedDisplay = protocolTotalFormatted
    ? `${formatCompactAmount(protocolTotalFormatted)} ${symbol}`
    : "—";

  const yourLockedDisplay = connected
    ? `${formatCompactAmount(myLockedFormatted)} ${symbol}`
    : "Connect wallet";

  const availableToLockDisplay = connected
    ? `${formatCompactAmountFloor(maxLockableFormatted)} ${symbol}`
    : "Connect wallet";

  const walletHint = connected
    ? solBalanceFormatted
      ? `Balance ${formatCompactAmount(walletBalanceFormatted)} · SOL ${solBalanceFormatted}`
      : `Balance ${formatCompactAmount(walletBalanceFormatted)}`
    : "Connect to view balances";

  return (
    <section aria-label="Staking overview">
      <div className="glass-card relative overflow-hidden rounded-2xl border border-foreground/[0.08]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
          aria-hidden
        />

        <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-border/45">
          <div className="border-b border-border/45 p-5 sm:p-6 lg:border-b-0">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              Network
            </p>
            <div className="grid grid-cols-2 gap-5 sm:gap-6">
              <MetricCell
                icon={Lock}
                label="Total locked"
                value={totalLockedDisplay}
                hint={
                  summary
                    ? `${summary.openLockCount.toLocaleString()} open locks · ${summary.network}`
                    : "Protocol-wide"
                }
                accent="primary"
              />
              <MetricCell
                icon={Users}
                label="Active stakers"
                value={summary ? summary.uniqueWallets.toLocaleString() : "—"}
                hint="Wallets with open locks"
              />
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              Your wallet
            </p>
            <div className="grid grid-cols-2 gap-5 sm:gap-6">
              <MetricCell
                icon={Wallet}
                label="Your locked"
                value={yourLockedDisplay}
                hint={
                  connected
                    ? `${openLocks.length} open position${openLocks.length === 1 ? "" : "s"}`
                    : undefined
                }
              />
              <MetricCell
                icon={Coins}
                label="Available to lock"
                value={availableToLockDisplay}
                hint={
                  connected
                    ? `${walletHint} · ~${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL for fees`
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
