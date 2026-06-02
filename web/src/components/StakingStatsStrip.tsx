"use client";

import { useEffect, useMemo } from "react";
import { Coins, Lock, Users, Wallet } from "lucide-react";
import { OverviewStatCard } from "@/components/dashboard/overview/OverviewStatCard";
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
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <OverviewStatCard key={i} label="—" value="—" isLoading accent="neutral" />
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
        <StatsSkeleton />
      </section>
    );
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

  const walletHint = connected
    ? solBalanceFormatted
      ? `Wallet ${formatCompactAmount(walletBalanceFormatted)} · SOL ${solBalanceFormatted}`
      : `Wallet ${formatCompactAmount(walletBalanceFormatted)}`
    : undefined;

  return (
    <section aria-label="Staking overview">
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <OverviewStatCard
          label="Total locked"
          value={totalLockedDisplay}
          hint={
            summary
              ? `${summary.openLockCount.toLocaleString()} locks · ${summary.network}`
              : "Protocol-wide"
          }
          icon={Lock}
          accent="marketplace"
        />
        <OverviewStatCard
          label="Active stakers"
          value={summary ? summary.uniqueWallets.toLocaleString() : "—"}
          hint="Wallets with open locks"
          icon={Users}
          accent="neutral"
        />
        <OverviewStatCard
          label="Your locked"
          value={yourLockedDisplay}
          hint={
            connected
              ? `${openLocks.length} open position${openLocks.length === 1 ? "" : "s"}`
              : "Connect wallet"
          }
          icon={Wallet}
          accent="neutral"
        />
        <OverviewStatCard
          label="Available to lock"
          value={availableToLockDisplay}
          hint={
            connected
              ? walletHint
                ? `${walletHint} · ~${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL for fees`
                : STREAMFLOW_CONFIG.lockDurationLabel
              : "Connect wallet"
          }
          icon={Coins}
          accent="neutral"
        />
      </div>
    </section>
  );
}
