/**
 * Multiwallet service — generate custodial Solana wallets, tier gating, $ANSEM swap execution.
 */
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';
import pLimit from 'p-limit';
import MultiWallet from '../models/multiWallet/MultiWallet.js';
import {
  ANSEM_MINT,
  DEFAULT_FUND_SOL,
  DEFAULT_SWAP_SOL,
  MULTIWALLET_ATA_RENT_LAMPORTS,
  MULTIWALLET_JUPITER_ROUTE_BUFFER_LAMPORTS,
  MULTIWALLET_MIN_SWAP_LAMPORTS,
  MULTIWALLET_PRIORITY_FEE_BUFFER_LAMPORTS,
  MULTIWALLET_TIGHT_BUDGET_LAMPORTS,
  MULTIWALLET_SLIPPAGE_BPS,
  MULTIWALLET_STAKER_THRESHOLD,
  MULTIWALLET_SWAP_CONCURRENCY,
  MULTIWALLET_SWAP_MAX_RETRIES,
  MULTIWALLET_SWAP_STAGGER_MS,
  MULTIWALLET_TIER_LIMITS,
  MULTIWALLET_WHALE_THRESHOLD,
  WSOL_MINT,
} from '../config/multiWallet.js';
import { isAdminWalletAddress } from './adminWallet.js';
import { getActiveStakedSyra } from './syraStakingEligibility.js';
import {
  decryptAgentSecretFromStorage,
  encryptAgentSecretForStorage,
} from './agentWalletSecretCrypto.js';
import { fetchJupiterQuote } from './jupiterQuoteService.js';
import { buildSwapTransaction } from './jupiterSwapBuild.js';
import { confirmSolanaTransaction } from './solanaConfirm.js';
import { withSolanaRpcFallback } from './solanaServerRpc.js';

const FUN_BLOCK_BASE = (process.env.PUMP_FUN_BLOCK_URL || 'https://fun-block.pump.fun').replace(/\/$/, '');
const FRONTEND_API_BASE = (process.env.PUMP_FUN_FRONTEND_API_URL || 'https://frontend-api-v3.pump.fun').replace(
  /\/$/,
  '',
);
/** Min extra $ANSEM above buy baseline to count as an external airdrop. */
const ANSEM_AIRDROP_EPSILON = 1e-6;

/**
 * @typedef {'basic' | 'staker' | 'whale' | 'admin'} MultiWalletTierId
 */

/**
 * @param {string} walletAddress
 * @returns {Promise<{
 *   tier: MultiWalletTierId;
 *   limit: number | null;
 *   stakedSyra: number;
 *   activeLockCount: number;
 * }>}
 */
export async function resolveMultiWalletTier(walletAddress) {
  const owner = String(walletAddress || '').trim();
  if (!owner) {
    return {
      tier: 'basic',
      limit: MULTIWALLET_TIER_LIMITS.basic,
      stakedSyra: 0,
      activeLockCount: 0,
      requiresStakedSyra: false,
    };
  }

  if (isAdminWalletAddress(owner)) {
    return { tier: 'admin', limit: null, stakedSyra: 0, activeLockCount: 0, requiresStakedSyra: false };
  }

  let stakedSyra = 0;
  let activeLockCount = 0;
  try {
    const stake = await getActiveStakedSyra(owner);
    stakedSyra = Number(stake?.amount) || 0;
    activeLockCount = stake?.activeLockCount ?? 0;
  } catch {
    // Staking lookup failed or wallet has no locks — treat as zero stake (basic tier).
  }

  if (stakedSyra >= MULTIWALLET_WHALE_THRESHOLD) {
    return { tier: 'whale', limit: MULTIWALLET_TIER_LIMITS.whale, stakedSyra, activeLockCount, requiresStakedSyra: true };
  }
  if (stakedSyra >= MULTIWALLET_STAKER_THRESHOLD) {
    return { tier: 'staker', limit: MULTIWALLET_TIER_LIMITS.staker, stakedSyra, activeLockCount, requiresStakedSyra: true };
  }

  // Basic: no staked $SYRA required — includes users with zero $SYRA balance and zero stake.
  return {
    tier: 'basic',
    limit: MULTIWALLET_TIER_LIMITS.basic,
    stakedSyra,
    activeLockCount,
    requiresStakedSyra: false,
  };
}

