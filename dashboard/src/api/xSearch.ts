/**
 * X (Twitter) API — live search via Syra API /x/search/recent (x402).
 * Uses dashboard wallet to pay; requires connection + signTransaction.
 */

import type { Connection } from "@solana/web3.js";
import type { PublicKey } from "@solana/web3.js";
import type { Transaction } from "@solana/web3.js";
import {
  parseX402Response,
  getBestPaymentOption,
  executePayment,
  type X402Response,
} from "../lib/x402Client";

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url || typeof url !== "string") throw new Error("VITE_API_BASE_URL is not set");
  return url.replace(/\/$/, "");
};

export interface XSearchPaymentConfig {
  connection: Connection;
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}

/** Tweet shape from X API /x/search/recent */
export interface XTweet {
  id: string;
  text: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface XSearchRecentResult {
  data?: XTweet[];
  errors?: Array<{ message?: string }>;
}

/** Timeout for each API fetch (ms). Prevents indefinite hang. */
const FETCH_TIMEOUT_MS = 45_000;

/**
 * Call GET /x/search/recent. On 402, parse payment, execute with wallet, retry with PAYMENT-SIGNATURE.
 * Uses timeouts so the request cannot hang indefinitely.
 */
export async function fetchXSearchRecent(
  query: string,
  maxResults: number,
  config: XSearchPaymentConfig
): Promise<XSearchRecentResult> {
  const base = getBaseUrl();
  const url = `${base}/x/search/recent?${new URLSearchParams({
    query: query.trim(),
    max_results: String(Math.min(100, Math.max(10, maxResults))),
  })}`;

  const first = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (first.status === 200) {
    return (await first.json()) as XSearchRecentResult;
  }

  if (first.status !== 402) {
    const text = await first.text();
    let err: string;
    try {
      const j = JSON.parse(text);
      err = j.error || j.message || text;
    } catch {
      err = text;
    }
    throw new Error(err || `X search failed: ${first.status}`);
  }

  const body = await first.text();
  const headers: Record<string, string> = {};
  first.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error("Invalid 402 response body");
  }

  const x402 = parseX402Response(data, headers);
  if (!x402?.accepts?.length) {
    throw new Error("Payment required (402). No payment options in response.");
  }

  const option = getBestPaymentOption(x402 as X402Response, "solana");
  if (!option) {
    throw new Error("Payment required (402). No supported payment option.");
  }

  const result = await executePayment(
    {
      connection: config.connection,
      publicKey: config.publicKey,
      signTransaction: config.signTransaction,
    },
    option,
    (x402 as X402Response & { _rawV1Accepts?: unknown[] })._rawV1Accepts?.[0] as Record<string, unknown> | undefined
  );

  if (!result.success || !result.paymentHeader) {
    throw new Error(result.error || "Payment failed");
  }

  const paymentHeaderName =
    (x402 as X402Response).x402Version === 1 ? "X-PAYMENT" : "PAYMENT-SIGNATURE";

  const retry = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      [paymentHeaderName]: result.paymentHeader,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!retry.ok) {
    const text = await retry.text();
    let err: string;
    try {
      const j = JSON.parse(text);
      err = j.error || j.message || text;
    } catch {
      err = text;
    }
    throw new Error(err || `X search after payment failed: ${retry.status}`);
  }

  return (await retry.json()) as XSearchRecentResult;
}

/**
 * Format X API tweet list as markdown for the research panel.
 */
export function formatTweetsAsMarkdown(result: XSearchRecentResult): string {
  const tweets = result.data ?? [];
  if (tweets.length === 0) {
    return result.errors?.length
      ? `No tweets found. ${result.errors.map((e) => e.message ?? "").join(" ")}`.trim()
      : "No recent tweets match this query.";
  }
  return tweets
    .map((t) => {
      const date = t.created_at ? `**${t.created_at}** — ` : "";
      return `- ${date}${(t.text ?? "").replace(/\n/g, " ")}`;
    })
    .join("\n\n");
}
