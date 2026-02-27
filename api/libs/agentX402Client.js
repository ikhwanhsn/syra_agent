/**
 * Agent x402 client: call x402 API v2 using agent keypair (pay automatically).
 * Used by the Syra agent to access paid APIs; balance must be checked before calling.
 */
import { Connection, PublicKey } from '@solana/web3.js';
import {
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  getMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import { getAgentKeypair } from './agentWallet.js';

/**
 * Get treasury keypair from AGENT_PRIVATE_KEY (base58). Used to pay for tool calls when user is a 1M+ SYRA holder.
 * @returns {Keypair | null}
 */
function getTreasuryKeypair() {
  const raw = process.env.AGENT_PRIVATE_KEY;
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const secretKey = bs58.decode(raw.trim());
    return Keypair.fromSecretKey(secretKey);
  } catch {
    return null;
  }
}

/** Placeholder signature (64 zero bytes base58) = tx was not actually signed; RPC returns this when tx is invalid. */
const ZERO_SIG_BASE58 = '1'.repeat(64);

const USDC_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const RPC_URL = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || 'https://rpc.ankr.com/solana';

/** Poll interval for confirmation (ms). */
const CONFIRM_POLL_MS = 1500;
/** Max time to wait for confirmation (ms). Gives slow RPCs time to confirm. */
const CONFIRM_TIMEOUT_MS = 90_000;

/**
 * Wait for transaction confirmation using HTTP-only RPC (getSignatureStatuses).
 * Does not use signatureSubscribe, so it works with RPCs that don't support WebSocket subscriptions.
 * @param {import('@solana/web3.js').Connection} connection
 * @param {string} signature
 * @param {number} lastValidBlockHeight
 * @param {number} [maxWaitMs] - Max ms to wait (default CONFIRM_TIMEOUT_MS). Use shorter value for pay-402 so we return header sooner; facilitator verifies by signature.
 * @returns {Promise<{ confirmed: boolean; error?: string }>}
 */
async function confirmTransactionByPolling(connection, signature, lastValidBlockHeight, maxWaitMs = CONFIRM_TIMEOUT_MS) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const currentBlockHeight = await connection.getBlockHeight('confirmed');
      if (currentBlockHeight > lastValidBlockHeight) {
        return { confirmed: false, error: 'Signature has expired: block height exceeded' };
      }
      const { value } = await connection.getSignatureStatuses([signature]);
      const status = value?.[0];
      if (status?.err) {
        return { confirmed: false, error: String(status.err) };
      }
      if (
        status?.confirmationStatus === 'confirmed' ||
        status?.confirmationStatus === 'finalized' ||
        status?.confirmationStatus === 'processed'
      ) {
        return { confirmed: true };
      }
    } catch (e) {
      // Transient RPC error; keep polling
    }
    await new Promise((r) => setTimeout(r, CONFIRM_POLL_MS));
  }
  return { confirmed: false, error: 'Confirmation timeout' };
}

/**
 * Normalize 402 accept option to v2 PaymentRequirements shape (flat asset/amount).
 * V2 API may return price: { asset, amount }; server expects top-level asset/amount.
 * @param {object} accept - Raw accept from 402 response (accepts[0])
 * @returns {object} Normalized accept for tx building and PAYMENT-SIGNATURE
 */
function normalizeAccept(accept) {
  const amount = String(
    accept.price?.amount ?? accept.amount ?? accept.maxAmountRequired ?? '0'
  );
  const asset = accept.price?.asset ?? accept.asset ?? USDC_MAINNET;
  return {
    scheme: accept.scheme || 'exact',
    network: accept.network,
    payTo: accept.payTo,
    asset,
    amount,
    maxTimeoutSeconds: accept.maxTimeoutSeconds ?? 60,
    extra: accept.extra && typeof accept.extra === 'object' ? accept.extra : {},
  };
}

/**
 * Build PAYMENT-SIGNATURE header (base64) for x402 v2.
 * V2 server expects decodePaymentSignatureHeader(header) to return PaymentPayload with .accepted and .payload.transaction (and optionally .payload.signature).
 * @param {VersionedTransaction} signedTx
 * @param {object} accepted - Normalized PaymentRequirements (scheme, network, payTo, asset, amount, ...)
 * @param {number} x402Version - Must be 2 for Syra API; v1 is legacy.
 * @returns {string} base64 payment header
 */
function createPaymentHeaderFromTx(signedTx, accepted, x402Version = 2) {
  const serialized = Buffer.from(signedTx.serialize()).toString('base64');
  const sig = signedTx.signatures?.[0];
  const signatureB58 = sig && sig.length === 64 ? bs58.encode(Buffer.from(sig)) : null;
  const paymentPayload = {
    x402Version: Number(x402Version) === 1 ? 1 : 2,
    accepted,
    payload: {
      transaction: serialized,
      ...(signatureB58 && { signature: signatureB58 }),
    },
  };
  return Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
}

