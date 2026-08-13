import { syraFetch } from "@/lib/agentAuthApi";
import { getApiBaseUrl } from "@/lib/env";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/earn/llm`;

export type LlmPricingMode = "per_million_tokens" | "flat";

export type LlmProviderStatus = "draft" | "active" | "paused" | "delisted";

export type LlmProtocol = "openai" | "anthropic" | "google" | "openai_custom";

export type LlmAuthConfig = {
  chatPath?: string;
  authHeader?: string;
  authScheme?: string;
  apiVersion?: string;
  extraHeaders?: Record<string, string>;
};

export type LlmProviderRecord = {
  id: string;
  creatorAnonymousId: string;
  slug: string;
  title: string;
  description: string;
  protocol: LlmProtocol;
  baseUrl: string | null;
  authConfig?: LlmAuthConfig;
  hasApiKey: boolean;
  models: Array<{ id: string; displayName: string }>;
  pricing: {
    mode: LlmPricingMode;
    inputUsdPer1M: number;
    outputUsdPer1M: number;
    flatUsdPerCall: number;
  };
  callerPriceHintUsd: number | null;
  capabilities: {
    contextWindow: number;
    streaming: boolean;
    tools: boolean;
    modalities: string[];
  };
  payoutWallet: string | null;
  payToChain: "solana";
  status: LlmProviderStatus;
  isSystemFallback: boolean;
  featured: boolean;
  health: {
    successRate: number;
    p50LatencyMs: number | null;
    p95LatencyMs: number | null;
    consecutiveFailures: number;
    lastProbeAt: string | null;
    lastSuccessAt: string | null;
    callabilityScore: number;
  };
  useCount: number;
  totalRevenueUsd?: number;
  totalSellerEarnedUsd?: number;
  createdAt?: string;
  updatedAt?: string;
};

export function llmProtocolLabel(protocol: LlmProtocol | string | undefined): string {
  switch (protocol) {
    case "anthropic":
      return "Claude";
    case "google":
      return "Gemini";
    case "openai_custom":
      return "Custom";
    case "openai":
    default:
      return "OpenAI";
  }
}

export type LlmEarningsSummary = {
  pendingUsd: number;
  paidUsd: number;
  totalUsd: number;
  pendingMicroUsdc: number;
  paidMicroUsdc: number;
  earnings: Array<{
    id: string;
    providerId: string;
    paidPath: string;
    sellerShareUsd: number;
    platformFeeUsd: number;
    status: string;
    modelId: string | null;
    routePolicy: string | null;
    payoutTxSignature: string | null;
    createdAt?: string;
    paidAt?: string | null;
  }>;
};

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string };

async function parseJson<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiEnvelope<T> & { error?: string };
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }
  if (json.data === undefined) {
    throw new Error("Missing response data");
  }
  return json.data;
}

export type CreateLlmProviderPayload = {
  title: string;
  description?: string;
  protocol?: LlmProtocol;
  baseUrl?: string;
  authConfig?: LlmAuthConfig;
  apiKey: string;
  models: Array<string | { id: string; displayName?: string }>;
  pricing: {
    mode: LlmPricingMode;
    inputUsdPer1M?: number;
    outputUsdPer1M?: number;
    flatUsdPerCall?: number;
  };
  capabilities?: {
    contextWindow?: number;
    streaming?: boolean;
    tools?: boolean;
    modalities?: string[];
  };
  slug?: string;
  activate?: boolean;
};

export type UpdateLlmProviderPayload = Partial<
  Omit<CreateLlmProviderPayload, "apiKey" | "activate"> & {
    apiKey?: string;
    payoutWallet?: string;
  }
>;

export async function fetchMyLlmProviders(): Promise<LlmProviderRecord[]> {
  const res = await syraFetch(`${base()}/mine`);
  return parseJson<LlmProviderRecord[]>(res);
}

export async function fetchLlmMarketplace(params?: {
  q?: string;
  limit?: number;
  skip?: number;
}): Promise<LlmProviderRecord[]> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.skip != null) search.set("skip", String(params.skip));
  const qs = search.toString();
  const res = await fetch(`${base()}/marketplace${qs ? `?${qs}` : ""}`, {
    headers: { Accept: "application/json" },
  });
  return parseJson<LlmProviderRecord[]>(res);
}

export async function createLlmProvider(
  payload: CreateLlmProviderPayload,
): Promise<LlmProviderRecord> {
  const res = await syraFetch(base(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<LlmProviderRecord>(res);
}

export async function updateLlmProvider(
  id: string,
  payload: UpdateLlmProviderPayload,
): Promise<LlmProviderRecord> {
  const res = await syraFetch(`${base()}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<LlmProviderRecord>(res);
}

