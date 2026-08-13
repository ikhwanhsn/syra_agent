import {PublicKey, type Connection, type VersionedTransaction} from '@solana/web3.js';
import {getApiBaseUrl} from './env';
import {headersToRecord} from './api';
import {
  executePayment,
  getBestPaymentOption,
  parseX402Response,
  formatPaymentAmount,
  type X402Response,
} from './x402Client';
import {appendSpendRecord} from './spendHistory';

export type PaidFetchResult<T = unknown> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  chargedUsd?: string;
  signature?: string;
  x402?: X402Response | null;
};

export type PaidFetchDeps = {
  publicKey: PublicKey;
  connection: Connection;
  /** MWA partial sign (do not submit). */
  signTransactions: (
    txs: VersionedTransaction[],
  ) => Promise<VersionedTransaction[]>;
  label: string;
};

/**
 * Fetch a paid Syra endpoint: free attempt → 402 → MWA sign → retry with PAYMENT-SIGNATURE.
 */
export async function fetchPaidJson<T = unknown>(
  path: string,
  deps: PaidFetchDeps,
  query?: Record<string, string>,
): Promise<PaidFetchResult<T>> {
  const base = getApiBaseUrl();
  const qs = query
    ? `?${Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')}`
    : '';
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}${qs}`;
  const payer = deps.publicKey.toBase58();

  const first = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Payer-Address': payer,
      'X-Connected-Wallet': payer,
    },
  });

  const firstText = await first.text();
  let firstJson: any = null;
  try {
    firstJson = firstText ? JSON.parse(firstText) : null;
  } catch {
    firstJson = null;
  }

  if (first.status !== 402) {
    if (first.ok) {
      return {ok: true, status: first.status, data: firstJson as T, chargedUsd: '0'};
    }
    return {
      ok: false,
      status: first.status,
      error: firstJson?.error || firstText || `HTTP ${first.status}`,
    };
  }

  const x402 = parseX402Response(firstJson, headersToRecord(first.headers));
  if (!x402) {
    return {ok: false, status: 402, error: 'Unrecognized 402 payment challenge', x402};
  }
  const option = getBestPaymentOption(x402);
  if (!option) {
    return {
      ok: false,
      status: 402,
      error: 'No Solana USDC payment option in 402 response',
      x402,
    };
  }

  const resourceUrl =
    (typeof x402.resource === 'object' && x402.resource?.url) || url;
  const pay = await executePayment({
    connection: deps.connection,
    publicKey: deps.publicKey,
    paymentOption: option,
    signTransactions: deps.signTransactions,
    resourceUrl,
    resourceFrom402:
      typeof x402.resource === 'object' ? x402.resource : {url: resourceUrl},
  });

  if (!pay.success || !pay.paymentHeader) {
    await appendSpendRecord({
      path,
      label: deps.label,
      amountUsd: formatPaymentAmount(option.amount),
      ok: false,
      error: pay.error,
    });
    return {
      ok: false,
      status: 402,
      error: pay.error || 'Payment signing failed',
      x402,
      chargedUsd: formatPaymentAmount(option.amount),
    };
  }

  const retry = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Payer-Address': payer,
      'X-Connected-Wallet': payer,
      'PAYMENT-SIGNATURE': pay.paymentHeader,
    },
  });
  const retryText = await retry.text();
  let retryJson: any = null;
  try {
    retryJson = retryText ? JSON.parse(retryText) : null;
  } catch {
    retryJson = null;
  }

  const chargedUsd = formatPaymentAmount(option.amount);
  if (!retry.ok) {
    await appendSpendRecord({
      path,
      label: deps.label,
      amountUsd: chargedUsd,
      signature: pay.signature,
      ok: false,
      error: retryJson?.error || retryText || `HTTP ${retry.status}`,
    });
    return {
      ok: false,
      status: retry.status,
      error: retryJson?.error || retryText || `Paid retry failed (${retry.status})`,
      x402,
      chargedUsd,
      signature: pay.signature,
    };
  }

  await appendSpendRecord({
    path,
    label: deps.label,
    amountUsd: chargedUsd,
    signature: pay.signature,
    ok: true,
  });

  return {
    ok: true,
    status: retry.status,
    data: retryJson as T,
    chargedUsd,
    signature: pay.signature,
    x402,
  };
}

/** Catalog prices (production) for UI confirm copy. */
export const PAID_PRICES_USD = {
  news: 0.005,
  sentiment: 0.005,
  signal: 0.005,
  scout: 0.005,
  rugcheck: 0.005,
  analyticsSummary: 0.022,
  smartMoney: 0.06,
  trending: 0.001,
} as const;