/**
 * @param {string} ownerWallet
 */
async function countActiveWallets(ownerWallet) {
  return MultiWallet.countDocuments({ ownerWallet, status: 'active' });
}

/**
 * @param {string} ownerWallet
 * @param {number} count
 */
export async function generateWallets(ownerWallet, count) {
  const owner = String(ownerWallet || '').trim();
  if (!owner) throw new Error('owner_wallet_required');

  const n = Number(count);
  if (!Number.isInteger(n) || n <= 0) throw new Error('count_must_be_positive_integer');
  if (n > 200) throw new Error('count_exceeds_batch_max');

  const tierInfo = await resolveMultiWalletTier(owner);
  const existing = await countActiveWallets(owner);

  if (tierInfo.limit != null && existing + n > tierInfo.limit) {
    const err = new Error('wallet_limit_exceeded');
    err.code = 'WALLET_LIMIT_EXCEEDED';
    err.details = {
      tier: tierInfo.tier,
      limit: tierInfo.limit,
      activeCount: existing,
      requested: n,
      remaining: Math.max(0, tierInfo.limit - existing),
    };
    throw err;
  }

  const startIndex = existing;
  const created = [];

  for (let i = 0; i < n; i += 1) {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const encrypted = encryptAgentSecretForStorage(bs58.encode(keypair.secretKey));
    const walletIndex = startIndex + i;

    const doc = await MultiWallet.create({
      ownerWallet: owner,
      chain: 'solana',
      walletIndex,
      publicKey,
      secretKey: encrypted,
      label: `Wallet ${walletIndex + 1}`,
      status: 'active',
    });

    created.push({
      id: String(doc._id),
      publicKey,
      walletIndex,
      label: doc.label,
      status: doc.status,
      ansemBought: doc.ansemBought,
      createdAt: doc.createdAt,
    });
  }

  return {
    tier: tierInfo.tier,
    limit: tierInfo.limit,
    activeCount: existing + n,
    wallets: created,
  };
}

/**
 * Fetch SPL token balance (ui amount) for a wallet + mint.
 * @param {import('@solana/web3.js').Connection} connection
 * @param {string} owner
 * @param {string} mint
 */
async function fetchTokenBalanceHuman(connection, owner, mint) {
  try {
    const accounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(owner), {
      mint: new PublicKey(mint),
    });
    let total = 0;
    for (const { account } of accounts.value) {
      const ui = account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      if (typeof ui === 'number' && Number.isFinite(ui)) total += ui;
    }
    return total;
  } catch {
    return null;
  }
}

/**
 * @param {number | null} ansemBalance
 * @param {number | null} ansemBalanceAtBuy
 * @param {boolean} ansemBought
 */
function computeAnsemAirdropFields(ansemBalance, ansemBalanceAtBuy, ansemBought) {
  if (ansemBalance == null || !Number.isFinite(ansemBalance)) {
    return { hasAnsemAirdrop: false, ansemAirdropExtra: null };
  }

  if (ansemBalanceAtBuy != null && Number.isFinite(ansemBalanceAtBuy)) {
    const extra = ansemBalance - ansemBalanceAtBuy;
    return {
      hasAnsemAirdrop: extra > ANSEM_AIRDROP_EPSILON,
      ansemAirdropExtra: extra > ANSEM_AIRDROP_EPSILON ? extra : 0,
    };
  }

  if (ansemBought) {
    return { hasAnsemAirdrop: false, ansemAirdropExtra: 0 };
  }

  if (ansemBalance > ANSEM_AIRDROP_EPSILON) {
    return { hasAnsemAirdrop: true, ansemAirdropExtra: ansemBalance };
  }

  return { hasAnsemAirdrop: false, ansemAirdropExtra: 0 };
}

/**
 * @param {string} ownerWallet
 * @param {{ includeBalances?: boolean }} [options]
 */
