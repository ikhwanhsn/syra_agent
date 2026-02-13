"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/WalletButton";
import { StatsCard } from "@/components/StatsCard";
import { StakeCard } from "@/components/StakeCard";
import { useStaking } from "@/hooks/useStaking";
import { toast } from "sonner";

const TOKEN_SYMBOL = "STAKE";

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
      await stake(amount);
      toast.success(`Staked ${amount} ${TOKEN_SYMBOL}`);
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
      await unstake(amount);
      toast.success(`Unstaked ${amount} ${TOKEN_SYMBOL}`);
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
      await claim();
      toast.success("Rewards claimed successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Claim failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <h1 className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-xl font-bold text-transparent">
            Staking dApp
          </h1>
          <WalletButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {!connected ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-20 backdrop-blur-sm">
            <p className="mb-4 text-zinc-400">
              Connect your wallet to view the dashboard and stake.
            </p>
            <WalletButton />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <section className="mb-10">
              <h2 className="mb-6 text-2xl font-bold text-white">Dashboard</h2>
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-xl bg-white/5"
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
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Pending Rewards
                  </h3>
                  <span className="text-2xl font-bold text-cyan-400">
                    {pendingRewardFormatted}
                  </span>
                </div>
                <p className="mb-4 text-sm text-zinc-400">
                  Reward balance in wallet: {userRewardBalanceFormatted}
                </p>
                <button
                  onClick={handleClaim}
                  disabled={
                    claimLoading ||
                    parseFloat(pendingRewardFormatted) <= 0 ||
                    !pool
                  }
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {claimLoading ? "Claiming..." : "Claim Rewards"}
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Wallet Balance
                </h3>
                <p className="text-2xl font-bold text-white">
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
