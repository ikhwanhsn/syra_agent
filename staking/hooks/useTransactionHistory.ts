"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import {
  fetchTransactionHistory,
  type TransactionHistoryEntry,
} from "@/lib/transactionHistory";

const PAGE_SIZE = 10;

/** Only show stake, unstake, and claim (exclude other transactions). */
function isStakingTx(entry: TransactionHistoryEntry): boolean {
  return entry.type === "stake" || entry.type === "unstake" || entry.type === "claim";
}

export function useTransactionHistory(): {
  transactions: TransactionHistoryEntry[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
} {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<TransactionHistoryEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!publicKey) {
      setTransactions([]);
      setNextCursor(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { entries, nextCursor: cursor } = await fetchTransactionHistory(
        connection,
        publicKey,
        { limit: PAGE_SIZE }
      );
      setTransactions(entries.filter(isStakingTx));
      setNextCursor(cursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
      setTransactions([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  const loadMore = useCallback(async () => {
    if (!publicKey || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const { entries, nextCursor: cursor } = await fetchTransactionHistory(
        connection,
        publicKey,
        { limit: PAGE_SIZE, before: nextCursor }
      );
      setTransactions((prev) => [...prev, ...entries.filter(isStakingTx)]);
      setNextCursor(cursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [connection, publicKey, nextCursor, loadingMore]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    transactions,
    loading,
    loadingMore,
    error,
    hasMore: nextCursor != null,
    refetch,
    loadMore,
  };
}
