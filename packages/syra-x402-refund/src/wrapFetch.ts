export type SyraRefundMode = "relay" | "reprobe";

export type WrapFetchWithSyraRefundOptions = {
  /** Syra API origin. Default https://api.syraa.fun */
  baseUrl?: string;
  /**
   * Fetch used to call Syra (pays the coverage premium on HTTP 402).
   * Pass a paid fetch from @syra-ai/sdk/payment or @syra-ai/x402-payer.
   */
  payer?: typeof fetch;
  /** Wallet that should receive on-chain refunds. */
  refundTo?: string;
  /** Client-side host filter. Server allowlist is authoritative. */
  allowlist?: string[];
  /** Hint for premium bps: USDC value of the insured call. */
  coveredUsd?: number;
  /** Skip coverage when quoted premium would exceed this. */
  maxPremiumUsd?: number;
  mode?: SyraRefundMode;
  /** Extra predicate. Return false to pass the call to baseFetch untouched. */
  shouldCover?: (url: URL) => boolean;
};

const DEFAULT_BASE = "https://api.syraa.fun";

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (typeof Request !== "undefined" && input instanceof Request) return input.url;
  return String(input);
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return String(init.method).toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) return input.method.toUpperCase();
  return "GET";
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function hostAllowed(host: string, allowlist?: string[]): boolean {
  if (!allowlist || allowlist.length === 0) return true;
  return allowlist.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

function isSyraApiHost(host: string, baseUrl: string): boolean {
  try {
    const syraHost = new URL(baseUrl).hostname.toLowerCase();
    return host === syraHost || host.endsWith(".syraa.fun");
  } catch {
    return host.endsWith("syraa.fun");
  }
}

function headerGet(headers: Headers, name: string): string {
  return headers.get(name) || headers.get(name.toLowerCase()) || headers.get(name.toUpperCase()) || "";
}

/**
 * Route covered calls through Syra's hosted refund relay.
 * Non-covered calls pass to `baseFetch` unchanged.
 */
export function wrapFetchWithSyraRefund(
  baseFetch: typeof fetch,
  opts: WrapFetchWithSyraRefundOptions = {},
): typeof fetch {
  const baseUrl = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/$/, "");
  const payer = opts.payer ?? baseFetch;
  const mode: SyraRefundMode = opts.mode ?? "relay";

  const wrapped: typeof fetch = async (input, init) => {
    const url = requestUrl(input);
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return baseFetch(input, init);
    }
    const host = parsed.hostname.toLowerCase();
    if (!host || isSyraApiHost(host, baseUrl)) {
      return baseFetch(input, init);
    }
    if (parsed.protocol !== "https:") {
      return baseFetch(input, init);
    }
    if (!hostAllowed(host, opts.allowlist)) {
      return baseFetch(input, init);
    }
    if (opts.shouldCover && !opts.shouldCover(parsed)) {
      return baseFetch(input, init);
    }

    const method = requestMethod(input, init);

    if (mode === "reprobe") {
      const res = await baseFetch(input, init);
      void reportReprobe(payer, baseUrl, parsed.href, res, opts).catch(() => {});
      return res;
    }

    const headers = new Headers(init?.headers);
    if (typeof Request !== "undefined" && input instanceof Request) {
      input.headers.forEach((value, key) => {
        if (!headers.has(key)) headers.set(key, value);
      });
    }

    const upstreamPay =
      headerGet(headers, "PAYMENT-SIGNATURE") ||
      headerGet(headers, "X-Payment") ||
      headerGet(headers, "payment-signature");
    if (upstreamPay) {
      headers.set("X-Refund-Upstream-Payment", upstreamPay);
      headers.delete("PAYMENT-SIGNATURE");
      headers.delete("X-Payment");
      headers.delete("payment-signature");
    }

    headers.set("X-Refund-Target", parsed.href);
    headers.set("X-Refund-Method", method);
    if (opts.refundTo) headers.set("X-Refund-To", opts.refundTo);
    if (opts.coveredUsd != null) headers.set("X-Refund-Covered-Usd", String(opts.coveredUsd));
    if (opts.maxPremiumUsd != null) headers.set("X-Refund-Max-Premium-Usd", String(opts.maxPremiumUsd));
    headers.set("X-Syra-Source", headers.get("X-Syra-Source") || "sdk");

    const body = init?.body ?? (typeof Request !== "undefined" && input instanceof Request ? input.body : undefined);

    return payer(`${baseUrl}/refund/relay`, {
      method: "POST",
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : body,
    });
  };

  return wrapped;
}

async function reportReprobe(
  payer: typeof fetch,
  baseUrl: string,
  url: string,
  res: Response,
  opts: WrapFetchWithSyraRefundOptions,
): Promise<void> {
  const paymentTx =
    res.headers.get("payment-response") ||
    res.headers.get("PAYMENT-RESPONSE") ||
    res.headers.get("x-payment-response") ||
    "";
  await payer(`${baseUrl}/refund/reprobe`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Syra-Source": "sdk",
      ...(opts.refundTo ? { "X-Refund-To": opts.refundTo } : {}),
    },
    body: JSON.stringify({
      url,
      paymentTx,
      refundTo: opts.refundTo,
      coveredUsd: opts.coveredUsd,
    }),
  });
}
