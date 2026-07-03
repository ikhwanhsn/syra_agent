/**
 * Recover SOL from legacy multiwallet farm wallets — sell $ANSEM then sweep to owner.
 */
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import pLimit from 'p-limit';
import MultiWallet from '../models/multiWallet/MultiWallet.js';
import {
  ANSEM_MINT,
  RECOVERY_MIN_SOL_FOR_SELL_FEES,
  RECOVERY_MIN_TOKEN_SELL_RAW,
  RECOVERY_SLIPPAGE_BPS,
  RECOVERY_SWAP_CONCURRENCY,
  RECOVERY_SWAP_MAX_RETRIES,
  RECOVERY_SWAP_STAGGER_MS,
  WSOL_MINT,
} from '../config/multiWalletRecovery.js';
import { decryptAgentSecretFromStorage } from './agentWalletSecretCrypto.js';
import { fetchJupiterQuote } from './jupiterQuoteService.js';
import { buildSwapTransaction } from './jupiterSwapBuild.js';
import { confirmSolanaTransaction } from './solanaConfirm.js';
import { withSolanaRpcFallback } from './solanaServerRpc.js';

const FUN_BLOCK_BASE = (process.env.PUMP_FUN_BLOCK_URL || 'https://fun-block.pump.fun').replace(/\/$/, '');
const FRONTEND_API_BASE = (process.env.PUMP_FUN_FRONTEND_API_URL || 'https://frontend-api-v3.pump.fun').replace(
  /\/$/,
  '',
);

const MIN_ANSEM_SELL_RAW = BigInt(RECOVERY_MIN_TOKEN_SELL_RAW);
const MIN_SOL_FOR_SELL_FEES = BigInt(RECOVERY_MIN_SOL_FOR_SELL_FEES);
const TX_FEE_BUFFER = 10_000n;

/**
 * @param {import('@solana/web3.js').Connection} connection
 * @param {string | PublicKey} owner
 * @param {string} mint
 */
async function fetchTokenBalanceRaw(connection, owner, mint) {
  try {
    const ownerPk = owner instanceof PublicKey ? owner : new PublicKey(owner);
    const accounts = await connection.getParsedTokenAccountsByOwner(ownerPk, {
      mint: new PublicKey(mint),
    });
    let total = 0n;
    for (const { account } of accounts.value) {
      const raw = account?.data?.parsed?.info?.tokenAmount?.amount;
      if (raw != null && String(raw).trim() !== '') total += BigInt(String(raw));
    }
    return total;
  } catch {
    return 0n;
  }
}

/**
 * @param {string} mint
 */
