/**
 * KOL marketplace pool wallet — receives campaign deposits and sends pro-rata payouts.
 * Env: KOL_POOL_WALLET_PRIVATE_KEY, KOL_POOL_WALLET_ADDRESS (optional; derived from keypair).
 */
import bs58 from "bs58";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { withSolanaRpcFallback } from "../libs/solanaServerRpc.js";
import { confirmSolanaTransaction } from "../libs/solanaConfirm.js";

const TX_FEE_BUFFER_LAMPORTS = 10_000n;
const DEPOSIT_TOLERANCE_LAMPORTS = 5_000n;
const DEFAULT_POOL_ADDRESS = "GGj37PSMDUUgkac5HkMx36Sk38zbHDMtXFLn6MR2HXnv";

/** @type {Keypair | null} */
let cachedKeypair = null;

/**
 * @returns {Keypair}
 */
export function getPoolKeypair() {
  if (cachedKeypair) return cachedKeypair;

  const raw = (process.env.KOL_POOL_WALLET_PRIVATE_KEY || "").trim();
  if (!raw) {
    const err = new Error("KOL_POOL_WALLET_PRIVATE_KEY is not configured");
    err.code = "pool_wallet_unconfigured";
    throw err;
  }

  try {
    if (raw.startsWith("[")) {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) throw new Error("invalid_json_array");
      cachedKeypair = Keypair.fromSecretKey(Uint8Array.from(arr));
      return cachedKeypair;
    }
    cachedKeypair = Keypair.fromSecretKey(bs58.decode(raw));
    return cachedKeypair;
  } catch {
    const err = new Error("Invalid KOL_POOL_WALLET_PRIVATE_KEY");
    err.code = "pool_wallet_invalid";
    throw err;
  }
}

/**
 * @returns {string}
 */
export function getPoolWalletAddress() {
  const envAddr = (process.env.KOL_POOL_WALLET_ADDRESS || "").trim();
  if (envAddr) return envAddr;
  if (isPoolWalletConfigured()) {
    return getPoolKeypair().publicKey.toBase58();
  }
  return DEFAULT_POOL_ADDRESS;
}

/**
 * @returns {boolean}
 */
export function isPoolWalletConfigured() {
  return Boolean((process.env.KOL_POOL_WALLET_PRIVATE_KEY || "").trim());
}

/**
 * @param {string} address
 * @returns {PublicKey}
 */
function toPublicKey(address) {
  try {
    return new PublicKey(String(address || "").trim());
  } catch {
    const err = new Error("Invalid Solana address");
    err.code = "invalid_address";
    throw err;
  }
}

/**
 * Verify a confirmed deposit transaction sent SOL from project wallet to the pool.
 * @param {{ txSignature: string; expectedLamports: number; fromWallet: string }} opts
 */
export async function verifyDeposit({ txSignature, expectedLamports, fromWallet }) {
  const sig = String(txSignature || "").trim();
  if (!sig) {
    const err = new Error("txSignature is required");
    err.code = "invalid_tx";
    throw err;
  }

  const expected = BigInt(Math.floor(Number(expectedLamports) || 0));
  if (expected <= 0n) {
    const err = new Error("expectedLamports must be positive");
    err.code = "invalid_amount";
    throw err;
  }

  const fromPk = toPublicKey(fromWallet);
  const poolPk = toPublicKey(getPoolWalletAddress());

  return withSolanaRpcFallback(async (connection) => {
    const tx = await connection.getParsedTransaction(sig, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    if (!tx?.meta || tx.meta.err) {
      const err = new Error("Deposit transaction not found or failed");
      err.code = "deposit_tx_invalid";
      throw err;
    }

    const accountKeys = tx.transaction.message.accountKeys.map((k) =>
      typeof k === "string" ? k : k.pubkey.toBase58(),
    );

    const fromIndex = accountKeys.findIndex((k) => k === fromPk.toBase58());
    const poolIndex = accountKeys.findIndex((k) => k === poolPk.toBase58());

    if (fromIndex < 0) {
      const err = new Error("Deposit sender does not match project wallet");
      err.code = "deposit_sender_mismatch";
      throw err;
    }
    if (poolIndex < 0) {
      const err = new Error("Deposit recipient is not the pool wallet");
      err.code = "deposit_recipient_mismatch";
      throw err;
    }

    const preFrom = BigInt(tx.meta.preBalances[fromIndex] ?? 0);
    const postFrom = BigInt(tx.meta.postBalances[fromIndex] ?? 0);
    const prePool = BigInt(tx.meta.preBalances[poolIndex] ?? 0);
    const postPool = BigInt(tx.meta.postBalances[poolIndex] ?? 0);

    const sent = preFrom - postFrom;
    const received = postPool - prePool;

    if (received + DEPOSIT_TOLERANCE_LAMPORTS < expected) {
      const err = new Error(
        `Deposit amount insufficient: received ${received} lamports, expected ${expected}`,
      );
      err.code = "deposit_amount_insufficient";
      throw err;
    }

    if (sent < expected - DEPOSIT_TOLERANCE_LAMPORTS) {
      const err = new Error("Deposit sender balance change does not match expected amount");
      err.code = "deposit_amount_mismatch";
      throw err;
    }

    return {
      success: true,
      lamports: Number(received),
      fromWallet: fromPk.toBase58(),
      poolWallet: poolPk.toBase58(),
      txSignature: sig,
    };
  }, "verifyDeposit");
}

/**
 * Send SOL payout from pool wallet to a KOL wallet.
 * @param {{ toWallet: string; lamports: number }} opts
 */
export async function sendPayout({ toWallet, lamports }) {
  const amount = BigInt(Math.floor(Number(lamports) || 0));
  if (amount <= 0n) {
    const err = new Error("lamports must be positive");
    err.code = "invalid_amount";
    throw err;
  }

  const keypair = getPoolKeypair();
  const toPk = toPublicKey(toWallet);

  return withSolanaRpcFallback(async (connection) => {
    const poolBalance = BigInt(await connection.getBalance(keypair.publicKey, "confirmed"));
    if (poolBalance < amount + TX_FEE_BUFFER_LAMPORTS) {
      const err = new Error("Pool wallet has insufficient balance for payout");
      err.code = "pool_insufficient_balance";
      throw err;
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    const tx = new Transaction({
      feePayer: keypair.publicKey,
      recentBlockhash: blockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: toPk,
        lamports: amount,
      }),
    );

    tx.sign(keypair);
    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    await confirmSolanaTransaction(connection, signature, { lastValidBlockHeight });

    return {
      success: true,
      txSignature: signature,
      lamports: Number(amount),
      toWallet: toPk.toBase58(),
      sol: Number(amount) / LAMPORTS_PER_SOL,
    };
  }, "sendPayout");
}
