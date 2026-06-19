export type SyraClientLike = {
  get<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<{ success: boolean; data?: T; error?: string }>;
  post<T = unknown>(path: string, body?: unknown): Promise<{ success: boolean; data?: T; error?: string }>;
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

function ok<T>(res: { success: boolean; data?: T; error?: string }): T {
  if (!res.success) throw new Error(res.error ?? "Request failed");
  return res.data as T;
}

export function createEarnModule(client: SyraClientLike) {
  return {
    summary(walletOrAnonymousId: string) {
      return client.get<EarnSummary>("/earn/summary", { wallet: walletOrAnonymousId }).then(ok);
    },
    payout(body?: { creatorAnonymousId?: string; maxPayoutMicroUsdc?: number }) {
      return client.post<{ paidMicroUsdc: number; paidUsd: number; count: number }>(
        "/earn/payout",
        body,
      );
    },
  };
}

export function createTreasuryModule(client: SyraClientLike) {
  return {
    billingSummary() {
      return client.get("/agent/billing/summary");
    },
    walletBalance() {
      return client.get("/agent/wallet/balance");
    },
    dashboardSummary() {
      return client.get("/dashboard-summary");
    },
  };
}

export function createInvestModule(client: SyraClientLike) {
  return {
    opportunities(params?: { anonymousId?: string }) {
      return client.get<{ opportunities: InvestOpportunity[] }>("/invest/opportunities", params);
    },
    positions(params?: { anonymousId?: string; limit?: number; offset?: number }) {
      return client.get("/invest/positions", params);
    },
    deploy(body: {
      adapter: InvestAdapterId;
      action?: string;
      toolId?: string;
      params?: Record<string, unknown>;
    }) {
      return client.post("/invest/deploy", body);
    },
  };
}

export function createSpendModule(client: SyraClientLike) {
  return {
    /** Generic x402 route call (402 retry when signer configured on client). */
    call<T = unknown>(path: string, init?: { method?: "GET" | "POST"; params?: Record<string, string | number | boolean | undefined>; body?: unknown }) {
      const method = init?.method ?? "GET";
      if (method === "POST") return client.post<T>(path, init?.body);
      return client.get<T>(path, init?.params);
    },
    listTools() {
      return client.get("/agent/tools");
    },
    callTool(toolId: string, params?: Record<string, unknown>) {
      return client.post("/agent/tools/call", { toolId, params });
    },
    pay402(body: Record<string, unknown>) {
      return client.post("/agent/wallet/pay-402", body);
    },
  };
}

export function createGrowModule(client: SyraClientLike) {
  return {
    portfolio(params?: { address?: string }) {
      return client.get("/grow/portfolio", params);
    },
    recommendations(params?: { address?: string; anonymousId?: string }) {
      return client.get<{ recommendations: GrowRecommendation[] }>("/grow/recommendations", params);
    },
    apply(body: { recommendationId: string; adapter?: string; action?: string }) {
      return client.post("/grow/apply", body);
    },
  };
}

export function createPillarsModule(client: SyraClientLike) {
  return {
    discover() {
      return client.get<PillarDiscovery>("/pillars");
    },
    get(pillarId: string) {
      return client.get(`/pillars/${pillarId}`);
    },
  };
}

export type SyraPillarModules = {
  earn: ReturnType<typeof createEarnModule>;
  treasury: ReturnType<typeof createTreasuryModule>;
  invest: ReturnType<typeof createInvestModule>;
  spend: ReturnType<typeof createSpendModule>;
  grow: ReturnType<typeof createGrowModule>;
  pillars: ReturnType<typeof createPillarsModule>;
};

export function attachPillarModules(client: SyraClientLike): SyraPillarModules {
  return {
    earn: createEarnModule(client),
    treasury: createTreasuryModule(client),
    invest: createInvestModule(client),
    spend: createSpendModule(client),
    grow: createGrowModule(client),
    pillars: createPillarsModule(client),
  };
}