export async function activateLlmProvider(id: string): Promise<LlmProviderRecord> {
  const res = await syraFetch(`${base()}/${encodeURIComponent(id)}/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  return parseJson<LlmProviderRecord>(res);
}

export async function pauseLlmProvider(id: string): Promise<LlmProviderRecord> {
  const res = await syraFetch(`${base()}/${encodeURIComponent(id)}/pause`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  return parseJson<LlmProviderRecord>(res);
}

export async function deleteLlmProvider(id: string, hard = false): Promise<void> {
  const url = `${base()}/${encodeURIComponent(id)}${hard ? "?hard=1" : ""}`;
  const res = await syraFetch(url, { method: "DELETE" });
  const json = (await res.json()) as ApiEnvelope<unknown>;
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }
}

export async function testLlmConnection(payload: {
  baseUrl?: string;
  apiKey?: string;
  modelId?: string;
  providerId?: string;
  protocol?: LlmProtocol;
  authConfig?: LlmAuthConfig;
}): Promise<{
  ok: boolean;
  status?: number;
  latencyMs?: number;
  error?: string;
  modelId?: string;
}> {
  const res = await syraFetch(`${base()}/test-connection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as ApiEnvelope<{
    ok: boolean;
    status?: number;
    latencyMs?: number;
    error?: string;
    modelId?: string;
  }> & { success: boolean; data?: { ok: boolean; error?: string } };
  if (!res.ok) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }
  return json.data ?? { ok: Boolean(json.success), error: json.error };
}

export async function fetchLlmEarnings(): Promise<LlmEarningsSummary> {
  const res = await syraFetch(`${base()}/earnings`);
  return parseJson<LlmEarningsSummary>(res);
}

export async function claimLlmPayout(maxPayoutUsd?: number): Promise<{
  success: boolean;
  claimedUsd?: number;
  count?: number;
  payoutWallet?: string | null;
  note?: string;
  error?: string;
}> {
  const res = await syraFetch(`${base()}/payouts/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(maxPayoutUsd != null ? { maxPayoutUsd } : {}),
  });
  return (await res.json()) as {
    success: boolean;
    claimedUsd?: number;
    count?: number;
    payoutWallet?: string | null;
    note?: string;
    error?: string;
  };
}

export function llmRoutePlaygroundSnippet(opts?: {
  policy?: string;
  model?: string;
  apiBase?: string;
}): string {
  const api = (opts?.apiBase || getApiBaseUrl()).replace(/\/$/, "");
  const policy = opts?.policy || "cheapest";
  const modelLine = opts?.model ? `\n    "model": ${JSON.stringify(opts.model)},` : "";
  return `curl -sS ${api}/llm/route \\
  -H "Content-Type: application/json" \\
  -H "X-Syra-Route: ${policy}" \\
  -d '{
    "messages": [{"role":"user","content":"Hello from Syra LLM Exchange"}],${modelLine}
    "max_tokens": 64
  }'
# First response is HTTP 402 with payment requirements.
# Retry with PAYMENT-SIGNATURE after settling x402.`;
}
