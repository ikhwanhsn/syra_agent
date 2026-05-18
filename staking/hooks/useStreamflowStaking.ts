"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAssociatedTokenAddressSync, getAccount } from "@solana/spl-token";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";
import { formatUnits, parseUnits } from "@/lib/format";
import {
  createTokenLockStake,
  fetchUserTokenLocksAll,
  type UserLockRow,
} from "@/lib/streamflowStaking";
import {
  bulkUpsertLocksToRegistry,
  fetchLocksFromRegistry,
  upsertLockToRegistry,
  type StreamflowLockRegistryItem,
} from "@/lib/streamflowLockRegistry";

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

export interface StreamflowStakingState {
  /** Open Streamflow locks for this wallet + mint. */
  locks: UserLockRow[];
  /** Completed / closed locks (staking history). */
  historyLocks: UserLockRow[];
  walletBalanceRaw: bigint;
  walletBalanceFormatted: string;
  refetch: () => Promise<void>;
  lockTokens: (amount: string, lockDurationSeconds: number) => Promise<string>;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

export function useStreamflowStaking(): StreamflowStakingState {
  const { connection } = useConnection();
  const { publicKey, wallet, connected } = useWallet();
  const [locks, setLocks] = useState<UserLockRow[]>([]);
  const [historyLocks, setHistoryLocks] = useState<UserLockRow[]>([]);
  const [walletBalanceRaw, setWalletBalanceRaw] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedWalletRef = useRef<string | null>(null);

  const decimals = STREAMFLOW_CONFIG.tokenDecimals;
  const mint = STREAMFLOW_CONFIG.tokenMint;

  const walletBalanceFormatted = useMemo(
    () => formatUnits(walletBalanceRaw, decimals, 6),
    [walletBalanceRaw, decimals]
  );

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setWalletBalanceRaw(BigInt(0));
      return;
    }
    try {
      const ata = getAssociatedTokenAddressSync(mint, publicKey, false);
      const acc = await getAccount(connection, ata).catch(() => null);
      setWalletBalanceRaw(acc?.amount ?? BigInt(0));
    } catch {
      setWalletBalanceRaw(BigInt(0));
    }
  }, [connection, publicKey, mint]);

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
      chainRows = await fetchUserTokenLocksAll(connection, publicKey);
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
  }, [connection, publicKey, mint, decimals]);

  const fetchData = useCallback(async () => {
    if (!publicKey) {
      setWalletBalanceRaw(BigInt(0));
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
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [publicKey, fetchBalance, fetchLocks]);

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

  const lockTokens = useCallback(
    async (amount: string, lockDurationSeconds: number): Promise<string> => {
      if (!connected || !wallet?.adapter) {
        throw new Error("Connect your wallet first");
      }
      const adapter = wallet.adapter as SignerWalletAdapter;
      const raw = parseUnits(amount.trim(), decimals);
      if (raw <= BigInt(0)) throw new Error("Enter a valid amount");
      if (raw <= BigInt(1)) {
        throw new Error("Amount too small for Streamflow (minimum 2 base units)");
      }
      if (raw > walletBalanceRaw) throw new Error("Insufficient balance");
      setActionLoading(true);
      setError(null);
      try {
        const { txId, metadataId, unlockAtUnix } = await createTokenLockStake(
          connection,
          adapter,
          raw,
          lockDurationSeconds
        );
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
            decimals,
            amountRaw: raw.toString(),
            amountFormatted: formatUnits(raw, decimals, 6),
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
        return txId;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Lock failed";
        setError(msg);
        throw e instanceof Error ? e : new Error(msg);
      } finally {
        setActionLoading(false);
      }
    },
    [connected, wallet?.adapter, decimals, walletBalanceRaw, connection, refetchAll, publicKey, mint]
  );

  return {
    locks,
    historyLocks,
    walletBalanceRaw,
    walletBalanceFormatted,
    refetch: refetchAll,
    lockTokens,
    loading,
    actionLoading,
    error,
  };
}
