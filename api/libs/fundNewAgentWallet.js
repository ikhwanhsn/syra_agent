/**
 * Fund newly created agent wallets from the PayAI treasury.
 * Sends $0.5 SOL + $0.5 USDC (total $1) to each new agent address.
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
/** 0.5 SOL in lamports */
const SOL_AMOUNT_LAMPORTS = 0.5 * LAMPORTS_PER_SOL;
/** $0.5 USDC in raw units (6 decimals) */
const USDC_AMOUNT_RAW = 500_000; // 0.5 * 1e6

const RPC_URL = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || 'https://rpc.ankr.com/solana';
const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 30_000;

function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  return fetch(url, { ...init, signal: init.signal || controller.signal }).finally(() =>
    clearTimeout(id)
  );
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
 * Fund a new agent wallet with 0.5 SOL and $0.5 USDC from the PayAI treasury.
 * Does nothing if ADDRESS_PAYAI or ADDRESS_PAYAI_PRIVATE_KEY is not set.
 * @param {string} agentAddress - New agent wallet public key (base58)
 * @returns {Promise<{ success: boolean; solSignature?: string; usdcSignature?: string; error?: string }>}
 */
export async function fundNewAgentWallet(agentAddress) {
  const payerKeypair = getPayAIKeypair();
  const payaiAddress = process.env.ADDRESS_PAYAI;
  if (!payerKeypair || !payaiAddress) {
    return { success: false, error: 'ADDRESS_PAYAI or ADDRESS_PAYAI_PRIVATE_KEY not set; skip funding' };
  }

  const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
  const recipientPubkey = new PublicKey(agentAddress);

  const result = { success: true };

  try {
    // 1. Send 0.5 SOL
    const solTx = new Transaction();
    solTx.add(
      SystemProgram.transfer({
        fromPubkey: payerKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: SOL_AMOUNT_LAMPORTS,
      })
    );
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    solTx.recentBlockhash = blockhash;
    solTx.feePayer = payerKeypair.publicKey;
    solTx.sign(payerKeypair);

    const solSig = await connection.sendRawTransaction(solTx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    result.solSignature = solSig;
    await connection.confirmTransaction({ signature: solSig, blockhash, lastValidBlockHeight }, 'confirmed');
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('[fundNewAgentWallet] SOL transfer failed:', msg);
    result.success = false;
    result.error = `SOL: ${msg}`;
    return result;
  }

  try {
    // 2. Send $0.5 USDC (create recipient ATA if needed)
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

    const usdcTx = new Transaction();
    let recipientAtaExists = false;
    try {
      await getAccount(connection, recipientUsdcAta);
      recipientAtaExists = true;
    } catch {
      usdcTx.add(
        createAssociatedTokenAccountInstruction(
          payerKeypair.publicKey,
          recipientUsdcAta,
          recipientPubkey,
          USDC_MAINNET
        )
      );
    }

    usdcTx.add(
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
    usdcTx.recentBlockhash = blockhash;
    usdcTx.feePayer = payerKeypair.publicKey;
    usdcTx.sign(payerKeypair);

    const usdcSig = await connection.sendRawTransaction(usdcTx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    result.usdcSignature = usdcSig;
    await connection.confirmTransaction({ signature: usdcSig, blockhash, lastValidBlockHeight }, 'confirmed');
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('[fundNewAgentWallet] USDC transfer failed:', msg);
    result.success = false;
    result.error = result.error ? `${result.error}; USDC: ${msg}` : `USDC: ${msg}`;
  }

  return result;
}
