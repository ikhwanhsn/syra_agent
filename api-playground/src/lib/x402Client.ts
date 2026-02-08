import {
  Connection,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
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

/**
 * Parse x402 response from API
 * Handles x402 v2 protocol responses (matching api/utils/x402Payment.js format)
 */
export function parseX402Response(data: any, responseHeaders?: Record<string, string>): X402Response | null {
  // Check for x402 protocol response (v2 or any version)
  if (data && typeof data.x402Version === 'number') {
    return {
      x402Version: data.x402Version,
      accepts: data.accepts || [],
      resource: data.resource,
      error: data.error,
      extensions: data.extensions,
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
  
  return null;
}

/** Normalize raw accept from 402 so it has top-level amount and asset (V2 may send price: { asset, amount }). */
function normalizePaymentOption(raw: X402PaymentOption & { price?: { asset?: string; amount?: string } }): X402PaymentOption {
  const amount = String(raw.price?.amount ?? raw.amount ?? '0');
  const asset = raw.price?.asset ?? raw.asset ?? USDC_MINT_STRING;
  return {
    scheme: raw.scheme || 'exact',
    network: raw.network,
    payTo: raw.payTo,
    amount,
    asset,
    maxTimeoutSeconds: raw.maxTimeoutSeconds ?? 60,
    ...(raw.extra && typeof raw.extra === 'object' ? { extra: raw.extra } : {}),
  };
}

/**
 * Get the best payment option from x402 response
 * Prioritizes Solana USDC payments. Normalizes so amount/asset are always set (V2 uses price.amount/price.asset).
 */
export function getBestPaymentOption(x402Response: X402Response): X402PaymentOption | null {
  const { accepts } = x402Response;
  
  if (!accepts || accepts.length === 0) {
    return null;
  }
  
  // Prefer Solana mainnet with exact scheme
  const solanaMainnetOption = accepts.find(opt => 
    opt.network === SOLANA_MAINNET_CAIP2 && 
    opt.scheme === 'exact'
  );
  
  if (solanaMainnetOption) {
    return normalizePaymentOption(solanaMainnetOption as X402PaymentOption & { price?: { asset?: string; amount?: string } });
  }
  
  // Fallback: any Solana network (including devnet)
  const solanaOption = accepts.find(opt => 
    opt.network?.startsWith('solana:') && 
    opt.scheme === 'exact'
  );
  
  if (solanaOption) {
    return normalizePaymentOption(solanaOption as X402PaymentOption & { price?: { asset?: string; amount?: string } });
  }
  
  // Last fallback: first option
  return normalizePaymentOption(accepts[0] as X402PaymentOption & { price?: { asset?: string; amount?: string } });
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
 * Create a USDC transfer as VersionedTransaction for x402 V2 (server expects VersionedTransaction).
 */
export async function createPaymentTransaction(
  config: X402ClientConfig,
  paymentOption: X402PaymentOption
): Promise<PaymentTransactionResult> {
  const { connection, publicKey } = config;

  const recipientPubkey = new PublicKey(paymentOption.payTo);
  const amount = BigInt(paymentOption.amount);

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
  const destAta = await getAssociatedTokenAddress(usdcMint, recipientPubkey, false, programId);

  const instructions = [
    createTransferCheckedInstruction(
      sourceAta,
      usdcMint,
      destAta,
      publicKey,
      amount,
      mint.decimals,
      [],
      programId
    ),
  ];

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
 * Execute payment and create payment header
 */
export async function executePayment(
  config: X402ClientConfig,
  paymentOption: X402PaymentOption
): Promise<PaymentResult> {
  let signature: string | undefined;
  let signedTransaction: VersionedTransaction | undefined;

  try {
    const { connection, signTransaction } = config;

    const { transaction, lastValidBlockHeight } = await createPaymentTransaction(config, paymentOption);

    signedTransaction = (await signTransaction(transaction as any)) as VersionedTransaction;

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

    const paymentHeader = createPaymentHeader(signedTransaction, paymentOption);

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
    const errorMessage = error.message || 'Payment execution failed';
    
    // If we have a signature, include it in the error so user can check it
    if (signature) {
      return {
        success: false,
        error: `${errorMessage}. Transaction signature: ${signature}. Check status on Solana Explorer.`,
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
  // API returns: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp (mainnet)
  // or: solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1 (devnet)
  let network = 'Solana';
  if (option.network) {
    if (option.network === SOLANA_MAINNET_CAIP2 || option.network.includes('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')) {
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
