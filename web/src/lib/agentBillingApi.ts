import { resolveApiBaseUrl } from "@/lib/resolveApiBaseUrl";

export type BillingSpendWindow = {
  totalUsd: number;
  callCount: number;
  byTool: { toolId: string; totalUsd: number; count: number }[];
  daily: { date: string; totalUsd: number; count: number }[];
};

export type AgentBillingSummary = {
  anonymousId: string;
  agentAddress: string | null;
  policy: {
    dailySpendCapUsd: number;
    hourlySpendCapUsd: number;
    perTxCapUsd: number;
    allowedToolsCount: number;
    status: string;
  } | null;
  spend: {
    last7d: BillingSpendWindow;
    last30d: BillingSpendWindow;
  };
  lifetime: {
    x402VolumeUsd: number;
    totalToolCalls: number;
    totalMessages: number;
    totalChats: number;
  };
  takeRateNote: string;
  updatedAt: string;
};

export async function fetchAgentBillingSummary(
  accessToken?: string | null,
): Promise<AgentBillingSummary> {
  const base = resolveApiBaseUrl().replace(/\/$/, "");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${base}/agent/wallet/billing/summary`, {
    credentials: "include",
    headers,
  });

  const json = (await res.json()) as {
    success?: boolean;
    data?: AgentBillingSummary;
    error?: string;
  };

  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || `billing_summary_${res.status}`);
  }

  return json.data;
}
