"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/WalletButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatsCard } from "@/components/StatsCard";
import { StakeCard } from "@/components/StakeCard";
import { useStaking } from "@/hooks/useStaking";
import { toast } from "sonner";
import { CONFIG } from "@/constants/config";

const TOKEN_SYMBOL = "STAKE";
const EXPLORER_CLUSTER = CONFIG.rpcEndpoint.includes("devnet") ? "devnet" : "mainnet";
const EXPLORER_TX = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=${EXPLORER_CLUSTER}`;

export default function StakingPage() {
  const { connected } = useWallet();
  const {
    pool,
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

  const handleStake = async (amount: string) => {
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
      const sig = await stake(amount);
      toast.success(
        <>
          Staked {amount} {TOKEN_SYMBOL}.{" "}
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

  const handleUnstake = async (amount: string) => {
    if (!connected) {
      toast.error("Connect your wallet first");
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (num > parseFloat(userStakedFormatted)) {
      toast.error("Insufficient staked amount");
      return;
    }
    try {
      const sig = await unstake(amount);
      toast.success(
        <>
          Unstaked {amount} {TOKEN_SYMBOL}.{" "}
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
          <h1 className="text-xl font-bold text-foreground">
            Staking dApp
          </h1>
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
          <div className="flex flex-col items-center justify-center rounded-2xl border border-warning/30 bg-warning/5 py-20 shadow-sm dark:shadow-none backdrop-blur-sm">
            <p className="mb-2 text-warning">
              Pool not loaded
            </p>
            <p className="mb-4 max-w-md text-center text-sm text-muted-foreground">
              The staking pool may not be initialized yet on devnet, or the RPC could not fetch it. Run the init-pool script if you deployed the program, or check your RPC and program ID in .env.local.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
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
                    value={`${totalStakedFormatted} ${TOKEN_SYMBOL}`}
                  />
                  <StatsCard
                    title="APR"
                    value={`${apr.toFixed(2)}%`}
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
                    value={`${userStakedFormatted} ${TOKEN_SYMBOL}`}
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
                  {userStakingBalanceFormatted} {TOKEN_SYMBOL}
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
                tokenSymbol={TOKEN_SYMBOL}
              />
              <StakeCard
                action="unstake"
                balance={userStakingBalanceFormatted}
                staked={userStakedFormatted}
                maxAmount={userStakedFormatted}
                disabled={!pool || loading}
                loading={unstakeLoading}
                onConfirm={handleUnstake}
                tokenSymbol={TOKEN_SYMBOL}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
