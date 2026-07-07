import { attachPillarModules } from "./pillars.js";

export type SyraApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type SyraPaymentSigner = {
  /**
   * Given a 402 response body (x402 JSON), return the PAYMENT-SIGNATURE header value
   * for the retried request. Implement with @x402/svm or your agent wallet.
   */
  signPayment(challenge: unknown, context: { url: string; method: string }): Promise<string>;
};

export type SyraClientOptions = {
  baseUrl?: string;
  signer?: SyraPaymentSigner;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
  maxPaymentRetries?: number;
};

export type SyraRequestInit = {
  method?: "GET" | "POST";
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};

const DEFAULT_BASE = "https://api.syraa.fun";

function buildUrl(base: string, path: string, params?: SyraRequestInit["params"]): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalized, base.endsWith("/") ? base : `${base}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function parseJsonSafe(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export class SyraClient {
  readonly baseUrl: string;
  private readonly signer?: SyraPaymentSigner;
  private readonly fetchFn: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;
  private readonly maxPaymentRetries: number;

  constructor(options: SyraClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE).replace(/\/$/, "");
    this.signer = options.signer;
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.defaultHeaders = { Accept: "application/json", ...options.headers };
    this.maxPaymentRetries = options.maxPaymentRetries ?? 1;
  }

  async request<T = unknown>(path: string, init: SyraRequestInit = {}): Promise<SyraApiResponse<T>> {
    const method = init.method ?? "GET";
    const url = buildUrl(this.baseUrl, path, method === "GET" ? init.params : undefined);
    const headers: Record<string, string> = { ...this.defaultHeaders, ...init.headers };

    let body: string | undefined;
    if (method === "POST" && init.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(init.body);
    }

    let res = await this.fetchFn(url, { method, headers, body });

    if (res.status === 402 && this.signer) {
      const challengeText = await res.text();
      const challenge = parseJsonSafe(challengeText);
      for (let attempt = 0; attempt < this.maxPaymentRetries; attempt++) {
        const paymentHeader = await this.signer.signPayment(challenge, { url, method });
        const paidHeaders = { ...headers, "PAYMENT-SIGNATURE": paymentHeader };
        res = await this.fetchFn(url, { method, headers: paidHeaders, body });
        if (res.status !== 402) break;
      }
    }

    const text = await res.text();
    const parsed = parseJsonSafe(text);

    if (!res.ok) {
      const error =
        typeof parsed === "object" && parsed !== null && "error" in parsed
          ? String((parsed as { error: unknown }).error)
          : `HTTP ${res.status}`;
      return { success: false, error };
    }

    if (typeof parsed === "object" && parsed !== null && "success" in parsed) {
      return parsed as SyraApiResponse<T>;
    }

    return { success: true, data: parsed as T };
  }

  get<T = unknown>(path: string, params?: SyraRequestInit["params"]): Promise<SyraApiResponse<T>> {
    return this.request<T>(path, { method: "GET", params });
  }

  post<T = unknown>(path: string, body?: unknown): Promise<SyraApiResponse<T>> {
    return this.request<T>(path, { method: "POST", body });
  }

  /** Five-pillar modules: earn, treasury, invest, spend, grow, pillars */
  readonly pillars = attachPillarModules(this);
}

export function createSyraClient(options?: SyraClientOptions): SyraClient {
  return new SyraClient(options);
}

export {
  createSyraPaidClient,
  createPaidFetchFromKeypair,
  getPaidFetch,
  hasPaidFetchConfigured,
  getPaidFetchNetworkLabel,
  resetPaidFetchCache,
  parseSolanaKeypairBytes,
  wrapPaidFetchWithRetries,
} from "./payment/index.js";
export type { SyraPaidClientOptions, CreatePaidFetchOptions } from "./payment/index.js";

export { isSyraX402Path, SYRA_HIGH_VALUE_ROUTES, SYRA_X402_ROUTE_PREFIXES } from "./routes.js";
export type { SyraHighValueRouteId } from "./routes.js";
export {
  SYRA_PILLAR_IDS,
  SYRA_PILLAR_ROUTES,
  resolveSyraPillarForPath,
} from "./pillars-routes.js";
export type { SyraPillarId } from "./pillars-routes.js";
export {
  attachPillarModules,
  createEarnModule,
  createTreasuryModule,
  createInvestModule,
  createSpendModule,
  createGrowModule,
  createPillarsModule,
} from "./pillars.js";
export type {
  SyraPillarModules,
  InvestAdapterId,
  InvestOpportunity,
  GrowRecommendation,
  EarnSummary,
  PillarDiscovery,
} from "./pillars.js";
