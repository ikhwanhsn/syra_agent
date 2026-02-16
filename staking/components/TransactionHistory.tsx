"use client";

import React from "react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { CONFIG } from "@/constants/config";
import type { StakingTxType } from "@/lib/transactionHistory";

const EXPLORER_CLUSTER = CONFIG.rpcEndpoint.includes("devnet")
  ? "devnet"
  : "mainnet";
const EXPLORER_TX = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=${EXPLORER_CLUSTER}`;

function formatDate(blockTime: number | null): string {
  if (blockTime == null || !Number.isFinite(blockTime)) return "—";
  try {
    return new Date(blockTime * 1000).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function typeLabel(type: StakingTxType): string {
  switch (type) {
    case "stake":
      return "Stake";
    case "unstake":
      return "Unstake";
    case "claim":
      return "Claim";
    default:
      return "Transaction";
  }
}

function typeBadgeClass(type: StakingTxType): string {
  switch (type) {
    case "stake":
      return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
    case "unstake":
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
    case "claim":
      return "bg-primary/20 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function shortSignature(sig: string): string {
  if (sig.length <= 12) return sig;
  return `${sig.slice(0, 6)}...${sig.slice(-6)}`;
}

interface TransactionHistoryProps {
  /** When this value changes, history is refetched (e.g. after a new tx). */
  refreshTrigger?: number;
}

export function TransactionHistory({ refreshTrigger }: TransactionHistoryProps = {}) {
  const {
    transactions,
    loading,
    loadingMore,
    error,
    hasMore,
    refetch,
    loadMore,
  } = useTransactionHistory();

  React.useEffect(() => {
    if (refreshTrigger != null && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  return (
    <div className="card-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Transaction history
        </h3>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={loading}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      )}

      {loading && transactions.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No stake, unstake, or claim transactions yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Signature</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.signature}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeClass(tx.type)}`}
                      >
                        {typeLabel(tx.type)}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {formatDate(tx.blockTime)}
                    </td>
                    <td className="py-3">
                      <a
                        href={EXPLORER_TX(tx.signature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-primary hover:underline"
                      >
                        {shortSignature(tx.signature)}
                      </a>
                    </td>
                    <td className="py-3">
                      {tx.err ? (
                        <span className="text-destructive">Failed</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Success
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center border-t border-border pt-4">
              <button
                type="button"
                onClick={() => loadMore()}
                disabled={loadingMore}
                className="rounded-xl border-2 border-primary bg-primary/10 px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
