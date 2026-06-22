import { resolveApiBaseUrl } from "@/lib/resolveApiBaseUrl";

export type DailyCount = { date: string; count: number };

export type AnalyticsKpi = {
  totalPaidApiCalls: number;
  paidApiCallsLast7Days: number;
  paidApiCallsLast30Days: number;
  completedPaidToolCalls: number;
  chatsWithPaidToolUse: number;
  byPath: { path: string; count: number }[];
  dailyPaidCalls: DailyCount[];
  kpiTargets: { paidApiCalls: number; agentSessions: number };
  insights: {
    totalRequestsLast24h: number;
    totalRequestsLast7d: number;
    totalRequestsLast30d: number;
    errorCountLast7d: number;
    errorCountLast30d: number;
    requestsByPath: { path: string; count: number; avgDurationMs: number }[];
    dailyRequests: DailyCount[];
  };
  updatedAt: string;
};

export type AnalyticsKpiExtended = {
  revenue: {
    bySource: { source: string; count: number }[];
    dailyBySource: { date: string; source: string; count: number }[];
    byPathAndSource: { path: string; source: string; count: number }[];
    hourlyToday: { hour: string; count: number }[];
    paidPrev30d: number;
    paidCurr30d: number;
    growthPct: number;
  };
  users: {
    totalChats: number;
    chatsLast7d: number;
    chatsLast30d: number;
    uniqueUsersTotal: number;
    uniqueUsersLast7d: number;
    uniqueUsersLast30d: number;
    avgMessagesPerChat: number;
    totalMessages: number;
    maxMessagesInChat: number;
    dailyNewChats: DailyCount[];
    dailyActiveUsers: DailyCount[];
    topAgents: { agentId: string; count: number }[];
    toolUsage: {
      name: string;
      total: number;
      completed: number;
      errors: number;
      successRate: number;
    }[];
  };
  playground: {
    totalShares: number;
    sharesLast7d: number;
    sharesLast30d: number;
    byChain: { chain: string; count: number }[];
    dailyShares: DailyCount[];
  };
  health: {
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    errorRateByEndpoint: {
      path: string;
      total: number;
      errors: number;
      errorRate: number;
      avgDuration: number;
    }[];
    statusCodeDistribution: { status: string; count: number }[];
    dailyErrorRate: { date: string; total: number; errors: number; errorRate: number }[];
    slowestEndpoints: {
      path: string;
      avgDuration: number;
      maxDuration: number;
      count: number;
    }[];
  };
  conversion: {
    totalRequests30d: number;
    paidRequests30d: number;
    conversionRate: number;
  };
  updatedAt: string;
};

async function fetchJson<T>(path: string): Promise<T> {
  const base = resolveApiBaseUrl().replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`analytics_${path}_${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchAnalyticsKpi(): Promise<AnalyticsKpi> {
  return fetchJson<AnalyticsKpi>("/analytics/kpi");
}

export function fetchAnalyticsKpiExtended(): Promise<AnalyticsKpiExtended> {
  return fetchJson<AnalyticsKpiExtended>("/analytics/kpi-extended");
}

export type InternalAnalyticsBundle = {
  kpi: AnalyticsKpi;
  extended: AnalyticsKpiExtended;
};

export async function fetchInternalAnalyticsBundle(): Promise<InternalAnalyticsBundle> {
  const [kpi, extended] = await Promise.all([
    fetchAnalyticsKpi(),
    fetchAnalyticsKpiExtended(),
  ]);
  return { kpi, extended };
}

export type X402Analytics = {
  summary: {
    totalCalls: number;
    callsLast7d: number;
    callsLast30d: number;
    paidCalls: number;
    paidCallsLast7d: number;
    paidCallsLast30d: number;
    failuresLast7d: number;
    failuresLast30d: number;
    successRate: number;
    totalUsdVolume: number;
    usdVolumeLast7d: number;
    usdVolumeLast30d: number;
    uniquePayers: number;
    inboundCalls: number;
    outboundCalls: number;
    growthPct: number;
    conversionRate: number;
  };
  funnel: {
    paymentRequired: number;
    verifyFailed: number;
    settleFailed: number;
    paid: number;
    conversionRate: number;
  };
  topEndpoints: {
    path: string;
    direction: string;
    calls: number;
    paidCalls: number;
    errors: number;
    errorRate: number;
    successUsd: number;
    avgLatencyMs: number;
  }[];
  byNetwork: {
    network: string;
    calls: number;
    paidCalls: number;
    successRate: number;
    successUsd: number;
  }[];
  byFacilitator: {
    facilitator: string;
    calls: number;
    paidCalls: number;
    successRate: number;
    successUsd: number;
  }[];
  errors: {
    recent: {
      path: string;
      host: string | null;
      direction: string;
      outcome: string;
      httpStatus: number | null;
      network: string | null;
      facilitator: string | null;
      errorReason: string | null;
      agentId: string | null;
      createdAt: string;
    }[];
    byReason: { reason: string; count: number }[];
  };
  needsImprovement: {
    highestErrorRate: {
      path: string;
      total: number;
      errors: number;
      errorRate: number;
      avgLatencyMs: number;
    }[];
    slowestEndpoints: {
      path: string;
      avgLatencyMs: number;
      maxLatencyMs: number;
      count: number;
    }[];
  };
  daily: {
    date: string;
    calls: number;
    paidCalls: number;
    errors: number;
    errorRate: number;
    usdVolume: number;
  }[];
  updatedAt: string;
};

export function fetchX402Analytics(): Promise<X402Analytics> {
  return fetchJson<X402Analytics>("/analytics/x402");
}
