"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/WalletButton";
import { useTheme } from "@/app/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatsCard } from "@/components/StatsCard";
import { StakeCard, type PeriodOption } from "@/components/StakeCard";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Alert } from "@/components/Alert";
import { useStaking } from "@/hooks/useStaking";
import { toast } from "sonner";
import { CONFIG } from "@/constants/config";
import type { StakingPeriod } from "@/lib/staking";

const EXPLORER_CLUSTER = CONFIG.rpcEndpoint.includes("devnet") ? "devnet" : "mainnet";
const EXPLORER_TX = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=${EXPLORER_CLUSTER}`;

/** Format APR for readability: compact (e.g. 631.15M%) when very large, otherwise with commas. */
function formatApr(apr: number): string {
  if (apr >= 1_000_000_000) {
    return `${(apr / 1_000_000_000).toFixed(2)}B%`;
  }
  if (apr >= 1_000_000) {
    return `${(apr / 1_000_000).toFixed(2)}M%`;
  }
  if (apr >= 1_000) {
    return `${(apr / 1_000).toFixed(2)}K%`;
  }
  return `${apr.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
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

export default function StakingPage() {
  const { resolved: theme } = useTheme();
  const { connected } = useWallet();
  const [stakePeriod, setStakePeriod] = useState<StakingPeriod>(0);
  const [unstakePeriod, setUnstakePeriod] = useState<StakingPeriod>(0);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const {
    pool,
    periodStakes,
    totalStakedFormatted,
    apr,
    rewardPerSecondFormatted,
    userStakedFormatted,
    pendingRewardFormatted,
    userStakingBalanceFormatted,
    userRewardBalanceFormatted,
    refetch,
    stake,
    unstake,
    claim,
    loading,
    stakeLoading,
    unstakeLoading,
    claimLoading,
    error,
  } = useStaking();

  const stakePeriodOptions = useMemo<PeriodOption[]>(() => {
    const labels = ["1 minute", "1 hour", "1 day"];
    return [
      { value: 0, label: labels[0], maxAmount: userStakingBalanceFormatted },
      { value: 1, label: labels[1], maxAmount: userStakingBalanceFormatted },
      { value: 2, label: labels[2], maxAmount: userStakingBalanceFormatted },
    ];
  }, [userStakingBalanceFormatted]);

  const unstakePeriodOptions = useMemo<PeriodOption[]>(() => {
    const labels = ["1 minute", "1 hour", "1 day"];
    return [
      {
        value: 0,
        label: labels[0],
        maxAmount: periodStakes[0].amountFormatted,
        isLocked: periodStakes[0].isLocked,
        unlockAt: periodStakes[0].unlockAt,
      },
      {
        value: 1,
        label: labels[1],
        maxAmount: periodStakes[1].amountFormatted,
        isLocked: periodStakes[1].isLocked,
        unlockAt: periodStakes[1].unlockAt,
      },
      {
        value: 2,
        label: labels[2],
        maxAmount: periodStakes[2].amountFormatted,
        isLocked: periodStakes[2].isLocked,
        unlockAt: periodStakes[2].unlockAt,
      },
    ];
  }, [periodStakes]);

  const handleStake = async (amount: string, period: StakingPeriod) => {
    if (!connected) {
      toast.error("Connect your wallet first");
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (num > parseFloat(userStakingBalanceFormatted)) {
      toast.error("Insufficient balance");
      return;
    }
    try {
      const sig = await stake(amount, period);
      setHistoryRefreshTrigger((t) => t + 1);
      toast.success(
        <>
          Staked {amount} {CONFIG.stakingTokenSymbol}.{" "}
          <a
            href={EXPLORER_TX(sig)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            View transaction
          </a>
        </>
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Stake failed");
    }
  };

  const handleUnstake = async (amount: string, period: StakingPeriod) => {
    if (!connected) {
      toast.error("Connect your wallet first");
      return;
    }
    const ps = periodStakes[period];
    if (ps.isLocked) {
      toast.error("This period is still locked");
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (num > parseFloat(ps.amountFormatted)) {
      toast.error("Insufficient staked amount in this period");
      return;
    }
    try {
      const sig = await unstake(amount, period);
      setHistoryRefreshTrigger((t) => t + 1);
      toast.success(
        <>
          Unstaked {amount} {CONFIG.stakingTokenSymbol}.{" "}
          <a
            href={EXPLORER_TX(sig)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            View transaction
          </a>
        </>
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unstake failed");
    }
  };

  const handleClaim = async () => {
    if (!connected) {
      toast.error("Connect your wallet first");
      return;
    }
    const pending = parseFloat(pendingRewardFormatted);
    if (pending <= 0) {
      toast.error("No rewards to claim");
      return;
    }
    try {
      const sig = await claim();
      setHistoryRefreshTrigger((t) => t + 1);
      toast.success(
        <>
          Rewards claimed.{" "}
          <a
            href={EXPLORER_TX(sig)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            View transaction
          </a>
        </>
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Claim failed");
    }
  };

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
        {!connected ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/80 py-20 shadow-sm dark:shadow-none backdrop-blur-sm">
            <p className="mb-4 text-muted-foreground">
              Connect your wallet to view the dashboard and stake.
            </p>
            <WalletButton />
          </div>
        ) : !loading && !pool ? (
          <div className="mx-auto max-w-lg py-12">
            <Alert
              variant="warning"
              title="Pool not loaded"
              action={
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-lg bg-warning/20 px-4 py-2 text-sm font-semibold text-warning hover:bg-warning/30 focus-visible:ring-2 focus-visible:ring-warning/50"
                >
                  Retry
                </button>
              }
            >
              <p>
                The staking pool may not be initialized yet on devnet, or the RPC could not fetch it. Run the init-pool script if you deployed the program, or check your RPC and program ID in .env.local.
              </p>
            </Alert>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6">
                <Alert variant="error" title="Error">
                  {error}
                </Alert>
              </div>
            )}

            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h2>
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-xl bg-muted"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatsCard
                    title="Total Staked"
                    value={`${totalStakedFormatted} ${CONFIG.stakingTokenSymbol}`}
                  />
                  <StatsCard
                    title="APR"
                    value={formatApr(apr)}
                    subValue="Based on current emission"
                    gradient
                  />
                  <StatsCard
                    title="Reward / Second"
                    value={rewardPerSecondFormatted}
                    subValue="Reward token emission"
                  />
                  <StatsCard
                    title="Your Staked"
                    value={`${userStakedFormatted} ${CONFIG.stakingTokenSymbol}`}
                  />
                </div>
              )}
            </section>

            <section className="mb-10 grid gap-6 lg:grid-cols-2">
              <div className="card-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    Pending Rewards
                  </h3>
                  <span className="text-2xl font-bold text-foreground">
                    {pendingRewardFormatted}
                  </span>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Reward balance in wallet: {userRewardBalanceFormatted}
                </p>
                <button
                  onClick={handleClaim}
                  disabled={
                    claimLoading ||
                    parseFloat(pendingRewardFormatted) <= 0 ||
                    !pool
                  }
                  className="w-full rounded-xl border-2 border-primary bg-primary py-3 font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                >
                  {claimLoading ? "Claiming..." : "Claim Rewards"}
                </button>
              </div>

              <div className="card-surface p-6">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Wallet Balance
                </h3>
                <p className="text-2xl font-bold text-foreground">
                  {userStakingBalanceFormatted} {CONFIG.stakingTokenSymbol}
                </p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <StakeCard
                action="stake"
                balance={userStakingBalanceFormatted}
                staked={userStakedFormatted}
                maxAmount={userStakingBalanceFormatted}
                disabled={!pool || loading}
                loading={stakeLoading}
                onConfirm={handleStake}
                tokenSymbol={CONFIG.stakingTokenSymbol}
                periodOptions={stakePeriodOptions}
                selectedPeriod={stakePeriod}
                onPeriodChange={setStakePeriod}
              />
              <StakeCard
                action="unstake"
                balance={userStakingBalanceFormatted}
                staked={userStakedFormatted}
                maxAmount={userStakedFormatted}
                disabled={!pool || loading}
                loading={unstakeLoading}
                onConfirm={handleUnstake}
                tokenSymbol={CONFIG.stakingTokenSymbol}
                periodOptions={unstakePeriodOptions}
                selectedPeriod={unstakePeriod}
                onPeriodChange={setUnstakePeriod}
                detailHref="/staking-details"
              />
            </section>

            <section className="mt-10">
              <TransactionHistory refreshTrigger={historyRefreshTrigger} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
