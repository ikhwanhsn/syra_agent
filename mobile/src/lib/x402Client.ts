/**
 * Solana x402 v2 client for React Native + Mobile Wallet Adapter.
 * Ported from web/src/lib/x402Client.ts (Solana path only).
 *
 * Flow: 402 → build v0 USDC transferChecked (feePayer = facilitator) →
 * MWA signTransactions (partial, do NOT send) → PAYMENT-SIGNATURE → retry.
 */
import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  type TransactionInstruction,
} from '@solana/web3.js';
import {
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getMint,
  getAccount,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';
import {Buffer} from 'buffer';
import {SOLANA_MAINNET_CAIP2, USDC_MINT, getSolanaRpcUrl} from './env';

const USDC_MINT_PK = new PublicKey(USDC_MINT);
const X402_VERSION = 2;
const X402_COMPUTE_UNIT_PRICE_MICROLAMPORTS = 1;
const X402_COMPUTE_UNIT_LIMIT = 8_000;

export type X402ResourceInfo = {
  url: string;
  description?: string;
  mimeType?: string;
};

export type X402PaymentOption = {
  scheme: string;
  network: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset?: string;
  owner?: string;
  extra?: Record<string, any>;
  _raw?: Record<string, unknown>;
  price?: {asset?: string; amount?: string};
};

export type X402Response = {
  x402Version: number;
  accepts: X402PaymentOption[];
  resource?: X402ResourceInfo;
  error?: string;
  extensions?: Record<string, unknown>;
  _rawV1Accepts?: any[];
};

export type PaymentResult = {
  success: boolean;
  signature?: string;
  paymentHeader?: string;
  error?: string;
};

function base64EncodeUnicode(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64');
}

function pickAmountFromObject(obj: any): string {
  if (obj == null || typeof obj !== 'object') return '0';
  const priceVal =
    typeof obj.price === 'object' && obj.price != null ? obj.price.amount : obj.price;
  const candidates = [
    obj.maxAmountRequired,
    obj.amount,
    obj.amountRequired,
    obj.requiredAmount,
    priceVal,
  ].filter(v => v !== undefined && v !== null && v !== '');
  for (const v of candidates) {
    const s = String(v).trim();
    if (s && s !== '0') return s;
  }
  return '0';
}

export function parseX402Version(raw: unknown): 1 | 2 | null {
  if (raw === 1 || raw === 2) return raw;
  if (typeof raw === 'string' && (raw.trim() === '1' || raw.trim() === '2')) {
    return Number(raw.trim()) as 1 | 2;
  }
  return null;
}

function normalizePaymentOption(
  raw: X402PaymentOption & {price?: {asset?: string; amount?: string}},
): X402PaymentOption {
  const amount =
    pickAmountFromObject(raw) !== '0'
      ? pickAmountFromObject(raw)
      : String(raw.price?.amount ?? raw.amount ?? '0');
  const asset = raw.price?.asset ?? raw.asset ?? USDC_MINT;
  const payTo =
    raw.payTo ||
    (raw as any).recipient ||
    (raw as any).paymentAddress ||
    (raw as any).address ||
    '';
  const owner = raw.owner ?? raw.extra?.owner;
  let network = String(raw.network || SOLANA_MAINNET_CAIP2);
  if (network === 'solana') network = SOLANA_MAINNET_CAIP2;
  return {
    scheme: raw.scheme || 'exact',
    network,
    payTo,
    amount,
    asset,
    maxTimeoutSeconds: raw.maxTimeoutSeconds ?? 60,
    ...(owner ? {owner: String(owner)} : {}),
    ...(raw.extra && typeof raw.extra === 'object' ? {extra: raw.extra} : {}),
    _raw: {...(raw as Record<string, unknown>)},
  };
}

export function parseX402Response(
  data: any,
  responseHeaders?: Record<string, string>,
): X402Response | null {
  const version = data ? parseX402Version(data.x402Version) : null;
  if (data && version !== null) {
    const rawAccepts = data.accepts || [];
    let accepts = rawAccepts.map((a: any) => normalizePaymentOption(a));
    if (accepts.length > 0) {
      const first = accepts[0];
      const topAmount = pickAmountFromObject(data);
      const topPayTo = data.payTo ?? data.recipient ?? data.address;
      accepts = [
        {
          ...first,
          ...((!first.amount || first.amount === '0') && topAmount !== '0'
            ? {amount: topAmount}
            : {}),
          ...(first.payTo === '' && topPayTo ? {payTo: String(topPayTo)} : {}),
        },
        ...accepts.slice(1),
      ];
    }
    return {
      x402Version: version,
      accepts,
      resource: data.resource,
      error: data.error,
      extensions: data.extensions,
      ...(version === 1 && rawAccepts.length ? {_rawV1Accepts: rawAccepts} : {}),
    };
  }

  if (responseHeaders) {
    const header =
      responseHeaders['Payment-Required'] ||
      responseHeaders['payment-required'] ||
      responseHeaders['PAYMENT-REQUIRED'];
    if (header) {
      try {
        const decoded = JSON.parse(
          Buffer.from(header, 'base64').toString('utf8'),
        );
        const rawAccepts = Array.isArray(decoded) ? decoded : decoded?.accepts;
        const v = parseX402Version(decoded?.x402Version) ?? 2;
        if (rawAccepts?.length) {
          return {
            x402Version: v,
            accepts: rawAccepts.map((a: any) => normalizePaymentOption(a)),
            resource: decoded?.resource,
          };
        }
      } catch {
        // ignore
      }
    }
  }
  return null;
}

export function isSolanaNetwork(opt: X402PaymentOption): boolean {
  const n = String(opt?.network || '').trim().toLowerCase();
  if (!n || n.includes('devnet') || n.includes('testnet')) return false;
  return n === 'solana' || n.startsWith('solana:') || n === SOLANA_MAINNET_CAIP2.toLowerCase();
}

export function getBestPaymentOption(
  x402Response: X402Response,
): X402PaymentOption | null {
  const accepts = x402Response?.accepts || [];
  if (!accepts.length) return null;
  const normalized = accepts.map(a => normalizePaymentOption(a));
  return (
    normalized.find(o => isSolanaNetwork(o) && o.scheme === 'exact') ||
    normalized.find(o => isSolanaNetwork(o)) ||
    null
  );
}

export function formatPaymentAmount(amount: string, decimals = 6): string {
  try {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const intPart = value / divisor;
    const decPart = value % divisor;
    if (decPart === BigInt(0)) return intPart.toString();
    const decStr = decPart
      .toString()
      .padStart(decimals, '0')
      .replace(/0+$/, '');
    return `${intPart}.${decStr}`;
  } catch {
    return amount;
  }
}

function parseAmountToSmallestUnits(amountStr: string, decimals = 6): bigint {
  const s = String(amountStr).trim();
  if (s.includes('.')) {
    const [whole = '0', frac = ''] = s.split('.');
    const padded = frac.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole || '0') * BigInt(10 ** decimals) + BigInt(padded || '0');
  }
  return BigInt(s || '0');
}

