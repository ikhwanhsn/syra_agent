"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAssociatedTokenAddressSync, getAccount } from "@solana/spl-token";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";
import { formatUnits, parseUnits } from "@/lib/format";
import {
  createTokenLockStake,
  fetchUserTokenLocks,
  withdrawFromLock,
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
  locks: UserLockRow[];
  walletBalanceRaw: bigint;
  walletBalanceFormatted: string;
  refetch: () => Promise<void>;
  lockTokens: (amount: string, lockDurationSeconds: number) => Promise<string>;
  withdrawUnlocked: (streamId: string) => Promise<string>;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

export function useStreamflowStaking(): StreamflowStakingState {
  const { connection } = useConnection();
  const { publicKey, wallet, connected } = useWallet();
  const [locks, setLocks] = useState<UserLockRow[]>([]);
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
      return;
    }

    try {
      const registryItems = await fetchLocksFromRegistry(publicKey, mint);
      if (registryItems.length > 0) {
        setLocks(registryItems.map(mapRegistryItemToRow));
        return;
      }
    } catch {
      // fallback to chain
    }

    try {
      const lockRows = await fetchUserTokenLocks(connection, publicKey);
      setLocks(lockRows);
      const network = toRegistryNetwork();
      const items: StreamflowLockRegistryItem[] = lockRows.map((row) => ({
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
        network,
        source: "onchain_sync",
        closed: row.closed,
        metadata: null,
      }));
      await bulkUpsertLocksToRegistry(items).catch(() => undefined);
    } catch {
      setLocks([]);
    }
  }, [connection, publicKey, mint, decimals]);

  const fetchData = useCallback(async () => {
    if (!publicKey) {
      setWalletBalanceRaw(BigInt(0));
      setLocks([]);
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
            network: toRegistryNetwork(),
            source: "app",
            closed: false,
            metadata: { createdAtClient: new Date().toISOString() },
          };
          await upsertLockToRegistry(lockPayload).catch(() => undefined);
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

  const withdrawUnlocked = useCallback(
    async (streamId: string): Promise<string> => {
      if (!connected || !wallet?.adapter) {
        throw new Error("Connect your wallet first");
      }
      const adapter = wallet.adapter as SignerWalletAdapter;
      setActionLoading(true);
      setError(null);
      try {
        const txId = await withdrawFromLock(connection, adapter, streamId);
        await new Promise((r) => setTimeout(r, 2000));
        await refetchAll();
        return txId;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Withdraw failed";
        setError(msg);
        throw e instanceof Error ? e : new Error(msg);
      } finally {
        setActionLoading(false);
      }
    },
    [connected, wallet?.adapter, connection, refetchAll]
  );

  return {
    locks,
    walletBalanceRaw,
    walletBalanceFormatted,
    refetch: refetchAll,
    lockTokens,
    withdrawUnlocked,
    loading,
    actionLoading,
    error,
  };
}
