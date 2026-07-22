/**
 * Refund USDC from the lab payTo wallet back to the x402 payer after successful settlement.
 * Isolated signer — does not route through walletBroker (lab wallets are outside agent policy).
 * Supports Solana (SPL USDC), Base (ERC-20 USDC via viem), Celo (tagged ERC-20 USDC),
 * and Algorand (USDC ASA via algosdk).
 */
import {
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  createPublicClient,
  http,
  parseUnits,
  formatEther,
  formatUnits,
} from 'viem';
import algosdk from 'algosdk';
import {
  getActivePayToKeypair,
  getActivePayToEvmAccount,
  getActivePayToAlgorandAccount,
  getLabWalletBalances,
  getBasePublicClient,
  createBaseWalletClient,
  getCeloRpcUrl,
  getAlgorandAlgodClient,
  getAlgorandUsdcAsaId,
  isAlgorandAddressOptedInUsdc,
  ensureAlgorandLabWalletUsdcOptIn,
} from './labWalletService.js';
import { pickSolanaConnectionForReads, isSolanaRpcRetryableError } from '../solanaServerRpc.js';
import { confirmSolanaTransaction, isSolanaTxConfirmedOnAnyRpc } from '../solanaConfirm.js';
import {
  getMaxLabX402PriceUsd,
  getMinLabX402PriceUsd,
  getWeightedAvgLabX402PriceUsd,
} from './labX402Endpoints.js';
import { getDexterNetworkByCaip2 } from '../../config/dexterX402Networks.js';
import { CELO_USDC_MAINNET } from '../../config/celoX402Networks.js';
import { sendTaggedCeloUsdcTransfer } from '../../utils/celoX402Settle.js';
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
/** Minimum CELO the Celo PayTo wallet needs for gas on a tagged USDC transfer. */
const PAYTO_MIN_CELO_FOR_REFUND = 0.001;
/** Minimum ALGO the Algorand PayTo wallet needs for fees on a USDC ASA transfer. */
const PAYTO_MIN_ALGO_FOR_REFUND = 0.1;

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

/**
 * Extract a submitted tx hash/signature from an error if present.
 * @param {unknown} e
 * @returns {string | null}
 */