export async function createPaymentTransaction(
  connection: Connection,
  publicKey: PublicKey,
  paymentOption: X402PaymentOption,
): Promise<VersionedTransaction> {
  const recipientPubkey = new PublicKey(paymentOption.payTo);
  const amount = parseAmountToSmallestUnits(paymentOption.amount, 6);
  if (amount <= BigInt(0)) {
    throw new Error(
      `Invalid payment amount: "${paymentOption.amount}". Expected micro-USDC.`,
    );
  }

  const feePayerStr = paymentOption.extra?.feePayer as string | undefined;
  const feePayerKey = feePayerStr ? new PublicKey(feePayerStr) : publicKey;

  let programId = TOKEN_PROGRAM_ID;
  try {
    const mintInfo = await connection.getAccountInfo(USDC_MINT_PK, 'confirmed');
    if (mintInfo?.owner?.equals(TOKEN_2022_PROGRAM_ID)) {
      programId = TOKEN_2022_PROGRAM_ID;
    }
  } catch {
    // keep default
  }

  const mint = await getMint(connection, USDC_MINT_PK, 'confirmed', programId);
  const sourceAta = await getAssociatedTokenAddress(
    USDC_MINT_PK,
    publicKey,
    false,
    programId,
  );

  let destAta: PublicKey;
  let ownerForAta: PublicKey | null = null;
  const payToIsOffCurve = !PublicKey.isOnCurve(recipientPubkey.toBytes());
  const ownerStr = paymentOption.owner ?? paymentOption.extra?.owner;

  if (payToIsOffCurve) {
    destAta = recipientPubkey;
  } else {
    destAta = await getAssociatedTokenAddress(
      USDC_MINT_PK,
      recipientPubkey,
      false,
      programId,
    );
    ownerForAta = recipientPubkey;
  }

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitLimit({units: X402_COMPUTE_UNIT_LIMIT}),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: X402_COMPUTE_UNIT_PRICE_MICROLAMPORTS,
    }),
  ];

  try {
    await getAccount(connection, destAta, 'confirmed');
  } catch {
    if (payToIsOffCurve && ownerStr) {
      const ownerPubkey = new PublicKey(ownerStr);
      destAta = await getAssociatedTokenAddress(
        USDC_MINT_PK,
        ownerPubkey,
        false,
        programId,
      );
      ownerForAta = ownerPubkey;
    }
    if (!ownerForAta) {
      throw new Error(
        'Recipient token account does not exist and no owner was provided.',
      );
    }
    instructions.push(
      createAssociatedTokenAccountInstruction(
        publicKey,
        destAta,
        ownerForAta,
        USDC_MINT_PK,
        programId,
      ),
    );
  }

  instructions.push(
    createTransferCheckedInstruction(
      sourceAta,
      USDC_MINT_PK,
      destAta,
      publicKey,
      amount,
      mint.decimals,
      [],
      programId,
    ),
  );

  const {blockhash} = await connection.getLatestBlockhash('confirmed');
  const message = new TransactionMessage({
    payerKey: feePayerKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  return new VersionedTransaction(message);
}

function resolveResourceForPayload(
  resourceUrl?: string,
  resourceFrom402?: X402ResourceInfo,
): X402ResourceInfo | undefined {
  const url = (resourceFrom402?.url?.trim() || resourceUrl?.trim()) || '';
  if (!url) return undefined;
  const rawDesc = resourceFrom402?.description?.trim();
  const description =
    rawDesc &&
    rawDesc.toLowerCase() !== url.toLowerCase() &&
    !/^https?:\/\//i.test(rawDesc)
      ? rawDesc
      : undefined;
  return {
    url,
    ...(description ? {description} : {}),
    ...(resourceFrom402?.mimeType ? {mimeType: resourceFrom402.mimeType} : {}),
  };
}

function normalizeAcceptedForHeader(
  option: X402PaymentOption,
): Record<string, unknown> {
  const amount = String(option.price?.amount ?? option.amount ?? '0');
  const asset = option.price?.asset ?? option.asset ?? USDC_MINT;
  const raw = option._raw ?? {};
  const accepted: Record<string, unknown> = {
    ...raw,
    scheme: option.scheme || 'exact',
    network: option.network,
    payTo: option.payTo,
    asset,
    amount,
    maxTimeoutSeconds: option.maxTimeoutSeconds ?? 60,
    ...(option.extra && typeof option.extra === 'object'
      ? {extra: option.extra}
      : {}),
  };
  delete accepted._raw;
  delete accepted.resource;
  return accepted;
}

export function createPaymentHeader(
  signedTransaction: VersionedTransaction,
  paymentOption: X402PaymentOption,
  resourceUrl?: string,
  resourceFrom402?: X402ResourceInfo,
): string {
  const serialized = signedTransaction.serialize();
  const base64Tx = Buffer.from(serialized).toString('base64');
  const accepted = normalizeAcceptedForHeader(paymentOption);
  const resource = resolveResourceForPayload(resourceUrl, resourceFrom402);
  const sig = signedTransaction.signatures[0];
  const signatureB58 =
    sig && sig.length === 64 ? bs58.encode(Buffer.from(sig)) : null;

  const paymentPayload: Record<string, unknown> = {
    x402Version: X402_VERSION,
    accepted,
    payload: {
      transaction: base64Tx,
      signature: signatureB58,
    },
  };
  if (resource?.url) paymentPayload.resource = resource;

  return base64EncodeUnicode(JSON.stringify(paymentPayload));
}

export type SignTransactionsFn = (
  txs: VersionedTransaction[],
) => Promise<VersionedTransaction[]>;

export async function executePayment(params: {
  connection?: Connection;
  publicKey: PublicKey;
  paymentOption: X402PaymentOption;
  signTransactions: SignTransactionsFn;
  resourceUrl?: string;
  resourceFrom402?: X402ResourceInfo;
}): Promise<PaymentResult> {
  try {
    const connection =
      params.connection ||
      new Connection(getSolanaRpcUrl(), {commitment: 'confirmed'});
    const transaction = await createPaymentTransaction(
      connection,
      params.publicKey,
      params.paymentOption,
    );
    const [signed] = await params.signTransactions([transaction]);
    if (!signed) {
      return {success: false, error: 'Wallet did not return a signed transaction'};
    }
    const sig = signed.signatures[0];
    const signatureB58 =
      sig && sig.length === 64 ? bs58.encode(Buffer.from(sig)) : undefined;
    const paymentHeader = createPaymentHeader(
      signed,
      params.paymentOption,
      params.resourceUrl,
      params.resourceFrom402,
    );
    return {success: true, signature: signatureB58, paymentHeader};
  } catch (error: any) {
    return {
      success: false,
      error: error?.message ?? 'Payment execution failed',
    };
  }
}

export function extractPaymentDetails(option: X402PaymentOption): {
  amount: string;
  token: string;
  recipient: string;
  network: string;
  feePayer?: string;
} {
  return {
    amount: formatPaymentAmount(String(option.amount ?? '0')),
    token: 'USDC',
    recipient: option.payTo,
    network: option.network,
    feePayer: option.extra?.feePayer as string | undefined,
  };
}