/**
 * Call an x402 v2 API using the agent wallet (pay automatically with agent keypair).
 * 1. GET/POST the resource URL -> expect 402 with accepts[]
 * 2. Build VersionedTransaction (feePayer from accepts, transfer from agent to payTo)
 * 3. Sign with agent keypair
 * 4. Call resource again with PAYMENT-SIGNATURE header
 *
 * @param {object} opts
 * @param {string} opts.anonymousId - Agent wallet anonymousId
 * @param {string} opts.url - Full URL (e.g. BASE_URL + /news)
 * @param {string} opts.method - GET or POST
 * @param {Record<string, string>} [opts.query] - Query params for GET
 * @param {object} [opts.body] - JSON body for POST
 * @param {string} [opts.connectedWalletAddress] - When set, sent as X-Connected-Wallet so API can apply dev pricing for that wallet
 * @returns {Promise<{ success: true; data: any } | { success: false; error: string }>}
 */
export async function callX402V2WithAgent(opts) {
  try {
    const { anonymousId, url, method = 'GET', query = {}, body, connectedWalletAddress } = opts;
    const keypair = await getAgentKeypair(anonymousId);
    if (!keypair) {
      return { success: false, error: 'Agent wallet not found for this user' };
    }
    return await callX402V2WithKeypair(keypair, { url, method, query, body, connectedWalletAddress });
  } catch (e) {
    const msg = e?.message || String(e);
    return { success: false, error: msg };
  }
}

/**
 * Call x402 v2 API using the treasury wallet (AGENT_PRIVATE_KEY). Used when user is a 1M+ SYRA holder (free tools).
 * @param {object} opts - { url, method?, query?, body? }
 * @returns {Promise<{ success: true; data: any } | { success: false; error: string }>}
 */
export async function callX402V2WithTreasury(opts) {
  try {
    const keypair = getTreasuryKeypair();
    if (!keypair) {
      return { success: false, error: 'Treasury wallet not configured (AGENT_PRIVATE_KEY)' };
    }
    return await callX402V2WithKeypair(keypair, opts);
  } catch (e) {
    const msg = e?.message || String(e);
    return { success: false, error: msg };
  }
}

async function callX402V2WithKeypair(keypair, opts) {
  const { url, method = 'GET', query = {}, body, connectedWalletAddress } = opts;
  const connection = new Connection(RPC_URL, 'confirmed');
  const agentPubkey = keypair.publicKey;

  const buildUrl = () => {
    const u = new URL(url);
    Object.entries(query).forEach(([k, v]) => {
      if (v != null && v !== '') u.searchParams.set(k, String(v));
    });
    return u.toString();
  };

  // 1. Initial request to get 402 with accepts (X-Connected-Wallet => API applies dev pricing when that wallet is a dev wallet)
  const initialUrl = buildUrl();
  const initHeaders = { 'Content-Type': 'application/json' };
  if (connectedWalletAddress && typeof connectedWalletAddress === 'string' && connectedWalletAddress.trim()) {
    initHeaders['X-Connected-Wallet'] = connectedWalletAddress.trim();
  }
  const initOpts = {
    method,
    headers: initHeaders,
    ...(body && method === 'POST' ? { body: JSON.stringify(body) } : {}),
  };
  const firstRes = await fetch(initialUrl, initOpts);
  const firstData = await firstRes.json().catch(() => ({}));

  // Payment only happens when the API returns 402. If 200/other, we return data without paying (balance unchanged).
  if (firstRes.status !== 402) {
    return { success: true, data: firstData };
  }

  const accepts = firstData?.accepts;
  if (!accepts?.length) {
    return { success: false, error: '402 response missing accepts array' };
  }

  return pay402AndRetry(keypair, {
    url: initialUrl,
    method,
    body,
    accepts,
    x402Version: firstData.x402Version ?? 2,
    connectedWalletAddress,
  });
}

/**
 * Execute 402 payment with keypair and retry the request. Used by Syra v2 and by Nansen direct calls.
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {{ url: string; method?: string; body?: object; accepts: object[]; x402Version?: number; connectedWalletAddress?: string }} opts
 * @returns {Promise<{ success: true; data: any } | { success: false; error: string }>}
 */
