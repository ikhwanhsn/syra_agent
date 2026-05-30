/**
 * 8004 Trustless Agent Registry API client for the AI agent marketplace.
 * All /8004 routes use API key (X-API-Key or Authorization: Bearer), not x402.
 */
import { getApiBaseUrl } from "./chatApi";

function apiBase(): string {
  const base = getApiBaseUrl();
  return `${base}/8004`;
}

/** API injects auth for trusted origins (agent.syraa.fun); do not embed keys in client. */
function getHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

export class AgentApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "AgentApiError";
    this.code = code;
  }
}

async function handleRes<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const payload = data as { error?: string; code?: string };
    const msg = payload?.error || res.statusText || "Request failed";
    throw new AgentApiError(msg, payload?.code);
  }
  return data as T;
}

export interface Agent8004SearchResult {
  agents?: Array<{
    asset?: string;
    owner?: string;
    agentWallet?: string;
    agent_uri?: string;
    [key: string]: unknown;
  }>;
  total?: number;
}

export interface Agent8004LeaderboardEntry {
  asset?: string;
  owner?: string;
  tier?: number;
  [key: string]: unknown;
}

export interface Agent8004Detail {
  asset: string;
  owner: string | null;
  agentWallet: string | null;
  agent_uri: string | null;
  col_locked?: boolean | null;
  parent_locked?: boolean | null;
  /** Set when RPC is restricted (e.g. 403); only asset is reliable. */
  _rpcUnavailable?: boolean;
}

export interface LivenessReport {
  alive?: boolean;
  mcp?: { reachable?: boolean; [key: string]: unknown };
  a2a?: { reachable?: boolean; [key: string]: unknown };
  [key: string]: unknown;
}

/** Status from 8004-solana verifyIntegrity: valid | syncing | corrupted | error */
export interface IntegrityResult {
  valid?: boolean;
  /** 'valid' | 'syncing' | 'corrupted' | 'error' */
  status?: string;
  /** When status is not valid, may contain message and recommendation */
  error?: { message?: string; recommendation?: string };
  /** When status is 'syncing', true if lag is small and data is still trustworthy */
  trustworthy?: boolean;
  [key: string]: unknown;
}

export interface RegisterAgentPayload {
  name: string;
  description: string;
  image?: string;
  services?: Array<{ type: string; value: string }>;
  skills?: string[];
  domains?: string[];
  x402Support?: boolean;
  /** Optional. If omitted and API has SYRA_COLLECTION_POINTER set, Syra collection is used. */
  collectionPointer?: string;
  /** When set, backend uses this user's Solana agent wallet to sign (agent owned by them, no browser popup). */
  anonymousId?: string;
  /** User wallet (base58). When set with agentAssetPubkey, API returns serialized tx for client to sign. */
  feePayer?: string;
  /** New agent mint pubkey (base58). Must be provided with feePayer for user-signed registration. */
  agentAssetPubkey?: string;
}

/** Server-signed response (backend sends the tx). */
export interface RegisterAgentResponse {
  asset: string;
  registerSignature: string;
  tokenUri: string;
  setCollectionSignature?: string;
}

/** Prepared transaction for client to sign (base64 serialized). */
export interface PreparedTransaction {
  transaction: string;
  blockhash: string;
  lastValidBlockHeight: number;
  signer: string;
}

/** User-signed response (API returns serialized tx; client signs and submits). */
export interface RegisterAgentResponseUserSigned {
  asset: string;
  tokenUri: string;
  registerTransaction: PreparedTransaction;
  setCollectionTransaction?: PreparedTransaction;
}

