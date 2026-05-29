"use client";

import type { Wallet } from "@coral-xyz/anchor";
import { PublicKey, type Transaction, type VersionedTransaction } from "@solana/web3.js";
import { useWalletContext } from "@/contexts/WalletContext";

/**
 * Anchor-compatible wallet backed by Privy Solana signing.
 */
export function usePrivyAnchorWallet(): Wallet | null {
  const { publicKey, signTransaction, signAllTransactions } = useWalletContext();

  if (!publicKey || !signTransaction) return null;

  return {
    publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      const signed = await signTransaction(tx);
      return signed as T;
    },
    signAllTransactions: signAllTransactions
      ? async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
          const signed = await signAllTransactions(txs);
          return signed as T[];
        }
      : async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
          const out: T[] = [];
          for (const tx of txs) {
            out.push((await signTransaction(tx)) as T);
          }
          return out;
        },
  };
}

export function publicKeyFromAddress(address: string | null | undefined): PublicKey | null {
  if (!address) return null;
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}