export async function listWallets(ownerWallet, options = {}) {
  const owner = String(ownerWallet || '').trim();
  if (!owner) throw new Error('owner_wallet_required');

  const docs = await MultiWallet.find({ ownerWallet: owner, status: 'active' })
    .sort({ walletIndex: 1, createdAt: 1 })
    .lean();

  const rows = docs.map((d) => ({
    id: String(d._id),
    publicKey: d.publicKey,
    walletIndex: d.walletIndex,
    label: d.label,
    status: d.status,
    ansemBought: Boolean(d.ansemBought),
    ansemBuySignature: d.ansemBuySignature ?? null,
    ansemBuyError: d.ansemBuyError ?? null,
    ansemBuyAt: d.ansemBuyAt ?? null,
    ansemBalanceAtBuy:
      d.ansemBalanceAtBuy != null && Number.isFinite(Number(d.ansemBalanceAtBuy))
        ? Number(d.ansemBalanceAtBuy)
        : null,
    createdAt: d.createdAt,
    solBalance: null,
    ansemBalance: null,
    hasAnsemAirdrop: false,
    ansemAirdropExtra: null,
  }));

  if (options.includeBalances && rows.length > 0) {
    await withSolanaRpcFallback(async (connection) => {
      const backfillOps = [];
      await Promise.all(
        rows.map(async (row, index) => {
          const doc = docs[index];
          try {
            const lamports = await connection.getBalance(new PublicKey(row.publicKey), 'confirmed');
            row.solBalance = lamports / LAMPORTS_PER_SOL;
          } catch {
            row.solBalance = null;
          }
          row.ansemBalance = await fetchTokenBalanceHuman(connection, row.publicKey, ANSEM_MINT);

          if (
            row.ansemBought &&
            row.ansemBalanceAtBuy == null &&
            row.ansemBalance != null &&
            Number.isFinite(row.ansemBalance)
          ) {
            row.ansemBalanceAtBuy = row.ansemBalance;
            backfillOps.push({
              updateOne: {
                filter: { _id: doc._id },
                update: { $set: { ansemBalanceAtBuy: row.ansemBalance } },
              },
            });
          }

          const airdrop = computeAnsemAirdropFields(
            row.ansemBalance,
            row.ansemBalanceAtBuy,
            row.ansemBought,
          );
          row.hasAnsemAirdrop = airdrop.hasAnsemAirdrop;
          row.ansemAirdropExtra = airdrop.ansemAirdropExtra;
        }),
      );
      if (backfillOps.length > 0) {
        await MultiWallet.bulkWrite(backfillOps, { ordered: false });
      }
    }, 'multiwallet balances');
  } else {
    for (const row of rows) {
      const airdrop = computeAnsemAirdropFields(row.ansemBalance, row.ansemBalanceAtBuy, row.ansemBought);
      row.hasAnsemAirdrop = airdrop.hasAnsemAirdrop;
      row.ansemAirdropExtra = airdrop.ansemAirdropExtra;
    }
  }

  const tierInfo = await resolveMultiWalletTier(owner);
  return {
    tier: tierInfo.tier,
    limit: tierInfo.limit,
    activeCount: rows.length,
    remaining: tierInfo.limit == null ? null : Math.max(0, tierInfo.limit - rows.length),
    stakedSyra: tierInfo.stakedSyra,
    fundSolPerWallet: DEFAULT_FUND_SOL,
    swapSolPerWallet: DEFAULT_SWAP_SOL,
    ansemMint: ANSEM_MINT,
    wallets: rows,
  };
}

/**
 * @param {string} ownerWallet
 */
export async function getMultiWalletTierSummary(ownerWallet) {
  const owner = String(ownerWallet || '').trim();
  const tierInfo = await resolveMultiWalletTier(owner);
  const activeCount = owner ? await countActiveWallets(owner) : 0;
  return {
    tier: tierInfo.tier,
    limit: tierInfo.limit,
    activeCount,
    remaining: tierInfo.limit == null ? null : Math.max(0, tierInfo.limit - activeCount),
    stakedSyra: tierInfo.stakedSyra,
    activeLockCount: tierInfo.activeLockCount,
    fundSolPerWallet: DEFAULT_FUND_SOL,
    swapSolPerWallet: DEFAULT_SWAP_SOL,
    ansemMint: ANSEM_MINT,
    upgradeHints: {
      basic: `No $SYRA required — create up to ${MULTIWALLET_TIER_LIMITS.basic} wallets`,
      staker: `Stake ${MULTIWALLET_STAKER_THRESHOLD.toLocaleString()}+ $SYRA to unlock ${MULTIWALLET_TIER_LIMITS.staker} wallets`,
      whale: `Stake ${MULTIWALLET_WHALE_THRESHOLD.toLocaleString()}+ $SYRA to unlock ${MULTIWALLET_TIER_LIMITS.whale} wallets`,
    },
    requiresStakedSyra: tierInfo.requiresStakedSyra === true,
  };
}

