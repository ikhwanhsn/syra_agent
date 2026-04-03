"use client";

import React, { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTheme } from "@/app/ThemeContext";
import { StakingPageHeader } from "@/components/StakingPageHeader";
import { useStreamflowStaking } from "@/hooks/useStreamflowStaking";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";
import { CONFIG } from "@/constants/config";
import { toast } from "sonner";

const EXPLORER_TX = (sig: string) =>
  CONFIG.IS_DEVNET
    ? `https://explorer.solana.com/tx/${sig}?cluster=devnet`
    : `https://explorer.solana.com/tx/${sig}`;

function formatCompactBalance(value: string): string {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return "0";
  if (num >= 1_000_000_000) return `${Math.floor(num / 1_000_000_000)}B`;
  if (num >= 1_000_000) return `${Math.floor(num / 1_000_000)}M`;
  if (num >= 1_000) return `${Math.floor(num / 1_000)}K`;
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function StreamflowStakingPage() {
  const { resolved: theme } = useTheme();
  const { connected } = useWallet();
  const [amount, setAmount] = useState("");
  const [presetIndex, setPresetIndex] = useState(0);
  const {
    locks,
    walletBalanceFormatted,
    lockTokens,
    withdrawUnlocked,
    loading,
    actionLoading,
    error,
  } = useStreamflowStaking();

  const preset = STREAMFLOW_CONFIG.lockPresets[presetIndex];

  const sortedLocks = useMemo(() => locks, [locks]);
  const walletBalanceCompact = useMemo(
    () => formatCompactBalance(walletBalanceFormatted),
    [walletBalanceFormatted]
  );

  const handleLock = async () => {
    if (!connected) {
      toast.error("Connect your wallet first");
      return;
    }
    try {
      const sig = await lockTokens(amount, preset.seconds);
      toast.success(
        <>
          Created Streamflow lock.{" "}
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
      setAmount("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lock failed");
    }
  };

  const handleWithdraw = async (id: string) => {
    try {
      const sig = await withdrawUnlocked(id);
      toast.success(
        <>
          Withdrew to your wallet.{" "}
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
      toast.error(e instanceof Error ? e.message : "Withdraw failed");
    }
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-theme={theme}
    >
      <StakingPageHeader />

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10">
        <section className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Streamflow token locks
          </h1>
          <p className="max-w-2xl text-muted-foreground leading-relaxed">
            Lock {STREAMFLOW_CONFIG.tokenSymbol} using{" "}
            <a
              href="https://streamflow.finance/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Streamflow
            </a>{" "}
            on Solana. Funds unlock at the end of the period; you withdraw them to your wallet
            after unlock. This path does not use the legacy Anchor staking program or reward pool.
          </p>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <section className="grid gap-6 rounded-xl border border-border bg-card p-6 shadow-sm md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">New lock</h2>
            <label className="block text-sm text-muted-foreground">
              Amount ({STREAMFLOW_CONFIG.tokenSymbol})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-offset-background focus:ring-2 focus:ring-ring"
              disabled={!connected || actionLoading}
            />
            <p className="text-xs text-muted-foreground" title={walletBalanceFormatted}>
              Wallet balance: {walletBalanceCompact} {STREAMFLOW_CONFIG.tokenSymbol}
            </p>
            <label className="block text-sm text-muted-foreground">Lock duration</label>
            <div className="flex flex-wrap gap-2">
              {STREAMFLOW_CONFIG.lockPresets.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPresetIndex(i)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    presetIndex === i
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                  disabled={actionLoading}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void handleLock()}
              disabled={!connected || actionLoading || loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading ? "Confirm in wallet…" : "Create lock"}
            </button>
            <p className="text-xs text-muted-foreground">
              Streamflow charges a small SOL fee for contract creation. Ensure you have SOL for fees.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-medium">Your locks</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : sortedLocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active locks for this wallet on this mint.
              </p>
            ) : (
              <ul className="space-y-3">
                {sortedLocks.map((row) => {
                  const now = Math.floor(Date.now() / 1000);
                  const unlocked = now >= row.unlocksAtUnix;
                  const unlockDate = new Date(row.unlocksAtUnix * 1000).toLocaleString();
                  return (
                    <li
                      key={row.id}
                      className="rounded-lg border border-border bg-background/60 p-4 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {row.depositedFormatted} {STREAMFLOW_CONFIG.tokenSymbol}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Unlocks {unlockDate}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Withdrawable now: {row.unlockedFormatted}{" "}
                            {STREAMFLOW_CONFIG.tokenSymbol}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleWithdraw(row.id)}
                          disabled={!unlocked || actionLoading}
                          className="shrink-0 rounded-md border border-border px-3 py-1 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Withdraw
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
