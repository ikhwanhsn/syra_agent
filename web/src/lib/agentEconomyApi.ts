import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/chatApi";

export interface AgentEconomySummary {
  success: boolean;
  source: string;
  license?: string;
  note?: string;
  upstream?: {
    onChain: string;
    offChain: string;
    site: string;
  };
  updatedAt?: {
    onChain: string | null;
    offChain: string | null;
  };
  x402: {
    totalTxs: number | null;
    totalVolumeUsd: number | null;
    facilitatorsTracked: number | null;
    chainsTracked: number | null;
  };
  erc8004: {
    totalAgents: number | null;
    chainsTracked: number | null;
  };
  x402Services: {
    uniqueProviders: number | null;
    totalListings: number | null;
  };
  agentSupply?: {
    officialMcpServers: number | null;
  };
  devAdoption?: {
    totalWeeklyAvg4w: number | null;
  };
  computedAt?: string;
}

const summaryUrl = () => `${getApiBaseUrl().replace(/\/$/, "")}/agent-economy/summary`;

const CLIENT_FETCH_TIMEOUT_MS = 15_000;

export function fetchAgentEconomySummary(signal?: AbortSignal): Promise<AgentEconomySummary> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_FETCH_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  return fetch(summaryUrl(), {
    headers: { Accept: "application/json" },
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Agent economy API ${res.status}`);
      return res.json() as Promise<AgentEconomySummary>;
    })
    .catch((err) => {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Agent economy timed out. Retry in a moment.");
      }
      throw err;
    })
    .finally(() => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    });
}

export function useAgentEconomySummary() {
  return useQuery({
    queryKey: ["agent-economy-summary"],
    queryFn: ({ signal }) => fetchAgentEconomySummary(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
