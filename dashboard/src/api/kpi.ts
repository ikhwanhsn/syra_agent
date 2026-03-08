/**
 * Fetches KPI analytics from the Syra API (GET /analytics/kpi).
 * Requires VITE_API_BASE_URL. API key is injected by the server for trusted origins (dashboard.syraa.fun).
 */

export interface KpiInsights {
  totalRequestsLast24h: number;
  totalRequestsLast7d: number;
  totalRequestsLast30d: number;
  errorCountLast7d: number;
  errorCountLast30d: number;
  requestsByPath: { path: string; count: number; avgDurationMs: number }[];
  dailyRequests: { date: string; count: number }[];
}

export interface KpiResponse {
  totalPaidApiCalls: number;
  paidApiCallsLast7Days: number;
  paidApiCallsLast30Days: number;
  completedPaidToolCalls: number;
  chatsWithPaidToolUse: number;
  byPath: { path: string; count: number }[];
  dailyPaidCalls: { date: string; count: number }[];
  kpiTargets: {
    paidApiCalls: number;
    agentSessions: number;
  };
  insights?: KpiInsights;
  updatedAt: string;
}

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url || typeof url !== "string") {
    throw new Error("VITE_API_BASE_URL is not set");
  }
  return url.replace(/\/$/, "");
};

export async function fetchKpi(): Promise<KpiResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/analytics/kpi`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KPI request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<KpiResponse>;
}
