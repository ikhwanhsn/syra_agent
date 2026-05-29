"use client";

import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { connection, useWalletContext } from "@/contexts/WalletContext";

/** Privy-backed Solana wallet for staking / Streamflow hooks. */
export function useSyraSolana() {
  const ctx = useWalletContext();

  const adapter: SignerWalletAdapter | null =
    ctx.publicKey && ctx.signTransaction
      ? ({
          publicKey: ctx.publicKey,
          signTransaction: ctx.signTransaction,
          signAllTransactions: ctx.signAllTransactions ?? (async (txs) =>
            Promise.all(txs.map((tx) => ctx.signTransaction!(tx)))),
        } as SignerWalletAdapter)
      : null;

  return {
    connection,
    publicKey: ctx.publicKey,
    connected: ctx.connected,
    address: ctx.address,
    adapter,
    signTransaction: ctx.signTransaction,
    signAllTransactions: ctx.signAllTransactions,
  };
}
