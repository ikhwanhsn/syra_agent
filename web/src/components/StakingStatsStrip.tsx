"use client";

import { useEffect, useMemo } from "react";
import { StatsCard } from "@/components/StatsCard";
import { useStakingProtocolSummary } from "@/hooks/useStakingProtocolSummary";
import { formatCompactAmount, formatCompactAmountFloor, formatUnits } from "@/lib/format";
import type { UserLockRow } from "@/lib/streamflowStaking";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";
import { STREAMFLOW_LOCK_SOL_RECOMMENDED } from "@/lib/streamflowStaking";

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

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="glass-card animate-pulse p-5"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="mb-3 h-3 w-20 rounded bg-muted-foreground/15" />
          <div className="h-7 w-24 rounded bg-muted-foreground/12" />
          <div className="mt-2 h-3 w-16 rounded bg-muted-foreground/10" />
        </div>
      ))}
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
  /** Max lockable after Streamflow fees (shown as "available to lock"). */
  maxLockableFormatted: string;
  /** Wallet SOL balance (for fee requirement hint). */
  solBalanceFormatted?: string;
  /** Increment to refetch protocol totals (e.g. after a new lock). */
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
    [myLockedRaw, tokenDecimals]
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
    return <StatsSkeleton />;
  }

  const totalLockedDisplay = protocolTotalFormatted
    ? `${formatCompactAmount(protocolTotalFormatted)} ${symbol}`
    : "—";

  const yourLockedDisplay = connected
    ? `${formatCompactAmount(myLockedFormatted)} ${symbol}`
    : "—";

  const availableToLockDisplay = connected
    ? `${formatCompactAmountFloor(maxLockableFormatted)} ${symbol}`
    : "—";

  const walletBalanceDisplay = connected
    ? `${formatCompactAmount(walletBalanceFormatted)} ${symbol}`
    : "—";

  return (
    <section className="mb-8 sm:mb-10" aria-label="Staking overview">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total locked"
          value={totalLockedDisplay}
          gradient
          subValue={
            summary
              ? `${summary.openLockCount.toLocaleString()} active lock${summary.openLockCount === 1 ? "" : "s"} on ${summary.network}`
              : "Across all Syra stakers"
          }
        />
        <StatsCard
          title="Active stakers"
          value={summary ? summary.uniqueWallets.toLocaleString() : "—"}
          subValue="Wallets with open locks"
        />
        <StatsCard
          title="Your locked"
          value={yourLockedDisplay}
          subValue={
            connected
              ? `${openLocks.length} open position${openLocks.length === 1 ? "" : "s"}`
              : "Connect wallet to view"
          }
        />
        <StatsCard
          title="Available to lock"
          value={availableToLockDisplay}
          subValue={
            connected
              ? solBalanceFormatted
                ? `Wallet ${walletBalanceDisplay} · SOL ${solBalanceFormatted} (need ~${STREAMFLOW_LOCK_SOL_RECOMMENDED})`
                : `Wallet balance ${walletBalanceDisplay} · ${STREAMFLOW_CONFIG.lockDurationLabel}`
              : "Connect wallet to lock"
          }
        />
      </div>
    </section>
  );
}
