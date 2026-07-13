/**
 * Refund USDC from the lab payTo wallet back to the x402 payer after successful settlement.
 * Isolated signer — does not route through walletBroker (lab wallets are outside agent policy).
 * Supports Solana (SPL USDC) and Base (ERC-20 USDC via viem).
 */
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatEther,
  formatUnits,
} from 'viem';
import { base } from 'viem/chains';
import {
  getActivePayToKeypair,
  getActivePayToEvmAccount,
  getLabWalletBalances,
  getBaseRpcUrl,
} from './labWalletService.js';
import { pickSolanaConnectionForReads, isSolanaRpcRetryableError } from '../solanaServerRpc.js';
import {
  getMaxLabX402PriceUsd,
  getMinLabX402PriceUsd,
  getWeightedAvgLabX402PriceUsd,
} from './labX402Endpoints.js';
import { getDexterNetworkByCaip2 } from '../../config/dexterX402Networks.js';
import { normalizeLabChain } from '../../models/labs/LabX402Settings.js';

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const BASE_USDC =
  getDexterNetworkByCaip2('eip155:8453')?.usdc ||
  process.env.BASE_USDC ||
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
];

/** Distinguishable error so callers can skip (not hard-fail) when the PayTo wallet is underfunded. */
export const PAYTO_INSUFFICIENT_FUNDS = 'PAYTO_INSUFFICIENT_FUNDS';

/** Minimum SOL the PayTo wallet needs to cover fees + possible ATA rent for a refund transfer. */
const PAYTO_MIN_SOL_FOR_REFUND = 0.003;
/** Minimum ETH the Base PayTo wallet needs for gas on a USDC transfer. */
const PAYTO_MIN_ETH_FOR_REFUND = 0.00005;

const REFUND_MAX_ATTEMPTS = 3;
const REFUND_RETRY_DELAY_MS = 800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Transient send errors worth retrying with a fresh blockhash / RPC. */
function isRetryableRefundError(e) {
  const msg = e?.message || String(e);
  return (
    isSolanaRpcRetryableError(e) ||
    /blockhash|block height exceeded|not confirmed|expired|node is behind|transaction was not confirmed|nonce|replacement|timeout|429|503|502/i.test(
      msg,
    )
  );
}

/** Refund only when payer USDC cannot cover the most expensive endpoint. */
export function getLabX402RefundLowThresholdUsd() {
  return getMaxLabX402PriceUsd();
}

/**
 * Working USDC buffer after a low-balance top-up (matches labs simulation).
 * @param {number} maxPriceUsd
 * @param {number} avgPriceUsd
 * @returns {number}
 */
export function computeLabX402PayerRefundTarget(maxPriceUsd, avgPriceUsd) {
  const maxPrice = Number(maxPriceUsd);
  const avgPrice = Number(avgPriceUsd);
  if (!Number.isFinite(maxPrice) || maxPrice <= 0) return 0.2;
  const avg = Number.isFinite(avgPrice) && avgPrice > 0 ? avgPrice : maxPrice;
  return Math.max(maxPrice * 2, avg * 3);
}

/** Top-up target after a low-balance refund — enough for several calls before next refund. */
export function getLabX402RefundTargetUsd() {
  return computeLabX402PayerRefundTarget(
    getMaxLabX402PriceUsd(),
    getWeightedAvgLabX402PriceUsd(),
  );
}

/**
 * Decide whether to refund after a successful payment.
 * Skips refund while payer still has enough USDC for another call; tops up only when low.
 * @param {number} usdcBalance - Payer USDC after the payment settled
 * @param {number} maxPriceUsd - Most expensive endpoint price
 * @param {number} avgPriceUsd - Weighted average endpoint price
 * @returns {{ shouldRefund: boolean; refundAmountUsd: number; reason: string; thresholdUsd: number; targetUsd: number }}
 */