async function isPumpTokenGraduated(mint) {
  try {
    const res = await fetch(`${FRONTEND_API_BASE}/coins-v2/${encodeURIComponent(mint)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.complete);
  } catch {
    return false;
  }
}

/**
 * @param {{ inputMint: string; outputMint: string; amount: string; user: string }} params
 */
async function fetchPumpfunSwapTransaction(params) {
  const res = await fetch(`${FUN_BLOCK_BASE}/agents/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      `pump.fun swap HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  if (!data?.transaction || typeof data.transaction !== 'string') {
    throw new Error('pump.fun did not return a transaction');
  }
  return data.transaction;
}

/**
 * @param {string} serialized
 */
function decodeSwapTransaction(serialized) {
  const raw = String(serialized || '').trim();
  if (!raw) throw new Error('empty_swap_transaction');

  try {
    const b64 = Buffer.from(raw, 'base64');
    if (b64.length > 0) {
      try {
        return { kind: 'versioned', tx: VersionedTransaction.deserialize(b64) };
      } catch {
        return { kind: 'legacy', tx: Transaction.from(b64) };
      }
    }
  } catch {
    /* try base58 */
  }

  try {
    const b58 = bs58.decode(raw);
    return { kind: 'versioned', tx: VersionedTransaction.deserialize(b58) };
  } catch (err) {
    throw new Error(
      `failed_to_deserialize_swap_tx: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * @param {import('@solana/web3.js').Connection} connection
 * @param {string} serializedBase64OrBase58
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {{ lastValidBlockHeight?: number | null }} [options]
 */
async function signAndSendSwapTransaction(connection, serializedBase64OrBase58, keypair, options = {}) {
  const decoded = decodeSwapTransaction(serializedBase64OrBase58);
  let serialized;
  if (decoded.kind === 'versioned') {
    decoded.tx.sign([keypair]);
    serialized = decoded.tx.serialize();
  } else {
    decoded.tx.partialSign(keypair);
    serialized = decoded.tx.serialize({ requireAllSignatures: false });
  }
  const signature = await connection.sendRawTransaction(serialized, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
    maxRetries: 5,
  });
  await confirmSolanaTransaction(connection, signature, {
    lastValidBlockHeight: options.lastValidBlockHeight ?? undefined,
  });
  return signature;
}

/**
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {string} inputMint
 * @param {string} outputMint
 * @param {bigint} amountRaw
 */
async function buildTokenSwapTransaction(keypair, inputMint, outputMint, amountRaw) {
  const user = keypair.publicKey.toBase58();
  const amount = amountRaw.toString();
  let graduated = false;
  try {
    graduated = await isPumpTokenGraduated(ANSEM_MINT);
  } catch {
    graduated = true;
  }

  const tryPumpfun = async () => {
    const serialized = await fetchPumpfunSwapTransaction({ inputMint, outputMint, amount, user });
    return { source: 'pumpfun', serialized, lastValidBlockHeight: null };
  };

  const tryJupiter = async () => {
    const quote = await fetchJupiterQuote({
      inputMint,
      outputMint,
      amount,
      slippageBps: RECOVERY_SLIPPAGE_BPS,
    });
    const built = await buildSwapTransaction({
      quoteResponse: quote.quote,
      userPublicKey: user,
    });
    return {
      source: 'jupiter',
      serialized: built.swapTransaction,
      lastValidBlockHeight: built.lastValidBlockHeight ?? null,
    };
  };

  if (graduated) {
    try {
      return await tryJupiter();
    } catch {
      return tryPumpfun();
    }
  }

  try {
    return await tryPumpfun();
  } catch {
    return tryJupiter();
  }
}

function isTransientSwapError(message) {
  const msg = String(message || '');
  return (
    msg.includes('429') ||
    msg.includes('Too many requests') ||
    msg.includes('Simulation failed') ||
    msg.includes('Blockhash not found') ||
    msg.includes('Transaction was not confirmed')
  );
}

/**
 * @param {import('@solana/web3.js').Connection} connection
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {PublicKey} recipient
 */
async function sweepSolToOwner(connection, keypair, recipient) {
  const balance = BigInt(await connection.getBalance(keypair.publicKey, 'confirmed'));
  const rentExempt = BigInt(await connection.getMinimumBalanceForRentExemption(0));
  const reserve = rentExempt + TX_FEE_BUFFER;
  if (balance <= reserve) return null;

  const toSend = balance - reserve;
  if (toSend <= 0n) return null;

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction();
  tx.feePayer = keypair.publicKey;
  tx.recentBlockhash = blockhash;
  tx.add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: recipient,
      lamports: Number(toSend),
    }),
  );

  tx.sign(keypair);
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
    maxRetries: 5,
  });
  await confirmSolanaTransaction(connection, signature, { lastValidBlockHeight });
  return { signature, lamports: toSend.toString() };
}

/**
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {string} ownerWallet
 */
