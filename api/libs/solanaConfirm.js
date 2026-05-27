/**
 * Poll Solana RPC until a transaction signature is confirmed on-chain (or fails / times out).
 */
import { createSolanaConnection, getSolanaRpcUrlCandidates } from "./solanaServerRpc.js";

const CONFIRM_POLL_MS = 1_500;
const DEFAULT_CONFIRM_TIMEOUT_MS = 90_000;

/**
 * @param {import("@solana/web3.js").Connection} connection
 * @param {string} signature
 * @param {{ timeoutMs?: number; lastValidBlockHeight?: number }} [options]
 */
export async function confirmSolanaTransaction(connection, signature, options = {}) {
  const sig = String(signature || "").trim();
  if (!sig) throw new Error("tx_signature_missing");

  const timeoutMs = options.timeoutMs ?? DEFAULT_CONFIRM_TIMEOUT_MS;
  const lastValidBlockHeight = options.lastValidBlockHeight;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (await isSolanaTxConfirmedOnAnyRpc(sig)) {
      return;
    }

    if (lastValidBlockHeight != null && Number.isFinite(lastValidBlockHeight)) {
      try {
        const currentHeight = await connection.getBlockHeight("confirmed");
        if (currentHeight > lastValidBlockHeight) {
          if (await isSolanaTxConfirmedOnAnyRpc(sig)) {
            return;
          }
          throw new Error("tx_blockhash_expired");
        }
      } catch (err) {
        if (err instanceof Error && err.message === "tx_blockhash_expired") {
          throw err;
        }
        // RPC read failed — keep polling signature status on other endpoints
      }
    }

    const { value } = await connection.getSignatureStatuses([sig], {
      searchTransactionHistory: true,
    });
    const status = value?.[0];

    if (status?.err) {
      throw new Error(`tx_failed_onchain:${JSON.stringify(status.err)}`);
    }

    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      return;
    }

    await new Promise((r) => setTimeout(r, CONFIRM_POLL_MS));
  }

  if (await isSolanaTxConfirmedOnAnyRpc(sig)) {
    return;
  }

  if (await isSolanaTxConfirmedOnChain(connection, sig)) {
    return;
  }

  throw new Error("tx_confirm_timeout");
}

/**
 * @param {import("@solana/web3.js").Connection} connection
 * @param {string} signature
 */
export async function isSolanaTxConfirmedOnChain(connection, signature) {
  const sig = String(signature || "").trim();
  if (!sig) return false;

  try {
    const { value } = await connection.getSignatureStatuses([sig], {
      searchTransactionHistory: true,
    });
    const status = value?.[0];
    if (!status || status.err) return false;
    return (
      status.confirmationStatus === "confirmed" ||
      status.confirmationStatus === "finalized"
    );
  } catch {
    return false;
  }
}

/**
 * Check signature status across all configured RPC URLs (Privy submit vs Syra read mismatch).
 * @param {string} signature
 */
export async function isSolanaTxConfirmedOnAnyRpc(signature) {
  const sig = String(signature || "").trim();
  if (!sig) return false;

  for (const rpcUrl of getSolanaRpcUrlCandidates()) {
    try {
      const connection = createSolanaConnection(rpcUrl);
      if (await isSolanaTxConfirmedOnChain(connection, sig)) {
        return true;
      }
    } catch {
      // try next RPC
    }
  }
  return false;
}
