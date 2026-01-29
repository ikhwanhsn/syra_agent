import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
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
  console.log('[x402] Parsing response:', JSON.stringify(data, null, 2));
  
  // Check for x402 protocol response (v2 or any version)
  if (data && typeof data.x402Version === 'number') {
    console.log('[x402] Found x402 version:', data.x402Version);
    
    // Validate accepts array exists and has items
    if (!data.accepts || !Array.isArray(data.accepts) || data.accepts.length === 0) {
      console.log('[x402] Warning: No accepts array in response');
    } else {
      console.log('[x402] Found', data.accepts.length, 'payment option(s)');
      console.log('[x402] First accept option:', JSON.stringify(data.accepts[0], null, 2));
    }
    
    return {
      x402Version: data.x402Version,
      accepts: data.accepts || [],
      resource: data.resource,
      error: data.error,
    };
  }
  
  // Try to extract payment info from generic 402 response (fallback)
  if (data && (data.accepts || data.payment || data.paymentRequired || data.price || data.amount)) {
    console.log('[x402] Attempting to parse generic 402 response');
    
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
  
  console.log('[x402] Could not parse response as x402 format');
  return null;
}

/**
 * Get the best payment option from x402 response
 * Prioritizes Solana USDC payments
 */
export function getBestPaymentOption(x402Response: X402Response): X402PaymentOption | null {
  const { accepts } = x402Response;
  
  console.log('[x402] Getting best payment option from', accepts?.length || 0, 'options');
  
  if (!accepts || accepts.length === 0) {
    console.log('[x402] No payment options available');
    return null;
  }
  
  // Prefer Solana mainnet with exact scheme
  const solanaMainnetOption = accepts.find(opt => 
    opt.network === SOLANA_MAINNET_CAIP2 && 
    opt.scheme === 'exact'
  );
  
  if (solanaMainnetOption) {
    console.log('[x402] Found Solana mainnet option:', solanaMainnetOption);
    return solanaMainnetOption;
  }
  
  // Fallback: any Solana network (including devnet)
  const solanaOption = accepts.find(opt => 
    opt.network?.startsWith('solana:') && 
    opt.scheme === 'exact'
  );
  
  if (solanaOption) {
    console.log('[x402] Found Solana option:', solanaOption);
    return solanaOption;
  }
  
  // Last fallback: first option
  console.log('[x402] Using first available option:', accepts[0]);
  return accepts[0];
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
 * Create a USDC transfer transaction for x402 payment
 */
export async function createPaymentTransaction(
  config: X402ClientConfig,
  paymentOption: X402PaymentOption
): Promise<Transaction> {
  const { connection, publicKey } = config;
  
  console.log('[x402] Creating payment transaction for option:', paymentOption);
  
  // Parse recipient address
  const recipientPubkey = new PublicKey(paymentOption.payTo);
  
  // Get amount in micro-units (6 decimals for USDC)
  const amount = BigInt(paymentOption.amount);
  
  // Create transaction
  const transaction = new Transaction();
  
  // Check if this is USDC or native SOL payment
  const isUSDC = paymentOption.asset === USDC_MINT_STRING || 
                 paymentOption.asset === USDC_DEVNET_STRING ||
                 paymentOption.asset === 'USDC' ||
                 !paymentOption.asset; // Default to USDC
  
  if (isUSDC) {
    // Determine which USDC mint to use based on asset or network
    const usdcMint = paymentOption.asset === USDC_DEVNET_STRING || 
                     paymentOption.network?.includes('devnet') ||
                     paymentOption.network === SOLANA_DEVNET_CAIP2
      ? new PublicKey(USDC_DEVNET_STRING)
      : USDC_MINT;
    
    console.log('[x402] Using USDC mint:', usdcMint.toBase58());
    
    // USDC transfer
    const senderTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      publicKey
    );
    
    const recipientTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      recipientPubkey
    );
    
    console.log('[x402] Sender token account:', senderTokenAccount.toBase58());
    console.log('[x402] Recipient token account:', recipientTokenAccount.toBase58());
    
    transaction.add(
      createTransferInstruction(
        senderTokenAccount,
        recipientTokenAccount,
        publicKey,
        amount,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  } else {
    // Native SOL transfer (convert amount from micro-units to lamports)
    // 1 SOL = 1e9 lamports, amount is in micro-units (1e6)
    const lamports = (amount * BigInt(LAMPORTS_PER_SOL)) / BigInt(1_000_000);
    
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientPubkey,
        lamports,
      })
    );
  }
  
  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = publicKey;
  
  return transaction;
}

/**
 * Create x402 payment header from signed transaction
 * The header format is base64 encoded JSON containing the signed transaction
 */
