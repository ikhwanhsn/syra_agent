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
    <div className="card-surface p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        {isStake ? "Stake" : "Unstake"} {tokenSymbol}
      </h3>
      <p className="mb-2 text-sm text-muted-foreground">
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
            className="w-full rounded-xl border-2 border-border bg-input px-4 py-3 text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
            disabled={disabled || loading || localLoading}
          />
          {hasInsufficient && (
            <p className="mt-1 text-sm text-destructive">Insufficient balance</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleMax}
            className="rounded-lg border-2 border-border bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:bg-secondary/80 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98]"
          >
            Max
          </button>
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl border-2 border-primary bg-primary py-3 font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
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
