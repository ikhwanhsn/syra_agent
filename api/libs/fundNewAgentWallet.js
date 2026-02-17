/**
 * Fund newly created agent wallets from the PayAI treasury.
 * Sends $0.50 USD worth of SOL + $0.50 USDC (total $1 USD) to each new agent address.
 * Uses ADDRESS_PAYAI (public key) and ADDRESS_PAYAI_PRIVATE_KEY (base58 secret) from env.
 */
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const LAMPORTS_PER_SOL = 1e9;
/** $0.50 USDC in raw units (6 decimals) */
const USDC_AMOUNT_RAW = 500_000; // 0.5 * 1e6
/** Fallback: ~$0.50 of SOL at $200/SOL = 0.0025 SOL (used if price fetch fails) */
const FALLBACK_SOL_LAMPORTS_FOR_50_CENTS = 2_500_000;
/** Cap SOL at 0.01 SOL (~$2 at $200) so we never over-send if price API is wrong */
const MAX_SOL_LAMPORTS = 10_000_000;

const RPC_URL = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || 'https://rpc.ankr.com/solana';
const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 30_000;
const FUNDING_MAX_RETRIES = 3;

function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  return fetch(url, { ...init, signal: init.signal || controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

function isRetryableSendError(message) {
  const m = (message || '').toLowerCase();
  return (
    /blockhash not found|block hash not found|blockhash expired/i.test(m) ||
    /simulation failed/i.test(m)
  );
}

/** $0.50 USD target for the SOL portion. */
const SOL_USD_TARGET = 0.5;

/**
 * Get SOL price in USD from CoinGecko free API. Returns null on failure.
 * @returns {Promise<number | null>}
 */
async function getSolPriceUsd() {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Syra-API/1.0' },
      signal: controller.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.solana?.usd;
    return typeof price === 'number' && price > 0 ? price : null;
  } catch {
    return null;
  }
}

/** Minimum SOL (lamports) to send so recipient has enough for fees. */
const MIN_SOL_LAMPORTS = 100_000;

/**
 * Lamports to send for $0.50 USD worth of SOL. Uses live price when available; fallback otherwise.
 * @returns {Promise<number>}
 */
async function getSolLamportsFor50Cents() {
  const priceUsd = await getSolPriceUsd();
  if (priceUsd != null && priceUsd > 0) {
    const lamports = Math.floor((SOL_USD_TARGET / priceUsd) * LAMPORTS_PER_SOL);
    return Math.max(MIN_SOL_LAMPORTS, Math.min(lamports, MAX_SOL_LAMPORTS));
  }
  return FALLBACK_SOL_LAMPORTS_FOR_50_CENTS;
}

/**
 * Get PayAI keypair from env. Returns null if not configured.
 * @returns {Keypair | null}
 */
function getPayAIKeypair() {
  const raw = process.env.ADDRESS_PAYAI_PRIVATE_KEY;
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const secretKey = raw.trim().startsWith('[')
      ? new Uint8Array(JSON.parse(raw))
      : bs58.decode(raw.trim());
    return Keypair.fromSecretKey(secretKey);
  } catch {
    return null;
  }
}

/**
 * Fund a new agent wallet with $0.50 of SOL + $0.50 USDC (total $1 USD) in a single transaction.
 * Uses one send + one confirmation so funding completes within timeout (no "Funding timeout").
 * Uses ADDRESS_PAYAI and ADDRESS_PAYAI_PRIVATE_KEY from env.
 * @param {string} agentAddress - New agent wallet public key (base58)
 * @returns {Promise<{ success: boolean; signature?: string; error?: string }>}
 */
export async function fundNewAgentWallet(agentAddress) {
  const payerKeypair = getPayAIKeypair();
  const payaiAddress = process.env.ADDRESS_PAYAI;
  if (!payerKeypair || !payaiAddress) {
    return { success: false, error: 'ADDRESS_PAYAI or ADDRESS_PAYAI_PRIVATE_KEY not set; skip funding' };
  }

  const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
  const recipientPubkey = new PublicKey(agentAddress);

  const solLamports = await getSolLamportsFor50Cents();

  const payerUsdcAta = await getAssociatedTokenAddress(
    USDC_MAINNET,
    payerKeypair.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );
  const recipientUsdcAta = await getAssociatedTokenAddress(
    USDC_MAINNET,
    recipientPubkey,
    false,
    TOKEN_PROGRAM_ID
  );

  const result = { success: true };

  for (let attempt = 1; attempt <= FUNDING_MAX_RETRIES; attempt++) {
    try {
      // Single transaction: $0.50 SOL + (create USDC ATA if needed) + $0.50 USDC.
      const tx = new Transaction();

      tx.add(
        SystemProgram.transfer({
          fromPubkey: payerKeypair.publicKey,
          toPubkey: recipientPubkey,
          lamports: solLamports,
        })
      );

      try {
        await getAccount(connection, recipientUsdcAta);
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(
            payerKeypair.publicKey,
            recipientUsdcAta,
            recipientPubkey,
            USDC_MAINNET
          )
        );
      }

      tx.add(
        createTransferInstruction(
          payerUsdcAta,
          recipientUsdcAta,
          payerKeypair.publicKey,
          USDC_AMOUNT_RAW,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = payerKeypair.publicKey;
      tx.sign(payerKeypair);

      const signature = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: true,
        maxRetries: 5,
      });
      result.signature = signature;

      // Use 'confirmed' for settlement; skill: "Confirm settlement by querying chain state"
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
      );

      return result;
    } catch (err) {
      const msg = err?.message || String(err);
      if (attempt < FUNDING_MAX_RETRIES && isRetryableSendError(msg)) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      result.success = false;
      result.error = msg;
      return result;
    }
  }

  result.success = false;
  result.error = result.error || 'Funding failed after retries';
  return result;
}
