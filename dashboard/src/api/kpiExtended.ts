/**
 * Fetches extended KPI analytics from GET /analytics/kpi-extended.
 * Returns revenue, users, engagement, playground, and system health metrics.
 */

export interface RevenueBySource {
  source: string;
  count: number;
}

export interface DailyBySource {
  date: string;
  source: string;
  count: number;
}

export interface PathBySource {
  path: string;
  source: string;
  count: number;
}

export interface HourlyCount {
  hour: string;
  count: number;
}

export interface RevenueData {
  bySource: RevenueBySource[];
  dailyBySource: DailyBySource[];
  byPathAndSource: PathBySource[];
  hourlyToday: HourlyCount[];
  paidPrev30d: number;
  paidCurr30d: number;
  growthPct: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface TopAgent {
  agentId: string;
  count: number;
}

export interface ToolUsageStat {
  name: string;
  total: number;
  completed: number;
  errors: number;
  successRate: number;
}

export interface UsersData {
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
  topAgents: TopAgent[];
  toolUsage: ToolUsageStat[];
}

export interface PlaygroundData {
  totalShares: number;
  sharesLast7d: number;
  sharesLast30d: number;
  byChain: { chain: string; count: number }[];
  dailyShares: DailyCount[];
}

export interface EndpointErrorRate {
  path: string;
  total: number;
  errors: number;
  errorRate: number;
  avgDuration: number;
}

export interface StatusCodeDist {
  status: string;
  count: number;
}

export interface DailyErrorRate {
  date: string;
  total: number;
  errors: number;
  errorRate: number;
}

export interface SlowestEndpoint {
  path: string;
  avgDuration: number;
  maxDuration: number;
  count: number;
}

export interface HealthData {
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRateByEndpoint: EndpointErrorRate[];
  statusCodeDistribution: StatusCodeDist[];
  dailyErrorRate: DailyErrorRate[];
  slowestEndpoints: SlowestEndpoint[];
}

export interface ConversionData {
  totalRequests30d: number;
  paidRequests30d: number;
  conversionRate: number;
}

export interface KpiExtendedResponse {
  revenue: RevenueData;
  users: UsersData;
  playground: PlaygroundData;
  health: HealthData;
  conversion: ConversionData;
  updatedAt: string;
}

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url || typeof url !== "string") {
    throw new Error("VITE_API_BASE_URL is not set");
  }
  return url.replace(/\/$/, "");
};

export async function fetchKpiExtended(): Promise<KpiExtendedResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/analytics/kpi-extended`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KPI extended request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<KpiExtendedResponse>;
}
