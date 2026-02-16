"use client";

import React, { useState } from "react";
import Link from "next/link";

export type StakeAction = "stake" | "unstake";

export interface PeriodOption {
  value: 0 | 1 | 2;
  label: string;
  maxAmount: string;
  isLocked?: boolean;
  unlockAt?: number;
}

interface StakeCardProps {
  action: StakeAction;
  balance: string;
  staked: string;
  maxAmount: string;
  disabled: boolean;
  loading: boolean;
  onConfirm: (amount: string, period: 0 | 1 | 2) => Promise<void>;
  tokenSymbol?: string;
  /** For stake: period options (1m, 3m, 1y). For unstake: period options with per-period max and lock status. */
  periodOptions?: PeriodOption[];
  selectedPeriod?: 0 | 1 | 2;
  onPeriodChange?: (period: 0 | 1 | 2) => void;
  /** When set and action is "unstake", shows a Detail button linking to the staking details page. */
  detailHref?: string;
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
  periodOptions,
  selectedPeriod = 0,
  onPeriodChange,
  detailHref,
}: StakeCardProps) {
  const [amount, setAmount] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const isStake = action === "stake";
  const usePeriodMax = !isStake && periodOptions && periodOptions.length > 0;
  const selectedOption = periodOptions?.find((o) => o.value === selectedPeriod);
  const effectiveMax = usePeriodMax
    ? selectedOption?.maxAmount ?? maxAmount
    : maxAmount;
  const isLocked = selectedOption?.isLocked ?? false;
  const max = effectiveMax;
  const hasInsufficient = !!amount && parseFloat(amount) > parseFloat(max);
  const canSubmit =
    amount &&
    parseFloat(amount) > 0 &&
    !hasInsufficient &&
    !disabled &&
    !loading &&
    !localLoading &&
    !isLocked;

  const handleMax = () => setAmount(max);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLocalLoading(true);
    try {
      await onConfirm(amount, selectedPeriod);
      setAmount("");
    } finally {
      setLocalLoading(false);
    }
  };

  const formatUnlock = (ts: number) => {
    if (ts == null || !Number.isFinite(ts) || ts <= 0) return "";
    const ms = ts * 1000;
    if (!Number.isFinite(ms) || ms > 8640000000000000) return ""; // valid Date range
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return "";
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
  };

  return (
    <div className="card-surface p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-foreground">
          {isStake ? "Stake" : "Unstake"} {tokenSymbol}
        </h3>
        {!isStake && detailHref && (
          <Link
            href={detailHref}
            className="rounded-lg border-2 border-border bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition hover:border-primary/40 hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Detail
          </Link>
        )}
      </div>
      {periodOptions && periodOptions.length > 0 && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            {isStake ? "Lock period" : "Unstake from"}
          </label>
          <div className="flex gap-2">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPeriodChange?.(opt.value)}
                className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                  selectedPeriod === opt.value
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-secondary text-secondary-foreground hover:border-primary/40"
                } ${!isStake && opt.isLocked ? "opacity-90" : ""}`}
              >
                {opt.label}
                {!isStake && opt.maxAmount !== "0" && (
                  <span className="ml-1 text-muted-foreground">
                    ({opt.maxAmount})
                  </span>
                )}
              </button>
            ))}
          </div>
          {!isStake && selectedOption?.isLocked && selectedOption?.unlockAt && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              Locked until {formatUnlock(selectedOption.unlockAt)}
            </p>
          )}
        </div>
      )}
      <p className="mb-2 text-sm text-muted-foreground">
        {isStake ? "Wallet balance" : "Staked in this period"}: {max} {tokenSymbol}
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
            disabled={disabled || loading || localLoading || isLocked}
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
        {!isStake && isLocked && (
          <p className="text-sm text-muted-foreground">
            Unstake will be available after the lock period ends.
          </p>
        )}
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
