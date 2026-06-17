import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  type Connection,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

import { getPrimarySolanaRpcUrl, withRpcFallback } from "@/lib/solanaRpc";

export { getPrimarySolanaRpcUrl as getSolanaRpcEndpoint };

const CONFIRM_TIMEOUT_MS = 90_000;
const CONFIRM_POLL_MS = 2_000;
const MAX_SEND_ATTEMPTS = 3;

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

function isExpiredBlockhashError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /block height exceeded|blockhash not found|expired|timeout/i.test(msg);
}

function buildDepositTransaction(from: PublicKey, to: PublicKey, lamports: number): Transaction {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    }),
  );
  tx.feePayer = from;
  // Intentionally omit recentBlockhash — wallet.sendTransaction fetches a fresh one right before sign.
  return tx;
}

/**
 * Poll signature status (HTTP-only). Avoids confirmTransaction blockhash expiry errors.
 */
async function confirmSignatureByPolling(connection: Connection, signature: string): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < CONFIRM_TIMEOUT_MS) {
    const status = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });
    const value = status?.value;

    if (value?.err) {
      throw new Error(`Transaction failed on-chain: ${JSON.stringify(value.err)}`);
    }

    if (
      value?.confirmationStatus === "confirmed" ||
      value?.confirmationStatus === "finalized" ||
      value?.confirmationStatus === "processed"
    ) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, CONFIRM_POLL_MS));
  }

  const finalStatus = await connection.getSignatureStatus(signature, {
    searchTransactionHistory: true,
  });
  const final = finalStatus?.value;
  if (
    final?.confirmationStatus === "confirmed" ||
    final?.confirmationStatus === "finalized" ||
    final?.confirmationStatus === "processed"
  ) {
    return;
  }

  throw new Error(
    `Deposit sent (${signature.slice(0, 8)}…) but confirmation timed out. Check Solscan — if it landed, retry confirm with that signature.`,
  );
}

/**
 * Build and send a SOL deposit from the connected wallet to the KOL pool.
 */
export async function sendCampaignDeposit(params: {
  wallet: WalletContextState;
  poolWalletAddress: string;
  lamports: number;
}): Promise<string> {
  const { wallet, poolWalletAddress, lamports } = params;

  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error("Connect a Solana wallet first");
  }

  if (!Number.isFinite(lamports) || lamports <= 0) {
    throw new Error("Invalid deposit amount");
  }

  const from = wallet.publicKey;
  const to = new PublicKey(poolWalletAddress);

  return withRpcFallback(async (connection) => {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_SEND_ATTEMPTS; attempt++) {
      try {
        const tx = buildDepositTransaction(from, to, lamports);
        const signature = await wallet.sendTransaction!(tx, connection, {
          skipPreflight: false,
          maxRetries: 3,
          preflightCommitment: "confirmed",
        });
        await confirmSignatureByPolling(connection, signature);
        return signature;
      } catch (error) {
        lastError = error;
        if (attempt < MAX_SEND_ATTEMPTS - 1 && isExpiredBlockhashError(error)) {
          continue;
        }
        throw error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Deposit failed");
  });
}