async function executeSingleWalletRecovery(keypair, ownerWallet) {
  let lastError = null;
  for (let attempt = 1; attempt <= RECOVERY_SWAP_MAX_RETRIES; attempt += 1) {
    try {
      return await withSolanaRpcFallback(async (connection) => {
        const ownerPk = new PublicKey(ownerWallet);
        const ansemRaw = await fetchTokenBalanceRaw(connection, keypair.publicKey, ANSEM_MINT);
        let sellSignature = null;
        let sellSource = null;
        let ansemSoldRaw = '0';

        if (ansemRaw >= MIN_ANSEM_SELL_RAW) {
          const solBal = BigInt(await connection.getBalance(keypair.publicKey, 'confirmed'));
          if (solBal < MIN_SOL_FOR_SELL_FEES) {
            throw new Error('insufficient_sol_for_sell_fees');
          }

          const { source, serialized, lastValidBlockHeight } = await buildTokenSwapTransaction(
            keypair,
            ANSEM_MINT,
            WSOL_MINT,
            ansemRaw,
          );
          sellSignature = await signAndSendSwapTransaction(connection, serialized, keypair, {
            lastValidBlockHeight,
          });
          sellSource = source;
          ansemSoldRaw = ansemRaw.toString();
        }

        const sweep = await sweepSolToOwner(connection, keypair, ownerPk);
        if (!sellSignature && !sweep) {
          return {
            skipped: true,
            sellSignature: null,
            sellSource: null,
            ansemSoldRaw: '0',
            sweepSignature: null,
            solSweptLamports: '0',
          };
        }

        return {
          skipped: false,
          sellSignature,
          sellSource,
          ansemSoldRaw,
          sweepSignature: sweep?.signature ?? null,
          solSweptLamports: sweep?.lamports ?? '0',
        };
      }, `multiwallet recover ${keypair.publicKey.toBase58().slice(0, 8)}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt >= RECOVERY_SWAP_MAX_RETRIES || !isTransientSwapError(lastError.message)) {
        throw lastError;
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastError ?? new Error('recovery_failed');
}

/**
 * @param {string} ownerWallet
 */
export async function previewMultiWalletRecovery(ownerWallet) {
  const owner = String(ownerWallet || '').trim();
  if (!owner) throw new Error('owner_wallet_required');

  const docs = await MultiWallet.find({ ownerWallet: owner, status: 'active' })
    .sort({ walletIndex: 1, createdAt: 1 })
    .lean();

  const wallets = [];
  let totalSol = 0;
  let totalAnsem = 0;

  if (docs.length > 0) {
    await withSolanaRpcFallback(async (connection) => {
      for (const doc of docs) {
        const lamports = await connection.getBalance(new PublicKey(doc.publicKey), 'confirmed');
        const sol = lamports / LAMPORTS_PER_SOL;
        const ansemRaw = await fetchTokenBalanceRaw(connection, doc.publicKey, ANSEM_MINT);
        const ansem = Number(ansemRaw) / 1e6;
        totalSol += sol;
        totalAnsem += ansem;
        wallets.push({
          publicKey: doc.publicKey,
          walletIndex: doc.walletIndex,
          solBalance: sol,
          ansemBalance: ansem,
        });
      }
    }, 'multiwallet recovery preview');
  }

  return {
    ownerWallet: owner,
    walletCount: docs.length,
    totalSol,
    totalAnsem,
    ansemMint: ANSEM_MINT,
    wallets,
  };
}

/**
 * Sell all $ANSEM and sweep SOL from farm wallets to the owner (connected) wallet.
 * @param {string} ownerWallet
 * @param {string[]} [publicKeys]
 */
export async function recoverMultiWalletFunds(ownerWallet, publicKeys) {
  const owner = String(ownerWallet || '').trim();
  if (!owner) throw new Error('owner_wallet_required');

  const keys = Array.isArray(publicKeys)
    ? publicKeys.map((k) => String(k || '').trim()).filter(Boolean)
    : [];

  const query = { ownerWallet: owner, status: 'active' };
  if (keys.length > 0) {
    if (keys.length > 200) throw new Error('too_many_wallets');
    query.publicKey = { $in: keys };
  }

  const docs = await MultiWallet.find(query).select('+secretKey').sort({ walletIndex: 1, createdAt: 1 });
  if (docs.length === 0) throw new Error('no_wallets_found');

  if (keys.length > 0) {
    const docByPk = new Map(docs.map((d) => [d.publicKey, d]));
    for (const pk of keys) {
      if (!docByPk.has(pk)) throw new Error(`wallet_not_found:${pk}`);
    }
  }

  const limit = pLimit(RECOVERY_SWAP_CONCURRENCY);
  const results = await Promise.all(
    docs.map((doc, index) =>
      limit(async () => {
        if (index > 0 && RECOVERY_SWAP_STAGGER_MS > 0) {
          await new Promise((r) => setTimeout(r, RECOVERY_SWAP_STAGGER_MS));
        }
        const publicKey = doc.publicKey;
        try {
          const secret = decryptAgentSecretFromStorage(doc.secretKey);
          const keypair = Keypair.fromSecretKey(bs58.decode(secret));
          const outcome = await executeSingleWalletRecovery(keypair, owner);

          if (outcome.sellSignature || outcome.sweepSignature) {
            await MultiWallet.updateOne(
              { _id: doc._id },
              {
                $set: {
                  ansemBought: false,
                  ansemBuySignature: null,
                  ansemBuyError: null,
                  ansemBuyAt: null,
                  ansemBalanceAtBuy: null,
                },
              },
            );
          }

          return {
            publicKey,
            success: true,
            skipped: outcome.skipped === true,
            sellSignature: outcome.sellSignature,
            sellSource: outcome.sellSource,
            ansemSoldRaw: outcome.ansemSoldRaw,
            sweepSignature: outcome.sweepSignature,
            solSweptLamports: outcome.solSweptLamports,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return { publicKey, success: false, error: message };
        }
      }),
    ),
  );

  const succeeded = results.filter((r) => r.success && !r.skipped).length;
  const skipped = results.filter((r) => r.success && r.skipped).length;
  const failed = results.filter((r) => !r.success).length;
  const totalSolSweptLamports = results.reduce(
    (sum, r) => sum + (r.success && r.solSweptLamports ? BigInt(r.solSweptLamports) : 0n),
    0n,
  );

  return {
    total: results.length,
    succeeded,
    skipped,
    failed,
    ansemMint: ANSEM_MINT,
    totalSolSwept: Number(totalSolSweptLamports) / LAMPORTS_PER_SOL,
    results,
  };
}
