"use client";

import { useSyraSolana } from "@/hooks/useSyraSolana";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";
import { formatUnits, parseUnits } from "@/lib/format";
import {
  createTokenLockStake,
  evaluateStakeReadiness,
  fetchMaxLockableRaw,
  fetchUserTokenLocksAll,
  mapStreamflowError,
  resolveStakeAmountRaw,
  StakeLockError,
  type StakeReadiness,
  type UserLockRow,
} from "@/lib/streamflowStaking";
import {
  bulkUpsertLocksToRegistry,
  fetchLocksFromRegistry,
  upsertLockToRegistry,
  type StreamflowLockRegistryItem,
} from "@/lib/streamflowLockRegistry";
import { withRpcFallback } from "@/lib/solanaRpc";

function toRegistryNetwork(): "mainnet" | "devnet" {
  return STREAMFLOW_CONFIG.isDevnet ? "devnet" : "mainnet";
}

function mergeRegistryAndChain(
  registry: UserLockRow[],
  chain: UserLockRow[]
): UserLockRow[] {
  const byId = new Map<string, UserLockRow>();
  for (const r of registry) {
    byId.set(r.id, r);
  }
  for (const r of chain) {
    const prev = byId.get(r.id);
    byId.set(r.id, prev ? { ...prev, ...r, closed: r.closed } : r);
  }
  return [...byId.values()];
}

function mapRegistryItemToRow(item: StreamflowLockRegistryItem): UserLockRow {
  return {
    id: item.streamId,
    mint: item.mint,
    sender: item.sender ?? item.wallet,
    recipient: item.recipient ?? item.wallet,
    depositedRaw: item.amountRaw,
    depositedFormatted: item.amountFormatted,
    unlockedRaw: item.unlockedRaw ?? "0",
    unlockedFormatted: item.unlockedFormatted ?? "0",
    withdrawnRaw: item.withdrawnRaw ?? "0",
    withdrawnFormatted: item.withdrawnFormatted ?? "0",
    unlocksAtUnix: item.unlockAtUnix,
    closed: Boolean(item.closed),
  };
}

export interface LockTokensResult {
  txId: string;
  wasClamped: boolean;
  amountFormatted: string;
}

