export type SyraClientLike = {
    get<T = unknown>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<{
        success: boolean;
        data?: T;
        error?: string;
    }>;
    post<T = unknown>(path: string, body?: unknown): Promise<{
        success: boolean;
        data?: T;
        error?: string;
    }>;
};
export type InvestAdapterId = "giza" | "lp_real" | "jupiter" | "rise";
export type InvestOpportunity = {
    adapter: InvestAdapterId | string;
    label: string;
    chain?: string;
    description: string;
    status: string;
    actions?: string[];
    toolId?: string;
    summary?: Record<string, unknown>;
};
export type GrowRecommendation = {
    id: string;
    type: string;
    priority: "low" | "medium" | "high";
    title: string;
    rationale: string;
    suggestedAdapter?: string;
    probabilistic: boolean;
};
export type EarnSummary = {
    wallet: string;
    creatorAnonymousId?: string | null;
    pendingMicroUsdc: number;
    paidMicroUsdc: number;
    totalMicroUsdc: number;
    pendingUsd: number;
    paidUsd: number;
    earnings: Array<{
        id: string;
        sourceType: string;
        sourceId: string;
        paidPath: string;
        creatorShareMicroUsdc: number;
        creatorShareUsd: number;
        status: string;
        payoutTxSignature?: string | null;
        createdAt?: string;
    }>;
};
export type PillarDiscovery = {
    narrative: string;
    notice: string[];
    pillars: Array<{
        id: string;
        label: string;
        tagline: string;
        order: number;
        routePrefixes: string[];
        routeCount: number;
        toolCount: number;
    }>;
};
export declare function createEarnModule(client: SyraClientLike): {
    summary(walletOrAnonymousId: string): Promise<EarnSummary>;
    payout(body?: {
        creatorAnonymousId?: string;
        maxPayoutMicroUsdc?: number;
    }): Promise<{
        success: boolean;
        data?: {
            paidMicroUsdc: number;
            paidUsd: number;
            count: number;
        } | undefined;
        error?: string;
    }>;
};
export declare function createTreasuryModule(client: SyraClientLike): {
    billingSummary(): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
    walletBalance(): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
    dashboardSummary(): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
};
export declare function createInvestModule(client: SyraClientLike): {
    opportunities(params?: {
        anonymousId?: string;
    }): Promise<{
        success: boolean;
        data?: {
            opportunities: InvestOpportunity[];
        } | undefined;
        error?: string;
    }>;
    positions(params?: {
        anonymousId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
    deploy(body: {
        adapter: InvestAdapterId;
        action?: string;
        toolId?: string;
        params?: Record<string, unknown>;
    }): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
};
export declare function createSpendModule(client: SyraClientLike): {
    /** Generic x402 route call (402 retry when signer configured on client). */
    call<T = unknown>(path: string, init?: {
        method?: "GET" | "POST";
        params?: Record<string, string | number | boolean | undefined>;
        body?: unknown;
    }): Promise<{
        success: boolean;
        data?: T | undefined;
        error?: string;
    }>;
    listTools(): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
    callTool(toolId: string, params?: Record<string, unknown>): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
    pay402(body: Record<string, unknown>): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
};
export declare function createGrowModule(client: SyraClientLike): {
    portfolio(params?: {
        address?: string;
    }): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
    recommendations(params?: {
        address?: string;
        anonymousId?: string;
    }): Promise<{
        success: boolean;
        data?: {
            recommendations: GrowRecommendation[];
        } | undefined;
        error?: string;
    }>;
    apply(body: {
        recommendationId: string;
        adapter?: string;
        action?: string;
    }): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
};
export declare function createPillarsModule(client: SyraClientLike): {
    discover(): Promise<{
        success: boolean;
        data?: PillarDiscovery | undefined;
        error?: string;
    }>;
    get(pillarId: string): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
};
export type SyraPillarModules = {
    earn: ReturnType<typeof createEarnModule>;
    treasury: ReturnType<typeof createTreasuryModule>;
    invest: ReturnType<typeof createInvestModule>;
    spend: ReturnType<typeof createSpendModule>;
    grow: ReturnType<typeof createGrowModule>;
    pillars: ReturnType<typeof createPillarsModule>;
};
export declare function attachPillarModules(client: SyraClientLike): SyraPillarModules;
