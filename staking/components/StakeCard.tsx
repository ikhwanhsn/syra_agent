"use client";

import React, { useState } from "react";

export type StakeAction = "stake" | "unstake";

interface StakeCardProps {
  action: StakeAction;
  balance: string;
  staked: string;
  maxAmount: string;
  disabled: boolean;
  loading: boolean;
  onConfirm: (amount: string) => Promise<void>;
  tokenSymbol?: string;
}

export function StakeCard({
  action,
  balance,
  staked,
  maxAmount,
  disabled,
  loading,
  onConfirm,
  tokenSymbol = "TOKEN",
}: StakeCardProps) {
  const [amount, setAmount] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const isStake = action === "stake";
  const max = isStake ? balance : staked;
  const hasInsufficient = !!amount && parseFloat(amount) > parseFloat(max);
  const canSubmit =
    amount &&
    parseFloat(amount) > 0 &&
    !hasInsufficient &&
    !disabled &&
    !loading &&
    !localLoading;

  const handleMax = () => setAmount(max);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLocalLoading(true);
    try {
      await onConfirm(amount);
      setAmount("");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-semibold text-white">
        {isStake ? "Stake" : "Unstake"} {tokenSymbol}
      </h3>
      <p className="mb-2 text-sm text-zinc-400">
        {isStake ? "Wallet balance" : "Staked"}: {max} {tokenSymbol}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, "");
              setAmount(v);
            }}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            disabled={disabled || loading || localLoading}
          />
          {hasInsufficient && (
            <p className="mt-1 text-sm text-red-400">Insufficient balance</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleMax}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/15"
          >
            Max
          </button>
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {localLoading || loading
            ? "Processing..."
            : isStake
              ? "Stake"
              : "Unstake"}
        </button>
      </form>
    </div>
  );
}