export const agent8004Api = {
  /** Get Syra collection pointer (dev only). Use for listing agents in Syra collection. */
  async getSyraCollectionPointer(): Promise<string | null> {
    const res = await fetch(`${apiBase()}/syra-collection`, { method: "GET", headers: getHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    return (data as { syraCollectionPointer?: string | null }).syraCollectionPointer ?? null;
  },

  /** List agents created by this user (from MongoDB). Used by "Your Agents" tab. Max 3 per user. */
  async getMyAgents(anonymousId: string): Promise<{ agents: Array<{ asset: string; name: string; description?: string; image?: string | null; createdAt?: string }>; total: number }> {
    const q = new URLSearchParams({ anonymousId });
    const res = await fetch(`${apiBase()}/my-agents?${q}`, { headers: getHeaders() });
    return handleRes(res);
  },

  /** Search agents (optional collection = c1:... or collection address). */
  async search(params: { collection?: string; owner?: string; creator?: string; limit?: number; offset?: number }): Promise<Agent8004SearchResult> {
    const q = new URLSearchParams();
    if (params.collection) q.set("collection", params.collection);
    if (params.owner) q.set("owner", params.owner);
    if (params.creator) q.set("creator", params.creator);
    if (params.limit != null) q.set("limit", String(params.limit));
    if (params.offset != null) q.set("offset", String(params.offset));
    const res = await fetch(`${apiBase()}/agents/search?${q}`, { headers: getHeaders() });
    return handleRes(res);
  },

  /** Leaderboard (optional collection, minTier, limit). */
  async leaderboard(params?: { collection?: string; minTier?: number; limit?: number }): Promise<{ entries?: Agent8004LeaderboardEntry[] }> {
    const q = new URLSearchParams();
    if (params?.collection) q.set("collection", params.collection);
    if (params?.minTier != null) q.set("minTier", String(params.minTier));
    if (params?.limit != null) q.set("limit", String(params.limit));
    const res = await fetch(`${apiBase()}/leaderboard?${q}`, { headers: getHeaders() });
    return handleRes(res);
  },

  /** Get single agent by asset (base58). */
  async getAgent(asset: string): Promise<Agent8004Detail> {
    const res = await fetch(`${apiBase()}/agent/${encodeURIComponent(asset)}`, { headers: getHeaders() });
    return handleRes(res);
  },

  /** Get agent registration metadata (name, description, image) from agent_uri for display. */
  async getAgentRegistrationMetadata(asset: string): Promise<{ name: string | null; description: string | null; image: string | null }> {
    const res = await fetch(`${apiBase()}/agent/${encodeURIComponent(asset)}/registration-metadata`, { headers: getHeaders() });
    return handleRes(res);
  },

  /** Resolve 8004market detail URL (token ID) for an asset. Used when list item has no agent_id (e.g. Your Agents). */
  async get8004MarketUrl(asset: string): Promise<{ tokenId: string; url: string }> {
    const res = await fetch(`${apiBase()}/agent/${encodeURIComponent(asset)}/8004market-url`, { headers: getHeaders() });
    return handleRes(res);
  },

  /** Liveness check for an agent. */
  async liveness(asset: string, timeoutMs?: number): Promise<LivenessReport> {
    const q = timeoutMs != null ? `?timeoutMs=${timeoutMs}` : "";
    const res = await fetch(`${apiBase()}/agent/${encodeURIComponent(asset)}/liveness${q}`, { headers: getHeaders() });
    return handleRes(res);
  },

  /** Integrity check for an agent. */
  async integrity(asset: string): Promise<IntegrityResult> {
    const res = await fetch(`${apiBase()}/agent/${encodeURIComponent(asset)}/integrity`, { headers: getHeaders() });
    return handleRes(res);
  },

  /** Register a new agent and optionally attach to collection (e.g. Syra). Uses marketplace route when anonymousId is set so the backend pays x402 from the user's agent wallet (no payment popup). */
  async registerAgent(
    payload: RegisterAgentPayload
  ): Promise<RegisterAgentResponse | RegisterAgentResponseUserSigned> {
    const base = getApiBaseUrl();
    const url =
      payload.anonymousId && payload.anonymousId.trim()
        ? `${base}/agent/marketplace/register-agent`
        : `${apiBase()}/register-agent`;
    const res = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleRes(res);
  },

  /** Global stats (total agents, etc.). */
  async stats(): Promise<{ totalAgents?: number; [key: string]: unknown }> {
    const res = await fetch(`${apiBase()}/stats`, { headers: getHeaders() });
    return handleRes(res);
  },
};
