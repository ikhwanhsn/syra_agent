/**
 * @syra-ai/x402-payer — minimal x402 v2 HTTP client utilities.
 * Open-source top-of-funnel (BlockRun ClawRouter playbook for Syra).
 */

export interface X402PaymentRequirement {
  network?: string;
  asset?: string;
  amount?: string;
  payTo?: string;
  resource?: string;
}

export interface X402PayerOptions {
  /** Sign a payment requirement and return the payment header value. */
  signPayment: (requirement: X402PaymentRequirement) => Promise<string>;
  /** Header name — Syra uses PAYMENT-SIGNATURE; some gateways use X-Payment. */
  paymentHeader?: "PAYMENT-SIGNATURE" | "X-Payment";
  /** Max automatic retries on safe errors. */
  maxRetries?: number;
}

export interface PaidFetchResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  charged: boolean;
  retries: number;
  error?: string;
}

/** True when the response body indicates no USDC was settled (safe retry). */
export function isPaymentNotCharged(bodyText: string): boolean {
  return /payment was not charged/i.test(bodyText);
}

/** Parse x402 accepts[] from a 402 JSON body. */
export function parse402Accepts(body: unknown): X402PaymentRequirement[] {
  if (!body || typeof body !== "object") return [];
  const accepts = (body as { accepts?: unknown }).accepts;
  return Array.isArray(accepts) ? (accepts as X402PaymentRequirement[]) : [];
}

/**
 * Fetch with automatic x402 payment on HTTP 402.
 * Does not include chain-specific signing — inject via signPayment.
 */
export async function fetchWithX402Payment<T = unknown>(
  url: string,
  init: RequestInit,
  options: X402PayerOptions,
): Promise<PaidFetchResult<T>> {
  const header = options.paymentHeader ?? "PAYMENT-SIGNATURE";
  const maxRetries = options.maxRetries ?? 2;
  let retries = 0;

  const attempt = async (withPayment?: string): Promise<PaidFetchResult<T>> => {
    const headers = new Headers(init.headers);
    if (withPayment) headers.set(header, withPayment);

    const res = await fetch(url, { ...init, headers });
    const text = await res.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }

    if (res.status === 402 && !withPayment) {
      const accepts = parse402Accepts(json);
      const req = accepts[0];
      if (!req) {
        return { ok: false, status: 402, charged: false, retries, error: "no_accept_in_402" };
      }
      const sig = await options.signPayment(req);
      retries += 1;
      return attempt(sig);
    }

    if (!res.ok) {
      const safe = isPaymentNotCharged(text);
      if (safe && retries < maxRetries) {
        retries += 1;
        return attempt(withPayment);
      }
      return {
        ok: false,
        status: res.status,
        charged: !safe && res.ok,
        retries,
        error: typeof json === "object" && json && "error" in json ? String((json as { error: unknown }).error) : text.slice(0, 200),
      };
    }

    return {
      ok: true,
      status: res.status,
      data: json as T,
      charged: Boolean(withPayment),
      retries,
    };
  };

  return attempt();
}

/** Quote price in USD from micro-USDC string when present. */
export function microUsdcToUsd(micro: string | number | undefined): number | null {
  const n = Number(micro);
  if (!Number.isFinite(n)) return null;
  return n / 1_000_000;
}
