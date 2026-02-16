"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/WalletButton";
import { useTheme } from "@/app/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStaking } from "@/hooks/useStaking";
import { CONFIG } from "@/constants/config";
import { formatUnits } from "@/lib/format";
import type { StakingPeriod } from "@/lib/staking";

function formatUnlock(ts: number): string {
  if (ts == null || !Number.isFinite(ts) || ts <= 0) return "—";
  const ms = ts * 1000;
  if (!Number.isFinite(ms) || ms > 8640000000000000) return "—";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toISOString().replace("T", " ").slice(0, 16);
  }
}

function NavbarLogo() {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return <span className="text-xl font-bold text-foreground">Staking dApp</span>;
  }
  return (
    <Image
      src="/logo.jpg"
      alt="Staking dApp"
      width={140}
      height={36}
      className="h-9 w-auto object-contain"
      style={{ width: "auto" }}
      priority
      onError={() => setFailed(true)}
    />
  );
}

const PERIOD_LABELS: [string, string, string] = [
  "1 minute",
  "1 hour",
  "1 day",
];

export default function StakingDetailsPage() {
  const { resolved: theme } = useTheme();
  const { connected } = useWallet();
  const {
    periodStakes,
    userStakedFormatted,
    pendingRewardFormatted,
    userStakeInfos,
    loading,
    error,
    refetch,
  } = useStaking();

  return (
    <div className="min-h-screen bg-background">
      <header className="navbar border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className={`flex items-center gap-3 no-underline hover:no-underline ${theme === "dark" ? "text-[#f5f5f5] hover:text-[#f5f5f5]" : "text-black hover:text-black"}`}
          >
            <NavbarLogo />
            <span className="text-xl font-semibold">Syra Staking</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Back to staking
          </Link>
        </div>

        {!connected ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/80 py-20 shadow-sm dark:shadow-none backdrop-blur-sm">
            <p className="mb-4 text-muted-foreground">
              Connect your wallet to view your staking details.
            </p>
            <WalletButton />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-destructive">
            <p className="font-medium">Error loading staking data</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-destructive/20 px-4 py-2 text-sm font-semibold hover:bg-destructive/30"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Staking details
              </h1>
              <p className="mt-1 text-muted-foreground">
                Your staking positions and lock information per period.
              </p>
            </div>

            {/* Summary */}
            <div className="card-surface grid gap-4 p-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total staked
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "—" : `${userStakedFormatted} ${CONFIG.stakingTokenSymbol}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total pending rewards
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "—" : pendingRewardFormatted}
                </p>
              </div>
            </div>

            {/* Per-period details */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Positions by lock period
              </h2>
              {loading ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-32 animate-pulse rounded-xl bg-muted"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {([0, 1, 2] as StakingPeriod[]).map((period) => {
                    const info = userStakeInfos[period];
                    const ps = periodStakes[period];
                    const label = PERIOD_LABELS[period];
                    const pendingFormatted =
                      info && ps.pendingRewardRaw > 0n
                        ? formatUnits(
                            ps.pendingRewardRaw,
                            CONFIG.rewardDecimals
                          )
                        : "0";

                    return (
                      <div
                        key={period}
                        className="card-surface overflow-hidden p-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-foreground">
                                {label}
                              </h3>
                              {ps.isLocked ? (
                                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                                  Locked
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  Unlocked
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Staked: {ps.amountFormatted} {CONFIG.stakingTokenSymbol}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Unlock at: {formatUnlock(ps.unlockAt)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Pending reward (this period): {pendingFormatted}
                            </p>
                          </div>
                          <Link
                            href="/"
                            className="rounded-lg border-2 border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                          >
                            Unstake
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
