/**
 * Shared Solana tx helpers for LP real agent and wallet broker.
 * Priority fees + blockhash refresh reduce tx_confirm_timeout during congestion.
 */
import {
  ComputeBudgetProgram,
  Keypair,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { createSolanaConnection, getSolanaRpcUrlCandidates } from "./solanaServerRpc.js";
import { decryptAgentSecretFromStorage } from "./agentWalletSecretCrypto.js";

let blockchainConnectionSingleton = null;
let blockchainRpcUrl = null;

/** Primary RPC for send/confirm/build (first env candidate with fetch timeout). */
export function getBlockchainSolanaConnection() {
  const candidates = getSolanaRpcUrlCandidates();
  const url = candidates[0] || "https://api.mainnet-beta.solana.com";
  if (!blockchainConnectionSingleton || blockchainRpcUrl !== url) {
    blockchainConnectionSingleton = createSolanaConnection(url);
    blockchainRpcUrl = url;
  }
  return blockchainConnectionSingleton;
}

function envInt(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Default priority fee for Meteora DLMM txs (micro-lamports per compute unit). */
export function getDefaultPriorityFeeMicroLamports() {
  return envInt("SOLANA_PRIORITY_FEE_MICROLAMPORTS", 150_000);
}

/** Default compute unit limit for Meteora DLMM open/close txs. */
export function getDefaultComputeUnitLimit() {
  return envInt("SOLANA_COMPUTE_UNIT_LIMIT", 600_000);
}

/**
 * Prepend compute budget instructions when absent (legacy Transaction).
 * @param {Transaction} tx
 */
export function injectPriorityFeeInstructions(tx) {
  const hasComputeBudget = tx.instructions.some((ix) =>
    ix.programId.equals(ComputeBudgetProgram.programId),
  );
  if (hasComputeBudget) return;

  tx.instructions.unshift(
    ComputeBudgetProgram.setComputeUnitLimit({ units: getDefaultComputeUnitLimit() }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: getDefaultPriorityFeeMicroLamports() }),
  );
}

/**
 * @param {string} positionSecretEnc
 * @returns {Keypair}
 */
export function keypairFromEncryptedSecret(positionSecretEnc) {
  const plain = decryptAgentSecretFromStorage(positionSecretEnc);
  return Keypair.fromSecretKey(bs58.decode(plain));
}

/**
 * Refresh blockhash on a partially-signed legacy tx before broker submit.
 * Required for multi-tx Meteora sequences where earlier txs may take >30s to confirm.
 *
 * @param {string} serializedTxBase64
 * @param {Keypair[]} [partialSigners]
 * @returns {Promise<{ serializedTxBase64: string; blockhash: string; lastValidBlockHeight: number }>}
 */
export async function refreshSerializedLegacyTxBlockhash(serializedTxBase64, partialSigners = []) {
  const tx = Transaction.from(Buffer.from(serializedTxBase64, "base64"));
  const connection = getBlockchainSolanaConnection();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;

  for (const sig of tx.signatures) {
    sig.signature = null;
  }
  if (partialSigners.length > 0) {
    tx.partialSign(...partialSigners);
  }

  const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  return {
    serializedTxBase64: Buffer.from(serialized).toString("base64"),
    blockhash,
    lastValidBlockHeight,
  };
}

/**
 * @param {string} serializedTxBase64
 * @param {string | null | undefined} positionSecretEnc
 */
export async function refreshLpRealSerializedTx(serializedTxBase64, positionSecretEnc) {
  const partialSigners =
    positionSecretEnc != null && String(positionSecretEnc).trim()
      ? [keypairFromEncryptedSecret(positionSecretEnc)]
      : [];
  return refreshSerializedLegacyTxBlockhash(serializedTxBase64, partialSigners);
}
