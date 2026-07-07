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
    signPayment(challenge: unknown, context: {
        url: string;
        method: string;
    }): Promise<string>;
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
export declare class SyraClient {
    readonly baseUrl: string;
    private readonly signer?;
    private readonly fetchFn;
    private readonly defaultHeaders;
    private readonly maxPaymentRetries;
    constructor(options?: SyraClientOptions);
    request<T = unknown>(path: string, init?: SyraRequestInit): Promise<SyraApiResponse<T>>;
    get<T = unknown>(path: string, params?: SyraRequestInit["params"]): Promise<SyraApiResponse<T>>;
    post<T = unknown>(path: string, body?: unknown): Promise<SyraApiResponse<T>>;
    /** Five-pillar modules: earn, treasury, invest, spend, grow, pillars */
    readonly pillars: import("./pillars.js").SyraPillarModules;
}
export declare function createSyraClient(options?: SyraClientOptions): SyraClient;
export { createSyraPaidClient, createPaidFetchFromKeypair, getPaidFetch, hasPaidFetchConfigured, getPaidFetchNetworkLabel, resetPaidFetchCache, parseSolanaKeypairBytes, wrapPaidFetchWithRetries, } from "./payment/index.js";
export type { SyraPaidClientOptions, CreatePaidFetchOptions } from "./payment/index.js";
export { isSyraX402Path, SYRA_HIGH_VALUE_ROUTES, SYRA_X402_ROUTE_PREFIXES } from "./routes.js";
export type { SyraHighValueRouteId } from "./routes.js";
export { SYRA_PILLAR_IDS, SYRA_PILLAR_ROUTES, resolveSyraPillarForPath, } from "./pillars-routes.js";
export type { SyraPillarId } from "./pillars-routes.js";
export { attachPillarModules, createEarnModule, createTreasuryModule, createInvestModule, createSpendModule, createGrowModule, createPillarsModule, } from "./pillars.js";
export type { SyraPillarModules, InvestAdapterId, InvestOpportunity, GrowRecommendation, EarnSummary, PillarDiscovery, } from "./pillars.js";
