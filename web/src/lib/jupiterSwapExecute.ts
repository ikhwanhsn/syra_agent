import { VersionedTransaction } from "@solana/web3.js";
import { withRpcFallback } from "@/lib/solanaRpc";

export interface SwapExecuteResult {
  signature: string;
}

export function formatSwapExecutionError(raw: string): string {
  if (raw === "fetch failed") {
    return "Could not reach the network. Check your connection and try again.";
  }
  if (/user rejected|rejected the request|cancelled/i.test(raw)) {
    return "Transaction cancelled in your wallet.";
  }
  if (/insufficient funds|insufficient lamports/i.test(raw)) {
    return "Insufficient SOL for transaction fees or swap amount.";
  }
  if (/slippage|0x1771|6001/i.test(raw)) {
    return "Slippage exceeded. Try increasing slippage tolerance and swap again.";
  }
  if (/blockhash not found|expired/i.test(raw)) {
    return "Quote expired. Refresh and try again.";
  }
  return raw;
}

/** Confirm in background — never block the swap UI on RPC confirmation latency. */
function confirmInBackground(
  connection: import("@solana/web3.js").Connection,
  signature: string,
  signedTx: VersionedTransaction,
  lastValidBlockHeight?: number | null,
): void {
  const blockhash = signedTx.message.recentBlockhash;
  const confirmPromise =
    lastValidBlockHeight != null
      ? connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed",
        )
      : connection.confirmTransaction(signature, "confirmed");

  void confirmPromise.catch(() => {
    /* Submitted to chain; explorer shows finality even if confirm poll times out. */
  });
}

export async function executeSignedSwap(params: {
  swapTransactionBase64: string;
  lastValidBlockHeight?: number | null;
  signTransaction: (tx: unknown) => Promise<VersionedTransaction>;
}): Promise<SwapExecuteResult> {
  const raw = Uint8Array.from(atob(params.swapTransactionBase64), (c) => c.charCodeAt(0));
  const tx = VersionedTransaction.deserialize(raw);
  const signed = await params.signTransaction(tx);
  const serialized = signed.serialize();

  return withRpcFallback(async (connection) => {
    const signature = await connection.sendRawTransaction(serialized, {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: "confirmed",
    });

    confirmInBackground(connection, signature, signed, params.lastValidBlockHeight);

    return { signature };
  });
}

export function solscanTxUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}`;
}
