import { getApiBaseUrl } from "@/lib/env";

export interface JupiterTokenInfo {
  id: string;
  symbol: string;
  name: string;
  icon: string | null;
  decimals: number;
  isVerified: boolean;
  usdPrice: number | null;
}

export interface JupiterReferralMeta {
  referralAccount: string | null;
  configuredPlatformFeeBps: number;
  platformFeeBps: number;
  feeAccount: string | null;
  applied: boolean;
}

export interface JupiterRoutePlanStep {
  swapInfo?: {
    label?: string;
    ammKey?: string;
    inputMint?: string;
    outputMint?: string;
    inAmount?: string;
    outAmount?: string;
    feeAmount?: string;
    feeMint?: string;
  };
  percent?: number;
}

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan?: JupiterRoutePlanStep[];
  platformFee?: {
    amount?: string;
    feeBps?: number;
  } | null;
}

export interface JupiterQuoteResponse {
  quote: JupiterQuote;
  referral: JupiterReferralMeta;
  computedAt: string;
}

export interface JupiterSwapBuildResponse {
  swapTransaction: string;
  lastValidBlockHeight: number | null;
  referral: JupiterReferralMeta;
  computedAt: string;
}

export interface JupiterTokenSearchResponse {
  tokens: JupiterTokenInfo[];
  source: string;
  computedAt: string;
}

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Build Jupiter UI path without `new URL()` — works with relative `/api` dev proxy bases. */
function jupiterUiUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const segment = path.startsWith("/") ? path : `/${path}`;
  const full = `${base}/jupiter/ui${segment}`;
  if (!query) return full;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null && String(value) !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${full}?${qs}` : full;
}

async function parseApiResult<T>(res: Response): Promise<ApiResult<T>> {
  const body = (await res.json().catch(() => ({}))) as ApiResult<T> & { error?: string };
  if (!res.ok || body.success === false) {
    return {
      success: false,
      error: body.error ?? `Request failed (${res.status})`,
    };
  }
  if (body.success && "data" in body && body.data != null) {
    return { success: true, data: body.data as T };
  }
  return { success: false, error: "Invalid API response" };
}

export async function getJupiterQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
}): Promise<ApiResult<JupiterQuoteResponse>> {
  const url = jupiterUiUrl("/quote", {
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageBps: params.slippageBps,
  });
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return parseApiResult<JupiterQuoteResponse>(res);
}

export async function buildJupiterSwap(params: {
  quoteResponse: JupiterQuote;
  userPublicKey: string;
}): Promise<ApiResult<JupiterSwapBuildResponse>> {
  const res = await fetch(jupiterUiUrl("/swap"), {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
    }),
  });
  return parseApiResult<JupiterSwapBuildResponse>(res);
}

export async function searchJupiterTokens(
  query?: string,
): Promise<ApiResult<JupiterTokenSearchResponse>> {
  const url = jupiterUiUrl("/tokens", query?.trim() ? { query: query.trim() } : undefined);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return parseApiResult<JupiterTokenSearchResponse>(res);
}

/** Convert raw base units to human-readable amount. */
export function baseUnitsToHuman(raw: string, decimals: number): number {
  const n = BigInt(raw);
  const divisor = 10n ** BigInt(decimals);
  const whole = n / divisor;
  const frac = n % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return Number(`${whole}${fracStr ? `.${fracStr}` : ""}`);
}

/** Format token amount for display. */
export function formatSwapAmount(value: number, maxDecimals = 6): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1_000_000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
  if (value >= 0.0001) return value.toFixed(Math.min(maxDecimals, 6));
  return value.toExponential(2);
}

/** Extract route labels from Jupiter quote. */
export function routeLabelsFromQuote(quote: JupiterQuote | null | undefined): string[] {
  if (!quote?.routePlan?.length) return [];
  const labels = quote.routePlan
    .map((step) => step.swapInfo?.label?.trim())
    .filter((l): l is string => Boolean(l));
  return [...new Set(labels)];
}