export function createPaymentHeader(
  signedTransaction: Transaction,
  paymentOption: X402PaymentOption
): string {
  const serialized = signedTransaction.serialize();
  const base64Tx = Buffer.from(serialized).toString('base64');
  
  // Create the payment header object per x402 spec
  const paymentHeader = {
    x402Version: X402_VERSION,
    scheme: paymentOption.scheme,
    network: paymentOption.network,
    payload: {
      transaction: base64Tx,
      signature: signedTransaction.signature ? 
        bs58.encode(signedTransaction.signature) : null,
    },
  };
  
  // Encode as base64
  return btoa(JSON.stringify(paymentHeader));
}

/**
 * Execute payment and create payment header
 */
export async function executePayment(
  config: X402ClientConfig,
  paymentOption: X402PaymentOption
): Promise<PaymentResult> {
  let signature: string | undefined;
  let signedTransaction: Transaction | undefined;
  
  try {
    const { connection, signTransaction } = config;
    
    // Create the transaction
    const transaction = await createPaymentTransaction(config, paymentOption);
    
    // Sign the transaction
    signedTransaction = await signTransaction(transaction);
    
    // Send the transaction
    signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { skipPreflight: false }
    );
    
    console.log('[x402] Transaction sent with signature:', signature);
    
    // Wait for confirmation with blockhash-based confirmation (more reliable than timeout-based)
    // This uses the transaction's blockhash validity window instead of a fixed timeout
    let confirmationSuccess = false;
    
    try {
      // Use blockhash-based confirmation which is more reliable
      // It will wait until the blockhash expires (typically ~60 seconds) or transaction confirms
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: transaction.recentBlockhash!,
          lastValidBlockHeight: transaction.lastValidBlockHeight!,
        },
        'confirmed'
      );
      
      if (confirmation.value.err) {
        return {
          success: false,
          error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
        };
      }
      
      confirmationSuccess = true;
      console.log('[x402] Transaction confirmed successfully');
    } catch (confirmationError: any) {
      // Handle timeout or confirmation errors gracefully
      const errorMessage = confirmationError?.message || 'Unknown confirmation error';
      
      console.warn('[x402] Confirmation timeout or error:', errorMessage);
      
      // Check if this is a timeout error (transaction not confirmed in time)
      if (errorMessage.includes('not confirmed') || errorMessage.includes('timeout') || errorMessage.includes('30')) {
        // Transaction was sent but not confirmed within the default 30-second timeout
        // This is common during network congestion
        // Still proceed because:
        // 1. The transaction was successfully submitted to the network
        // 2. The server can verify it using the signature and getSignatureStatus
        // 3. The payment header contains the signed transaction which proves payment intent
        console.log('[x402] Confirmation timed out, but transaction was submitted successfully');
        console.log('[x402] Transaction may confirm later - server can verify using signature:', signature);
        console.log('[x402] Proceeding with payment header creation');
      } else {
        // For other errors, log but still try to proceed
        // The transaction was sent, so it might still succeed
        console.warn('[x402] Confirmation error (transaction was sent):', errorMessage);
        console.log('[x402] Proceeding with payment header - server will verify transaction status');
      }
      
      // Try a quick status check as a fallback
      try {
        const status = await connection.getSignatureStatus(signature);
        if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
          if (status.value.err) {
            return {
              success: false,
              error: `Transaction failed: ${JSON.stringify(status.value.err)}`,
            };
          }
          confirmationSuccess = true;
          console.log('[x402] Transaction confirmed via status check');
        } else {
          console.log('[x402] Transaction status:', status?.value?.confirmationStatus || 'pending');
        }
      } catch (statusError) {
        console.warn('[x402] Could not check transaction status:', statusError);
      }
    }
    
    // Create the payment header for the retry request
    // This is safe to do even if confirmation timed out because:
    // - The transaction was successfully submitted
    // - The server can verify the transaction using the signature
    // - The signed transaction in the header proves payment intent
    if (!signedTransaction) {
      return {
        success: false,
        error: 'Failed to create signed transaction',
      };
    }
    
    const paymentHeader = createPaymentHeader(signedTransaction, paymentOption);
    
    // If confirmation timed out, include a note in the success response
    // The transaction was sent and will be verified by the server
    return {
      success: true,
      signature,
      paymentHeader,
      // Include a warning if confirmation didn't complete (for user info, not an error)
      ...(confirmationSuccess ? {} : {
        warning: `Transaction submitted but confirmation timed out. Check status: https://solscan.io/tx/${signature}`,
      }),
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Payment execution failed';
    console.error('[x402] Payment execution error:', errorMessage);
    
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
  console.log('[x402] Extracting payment details from response');
  
  const option = getBestPaymentOption(x402Response);
  
  if (!option) {
    console.log('[x402] No payment option found');
    return null;
  }
  
  console.log('[x402] Payment option to extract:', option);
  
  // Validate required fields
  if (!option.payTo) {
    console.log('[x402] Missing payTo address');
    return null;
  }
  
  if (!option.amount) {
    console.log('[x402] Missing amount');
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
  
  console.log('[x402] Extracted payment details:', details);
  
  return details;
}
