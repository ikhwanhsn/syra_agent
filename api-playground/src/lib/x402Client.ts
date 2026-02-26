import {
  Connection,
  PublicKey,
  Transaction,
  TransactionMessage,
  TransactionInstruction,
  VersionedTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getMint,
  getAccount,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';

// USDC token mint on Solana mainnet
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const USDC_MINT_STRING = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDC_DEVNET_STRING = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

// CAIP-2 Network identifiers (matching API)
const SOLANA_MAINNET_CAIP2 = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOLANA_DEVNET_CAIP2 = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
const BASE_MAINNET_CAIP2 = 'eip155:8453';
const BASE_USDC_MAINNET = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

// x402 protocol version
const X402_VERSION = 2;

/** Poll interval for confirmation (ms). */
const CONFIRM_POLL_MS = 1500;
/** Max time to wait for confirmation (ms). */
const CONFIRM_TIMEOUT_MS = 60_000;

/**
 * Wait for transaction confirmation using HTTP-only RPC (getSignatureStatus).
 * Does NOT use signatureSubscribe/WebSocket, so it works with RPCs that don't support subscriptions
 * and avoids "Received JSON-RPC error calling signatureSubscribe" errors.
 */
async function confirmTransactionByPolling(
  connection: Connection,
  signature: string,
  lastValidBlockHeight: number
): Promise<{ confirmed: boolean; err?: any }> {
  const start = Date.now();
  while (Date.now() - start < CONFIRM_TIMEOUT_MS) {
    try {
      const currentBlockHeight = await connection.getBlockHeight('confirmed');
      if (currentBlockHeight > lastValidBlockHeight) {
        return { confirmed: false, err: 'Signature expired: block height exceeded' };
      }
      const status = await connection.getSignatureStatus(signature);
      const value = status?.value;
      if (value?.err) {
        return { confirmed: false, err: value.err };
      }
      if (
        value?.confirmationStatus === 'confirmed' ||
        value?.confirmationStatus === 'finalized' ||
        value?.confirmationStatus === 'processed'
      ) {
        return { confirmed: true };
      }
    } catch {
      // Transient RPC error; keep polling
    }
    await new Promise((r) => setTimeout(r, CONFIRM_POLL_MS));
  }
  return { confirmed: false, err: 'Confirmation timeout' };
}

export interface X402PaymentOption {
  scheme: string;
  network: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset?: string;
  /** When payTo is a token account (ATA), owner is the wallet that owns it. Lets us create the ATA if it doesn't exist. */
  owner?: string;
  extra?: Record<string, any>;
}

export interface X402Response {
  x402Version: number;
  accepts: X402PaymentOption[];
  resource?: {
    url: string;
    description?: string;
    mimeType?: string;
  };
  error?: string;
  extensions?: {
    bazaar?: {
      info?: {
        input?: Record<string, any>;
        output?: Record<string, any>;
      };
      schema?: {
        type?: string;
        properties?: Record<string, {
          type?: string;
          description?: string;
          required?: boolean;
        }>;
        required?: string[];
      };
    };
  };
  // Flag to indicate if this is a generic 402 (not x402 protocol)
  isGeneric402?: boolean;
  /** Raw v1 accepts from 402 body (for building X-Payment header in v1 format) */
  _rawV1Accepts?: any[];
}

export interface PaymentResult {
  success: boolean;
  signature?: string;
  paymentHeader?: string;
  error?: string;
  warning?: string; // Optional warning message (e.g., confirmation timeout)
}

export interface X402ClientConfig {
  connection: Connection;
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}

/** Normalize a v1 accept (maxAmountRequired, network "solana") to shared shape for getBestPaymentOption and createPaymentTransaction. */
function normalizeV1Accept(raw: any): X402PaymentOption {
  const amount = String(raw.maxAmountRequired ?? raw.amount ?? '0');
  const network =
    raw.network === 'solana' || !raw.network
      ? SOLANA_MAINNET_CAIP2
      : raw.network.startsWith('solana:')
        ? raw.network
        : SOLANA_MAINNET_CAIP2;
  const owner = raw.owner ?? raw.extra?.owner;
  return {
    scheme: raw.scheme || 'exact',
    network,
    payTo: raw.payTo ?? '',
    amount,
    asset: raw.asset ?? USDC_MINT_STRING,
    maxTimeoutSeconds: raw.maxTimeoutSeconds ?? 60,
    ...(owner ? { owner: String(owner) } : {}),
    ...(raw.extra && typeof raw.extra === 'object' ? { extra: raw.extra } : {}),
  };
}

/**
 * Parse x402 response from API
 * Handles x402 v2 and v1 protocol responses (matching api/utils/x402Payment.js format)
 */
export function parseX402Response(data: any, responseHeaders?: Record<string, string>): X402Response | null {
  // Check for x402 protocol response (v2 or v1)
  if (data && typeof data.x402Version === 'number') {
    const version = data.x402Version;
    const rawAccepts = data.accepts || [];
    // v1 uses maxAmountRequired and simple "solana" network; normalize so getBestPaymentOption/createPaymentTransaction work
    const accepts =
      version === 1 && rawAccepts.length > 0
        ? rawAccepts.map((a: any) => normalizeV1Accept(a))
        : rawAccepts;
    return {
      x402Version: version,
      accepts,
      resource: data.resource,
      error: data.error,
      extensions: data.extensions,
      // Keep raw accepts for v1 so we can build the correct X-Payment header (server expects v1 shape)
      ...(version === 1 && rawAccepts.length > 0 ? { _rawV1Accepts: rawAccepts } : {}),
    };
  }
  
  // Try to extract payment info from generic 402 response (fallback)
  if (data && (data.accepts || data.payment || data.paymentRequired || data.price || data.amount)) {
    let accepts: X402PaymentOption[] = [];
    
    // If accepts array exists, use it directly
    if (Array.isArray(data.accepts) && data.accepts.length > 0) {
      accepts = data.accepts;
    }
    // Try to build from payment object
    else if (data.payment) {
      accepts = [{
        scheme: data.payment.scheme || 'exact',
        network: data.payment.network || SOLANA_MAINNET_CAIP2,
        amount: String(data.payment.amount || data.amount || '0'),
        payTo: data.payment.payTo || data.payment.address || data.payment.recipient || '',
        maxTimeoutSeconds: data.payment.maxTimeoutSeconds || 3600,
        asset: data.payment.asset || data.payment.token || USDC_MINT_STRING,
      }];
    }
    // Try to build from price/amount fields
    else if (data.price || data.amount) {
      accepts = [{
        scheme: 'exact',
        network: data.network || SOLANA_MAINNET_CAIP2,
        amount: String(data.price || data.amount || '0'),
        payTo: data.payTo || data.address || data.recipient || '',
        maxTimeoutSeconds: data.maxTimeoutSeconds || 3600,
        asset: data.asset || data.token || USDC_MINT_STRING,
      }];
    }

    if (accepts.length > 0 && accepts[0].payTo) {
      return {
        x402Version: 2,
        accepts,
        isGeneric402: true,
      };
    }
  }

  // Payment options may be in Payment-Required header (e.g. Nansen / some x402 APIs)
  if (responseHeaders) {
    const header =
      responseHeaders['Payment-Required'] ||
      responseHeaders['PAYMENT-REQUIRED'] ||
      responseHeaders['payment-required'];
    if (header) {
      try {
        const decoded = JSON.parse(atob(header));
        const rawAccepts = Array.isArray(decoded) ? decoded : decoded?.accepts;
        const version = decoded?.x402Version ?? 2;
        if (rawAccepts?.length) {
          const accepts = rawAccepts.map((a: any) =>
            (version === 1 || a.maxAmountRequired != null) ? normalizeV1Accept(a) : normalizePaymentOption(a as X402PaymentOption & { price?: { asset?: string; amount?: string } })
          );
          if (accepts.some((a: X402PaymentOption) => a.payTo)) {
            return {
              x402Version: version,
              accepts,
              ...(version === 1 && rawAccepts.length > 0 ? { _rawV1Accepts: rawAccepts } : {}),
            };
          }
        }
      } catch {
        // ignore invalid header
      }
    }
  }

  return null;
}

/** Normalize raw accept from 402 so it has top-level amount and asset (V2 may send price: { asset, amount }). */
function normalizePaymentOption(raw: X402PaymentOption & { price?: { asset?: string; amount?: string }; owner?: string; extra?: { owner?: string } }): X402PaymentOption {
  const amount = String(raw.price?.amount ?? raw.amount ?? '0');
  const asset = raw.price?.asset ?? raw.asset ?? USDC_MINT_STRING;
  const owner = raw.owner ?? raw.extra?.owner;
  return {
    scheme: raw.scheme || 'exact',
    network: raw.network,
    payTo: raw.payTo,
    amount,
    asset,
    maxTimeoutSeconds: raw.maxTimeoutSeconds ?? 60,
    ...(owner ? { owner: String(owner) } : {}),
    ...(raw.extra && typeof raw.extra === 'object' ? { extra: raw.extra } : {}),
  };
}

/** True if option is Base (EVM) network. */
export function isBaseNetwork(opt: X402PaymentOption): boolean {
  return String(opt?.network || '').startsWith('eip155:');
}

/** True if option is Solana network. */
export function isSolanaNetwork(opt: X402PaymentOption): boolean {
  return /^solana:/i.test(String(opt?.network || ''));
}

/**
 * Get payment options grouped by chain (Solana and/or Base).
 * Use when the API offers both so the UI can show a chain selector.
 */
export function getPaymentOptionsByChain(x402Response: X402Response): {
  solana: X402PaymentOption | null;
  base: X402PaymentOption | null;
} {
  const { accepts } = x402Response ?? {};
  if (!accepts?.length) return { solana: null, base: null };
  const normalized = accepts.map((a) => normalizePaymentOption(a as X402PaymentOption & { price?: { asset?: string; amount?: string } }));
  const solana = normalized.find((opt) => isSolanaNetwork(opt)) ?? null;
  const base = normalized.find((opt) => isBaseNetwork(opt)) ?? null;
  return { solana, base };
}

/**
 * Get the best payment option from x402 response.
 * Prefers Solana then Base. Pass preferredChain to force one chain when both are available.
 */
export function getBestPaymentOption(
  x402Response: X402Response,
  preferredChain?: 'solana' | 'base' | 'auto'
): X402PaymentOption | null {
  const { accepts } = x402Response;

  if (!accepts || accepts.length === 0) {
    return null;
  }

  const normalized = accepts.map((a) =>
    normalizePaymentOption(a as X402PaymentOption & { price?: { asset?: string; amount?: string } })
  );

  if (preferredChain === 'base') {
    const baseOpt = normalized.find((opt) => isBaseNetwork(opt));
    if (baseOpt) return baseOpt;
  }

  // Prefer Solana mainnet with exact scheme
  const solanaMainnetOption = normalized.find(
    (opt) => opt.network === SOLANA_MAINNET_CAIP2 && opt.scheme === 'exact'
  );
  if (solanaMainnetOption) return solanaMainnetOption;

  // Any Solana network
  const solanaOption = normalized.find((opt) => isSolanaNetwork(opt) && opt.scheme === 'exact');
  if (solanaOption) return solanaOption;

  // Base (eip155)
  const baseOption = normalized.find((opt) => isBaseNetwork(opt) && opt.scheme === 'exact');
  if (baseOption) return baseOption;

  return normalized[0] ?? null;
}

/**
 * Convert amount from micro-units to display format
 * x402 amounts are in micro-units (1 USD = 1,000,000 micro-units)
 */
export function formatPaymentAmount(amount: string, decimals: number = 6): string {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const intPart = value / divisor;
  const decPart = value % divisor;
  
  if (decPart === BigInt(0)) {
    return intPart.toString();
  }
  
  const decStr = decPart.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${intPart}.${decStr}`;
}

/**
 * Result of createPaymentTransaction (VersionedTransaction + blockhash for confirmation).
 */
export interface PaymentTransactionResult {
  transaction: VersionedTransaction;
  lastValidBlockHeight: number;
}

/**
 * Parse amount string to BigInt in smallest units.
 * Supports integer strings (micro units) and decimal strings (e.g. "0.01" for USDC).
 */
function parseAmountToSmallestUnits(amountStr: string, decimals: number = 6): bigint {
  const s = String(amountStr).trim();
  if (s.includes('.')) {
    const [whole = '0', frac = ''] = s.split('.');
    const padded = frac.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole === '-' ? '0' : whole) * BigInt(10 ** decimals) + BigInt(padded || '0');
  }
  return BigInt(s || '0');
}

/**
 * Create a USDC transfer as VersionedTransaction for x402 V2 (server expects VersionedTransaction).
 */
export async function createPaymentTransaction(
  config: X402ClientConfig,
  paymentOption: X402PaymentOption
): Promise<PaymentTransactionResult> {
  const { connection, publicKey } = config;

  const recipientPubkey = new PublicKey(paymentOption.payTo);
  const amount = parseAmountToSmallestUnits(paymentOption.amount, 6);
  if (amount <= BigInt(0)) {
    throw new Error(
      `Invalid payment amount: "${paymentOption.amount}". Use micro units (e.g. 10000 for $0.01 USDC) or decimal (e.g. 0.01).`
    );
  }

  const isUSDC =
    paymentOption.asset === USDC_MINT_STRING ||
    paymentOption.asset === USDC_DEVNET_STRING ||
    paymentOption.asset === 'USDC' ||
    !paymentOption.asset;

  if (!isUSDC) {
    const lamports = (amount * BigInt(LAMPORTS_PER_SOL)) / BigInt(1_000_000);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    const message = new TransactionMessage({
      payerKey: publicKey,
      recentBlockhash: blockhash,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        }),
      ],
    }).compileToV0Message();
    const transaction = new VersionedTransaction(message);
    return { transaction, lastValidBlockHeight };
  }

  const usdcMint =
    paymentOption.asset === USDC_DEVNET_STRING ||
    paymentOption.network?.includes('devnet') ||
    paymentOption.network === SOLANA_DEVNET_CAIP2
      ? new PublicKey(USDC_DEVNET_STRING)
      : USDC_MINT;

  let programId = TOKEN_PROGRAM_ID;
  try {
    const mintInfo = await connection.getAccountInfo(usdcMint, 'confirmed');
    if (mintInfo?.owner?.equals(TOKEN_2022_PROGRAM_ID)) {
      programId = TOKEN_2022_PROGRAM_ID;
    }
  } catch {
    // keep TOKEN_PROGRAM_ID
  }

  const mint = await getMint(connection, usdcMint, 'confirmed', programId);
  const sourceAta = await getAssociatedTokenAddress(usdcMint, publicKey, false, programId);

  // payTo can be either (a) wallet address (on-curve) or (b) token account / ATA address (off-curve, PDA).
  // If off-curve, use payTo as dest. If that account doesn't exist and the API provided owner, derive ATA from owner and create it.
  let destAta: PublicKey;
  let ownerForAta: PublicKey | null = null; // used only when we need to create the ATA
  const payToIsOffCurve = !PublicKey.isOnCurve(recipientPubkey.toBytes());
  const ownerStr = paymentOption.owner ?? paymentOption.extra?.owner;

  if (payToIsOffCurve) {
    destAta = recipientPubkey;
  } else {
    destAta = await getAssociatedTokenAddress(usdcMint, recipientPubkey, false, programId);
    ownerForAta = recipientPubkey;
  }

  const instructions: TransactionInstruction[] = [];

  // Ensure destination ATA exists. Create it if we have the owner (wallet address).
  try {
    await getAccount(connection, destAta, 'confirmed');
  } catch {
    if (payToIsOffCurve && ownerStr) {
      const ownerPubkey = new PublicKey(ownerStr);
      if (!PublicKey.isOnCurve(ownerPubkey.toBytes())) {
        throw new Error('Payment option "owner" must be a wallet address (on-curve), not a token account.');
      }
      const derivedAta = await getAssociatedTokenAddress(usdcMint, ownerPubkey, false, programId);
      destAta = derivedAta;
      ownerForAta = ownerPubkey;
    }
    if (!ownerForAta) {
      throw new Error(
        'Recipient token account does not exist. The API returned a token account address; it must either exist already or the 402 response should include "owner" (wallet address) so we can create it.'
      );
    }
    instructions.push(
      createAssociatedTokenAccountInstruction(
        publicKey,
        destAta,
        ownerForAta,
        usdcMint,
        programId
      )
    );
  }

  instructions.push(
    createTransferCheckedInstruction(
      sourceAta,
      usdcMint,
      destAta,
      publicKey,
      amount,
      mint.decimals,
      [],
      programId
    )
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const message = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(message);
  return { transaction, lastValidBlockHeight };
}

/** V2 API may return price as { asset, amount }; normalize to top-level for header. */
function normalizeAcceptedForHeader(option: X402PaymentOption & { price?: { asset?: string; amount?: string } }): Record<string, unknown> {
  const amount = String(option.price?.amount ?? option.amount ?? '0');
  const asset = option.price?.asset ?? option.asset ?? USDC_MINT_STRING;
  return {
    scheme: option.scheme || 'exact',
    network: option.network,
    payTo: option.payTo,
    asset,
    amount,
    maxTimeoutSeconds: option.maxTimeoutSeconds ?? 60,
    ...(option.extra && typeof option.extra === 'object' ? { extra: option.extra } : {}),
  };
}

/**
 * Create x402 V2 payment header from signed VersionedTransaction.
 * V2 API expects decodePaymentSignatureHeader(header) to return payload with .accepted and .payload.transaction.
 */
export function createPaymentHeader(
  signedTransaction: VersionedTransaction,
  paymentOption: X402PaymentOption
): string {
  const serialized = signedTransaction.serialize();
  const base64Tx = Buffer.from(serialized).toString('base64');
  const accepted = normalizeAcceptedForHeader(paymentOption);
  const sig = signedTransaction.signatures[0];
  const signatureB58 = sig && sig.length === 64 ? bs58.encode(Buffer.from(sig)) : null;

  const paymentPayload = {
    x402Version: X402_VERSION,
    accepted,
    payload: {
      transaction: base64Tx,
      signature: signatureB58,
    },
  };

  return btoa(JSON.stringify(paymentPayload));
}

/**
 * Build v1 "accepted" object for X-PAYMENT header. Server (x402-solana) expects simple network string "solana" or "devnet", not CAIP-2.
 * Sending CAIP-2 (e.g. "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") causes "Invalid network" on verification.
 */
function buildV1AcceptedForHeader(rawV1Accept: Record<string, any>): Record<string, any> {
  const rawNetwork = rawV1Accept.network;
  const network =
    rawNetwork === 'solana' || rawNetwork === 'devnet'
      ? rawNetwork
      : typeof rawNetwork === 'string' && rawNetwork.includes('devnet')
        ? 'devnet'
        : 'solana';
  return {
    scheme: rawV1Accept.scheme ?? 'exact',
    network,
    maxAmountRequired: rawV1Accept.maxAmountRequired ?? rawV1Accept.amount,
    resource: rawV1Accept.resource,
    description: rawV1Accept.description,
    mimeType: rawV1Accept.mimeType ?? '',
    payTo: rawV1Accept.payTo,
    maxTimeoutSeconds: rawV1Accept.maxTimeoutSeconds ?? 60,
    asset: rawV1Accept.asset,
    outputSchema: rawV1Accept.outputSchema,
    extra: rawV1Accept.extra && typeof rawV1Accept.extra === 'object' ? rawV1Accept.extra : undefined,
  };
}

/**
 * Create x402 V1 payment header from signed VersionedTransaction.
 * V1 API (x402-solana) expects X-PAYMENT header with x402Version: 1 and accepted in v1 shape (maxAmountRequired, network "solana").
 */
export function createV1PaymentHeader(
  signedTransaction: VersionedTransaction,
  rawV1Accept: Record<string, any>
): string {
  const serialized = signedTransaction.serialize();
  const base64Tx = typeof Buffer !== 'undefined'
    ? Buffer.from(serialized).toString('base64')
    : btoa(String.fromCharCode(...new Uint8Array(serialized)));
  const paymentPayload = {
    x402Version: 1,
    accepted: buildV1AcceptedForHeader(rawV1Accept),
    payload: {
      transaction: base64Tx,
    },
  };
  return btoa(JSON.stringify(paymentPayload));
}

/** EVM signer for Base payments: address + signTypedData (viem-compatible). */
export interface EvmSigner {
  address: string;
  signTypedData: (args: {
    domain: { name: string; version: string; chainId: number; verifyingContract: string };
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => Promise<string>;
}

/**
 * Build PAYMENT-SIGNATURE header for x402 V2 from EVM payload (no transaction, authorization + signature).
 */
function createEvmPaymentHeader(
  payload: { authorization: Record<string, unknown>; signature: string },
  paymentOption: X402PaymentOption
): string {
  const accepted = normalizeAcceptedForHeader(paymentOption as X402PaymentOption & { price?: { asset?: string; amount?: string } });
  const paymentPayload = {
    x402Version: X402_VERSION,
    accepted,
    payload,
  };
  return btoa(JSON.stringify(paymentPayload));
}

/**
 * Execute Base (EVM) payment via EIP-3009 TransferWithAuthorization and return payment header.
 * Requires EVM signer (e.g. from viem createWalletClient) and payment option with extra.name/version for EIP-712.
 */
export async function executeBasePayment(
  evmSigner: EvmSigner,
  paymentOption: X402PaymentOption
): Promise<PaymentResult> {
  const { ExactEvmScheme } = await import('@x402/evm/exact/client');
  const raw = paymentOption as X402PaymentOption & { extra?: { name?: string; version?: string; eip712?: { name?: string; version?: string } } };
  const name = raw.extra?.eip712?.name ?? raw.extra?.name ?? 'USD Coin';
  const version = raw.extra?.eip712?.version ?? raw.extra?.version ?? '2';
  const paymentRequirements = {
    payTo: raw.payTo,
    amount: String(raw.amount ?? '0'),
    maxTimeoutSeconds: raw.maxTimeoutSeconds ?? 60,
    network: raw.network,
    asset: (raw.asset ?? raw.price?.asset ?? BASE_USDC_MAINNET).toLowerCase().startsWith('0x')
      ? raw.asset ?? raw.price?.asset ?? BASE_USDC_MAINNET
      : BASE_USDC_MAINNET,
    extra: { name, version },
  };
  const scheme = new ExactEvmScheme(evmSigner);
  const result = await scheme.createPaymentPayload(X402_VERSION, paymentRequirements);
  const paymentHeader = createEvmPaymentHeader(result.payload, paymentOption);
  return {
    success: true,
    paymentHeader,
    signature: undefined,
  };
}

/**
 * Execute payment and create payment header.
 * For v1 APIs pass rawV1Accept (the original accept from 402 body) so the header is built in v1 format (X-PAYMENT).
 */
export async function executePayment(
  config: X402ClientConfig,
  paymentOption: X402PaymentOption,
  rawV1Accept?: Record<string, any>
): Promise<PaymentResult> {
  let signature: string | undefined;
  let signedTransaction: VersionedTransaction | undefined;

  try {
    const { connection, signTransaction } = config;

    const { transaction, lastValidBlockHeight } = await createPaymentTransaction(config, paymentOption);

    signedTransaction = (await signTransaction(transaction as any)) as unknown as VersionedTransaction;

    signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
    });

    const { confirmed: confirmationSuccess, err: confirmErr } = await confirmTransactionByPolling(
      connection,
      signature,
      lastValidBlockHeight
    );

    if (!confirmationSuccess && confirmErr && confirmErr !== 'Confirmation timeout') {
      return {
        success: false,
        error: `Transaction failed: ${JSON.stringify(confirmErr)}`,
      };
    }
    if (!signedTransaction) {
      return {
        success: false,
        error: 'Failed to create signed transaction',
      };
    }

    const paymentHeader = rawV1Accept
      ? createV1PaymentHeader(signedTransaction, rawV1Accept)
      : createPaymentHeader(signedTransaction, paymentOption);

    return {
      success: true,
      signature,
      paymentHeader,
      ...(confirmationSuccess
        ? {}
        : {
            warning: `Transaction submitted but confirmation timed out. Check status: https://solscan.io/tx/${signature}`,
          }),
    };
  } catch (error: any) {
    const errMsg = error?.message ?? 'Payment execution failed';
    const errLog = error?.logs?.join?.(' ') ?? error?.toString?.() ?? '';
    const errorMessage = errLog && !errMsg.includes(errLog.slice(0, 50)) ? `${errMsg}. ${errLog.slice(0, 200)}` : errMsg;

    if (signature) {
      return {
        success: false,
        error: `${errorMessage}. Tx: ${signature}. Check Solana Explorer.`,
      };
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Extract payment details from x402 response for display
 * Matches the format returned by api/utils/x402Payment.js
 */
export function extractPaymentDetails(x402Response: X402Response): {
  amount: string;
  token: string;
  recipient: string;
  network: string;
  memo?: string;
} | null {
  const option = getBestPaymentOption(x402Response);
  
  if (!option) {
    return null;
  }
  
  // Validate required fields
  if (!option.payTo) {
    return null;
  }
  
  if (!option.amount) {
    return null;
  }
  
  // Determine token type from asset field
  // API returns USDC mint address: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (mainnet)
  // or 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU (devnet)
  let token = 'USDC';
  const asset = option.asset;
  
  if (asset) {
    if (asset === USDC_MINT_STRING || asset === USDC_DEVNET_STRING || asset === 'USDC') {
      token = 'USDC';
    } else if (asset === 'SOL' || asset === 'So11111111111111111111111111111111111111112') {
      token = 'SOL';
    } else {
      // Unknown token, show first/last chars of address
      token = `${asset.slice(0, 4)}...${asset.slice(-4)}`;
    }
  }
  
  // Format network name from CAIP-2 identifier
  let network = 'Solana';
  if (option.network) {
    if (option.network === BASE_MAINNET_CAIP2 || option.network === 'eip155:8453') {
      network = 'Base Mainnet';
    } else if (option.network.startsWith('eip155:')) {
      network = 'Base';
    } else if (option.network === SOLANA_MAINNET_CAIP2 || option.network.includes('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')) {
      network = 'Solana Mainnet';
    } else if (option.network === SOLANA_DEVNET_CAIP2 || option.network.includes('EtWTRABZaYq6iMfeYKouRu166VU2xqa1') || option.network.includes('devnet')) {
      network = 'Solana Devnet';
    } else if (option.network.startsWith('solana:')) {
      network = 'Solana';
    }
  }
  
  // Format amount from micro-units (1,000,000 = $1.00)
  const formattedAmount = formatPaymentAmount(option.amount);
  
  const details = {
    amount: formattedAmount,
    token,
    recipient: option.payTo,
    network,
    memo: option.extra?.memo,
  };

  return details;
}

/**
 * Build payment details for display from a single payment option (e.g. when user selects Solana vs Base).
 */
export function extractPaymentDetailsFromOption(option: X402PaymentOption): PaymentDetails {
  const formattedAmount = formatPaymentAmount(option.amount);
  let token = 'USDC';
  const asset = option.asset;
  if (asset) {
    if (asset === USDC_MINT_STRING || asset === USDC_DEVNET_STRING || asset.toLowerCase() === BASE_USDC_MAINNET.toLowerCase() || asset === 'USDC') {
      token = 'USDC';
    } else if (asset === 'SOL' || asset === 'So11111111111111111111111111111111111111112') {
      token = 'SOL';
    } else {
      token = `${String(asset).slice(0, 4)}...${String(asset).slice(-4)}`;
    }
  }
  let network = 'Solana';
  if (option.network) {
    if (option.network === BASE_MAINNET_CAIP2 || option.network === 'eip155:8453') network = 'Base Mainnet';
    else if (option.network.startsWith('eip155:')) network = 'Base';
    else if (option.network === SOLANA_MAINNET_CAIP2 || String(option.network).includes('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')) network = 'Solana Mainnet';
    else if (option.network === SOLANA_DEVNET_CAIP2 || String(option.network).includes('devnet')) network = 'Solana Devnet';
    else if (option.network.startsWith('solana:')) network = 'Solana';
  }
  return {
    amount: formattedAmount,
    token,
    recipient: option.payTo ?? '',
    network,
    memo: option.extra?.memo,
  };
}