export async function pay402AndRetry(keypair, opts) {
  const { url, method = 'POST', body, accepts, x402Version = 2, connectedWalletAddress } = opts;
  const connection = new Connection(RPC_URL, 'confirmed');
  const agentPubkey = keypair.publicKey;

  const rawAccept = accepts[0];
  const accept = normalizeAccept(rawAccept);
  const amountStr = accept.amount;
  const amount = BigInt(amountStr);
  const payTo = accept.payTo;
  const asset = accept.asset;
  const feePayerPubkey = agentPubkey;
  const destinationPubkey = new PublicKey(payTo);
  const mintPubkey = new PublicKey(asset);

  let programId = TOKEN_PROGRAM_ID;
  try {
    const mintInfo = await connection.getAccountInfo(mintPubkey, 'confirmed');
    if (mintInfo?.owner?.equals(TOKEN_2022_PROGRAM_ID)) {
      programId = TOKEN_2022_PROGRAM_ID;
    }
  } catch {
    // keep TOKEN_PROGRAM_ID
  }

  const mint = await getMint(connection, mintPubkey, undefined, programId);
  const sourceAta = await getAssociatedTokenAddress(
    mintPubkey,
    agentPubkey,
    false,
    programId
  );
  const destAta = await getAssociatedTokenAddress(
    mintPubkey,
    destinationPubkey,
    false,
    programId
  );

  const sourceAtaInfo = await connection.getAccountInfo(sourceAta, 'confirmed');
  if (!sourceAtaInfo) {
    const err = 'Agent wallet has no USDC token account. Deposit USDC to the agent wallet first.';
    return { success: false, error: err };
  }

  const destAtaInfo = await connection.getAccountInfo(destAta, 'confirmed');
  if (!destAtaInfo) {
    const err =
      'Recipient token account not found. The API treasury must have a USDC token account.';
    return { success: false, error: err };
  }

  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 7_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
    createTransferCheckedInstruction(
      sourceAta,
      mintPubkey,
      destAta,
      agentPubkey,
      amount,
      mint.decimals,
      [],
      programId
    ),
  ];

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const message = new TransactionMessage({
    payerKey: feePayerPubkey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(message);
  transaction.sign([keypair]);

  const sig0 = transaction.signatures[0];
  if (!sig0 || sig0.length !== 64 || sig0.every((b) => b === 0)) {
    const err =
      'Transaction signing failed: fee payer must be the agent wallet. The payment was not sent.';
    return { success: false, error: err };
  }

  let signature;
  try {
    signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    if (signature === ZERO_SIG_BASE58) {
      return {
        success: false,
        error: 'Payment transaction was invalid (not signed). Balance was not deducted.',
      };
    }
  } catch (sendErr) {
    const rawMsg = sendErr?.message || 'Failed to submit payment transaction to Solana';
    const isDebitNoCredit =
      /debit an account but found no record of a prior credit/i.test(rawMsg) ||
      /insufficient funds/i.test(rawMsg);
    const err = isDebitNoCredit
      ? 'Agent wallet needs SOL for transaction fees. The wallet has USDC but no (or not enough) SOL to pay the network fee. Send a small amount of SOL (e.g. 0.01 SOL) to the agent wallet: ' +
        agentPubkey.toBase58()
      : rawMsg;
    return { success: false, error: err };
  }

  await confirmTransactionByPolling(connection, signature, lastValidBlockHeight);

  const paymentHeader = createPaymentHeaderFromTx(transaction, accept, x402Version);

  const retryHeaders = {
    'Content-Type': 'application/json',
    'PAYMENT-SIGNATURE': paymentHeader,
    ...(x402Version === 1 && { 'X-PAYMENT': paymentHeader }),
  };
  if (connectedWalletAddress && typeof connectedWalletAddress === 'string' && connectedWalletAddress.trim()) {
    retryHeaders['X-Connected-Wallet'] = connectedWalletAddress.trim();
  }

  const retryOpts = {
    method,
    headers: retryHeaders,
    ...(body && method === 'POST' ? { body: JSON.stringify(body) } : {}),
  };

  const secondRes = await fetch(url, retryOpts);
  const secondData = await secondRes.json().catch(() => ({}));

  if (!secondRes.ok) {
    return {
      success: false,
      error: secondData?.error || secondRes.statusText || `Request failed: ${secondRes.status}`,
    };
  }

  return { success: true, data: secondData };
}

/**
 * Build payment header from a 402 response body (for frontend pay-then-retry flow).
 * Used when the client receives 402 and wants the backend to sign with the agent wallet.
 * @param {string} anonymousId - Agent wallet anonymousId
 * @param {object} paymentRequired - The 402 response body (must have accepts[] and optionally x402Version)
 * @returns {Promise<{ paymentHeader: string; signature?: string }>}
 */
export async function buildPaymentHeaderFrom402Body(anonymousId, paymentRequired) {
  if (!paymentRequired || !Array.isArray(paymentRequired.accepts) || paymentRequired.accepts.length === 0) {
    throw new Error('paymentRequired must have non-empty accepts array');
  }
  const keypair = await getAgentKeypair(anonymousId);
  if (!keypair) {
    throw new Error('Agent wallet not found for this user');
  }

  const connection = new Connection(RPC_URL, 'confirmed');
  const agentPubkey = keypair.publicKey;
  const agentAddress = agentPubkey.toBase58();
  const rawAccept = paymentRequired.accepts[0];
  const accept = normalizeAccept(rawAccept);
  const amountStr = accept.amount;
  const amount = BigInt(amountStr);
  const payTo = accept.payTo;
  const asset = accept.asset;
  const x402Version = paymentRequired.x402Version ?? 2;
  // Agent is the payer: we must be the fee payer so our signature is applied (same fix as callX402V2WithAgentImpl).
  const feePayerPubkey = agentPubkey;
  const destinationPubkey = new PublicKey(payTo);
  const mintPubkey = new PublicKey(asset);

  let programId = TOKEN_PROGRAM_ID;
  try {
    const mintInfo = await connection.getAccountInfo(mintPubkey, 'confirmed');
    if (mintInfo?.owner?.equals(TOKEN_2022_PROGRAM_ID)) {
      programId = TOKEN_2022_PROGRAM_ID;
    }
  } catch {
    // keep TOKEN_PROGRAM_ID
  }

  const mint = await getMint(connection, mintPubkey, undefined, programId);
  const sourceAta = await getAssociatedTokenAddress(
    mintPubkey,
    agentPubkey,
    false,
    programId
  );
  const destAta = await getAssociatedTokenAddress(
    mintPubkey,
    destinationPubkey,
    false,
    programId
  );

  const sourceAtaInfo = await connection.getAccountInfo(sourceAta, 'confirmed');
  if (!sourceAtaInfo) {
    throw new Error('Agent wallet has no USDC token account. Deposit USDC to the agent wallet first.');
  }

  const destAtaInfo = await connection.getAccountInfo(destAta, 'confirmed');
  if (!destAtaInfo) {
    throw new Error('Recipient token account not found');
  }

  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 7_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
    createTransferCheckedInstruction(
      sourceAta,
      mintPubkey,
      destAta,
      agentPubkey,
      amount,
      mint.decimals,
      [],
      programId
    ),
  ];

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const message = new TransactionMessage({
    payerKey: feePayerPubkey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(message);
  transaction.sign([keypair]);

  let signature;
  try {
    signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
  } catch (sendErr) {
    throw new Error(sendErr?.message || 'Failed to submit payment transaction to Solana');
  }

  // Use shorter wait (20s) for pay-402 so client gets header sooner; tx is already submitted, facilitator can verify by signature.
  const PAY402_CONFIRM_MAX_MS = 20_000;
  await confirmTransactionByPolling(
    connection,
    signature,
    lastValidBlockHeight,
    PAY402_CONFIRM_MAX_MS
  );
  // If confirmation timed out we still return the header; facilitator verifies by signature.

  const paymentHeader = createPaymentHeaderFromTx(transaction, accept, x402Version);
  return { paymentHeader, signature };
}

/**
 * Sign and submit a Jupiter swap transaction with the agent wallet.
 * Used after getting a swap order so the agent's token balance is actually reduced (swap executed).
 * @param {string} anonymousId - Agent wallet anonymousId
 * @param {string} serializedTxBase64 - Base64-encoded transaction from Jupiter order response
 * @returns {Promise<{ signature: string }>} Transaction signature (base58)
 */
export async function signAndSubmitSwapTransaction(anonymousId, serializedTxBase64) {
  const keypair = await getAgentKeypair(anonymousId);
  if (!keypair) {
    throw new Error('Agent wallet not found for this user');
  }
  const connection = new Connection(RPC_URL, 'confirmed');
  const txBuf = Buffer.from(serializedTxBase64, 'base64');
  const transaction = VersionedTransaction.deserialize(txBuf);
  transaction.sign([keypair]);
  const sig0 = transaction.signatures[0];
  if (!sig0 || sig0.length !== 64) {
    throw new Error('Failed to sign swap transaction');
  }
  try {
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    return { signature };
  } catch (sendErr) {
    const rawMsg = sendErr?.message || 'Failed to submit swap transaction to Solana';
    const isDebitNoCredit =
      /debit an account but found no record of a prior credit/i.test(rawMsg) ||
      /insufficient funds/i.test(rawMsg);
    const err = isDebitNoCredit
      ? 'Agent wallet needs SOL for transaction fees. Send a small amount of SOL (e.g. 0.01) to the agent wallet.'
      : rawMsg;
    throw new Error(err);
  }
}