/**
 * @param {string} ownerWallet
 * @param {string} publicKey
 */
export async function revealSecret(ownerWallet, publicKey) {
  const owner = String(ownerWallet || '').trim();
  const pk = String(publicKey || '').trim();
  if (!owner || !pk) throw new Error('owner_and_public_key_required');

  const doc = await MultiWallet.findOne({ ownerWallet: owner, publicKey: pk, status: 'active' }).select(
    '+secretKey',
  );
  if (!doc) throw new Error('wallet_not_found');

  console.info('[multiWallet] secret reveal', { ownerWallet: owner, publicKey: pk, at: new Date().toISOString() });

  const secretKey = decryptAgentSecretFromStorage(doc.secretKey);
  return {
    publicKey: doc.publicKey,
    secretKey,
    walletIndex: doc.walletIndex,
    label: doc.label,
  };
}

/**
 * @param {string} ownerWallet
 * @param {string} publicKey
 */
export async function archiveWallet(ownerWallet, publicKey) {
  const owner = String(ownerWallet || '').trim();
  const pk = String(publicKey || '').trim();
  if (!owner || !pk) throw new Error('owner_and_public_key_required');

  const doc = await MultiWallet.findOneAndUpdate(
    { ownerWallet: owner, publicKey: pk, status: 'active' },
    { $set: { status: 'archived' } },
    { new: true },
  );
  if (!doc) throw new Error('wallet_not_found');
  return { publicKey: doc.publicKey, status: doc.status };
}

/**
 * @param {import('@solana/web3.js').Connection} connection
 * @param {PublicKey} owner
 * @param {PublicKey} mint
 */
async function walletHasTokenAta(connection, owner, mint) {
  for (const programId of [TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID]) {
    try {
      const ata = await getAssociatedTokenAddress(mint, owner, false, programId);
      const info = await connection.getAccountInfo(ata, 'confirmed');
      if (info) return true;
    } catch {
      /* try next program */
    }
  }
  return false;
}

/**
 * Lamports to keep in the wallet (not used as swap input).
 * @param {bigint} balance
 * @param {boolean} hasOutputAta
 * @param {boolean} hasWsolAta
 */
function computeSwapFeeReserveLamports(balance, hasOutputAta, hasWsolAta) {
  const tightBudget = balance < BigInt(MULTIWALLET_TIGHT_BUDGET_LAMPORTS);
  let feeReserve =
    BigInt(MULTIWALLET_PRIORITY_FEE_BUFFER_LAMPORTS) +
    BigInt(MULTIWALLET_JUPITER_ROUTE_BUFFER_LAMPORTS) +
    200_000n;
  if (!hasOutputAta) feeReserve += BigInt(MULTIWALLET_ATA_RENT_LAMPORTS);
  // On tight budgets Jupiter may still create/wrap wSOL even when an ATA exists.
  if (!hasWsolAta || tightBudget) feeReserve += BigInt(MULTIWALLET_ATA_RENT_LAMPORTS);
  return feeReserve;
}

/**
 * Compute max swap lamports that fit in wallet balance after fee reserve.
 * @param {import('@solana/web3.js').Connection} connection
 * @param {PublicKey} owner
 * @param {bigint} requestedLamports
 */