export function evaluateLowBalanceRefund(usdcBalance, maxPriceUsd, avgPriceUsd) {
  const balance = Number(usdcBalance);
  const thresholdUsd = Number(maxPriceUsd);
  const targetUsd = computeLabX402PayerRefundTarget(maxPriceUsd, avgPriceUsd);

  if (!Number.isFinite(balance) || balance < 0) {
    return { shouldRefund: true, refundAmountUsd: targetUsd, reason: 'balance_unavailable', thresholdUsd, targetUsd };
  }
  if (!Number.isFinite(thresholdUsd) || thresholdUsd <= 0) {
    return { shouldRefund: false, refundAmountUsd: 0, reason: 'invalid_threshold', thresholdUsd, targetUsd };
  }

  if (balance >= thresholdUsd) {
    return { shouldRefund: false, refundAmountUsd: 0, reason: 'sufficient_balance', thresholdUsd, targetUsd };
  }

  const refundAmountUsd = Math.max(0, Math.round((targetUsd - balance) * 1e6) / 1e6);
  if (refundAmountUsd <= 0) {
    return { shouldRefund: false, refundAmountUsd: 0, reason: 'already_at_target', thresholdUsd, targetUsd };
  }

  return { shouldRefund: true, refundAmountUsd, reason: 'low_balance', thresholdUsd, targetUsd };
}