function extractSubmittedTxId(e) {
  if (!e || typeof e !== 'object') return null;
  const err = /** @type {Record<string, unknown>} */ (e);
  for (const key of ['txSignature', 'signature', 'hash', 'transactionHash', 'txid']) {
    const v = err[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  const msg = String(err.message || '');
  const m = msg.match(/\b([1-9A-HJ-NP-Za-km-z]{64,100})\b/) || msg.match(/\b(0x[0-9a-fA-F]{64})\b/);
  return m ? m[1] : null;
}

/**
 * Before retrying a refund, check whether a previously submitted tx already landed.
 * @param {string | null | undefined} txId
 * @param {'solana' | 'base' | 'celo' | 'algorand'} chain
 * @param {object} [clients]
 * @returns {Promise<boolean>}
 */
async function isRefundTxAlreadyConfirmed(txId, chain, clients = {}) {
  const id = String(txId || '').trim();
  if (!id) return false;
  try {
    if (chain === 'solana') {
      return await isSolanaTxConfirmedOnAnyRpc(id);
    }
    if (chain === 'base' && clients.publicClient) {
      const receipt = await clients.publicClient.getTransactionReceipt({
        hash: /** @type {`0x${string}`} */ (id),
      });
      return Boolean(receipt && receipt.status === 'success');
    }
    if (chain === 'celo' && clients.publicClient) {
      const receipt = await clients.publicClient.getTransactionReceipt({
        hash: /** @type {`0x${string}`} */ (id),
      });
      return Boolean(receipt && receipt.status === 'success');
    }
    if (chain === 'algorand' && clients.algod) {
      const info = await clients.algod.pendingTransactionInformation(id).do();
      return Boolean(info?.confirmedRound || info?.['confirmed-round']);
    }
  } catch {
    // unknown — do not assume confirmed
  }
  return false;
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
  /** @type {string | null} */
  let submittedSig = null;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    if (submittedSig && (await isRefundTxAlreadyConfirmed(submittedSig, 'solana'))) {
      return { signature: submittedSig, amountUsdc: amount };
    }
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
      tx.sign(payToKeypair);

      const signature = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });
      submittedSig = signature;

      await confirmSolanaTransaction(connection, signature, { lastValidBlockHeight });
      return { signature, amountUsdc: amount };
    } catch (e) {
      lastErr = e;
      const fromErr = extractSubmittedTxId(e);
      if (fromErr) submittedSig = fromErr;
      if (submittedSig && (await isRefundTxAlreadyConfirmed(submittedSig, 'solana'))) {
        return { signature: submittedSig, amountUsdc: amount };
      }
      // Ambiguous confirm — do NOT re-broadcast a new transfer
      const msg = e?.message || String(e);
      if (
        submittedSig &&
        (/tx_confirm_timeout|tx_blockhash_expired|not confirmed|timeout/i.test(msg) ||
          e?.ambiguous)
      ) {
        console.warn(
          `[labX402Refund] Solana refund confirm ambiguous; not retrying send. sig=${submittedSig}`,
        );
        throw e;
      }
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e) && !submittedSig) {
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
  const publicClient = getBasePublicClient();
  const walletClient = createBaseWalletClient(payToAccount);

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
  /** @type {string | null} */
  let submittedHash = null;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    if (
      submittedHash &&
      (await isRefundTxAlreadyConfirmed(submittedHash, 'base', { publicClient }))
    ) {
      return { signature: submittedHash, amountUsdc: amount };
    }
    try {
      const hash = await walletClient.writeContract({
        address: /** @type {`0x${string}`} */ (BASE_USDC),
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [/** @type {`0x${string}`} */ (payer), amountRaw],
      });
      submittedHash = hash;
      await publicClient.waitForTransactionReceipt({ hash });
      return { signature: hash, amountUsdc: amount };
    } catch (e) {
      lastErr = e;
      const fromErr = extractSubmittedTxId(e);
      if (fromErr) submittedHash = fromErr;
      if (
        submittedHash &&
        (await isRefundTxAlreadyConfirmed(submittedHash, 'base', { publicClient }))
      ) {
        return { signature: submittedHash, amountUsdc: amount };
      }
      if (submittedHash) {
        console.warn(
          `[labX402Refund] Base refund confirm ambiguous; not retrying send. hash=${submittedHash}`,
        );
        throw e;
      }
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
 * Transfer USDC from the Celo PayTo lab wallet to the payer (ERC-20 + ERC-8021 tag).
 * @param {string} payerAddress
 * @param {number} amountUsd
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
async function refundUsdcToPayerCelo(payerAddress, amountUsd) {
  const payer = String(payerAddress || '').trim();
  const amount = Number(amountUsd);
  if (!payer || !/^0x[0-9a-fA-F]{40}$/.test(payer) || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const payToAccount = await getActivePayToEvmAccount('celo');
  if (!payToAccount) {
    throw new Error('No active Celo payTo lab wallet configured');
  }

  const payToAddr = payToAccount.address;
  const { createPublicClient: createCeloPublic, http: httpCelo } = await import('viem');
  const { celo } = await import('viem/chains');
  const celoClient = createCeloPublic({
    chain: celo,
    transport: httpCelo(getCeloRpcUrl()),
  });

  const amountRaw = parseUnits(amount.toFixed(6), 6);

  const [usdcBal, celoBal] = await Promise.all([
    celoClient.readContract({
      address: /** @type {`0x${string}`} */ (CELO_USDC_MAINNET),
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [/** @type {`0x${string}`} */ (payToAddr)],
    }),
    celoClient.getBalance({ address: /** @type {`0x${string}`} */ (payToAddr) }),
  ]);

  const usdcBalance = Number(formatUnits(/** @type {bigint} */ (usdcBal), 6));
  const celoBalance = Number(formatEther(celoBal));

  if (usdcBalance < amount) {
    throw new Error(
      `${PAYTO_INSUFFICIENT_FUNDS}: payTo USDC ${usdcBalance.toFixed(4)} < needed ${amount.toFixed(4)}`,
    );
  }
  if (celoBalance < PAYTO_MIN_CELO_FOR_REFUND) {
    throw new Error(
      `${PAYTO_INSUFFICIENT_FUNDS}: payTo CELO ${celoBalance.toFixed(6)} < needed ${PAYTO_MIN_CELO_FOR_REFUND} for gas`,
    );
  }

  let lastErr;
  /** @type {string | null} */
  let submittedHash = null;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    if (
      submittedHash &&
      (await isRefundTxAlreadyConfirmed(submittedHash, 'celo', { publicClient: celoClient }))
    ) {
      return { signature: submittedHash, amountUsdc: amount };
    }
    try {
      const hash = await sendTaggedCeloUsdcTransfer(
        payToAccount,
        /** @type {`0x${string}`} */ (payer),
        amountRaw,
      );
      submittedHash = hash;
      return { signature: hash, amountUsdc: amount };
    } catch (e) {
      lastErr = e;
      const fromErr = extractSubmittedTxId(e);
      if (fromErr) submittedHash = fromErr;
      if (
        submittedHash &&
        (await isRefundTxAlreadyConfirmed(submittedHash, 'celo', { publicClient: celoClient }))
      ) {
        return { signature: submittedHash, amountUsdc: amount };
      }
      if (submittedHash) {
        console.warn(
          `[labX402Refund] Celo refund confirm ambiguous; not retrying send. hash=${submittedHash}`,
        );
        throw e;
      }
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e)) {
        console.warn(
          `[labX402Refund] Celo refund attempt ${attempt}/${REFUND_MAX_ATTEMPTS} failed, retrying:`,
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
 * Transfer USDC ASA from the Algorand PayTo lab wallet to the payer.
 * Payer must already be opted into the USDC ASA.
 * @param {string} payerAddress
 * @param {number} amountUsd
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
async function refundUsdcToPayerAlgorand(payerAddress, amountUsd) {
  const payer = String(payerAddress || '').trim();
  const amount = Number(amountUsd);
  if (!payer || !Number.isFinite(amount) || amount <= 0) return null;

  const payToAccount = await getActivePayToAlgorandAccount();
  if (!payToAccount) {
    throw new Error('No active Algorand payTo lab wallet configured');
  }

  const optedIn = await isAlgorandAddressOptedInUsdc(payer);
  if (!optedIn) {
    throw new Error(
      `${PAYTO_INSUFFICIENT_FUNDS}: payer not opted into USDC ASA (opt-in required before refund)`,
    );
  }

  const payToBalances = await getLabWalletBalances(payToAccount.address, 'algorand');
  if (payToBalances) {
    if (payToBalances.usdcBalance < amount) {
      throw new Error(
        `${PAYTO_INSUFFICIENT_FUNDS}: payTo USDC ${payToBalances.usdcBalance.toFixed(4)} < needed ${amount.toFixed(4)}`,
      );
    }
    if (payToBalances.nativeBalance < PAYTO_MIN_ALGO_FOR_REFUND) {
      throw new Error(
        `${PAYTO_INSUFFICIENT_FUNDS}: payTo ALGO ${payToBalances.nativeBalance.toFixed(4)} < needed ${PAYTO_MIN_ALGO_FOR_REFUND} for fees`,
      );
    }
  }

  const client = getAlgorandAlgodClient();
  const asaId = getAlgorandUsdcAsaId();
  const amountMicro = Math.round(amount * 1e6);

  let lastErr;
  /** @type {string | null} */
  let submittedTxid = null;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    if (
      submittedTxid &&
      (await isRefundTxAlreadyConfirmed(submittedTxid, 'algorand', { algod: client }))
    ) {
      return { signature: submittedTxid, amountUsdc: amount };
    }
    try {
      const sp = await client.getTransactionParams().do();
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: payToAccount.address,
        receiver: payer,
        amount: amountMicro,
        assetIndex: asaId,
        suggestedParams: sp,
      });
      const signed = txn.signTxn(payToAccount.sk);
      const { txid } = await client.sendRawTransaction(signed).do();
      submittedTxid = txid;
      await algosdk.waitForConfirmation(client, txid, 8);
      return { signature: txid, amountUsdc: amount };
    } catch (e) {
      lastErr = e;
      const fromErr = extractSubmittedTxId(e);
      if (fromErr) submittedTxid = fromErr;
      if (
        submittedTxid &&
        (await isRefundTxAlreadyConfirmed(submittedTxid, 'algorand', { algod: client }))
      ) {
        return { signature: submittedTxid, amountUsdc: amount };
      }
      if (submittedTxid) {
        console.warn(
          `[labX402Refund] Algorand refund confirm ambiguous; not retrying send. txid=${submittedTxid}`,
        );
        throw e;
      }
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e)) {
        console.warn(
          `[labX402Refund] Algorand refund attempt ${attempt}/${REFUND_MAX_ATTEMPTS} failed, retrying:`,
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
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain]
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
export async function refundUsdcToPayer(payerAddress, amountUsd, chain) {
  const c =
    chain != null
      ? normalizeLabChain(chain)
      : /^0x/i.test(String(payerAddress || ''))
        ? 'base'
        : 'solana';
  if (c === 'algorand') return refundUsdcToPayerAlgorand(payerAddress, amountUsd);
  if (c === 'celo') return refundUsdcToPayerCelo(payerAddress, amountUsd);
  if (c === 'base') return refundUsdcToPayerBase(payerAddress, amountUsd);
  return refundUsdcToPayerSolana(payerAddress, amountUsd);
}

/**
 * Proactively ensure a payer can afford the next call, topping it up from the PayTo wallet
 * when its USDC is too low.
 *
 * @param {string} payerAddress
 * @param {{ refundEnabled?: boolean; chain?: 'solana' | 'base' | 'celo' | 'algorand'; priceMultiplier?: number }} [opts]
 * @returns {Promise<{ canPay: boolean; funded: boolean; balanceUsdc: number | null; reason: string; signature?: string | null; amountUsd?: number; error?: string }>}
 */
export async function ensurePayerFundedForNextCall(payerAddress, opts = {}) {
  const chain =
    opts.chain != null
      ? normalizeLabChain(opts.chain)
      : /^0x/i.test(String(payerAddress || ''))
        ? 'base'
        : 'solana';
  const rawMult = Number(opts.priceMultiplier);
  const priceMultiplier =
    Number.isFinite(rawMult) ? Math.min(100, Math.max(1, rawMult)) : 1;
  const minPriceUsd = getMinLabX402PriceUsd() * priceMultiplier;

  // Algorand payers must opt into USDC ASA before balance/top-up can succeed.
  if (chain === 'algorand') {
    const optIn = await ensureAlgorandLabWalletUsdcOptIn(payerAddress);
    if (!optIn.ok && !optIn.already) {
      const balancesAfterFail = await getLabWalletBalances(payerAddress, chain);
      const reason = String(optIn.error || '').includes('insufficient_algo_for_opt_in')
        ? 'insufficient_algo_for_opt_in'
        : 'usdc_opt_in_failed';
      return {
        canPay: false,
        funded: false,
        balanceUsdc: balancesAfterFail?.usdcBalance ?? null,
        reason,
        error: optIn.error || reason,
      };
    }
  }

  let balances = await getLabWalletBalances(payerAddress, chain);

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
    getMaxLabX402PriceUsd() * priceMultiplier,
    getWeightedAvgLabX402PriceUsd() * priceMultiplier,
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
    // Re-read after top-up so Algorand opt-in + ASA balance are current.
    balances = (await getLabWalletBalances(payerAddress, chain)) ?? balances;
    return {
      canPay: true,
      funded: true,
      balanceUsdc: balances.usdcBalance,
      reason: 'topped_up',
      signature: refund?.signature ?? null,
      amountUsd: decision.refundAmountUsd,
    };
  } catch (e) {
    const msg = e?.message || String(e);
    const underfunded = String(msg).includes(PAYTO_INSUFFICIENT_FUNDS);
    const notOptedIn = /not opted into USDC ASA/i.test(String(msg));
    console.warn(
      `[labX402Refund] proactive top-up failed for ${payerAddress} (${underfunded ? 'payTo underfunded' : msg})`,
    );
    return {
      canPay: balances.usdcBalance >= minPriceUsd,
      funded: false,
      balanceUsdc: balances.usdcBalance,
      reason: notOptedIn
        ? 'usdc_opt_in_required'
        : underfunded
          ? 'payto_underfunded'
          : 'topup_failed',
      error: msg,
    };
  }
}