export interface StreamflowStakingState {
  /** Open Streamflow locks for this wallet + mint. */
  locks: UserLockRow[];
  /** Completed / closed locks (staking history). */
  historyLocks: UserLockRow[];
  walletBalanceRaw: bigint;
  walletBalanceFormatted: string;
  /** Max deposit allowed after fees + safety buffer (use for "available to lock"). */
  maxLockableRaw: bigint;
  maxLockableFormatted: string;
  /** On-chain mint decimals (may differ from env). */
  tokenDecimals: number;
  refetch: () => Promise<void>;
  /** Refetch only the wallet's SPL balance (cheap; used by balance display). */
  refreshBalance: () => Promise<bigint>;
  /** Max lockable amount after Streamflow fees (used by Max/50% buttons). */
  refreshMaxLockAmount: () => Promise<{ maxLockable: bigint; decimals: number }>;
  lockTokens: (amount: string, lockDurationSeconds: number) => Promise<LockTokensResult>;
  readiness: StakeReadiness | null;
  readinessLoading: boolean;
  refreshReadiness: (amount?: string) => Promise<StakeReadiness | null>;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

export function useStreamflowStaking(): StreamflowStakingState {
  const { connection, publicKey, adapter, connected } = useSyraSolana();
  const [locks, setLocks] = useState<UserLockRow[]>([]);
  const [historyLocks, setHistoryLocks] = useState<UserLockRow[]>([]);
  const [walletBalanceRaw, setWalletBalanceRaw] = useState<bigint>(BigInt(0));
  const [maxLockableRaw, setMaxLockableRaw] = useState<bigint>(BigInt(0));
  const [mintDecimals, setMintDecimals] = useState(STREAMFLOW_CONFIG.tokenDecimals);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<StakeReadiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const fetchedWalletRef = useRef<string | null>(null);

  const decimals = mintDecimals;
  const mint = STREAMFLOW_CONFIG.tokenMint;

  const walletBalanceFormatted = useMemo(
    () => formatUnits(walletBalanceRaw, mintDecimals, 6),
    [walletBalanceRaw, mintDecimals]
  );

  const maxLockableFormatted = useMemo(
    () => formatUnits(maxLockableRaw, mintDecimals, mintDecimals),
    [maxLockableRaw, mintDecimals]
  );

  const fetchBalance = useCallback(async (): Promise<bigint> => {
    if (!publicKey) {
      setWalletBalanceRaw(BigInt(0));
      setMaxLockableRaw(BigInt(0));
      return BigInt(0);
    }
    try {
      return await withRpcFallback(async (readConnection) => {
        const { maxLockable, walletState } = await fetchMaxLockableRaw(readConnection, publicKey);
        setWalletBalanceRaw(walletState.balance);
        setMaxLockableRaw(maxLockable);
        setMintDecimals(walletState.decimals);
        return walletState.balance;
      });
    } catch {
      setWalletBalanceRaw(BigInt(0));
      setMaxLockableRaw(BigInt(0));
      return BigInt(0);
    }
  }, [publicKey]);

  const refreshMaxLockAmount = useCallback(async (): Promise<{
    maxLockable: bigint;
    decimals: number;
  }> => {
    if (!publicKey) {
      setMaxLockableRaw(BigInt(0));
      return { maxLockable: BigInt(0), decimals: mintDecimals };
    }
    try {
      return await withRpcFallback(async (readConnection) => {
        const { maxLockable, walletState } = await fetchMaxLockableRaw(readConnection, publicKey);
        setWalletBalanceRaw(walletState.balance);
        setMaxLockableRaw(maxLockable);
        setMintDecimals(walletState.decimals);
        return { maxLockable, decimals: walletState.decimals };
      });
    } catch {
      setMaxLockableRaw(BigInt(0));
      return { maxLockable: BigInt(0), decimals: mintDecimals };
    }
  }, [publicKey, mintDecimals]);

  const refreshReadiness = useCallback(
    async (amountInput = ""): Promise<StakeReadiness | null> => {
      if (!publicKey) {
        setReadiness(null);
        return null;
      }
      setReadinessLoading(true);
      try {
        const result = await withRpcFallback((readConnection) =>
          evaluateStakeReadiness(readConnection, publicKey, amountInput),
        );
        setReadiness(result);
        return result;
      } catch {
        setReadiness(null);
        return null;
      } finally {
        setReadinessLoading(false);
      }
    },
    [publicKey]
  );

  const fetchLocks = useCallback(async () => {
    if (!publicKey) {
      setLocks([]);
      setHistoryLocks([]);
      return;
    }

    let registryRows: UserLockRow[] = [];
    try {
      const registryItems = await fetchLocksFromRegistry(publicKey, mint, {
        includeClosed: true,
      });
      registryRows = registryItems.map(mapRegistryItemToRow);
    } catch {
      registryRows = [];
    }

    let chainRows: UserLockRow[] = [];
    try {
      chainRows = await withRpcFallback((readConnection) =>
        fetchUserTokenLocksAll(readConnection, publicKey),
      );
    } catch {
      chainRows = [];
    }

    const merged = mergeRegistryAndChain(registryRows, chainRows);
    const nowUnix = Math.floor(Date.now() / 1000);
    /** Open only while lock is still active (unlock time not reached); Streamflow may lag updating `closed`. */
    const open = merged
      .filter((r) => !r.closed && r.unlocksAtUnix > nowUnix)
      .sort((a, b) => a.unlocksAtUnix - b.unlocksAtUnix);
    /** History: explicitly closed, or unlock date has passed (e.g. yesterday). */
    const closed = merged
      .filter((r) => r.closed || r.unlocksAtUnix <= nowUnix)
      .sort((a, b) => b.unlocksAtUnix - a.unlocksAtUnix);

    setLocks(open);
    setHistoryLocks(closed);

    if (chainRows.length > 0) {
      const network = toRegistryNetwork();
      const nowUnix = Math.floor(Date.now() / 1000);
      const items: StreamflowLockRegistryItem[] = chainRows.map((row) => {
        const isActive = !row.closed && row.unlocksAtUnix > nowUnix;
        return {
          streamId: row.id,
          txId: row.id,
          wallet: publicKey.toBase58(),
          sender: row.sender,
          recipient: row.recipient,
          mint: row.mint,
          tokenSymbol: STREAMFLOW_CONFIG.tokenSymbol,
          decimals,
          amountRaw: row.depositedRaw,
          amountFormatted: row.depositedFormatted,
          unlockedRaw: row.unlockedRaw,
          unlockedFormatted: row.unlockedFormatted,
          withdrawnRaw: row.withdrawnRaw,
          withdrawnFormatted: row.withdrawnFormatted,
          unlockAtUnix: row.unlocksAtUnix,
          unlockAtIso: new Date(row.unlocksAtUnix * 1000).toISOString(),
          lockDurationSeconds: STREAMFLOW_CONFIG.lockDurationSeconds,
          network,
          source: "onchain_sync",
          closed: row.closed || !isActive,
          status: row.closed ? "closed" : isActive ? "active" : "expired",
          metadata: { syncedAt: new Date().toISOString() },
        };
      });
      await bulkUpsertLocksToRegistry(items).catch((err) => {
        console.warn("[staking] registry bulk sync failed:", err);
      });
    }
  }, [publicKey, mint, decimals]);

  const fetchData = useCallback(async () => {
    if (!publicKey) {
      setWalletBalanceRaw(BigInt(0));
      setMaxLockableRaw(BigInt(0));
      setLocks([]);
      setHistoryLocks([]);
      setLoading(false);
      setError(null);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await fetchBalance();
      await fetchLocks();
      await refreshReadiness("");
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [publicKey, fetchBalance, fetchLocks, refreshReadiness]);

  const walletKey = publicKey?.toBase58() ?? null;
  useEffect(() => {
    if (!walletKey) {
      fetchedWalletRef.current = null;
      void fetchData();
      return;
    }
    if (fetchedWalletRef.current === walletKey) return;
    fetchedWalletRef.current = walletKey;
    void fetchData();
  }, [walletKey, fetchData]);

  const refetchAll = useCallback(async () => {
    fetchedWalletRef.current = null;
    await fetchData();
  }, [fetchData]);

  /** Auto-refresh balance when the tab regains focus, so users coming back
   *  from a swap/transfer in their wallet see fresh numbers before staking. */
  useEffect(() => {
    if (!publicKey) return;
    const onFocus = () => {
      void fetchBalance();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchBalance();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [publicKey, fetchBalance]);

  const lockTokens = useCallback(
    async (amount: string, lockDurationSeconds: number): Promise<LockTokensResult> => {
      if (!connected || !adapter) {
        throw new Error("Connect your wallet first");
      }
      if (!publicKey) throw new Error("Wallet not connected");

      const { maxLockable, walletState } = await fetchMaxLockableRaw(connection, publicKey);
      const stakeDecimals = walletState.decimals;
      setWalletBalanceRaw(walletState.balance);
      setMaxLockableRaw(maxLockable);
      setMintDecimals(stakeDecimals);

      const requestedRaw = parseUnits(amount.trim(), stakeDecimals);
      if (requestedRaw <= BigInt(0)) {
        throw new StakeLockError({
          code: "amount_empty",
          title: "Enter an amount",
          message: "Choose how much to lock or tap Max.",
          fix: "Tap Max to use the highest lockable amount.",
        });
      }
      if (requestedRaw <= BigInt(1)) {
        throw new StakeLockError({
          code: "amount_too_low",
          title: "Amount too small",
          message: "Streamflow requires more than 2 base units.",
          fix: "Enter a larger amount or tap Max.",
        });
      }

      const resolved = await resolveStakeAmountRaw(connection, publicKey, requestedRaw);
      let raw = resolved.amountRaw;
      let preClamped = resolved.wasClamped;
      setActionLoading(true);
      setError(null);
      try {
        const { txId, metadataId, unlockAtUnix, amountRaw, wasClamped } =
          await createTokenLockStake(connection, adapter, raw, lockDurationSeconds);
        const amountFormatted = formatUnits(amountRaw, stakeDecimals, 6);
        const walletStr = publicKey?.toBase58() ?? "";
        if (walletStr) {
          const lockPayload: StreamflowLockRegistryItem = {
            streamId: metadataId,
            txId,
            wallet: walletStr,
            sender: walletStr,
            recipient: walletStr,
            mint: mint.toBase58(),
            tokenSymbol: STREAMFLOW_CONFIG.tokenSymbol,
            decimals: stakeDecimals,
            amountRaw: amountRaw.toString(),
            amountFormatted,
            unlockedRaw: "0",
            unlockedFormatted: "0",
            withdrawnRaw: "0",
            withdrawnFormatted: "0",
            unlockAtUnix,
            unlockAtIso: new Date(unlockAtUnix * 1000).toISOString(),
            lockDurationSeconds,
            network: toRegistryNetwork(),
            source: "app",
            closed: false,
            status: "active",
            metadata: { createdAtClient: new Date().toISOString() },
          };
          await upsertLockToRegistry(lockPayload).catch((err) => {
            console.warn("[staking] registry upsert failed:", err);
          });
        }
        await new Promise((r) => setTimeout(r, 2000));
        await refetchAll();
        return { txId, wasClamped: wasClamped || preClamped, amountFormatted };
      } catch (e) {
        const mapped = mapStreamflowError(e, STREAMFLOW_CONFIG.tokenSymbol);
        setError(mapped.displayMessage());
        throw mapped;
      } finally {
        setActionLoading(false);
      }
    },
    [connected, adapter, connection, refetchAll, publicKey, mint]
  );

  return {
    locks,
    historyLocks,
    walletBalanceRaw,
    walletBalanceFormatted,
    maxLockableRaw,
    maxLockableFormatted,
    tokenDecimals: mintDecimals,
    refetch: refetchAll,
    refreshBalance: fetchBalance,
    refreshMaxLockAmount,
    lockTokens,
    readiness,
    readinessLoading,
    refreshReadiness,
    loading,
    actionLoading,
    error,
  };
}