async function resolveEffectiveSwapLamports(connection, owner, requestedLamports) {
  const outputMint = new PublicKey(ANSEM_MINT);
  const wsolMint = new PublicKey(WSOL_MINT);
  const hasOutputAta = await walletHasTokenAta(connection, owner, outputMint);
  const hasWsolAta = await walletHasTokenAta(connection, owner, wsolMint);

  const balance = BigInt(await connection.getBalance(owner, 'confirmed'));
  const feeReserve = computeSwapFeeReserveLamports(balance, hasOutputAta, hasWsolAta);
  const maxSwap = balance > feeReserve ? balance - feeReserve : 0n;
  const effective = requestedLamports <= maxSwap ? requestedLamports : maxSwap;

  if (effective < BigInt(MULTIWALLET_MIN_SWAP_LAMPORTS)) {
    throw new Error(
      `insufficient_sol_for_swap:balance_${balance}_lamports_need_at_least_${requestedLamports + feeReserve}_lamports` +
        `_output_ata_${hasOutputAta ? 'yes' : 'no'}_wsol_ata_${hasWsolAta ? 'yes' : 'no'}`,
    );
  }

  return { effective, feeReserve, balance, hasOutputAta, hasWsolAta };
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
 * Decode swap tx from Jupiter (base64) or pump.fun fun-block (base58).
 * @param {string} serialized
 */
function decodeSwapTransaction(serialized) {
  const raw = String(serialized || '').trim();
  if (!raw) throw new Error('empty_swap_transaction');

  // Jupiter and most aggregators return base64.
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

  // pump.fun fun-block returns base58-encoded versioned transactions.
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
 * @param {PublicKey} pubkey
 * @param {bigint} minLamports
 */
async function waitForMinBalance(connection, pubkey, minLamports, timeoutMs = 90_000) {
  const need = Number(minLamports);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const bal = await connection.getBalance(pubkey, 'confirmed');
    if (bal >= need) return bal;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`wallet_underfunded:${pubkey.toBase58()}:need_${need}_lamports`);
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
 * @param {bigint} swapLamports
 */
async function buildAnsemSwapTransaction(keypair, swapLamports) {
  const user = keypair.publicKey.toBase58();
  const amount = swapLamports.toString();
  let graduated = false;
  try {
    graduated = await isPumpTokenGraduated(ANSEM_MINT);
  } catch (err) {
    console.warn('[multiWallet] graduation check failed, preferring Jupiter:', err?.message || err);
    graduated = true;
  }

  const tryPumpfun = async () => {
    const serialized = await fetchPumpfunSwapTransaction({
      inputMint: WSOL_MINT,
      outputMint: ANSEM_MINT,
      amount,
      user,
    });
    return { source: 'pumpfun', serialized, lastValidBlockHeight: null };
  };

  const tryJupiter = async () => {
    const quote = await fetchJupiterQuote({
      inputMint: WSOL_MINT,
      outputMint: ANSEM_MINT,
      amount,
      slippageBps: MULTIWALLET_SLIPPAGE_BPS,
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
    } catch (jupErr) {
      console.warn('[multiWallet] Jupiter swap build failed, trying pump.fun:', jupErr?.message || jupErr);
      return tryPumpfun();
    }
  }

  try {
    return await tryPumpfun();
  } catch (pumpErr) {
    console.warn('[multiWallet] pump.fun swap build failed, trying Jupiter:', pumpErr?.message || pumpErr);
    return tryJupiter();
  }
}

function isTransientBuyError(message) {
  const msg = String(message || '');
  return (
    msg.includes('429') ||
    msg.includes('Too many requests') ||
    msg.includes('API Gateway') ||
    msg.includes('Simulation failed') ||
    msg.includes('Blockhash not found') ||
    msg.includes('Transaction was not confirmed')
  );
}

/**
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {bigint} swapLamports
 */
async function executeSingleWalletAnsemBuy(keypair, swapLamports) {
  let lastError = null;
  for (let attempt = 1; attempt <= MULTIWALLET_SWAP_MAX_RETRIES; attempt += 1) {
    try {
      return await withSolanaRpcFallback(async (connection) => {
        const outputMint = new PublicKey(ANSEM_MINT);
        const wsolMint = new PublicKey(WSOL_MINT);
        const balanceLamports = BigInt(await connection.getBalance(keypair.publicKey, 'confirmed'));
        const hasOutputAta = await walletHasTokenAta(connection, keypair.publicKey, outputMint);
        const hasWsolAta = await walletHasTokenAta(connection, keypair.publicKey, wsolMint);
        const reserve = computeSwapFeeReserveLamports(balanceLamports, hasOutputAta, hasWsolAta);
        const minWaitLamports = Number(BigInt(MULTIWALLET_MIN_SWAP_LAMPORTS) + reserve);
        await waitForMinBalance(connection, keypair.publicKey, minWaitLamports);

        const { effective, balance } = await resolveEffectiveSwapLamports(
          connection,
          keypair.publicKey,
          swapLamports,
        );

        const { source, serialized, lastValidBlockHeight } = await buildAnsemSwapTransaction(
          keypair,
          effective,
        );

        const signature = await signAndSendSwapTransaction(connection, serialized, keypair, {
          lastValidBlockHeight,
        });

        const ansemBalanceAtBuy =
          (await fetchTokenBalanceHuman(connection, keypair.publicKey, ANSEM_MINT)) ?? 0;

        return {
          signature,
          source,
          swapLamportsUsed: effective.toString(),
          balanceLamports: balance.toString(),
          ansemBalanceAtBuy,
        };
      }, `multiwallet ansem buy ${keypair.publicKey.toBase58().slice(0, 8)}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt >= MULTIWALLET_SWAP_MAX_RETRIES || !isTransientBuyError(lastError.message)) {
        throw lastError;
      }
      await new Promise((r) => setTimeout(r, 1200 * attempt));
    }
  }
  throw lastError ?? new Error('buy_failed');
}

/**
 * @param {string} ownerWallet
 * @param {string[]} publicKeys
 * @param {number} [swapSol]
 */
export async function executeAnsemBuy(ownerWallet, publicKeys, swapSol = DEFAULT_SWAP_SOL) {
  const owner = String(ownerWallet || '').trim();
  if (!owner) throw new Error('owner_wallet_required');

  const keys = Array.isArray(publicKeys)
    ? publicKeys.map((k) => String(k || '').trim()).filter(Boolean)
    : [];
  if (keys.length === 0) throw new Error('public_keys_required');
  if (keys.length > 200) throw new Error('too_many_wallets');

  const swapSolNum = Number(swapSol);
  if (!Number.isFinite(swapSolNum) || swapSolNum <= 0 || swapSolNum >= DEFAULT_FUND_SOL) {
    throw new Error('invalid_swap_sol_amount');
  }

  const swapLamports = BigInt(Math.floor(swapSolNum * LAMPORTS_PER_SOL));
  if (swapLamports <= 0n) throw new Error('invalid_swap_lamports');

  const docs = await MultiWallet.find({
    ownerWallet: owner,
    publicKey: { $in: keys },
    status: 'active',
  }).select('+secretKey');

  const docByPk = new Map(docs.map((d) => [d.publicKey, d]));
  for (const pk of keys) {
    if (!docByPk.has(pk)) throw new Error(`wallet_not_found:${pk}`);
  }

  const limit = pLimit(MULTIWALLET_SWAP_CONCURRENCY);
  const results = await Promise.all(
    keys.map((publicKey, index) =>
      limit(async () => {
        if (index > 0 && MULTIWALLET_SWAP_STAGGER_MS > 0) {
          await new Promise((r) => setTimeout(r, MULTIWALLET_SWAP_STAGGER_MS));
        }
        const doc = docByPk.get(publicKey);
        try {
          const secret = decryptAgentSecretFromStorage(doc.secretKey);
          const keypair = Keypair.fromSecretKey(bs58.decode(secret));

          const buyOutcome = await executeSingleWalletAnsemBuy(keypair, swapLamports);

          await MultiWallet.updateOne(
            { _id: doc._id },
            {
              $set: {
                ansemBought: true,
                ansemBuySignature: buyOutcome.signature,
                ansemBuyError: null,
                ansemBuyAt: new Date(),
                ansemBalanceAtBuy: buyOutcome.ansemBalanceAtBuy,
              },
            },
          );

          return {
            publicKey,
            success: true,
            signature: buyOutcome.signature,
            source: buyOutcome.source,
            swapLamportsUsed: buyOutcome.swapLamportsUsed,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await MultiWallet.updateOne(
            { _id: doc._id },
            { $set: { ansemBuyError: message.slice(0, 500) } },
          );
          return { publicKey, success: false, error: message };
        }
      }),
    ),
  );

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.length - succeeded;

  return {
    total: results.length,
    succeeded,
    failed,
    swapSol: swapSolNum,
    ansemMint: ANSEM_MINT,
    results,
  };
}

export { ANSEM_MINT, DEFAULT_FUND_SOL, DEFAULT_SWAP_SOL, WSOL_MINT };