/**
 * Transfer USDC from the Solana PayTo lab wallet to the payer.
 * @param {string} payerAddress
 * @param {number} amountUsd
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
async function refundUsdcToPayerSolana(payerAddress, amountUsd) {
  const payer = String(payerAddress || '').trim();
  const amount = Number(amountUsd);
  if (!payer || !Number.isFinite(amount) || amount <= 0) return null;

  const payToKeypair = await getActivePayToKeypair();
  if (!payToKeypair) {
    throw new Error('No active Solana payTo lab wallet configured');
  }

  const payerPk = new PublicKey(payer);
  const payToPk = payToKeypair.publicKey;
  const payToAddr = payToPk.toBase58();
  const amountMicro = BigInt(Math.round(amount * 1e6));

  const payToBalances = await getLabWalletBalances(payToAddr, 'solana');
  if (payToBalances) {
    if (payToBalances.usdcBalance < amount) {
      throw new Error(
        `${PAYTO_INSUFFICIENT_FUNDS}: payTo USDC ${payToBalances.usdcBalance.toFixed(4)} < needed ${amount.toFixed(4)}`,
      );
    }
    if (payToBalances.nativeBalance < PAYTO_MIN_SOL_FOR_REFUND) {
      throw new Error(
        `${PAYTO_INSUFFICIENT_FUNDS}: payTo SOL ${payToBalances.nativeBalance.toFixed(5)} < needed ${PAYTO_MIN_SOL_FOR_REFUND} for fees`,
      );
    }
  }

  const sourceAta = await getAssociatedTokenAddress(USDC_MAINNET, payToPk);
  const destAta = await getAssociatedTokenAddress(USDC_MAINNET, payerPk);

  let lastErr;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    try {
      const { connection } = await pickSolanaConnectionForReads(payToPk);

      const tx = new Transaction();
      const destInfo = await connection.getAccountInfo(destAta);
      if (!destInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(payToPk, destAta, payerPk, USDC_MAINNET),
        );
      }
      tx.add(
        createTransferInstruction(sourceAta, destAta, payToPk, amountMicro, [], TOKEN_PROGRAM_ID),
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = payToPk;

      const signature = await sendAndConfirmTransaction(connection, tx, [payToKeypair], {
        commitment: 'confirmed',
        maxRetries: 3,
      });

      return { signature, amountUsdc: amount };
    } catch (e) {
      lastErr = e;
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e)) {
        console.warn(
          `[labX402Refund] Solana refund attempt ${attempt}/${REFUND_MAX_ATTEMPTS} failed, retrying:`,
          e?.message || e,
        );
        await sleep(REFUND_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw e;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Transfer USDC from the Base PayTo lab wallet to the payer (ERC-20).
 * @param {string} payerAddress
 * @param {number} amountUsd
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
async function refundUsdcToPayerBase(payerAddress, amountUsd) {
  const payer = String(payerAddress || '').trim();
  const amount = Number(amountUsd);
  if (!payer || !/^0x[0-9a-fA-F]{40}$/.test(payer) || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const payToAccount = await getActivePayToEvmAccount();
  if (!payToAccount) {
    throw new Error('No active Base payTo lab wallet configured');
  }

  const payToAddr = payToAccount.address;
  const rpcUrl = getBaseRpcUrl();
  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    account: payToAccount,
    chain: base,
    transport: http(rpcUrl),
  });

  const amountRaw = parseUnits(amount.toFixed(6), 6);

  const [usdcBal, ethBal] = await Promise.all([
    publicClient.readContract({
      address: /** @type {`0x${string}`} */ (BASE_USDC),
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [/** @type {`0x${string}`} */ (payToAddr)],
    }),
    publicClient.getBalance({ address: /** @type {`0x${string}`} */ (payToAddr) }),
  ]);

  const usdcBalance = Number(formatUnits(/** @type {bigint} */ (usdcBal), 6));
  const ethBalance = Number(formatEther(ethBal));

  if (usdcBalance < amount) {
    throw new Error(
      `${PAYTO_INSUFFICIENT_FUNDS}: payTo USDC ${usdcBalance.toFixed(4)} < needed ${amount.toFixed(4)}`,
    );
  }
  if (ethBalance < PAYTO_MIN_ETH_FOR_REFUND) {
    throw new Error(
      `${PAYTO_INSUFFICIENT_FUNDS}: payTo ETH ${ethBalance.toFixed(6)} < needed ${PAYTO_MIN_ETH_FOR_REFUND} for gas`,
    );
  }

  let lastErr;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    try {
      const hash = await walletClient.writeContract({
        address: /** @type {`0x${string}`} */ (BASE_USDC),
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [/** @type {`0x${string}`} */ (payer), amountRaw],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      return { signature: hash, amountUsdc: amount };
    } catch (e) {
      lastErr = e;
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e)) {
        console.warn(
          `[labX402Refund] Base refund attempt ${attempt}/${REFUND_MAX_ATTEMPTS} failed, retrying:`,
          e?.message || e,
        );
        await sleep(REFUND_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw e;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Transfer USDC from the PayTo lab wallet to the payer (chain-aware).
 * @param {string} payerAddress
 * @param {number} amountUsd
 * @param {'solana' | 'base'} [chain]
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
export async function refundUsdcToPayer(payerAddress, amountUsd, chain) {
  const c =
    chain != null
      ? normalizeLabChain(chain)
      : /^0x/i.test(String(payerAddress || ''))
        ? 'base'
        : 'solana';
  if (c === 'base') return refundUsdcToPayerBase(payerAddress, amountUsd);
  return refundUsdcToPayerSolana(payerAddress, amountUsd);
}

/**
 * Proactively ensure a payer can afford the next call, topping it up from the PayTo wallet
 * when its USDC is too low.
 *
 * @param {string} payerAddress
 * @param {{ refundEnabled?: boolean; chain?: 'solana' | 'base' }} [opts]
 * @returns {Promise<{ canPay: boolean; funded: boolean; balanceUsdc: number | null; reason: string; signature?: string | null; amountUsd?: number; error?: string }>}
 */
export async function ensurePayerFundedForNextCall(payerAddress, opts = {}) {
  const chain =
    opts.chain != null
      ? normalizeLabChain(opts.chain)
      : /^0x/i.test(String(payerAddress || ''))
        ? 'base'
        : 'solana';
  const minPriceUsd = getMinLabX402PriceUsd();
  const balances = await getLabWalletBalances(payerAddress, chain);

  // Balance unknown (RPC unavailable) — stay optimistic and let the payment attempt decide.
  if (!balances) {
    return { canPay: true, funded: false, balanceUsdc: null, reason: 'balance_unavailable' };
  }

  // Manual funding mode: do not auto top-up, only report affordability.
  if (opts.refundEnabled === false) {
    return {
      canPay: balances.usdcBalance >= minPriceUsd,
      funded: false,
      balanceUsdc: balances.usdcBalance,
      reason: 'refund_disabled',
    };
  }

  const decision = evaluateLowBalanceRefund(
    balances.usdcBalance,
    getMaxLabX402PriceUsd(),
    getWeightedAvgLabX402PriceUsd(),
  );

  if (!decision.shouldRefund) {
    return {
      canPay: balances.usdcBalance >= minPriceUsd,
      funded: false,
      balanceUsdc: balances.usdcBalance,
      reason: decision.reason,
    };
  }

  try {
    const refund = await refundUsdcToPayer(payerAddress, decision.refundAmountUsd, chain);
    return {
      canPay: true,
      funded: true,
      balanceUsdc: balances.usdcBalance,
      reason: 'topped_up',
      signature: refund?.signature ?? null,
      amountUsd: decision.refundAmountUsd,
    };
  } catch (e) {
    const underfunded = String(e?.message || '').includes(PAYTO_INSUFFICIENT_FUNDS);
    console.warn(
      `[labX402Refund] proactive top-up failed for ${payerAddress} (${underfunded ? 'payTo underfunded' : e?.message || e})`,
    );
    return {
      canPay: balances.usdcBalance >= minPriceUsd,
      funded: false,
      balanceUsdc: balances.usdcBalance,
      reason: underfunded ? 'payto_underfunded' : 'topup_failed',
      error: e?.message || String(e),
    };
  }
}
