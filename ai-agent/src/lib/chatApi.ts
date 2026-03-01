export const getApiBaseUrl = () => {
  const env = import.meta.env?.VITE_API_URL;
  if (env && typeof env === "string") return env.replace(/\/$/, "");
  return "http://localhost:3000";
};

/** Headers for Syra API (X-API-Key). Set VITE_API_KEY in .env to match the API's API_KEY. */
function getApiHeaders(): Record<string, string> {
  const key = import.meta.env?.VITE_API_KEY as string | undefined;
  if (!key || typeof key !== "string") return {};
  return { "X-API-Key": key };
}

const base = () => getApiBaseUrl() + "/agent/chat";
const agentWalletBase = () => getApiBaseUrl() + "/agent/wallet";

export interface ApiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string | Date;
  toolUsage?: { name: string; status: "running" | "complete" | "error" };
}

export interface JatevoModel {
  id: string;
  name: string;
  contextWindow?: string;
  capabilities?: string[];
}

export interface ApiChat {
  id: string;
  title: string;
  preview: string;
  agentId?: string;
  systemPrompt?: string;
  modelId?: string;
  shareId: string | null;
  isPublic: boolean;
  messages?: ApiMessage[];
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
}

async function handleRes<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error || res.statusText || "Request failed");
  }
  return data as T;
}

export const chatApi = {
  /** List chats for the given anonymousId (wallet-scoped). */
  async list(anonymousId: string): Promise<{ chats: ApiChat[] }> {
    const params = new URLSearchParams({ anonymousId });
    const res = await fetch(`${base()}?${params}`, { headers: getApiHeaders() });
    return handleRes(res);
  },

  /** Get one chat (must belong to anonymousId). */
  async get(id: string, anonymousId: string): Promise<ApiChat> {
    const params = new URLSearchParams({ anonymousId });
    const res = await fetch(`${base()}/${id}?${params}`, { headers: getApiHeaders() });
    return handleRes(res);
  },

  /**
   * Get chat by share link. Pass anonymousId to detect owner (owner can always access).
   * Returns chat + isOwner when successful.
   */
  async getByShareId(
    shareId: string,
    anonymousId?: string | null
  ): Promise<
    | { success: true; chat: ApiChat; isOwner: boolean }
    | { success: false; private: true; error: string; message?: string }
    | { success: false; error: string }
  > {
    const params = new URLSearchParams();
    if (anonymousId?.trim()) params.set("anonymousId", anonymousId.trim());
    const qs = params.toString();
    const url = `${base()}/share/${encodeURIComponent(shareId)}${qs ? `?${qs}` : ""}`;
    const res = await fetch(url, { headers: getApiHeaders() });
    const data = await res.json().catch(() => ({}));
    if (res.status === 403 && (data as { private?: boolean }).private) {
      return {
        success: false,
        private: true,
        error: (data as { error?: string }).error ?? "This chat is private",
        message: (data as { message?: string }).message,
      };
    }
    if (!res.ok) {
      return { success: false, error: (data as { error?: string })?.error ?? res.statusText };
    }
    const isOwner = !!(data as { isOwner?: boolean }).isOwner;
    return { success: true, chat: data as ApiChat, isOwner };
  },

  /** List available Jatevo LLM models for agent chat. */
  async getModels(): Promise<{ models: JatevoModel[] }> {
    const res = await fetch(`${base()}/models`, { headers: getApiHeaders() });
    return handleRes(res);
  },

  /** Create a chat scoped to anonymousId (wallet/user). */
  async create(anonymousId: string, options?: {
    title?: string;
    preview?: string;
    agentId?: string;
    systemPrompt?: string;
    modelId?: string;
  }): Promise<{ chat: ApiChat }> {
    const res = await fetch(base(), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({ ...(options ?? {}), anonymousId }),
    });
    return handleRes(res);
  },

  async update(
    id: string,
    anonymousId: string,
    payload: { title?: string; preview?: string; agentId?: string; systemPrompt?: string; modelId?: string; isPublic?: boolean }
  ): Promise<{ chat: ApiChat }> {
    const res = await fetch(`${base()}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({ ...payload, anonymousId }),
    });
    return handleRes(res);
  },

  async putMessages(
    id: string,
    anonymousId: string,
    messages: ApiMessage[],
    meta?: { title?: string; preview?: string }
  ): Promise<{ messages: ApiMessage[] }> {
    const normalized = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      toolUsage: m.toolUsage,
    }));
    const body: { anonymousId: string; messages: ApiMessage[]; title?: string; preview?: string } = {
      anonymousId,
      messages: normalized,
    };
    if (meta?.title !== undefined) body.title = meta.title;
    if (meta?.preview !== undefined) body.preview = meta.preview;
    const res = await fetch(`${base()}/${id}/messages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify(body),
    });
    return handleRes(res);
  },

  async appendMessages(id: string, anonymousId: string, messages: ApiMessage[]): Promise<{ messages: ApiMessage[] }> {
    const normalized = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      toolUsage: m.toolUsage,
    }));
    const res = await fetch(`${base()}/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({ anonymousId, messages: normalized }),
    });
    return handleRes(res);
  },

  /** Delete a chat (must belong to anonymousId). */
  async delete(id: string, anonymousId: string): Promise<{ success: boolean }> {
    const params = new URLSearchParams({ anonymousId });
    const res = await fetch(`${base()}/${id}?${params}`, { method: "DELETE", headers: getApiHeaders() });
    return handleRes(res);
  },

  /** Error message thrown when 402 is received and wallet is not connected (tools/realtime require wallet). Shown as agent's answer. */
  WALLET_REQUIRED_FOR_TOOLS:
    "To use tools and realtime data, please connect your wallet first. You can keep chatting about crypto, web3, and blockchain without a wallet—connect when you need live data or tools.",

  /**
   * Get LLM completion from Jatevo. Playground-style: if completion returns 402 (tool requires payment),
   * pay with agent wallet via pay-402 then retry with payment header when walletConnected; otherwise throw WALLET_REQUIRED_FOR_TOOLS.
   */
  async completion(params: {
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    systemPrompt?: string;
    /** Jatevo model id (e.g. glm-4.7, deepseek-v3.2). Omit to use default. */
    model?: string | null;
    /** Client anonymous id; agent wallet pays x402 (pay-402 then retry) */
    anonymousId?: string | null;
    /** When false, do not attempt pay-402 on 402; throw WALLET_REQUIRED_FOR_TOOLS instead */
    walletConnected?: boolean;
    /** Agent wallet balances from client (same as dropdown); API uses these so chat matches UI */
    agentWalletBalances?: { usdcBalance: number; solBalance: number } | null;
    /** Optional: request a paid x402 v2 tool */
    toolRequest?: { toolId: string; params?: Record<string, string> } | null;
    /** Internal: payment header for retry after 402 (set by completion wrapper) */
    paymentHeader?: string | null;
  }): Promise<{ response: string }> {
    const stepStart = Date.now();
    const headers: Record<string, string> = { "Content-Type": "application/json", ...getApiHeaders() };
    if (params.paymentHeader) {
      headers["X-Payment"] = params.paymentHeader;
      headers["PAYMENT-SIGNATURE"] = params.paymentHeader;
    }
    const res = await fetch(getApiBaseUrl() + "/agent/chat/completion", {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages: params.messages,
        systemPrompt: params.systemPrompt,
        model: params.model ?? undefined,
        anonymousId: params.anonymousId ?? undefined,
        toolRequest: params.toolRequest ?? undefined,
        walletConnected: params.walletConnected,
        agentWalletBalances:
          params.agentWalletBalances &&
          typeof params.agentWalletBalances.usdcBalance === "number" &&
          typeof params.agentWalletBalances.solBalance === "number"
            ? params.agentWalletBalances
            : undefined,
      }),
    });

    if (res.status === 402) {
      const paymentRequired = await res.json().catch(() => ({}));
      const rawError = (paymentRequired as { error?: string })?.error ?? "";
      // Already retried with payment header; don't loop.
      if (params.paymentHeader) {
        const friendlyMessage =
          /Facilitator|500|Internal server error/i.test(rawError)
            ? "Payment verification is temporarily unavailable. Please try again in a moment."
            : rawError || "Payment was submitted but not yet accepted. Please try again in a moment.";
        throw new Error(friendlyMessage);
      }
      // Tools/realtime data require payment; if user has not connected wallet, ask them to connect.
      if (params.walletConnected === false) {
        throw new Error(chatApi.WALLET_REQUIRED_FOR_TOOLS);
      }
      if (
        params.anonymousId &&
        paymentRequired &&
        Array.isArray(paymentRequired.accepts) &&
        paymentRequired.accepts.length > 0
      ) {
        const { paymentHeader } = await agentWalletApi.pay402(
          params.anonymousId,
          paymentRequired
        );
        return chatApi.completion({
          ...params,
          paymentHeader,
        });
      }
      throw new Error(
        (paymentRequired as { error?: string })?.error || "Payment required (402)"
      );
    }

    const data = await handleRes<{
      success: boolean;
      response: string;
      amountChargedUsd?: number;
      toolUsages?: Array<{ name: string; status: "running" | "complete" | "error" }>;
    }>(res);
    return {
      response: data.response ?? "",
      ...(typeof data.amountChargedUsd === "number" && data.amountChargedUsd > 0
        ? { amountChargedUsd: data.amountChargedUsd }
        : {}),
      ...(Array.isArray(data.toolUsages) && data.toolUsages.length > 0
        ? { toolUsages: data.toolUsages }
        : {}),
    };
  },
};

/** Agent wallet API: get/create agent wallet by anonymousId or by connected wallet. Private key stored on server for permissionless x402. */
export const agentWalletApi = {
  /** Get or create agent wallet by connected wallet address and chain (checks database first). */
  async getOrCreateByWallet(
    walletAddress: string,
    chain: "solana" | "base" = "solana"
  ): Promise<{
    anonymousId: string;
    agentAddress: string;
    avatarUrl?: string | null;
    isNewWallet?: boolean;
    fundingSuccess?: boolean;
    fundingError?: string;
    fundingPending?: boolean;
    chain?: "solana" | "base";
  }> {
    const res = await fetch(`${agentWalletBase()}/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({ walletAddress, chain }),
    });
    const data = await handleRes<{
      success: boolean;
      anonymousId: string;
      agentAddress: string;
      avatarUrl?: string | null;
      isNewWallet?: boolean;
      fundingSuccess?: boolean;
      fundingError?: string;
      fundingPending?: boolean;
      chain?: "solana" | "base";
    }>(res);
    return {
      anonymousId: data.anonymousId,
      agentAddress: data.agentAddress,
      avatarUrl: data.avatarUrl ?? null,
      isNewWallet: data.isNewWallet,
      fundingSuccess: data.fundingSuccess,
      fundingError: data.fundingError,
      fundingPending: data.fundingPending,
      chain: data.chain,
    };
  },

  /** Get or create agent wallet. Pass existing anonymousId or omit to get a new one. Returns anonymousId + agentAddress + avatarUrl. */
  async getOrCreate(anonymousId?: string | null): Promise<{
    anonymousId: string;
    agentAddress: string;
    avatarUrl?: string | null;
    isNewWallet?: boolean;
    fundingSuccess?: boolean;
    fundingError?: string;
    fundingPending?: boolean;
  }> {
    const res = await fetch(agentWalletBase(), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify(anonymousId ? { anonymousId } : {}),
    });
    const data = await handleRes<{
      success: boolean;
      anonymousId: string;
      agentAddress: string;
      avatarUrl?: string | null;
      isNewWallet?: boolean;
      fundingSuccess?: boolean;
      fundingError?: string;
      fundingPending?: boolean;
    }>(res);
    return {
      anonymousId: data.anonymousId,
      agentAddress: data.agentAddress,
      avatarUrl: data.avatarUrl ?? null,
      isNewWallet: data.isNewWallet,
      fundingSuccess: data.fundingSuccess,
      fundingError: data.fundingError,
      fundingPending: data.fundingPending,
    };
  },

  /** Get agent wallet address by anonymousId (404 if not created yet). */
  async get(anonymousId: string): Promise<{ agentAddress: string; avatarUrl?: string | null }> {
    const res = await fetch(`${agentWalletBase()}/${encodeURIComponent(anonymousId)}`, { headers: getApiHeaders() });
    return handleRes(res);
  },

  /** Get agent wallet SOL and USDC balance. */
  async getBalance(anonymousId: string): Promise<{
    agentAddress: string;
    solBalance: number;
    usdcBalance: number;
  }> {
    const res = await fetch(
      `${agentWalletBase()}/${encodeURIComponent(anonymousId)}/balance`,
      { headers: getApiHeaders() },
    );
    return handleRes(res);
  },

  /**
   * Pay for a 402 response using the agent wallet (playground-style).
   * Backend signs with agent keypair and returns payment header for client to retry the request.
   */
  async pay402(
    anonymousId: string,
    paymentRequired: { accepts: unknown[]; x402Version?: number; [k: string]: unknown }
  ): Promise<{ paymentHeader: string; signature?: string }> {
    const res = await fetch(`${agentWalletBase()}/pay-402`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({ anonymousId, paymentRequired }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string })?.error || res.statusText || "Payment failed");
    }
    return data as { paymentHeader: string; signature?: string };
  },

  /** Update user avatar with a base64 image data URL. */
  async updateAvatar(anonymousId: string, avatarDataUrl: string): Promise<{ success: boolean; avatarUrl: string }> {
    const res = await fetch(`${agentWalletBase()}/${encodeURIComponent(anonymousId)}/avatar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({ avatarUrl: avatarDataUrl }),
    });
    return handleRes(res);
  },

  /** Generate a new random avatar for the user. */
  async generateAvatar(anonymousId: string): Promise<{ success: boolean; avatarUrl: string }> {
    const res = await fetch(`${agentWalletBase()}/${encodeURIComponent(anonymousId)}/avatar/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
    });
    return handleRes(res);
  },
};

/** Agent marketplace preferences API: favorites, recent, call counts (stored in DB by anonymousId). */
const agentMarketplaceBase = () => getApiBaseUrl() + "/agent/marketplace";

/** User-created prompts (marketplace). Stored in MongoDB; users can create and others can use. */
const agentMarketplacePromptsBase = () => getApiBaseUrl() + "/agent/marketplace/prompts";

export interface UserPromptItem {
  id: string;
  anonymousId: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  useCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export const userPromptsApi = {
  /** List all user-created prompts (for discovery). */
  async list(params?: { category?: string; limit?: number; skip?: number }): Promise<{ prompts: UserPromptItem[] }> {
    const search = new URLSearchParams();
    if (params?.category) search.set("category", params.category);
    if (params?.limit != null) search.set("limit", String(params.limit));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    const res = await fetch(`${agentMarketplacePromptsBase()}${qs ? `?${qs}` : ""}`, { headers: getApiHeaders() });
    const data = await handleRes<{ success: boolean; prompts: UserPromptItem[] }>(res);
    return { prompts: data.prompts ?? [] };
  },

  /** Create a user prompt. */
  async create(anonymousId: string, payload: { title: string; description?: string; prompt: string; category?: string }): Promise<{ prompt: UserPromptItem }> {
    const res = await fetch(agentMarketplacePromptsBase(), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({ anonymousId, ...payload }),
    });
    return handleRes(res);
  },

  /** Get one user prompt by id. */
  async get(id: string): Promise<{ prompt: UserPromptItem }> {
    const res = await fetch(`${agentMarketplacePromptsBase()}/${encodeURIComponent(id)}`, { headers: getApiHeaders() });
    return handleRes(res);
  },

  /** Update own prompt (anonymousId must match creator). */
  async update(id: string, anonymousId: string, payload: { title?: string; description?: string; prompt?: string; category?: string }): Promise<{ prompt: UserPromptItem }> {
    const res = await fetch(`${agentMarketplacePromptsBase()}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({ anonymousId, ...payload }),
    });
    return handleRes(res);
  },

  /** Delete own prompt (anonymousId must match creator). */
  async delete(id: string, anonymousId: string): Promise<{ success: boolean }> {
    const params = new URLSearchParams({ anonymousId });
    const res = await fetch(`${agentMarketplacePromptsBase()}/${encodeURIComponent(id)}?${params}`, { method: "DELETE", headers: getApiHeaders() });
    return handleRes(res);
  },

  /** Bulk delete own prompts (only those owned by anonymousId). */
  async bulkDelete(anonymousId: string, ids: string[]): Promise<{ deleted: number }> {
    const res = await fetch(`${agentMarketplacePromptsBase()}/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({ anonymousId, ids }),
    });
    const data = await handleRes<{ success: boolean; deleted: number }>(res);
    return { deleted: data.deleted ?? 0 };
  },

  /** Record that this prompt was used (increments useCount on server). */
  async recordUse(id: string): Promise<{ useCount: number }> {
    const res = await fetch(`${agentMarketplacePromptsBase()}/${encodeURIComponent(id)}/use`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({}),
    });
    return handleRes(res);
  },
};

export interface MarketplacePreferencesData {
  favorites: string[];
  recent: Array<{ id: string; title: string; prompt: string }>;
  callCounts: Record<string, number>;
}

export const marketplaceApi = {
  /** Get preferences for the user (anonymousId). */
  async get(anonymousId: string): Promise<MarketplacePreferencesData> {
    const res = await fetch(
      `${agentMarketplaceBase()}/${encodeURIComponent(anonymousId)}`,
      { headers: getApiHeaders() },
    );
    const data = await handleRes<{
      success: boolean;
      favorites: string[];
      recent: Array<{ id: string; title: string; prompt: string }>;
      callCounts: Record<string, number>;
    }>(res);
    return {
      favorites: data.favorites ?? [],
      recent: data.recent ?? [],
      callCounts: data.callCounts ?? {},
    };
  },

  /** Update preferences (merge: only provided fields are updated). */
  async put(
    anonymousId: string,
    payload: Partial<MarketplacePreferencesData>
  ): Promise<MarketplacePreferencesData> {
    const res = await fetch(
      `${agentMarketplaceBase()}/${encodeURIComponent(anonymousId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getApiHeaders() },
        body: JSON.stringify(payload),
      },
    );
    const data = await handleRes<{
      success: boolean;
      favorites: string[];
      recent: Array<{ id: string; title: string; prompt: string }>;
      callCounts: Record<string, number>;
    }>(res);
    return {
      favorites: data.favorites ?? [],
      recent: data.recent ?? [],
      callCounts: data.callCounts ?? {},
    };
  },
};

/** Agent tools API: list x402 v2 resources and call them (balance checked first; pay with agent wallet). Nansen tools call the real Nansen API (api.nansen.ai) directly. */
const agentToolsBase = () => getApiBaseUrl() + "/agent/tools";

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  path: string;
  method: string;
}

export const agentToolsApi = {
  /** List available x402 v2 tools (id, name, description, priceUsd). */
  async list(): Promise<{ tools: AgentTool[] }> {
    const res = await fetch(agentToolsBase(), { headers: getApiHeaders() });
    const data = await handleRes<{ success: boolean; tools: AgentTool[] }>(res);
    return { tools: data.tools ?? [] };
  },

  /**
   * Call an x402 v2 tool using the agent wallet. Balance is checked first.
   * If balance is 0 or lower than price, returns insufficientBalance and message; otherwise pays and returns data.
   */
  async call(params: {
    anonymousId: string;
    toolId: string;
    params?: Record<string, string>;
  }): Promise<
    | { success: true; toolId: string; data: unknown }
    | {
        success: false;
        insufficientBalance?: boolean;
        usdcBalance?: number;
        requiredUsdc?: number;
        message?: string;
        error?: string;
      }
  > {
    const res = await fetch(agentToolsBase() + "/call", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getApiHeaders() },
      body: JSON.stringify({
        anonymousId: params.anonymousId,
        toolId: params.toolId,
        params: params.params ?? {},
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        insufficientBalance: data.insufficientBalance,
        usdcBalance: data.usdcBalance,
        requiredUsdc: data.requiredUsdc,
        message: data.message,
        error: data.error ?? res.statusText,
      };
    }
    return data as { success: true; toolId: string; data: unknown };
  },
};

/** Agent chat leaderboard: users ranked by messages/chats/tools/volume/recent. */
const agentLeaderboardBase = () => getApiBaseUrl() + "/agent/leaderboard";

export interface AgentLeaderboardEntry {
  rank: number;
  anonymousId: string;
  totalMessages: number;
  totalChats: number;
  totalToolCalls: number;
  x402VolumeUsd: number;
  lastActiveAt: string;
}

export const agentLeaderboardApi = {
  /** Get leaderboard with sort, order, pagination (limit, skip). Returns total for pagination. */
  async get(params?: {
    sort?: "messages" | "chats" | "recent" | "tools" | "volume";
    order?: "asc" | "desc";
    limit?: number;
    skip?: number;
  }): Promise<{
    leaderboard: AgentLeaderboardEntry[];
    sort: string;
    order: "asc" | "desc";
    total: number;
    limit: number;
    skip: number;
  }> {
    const search = new URLSearchParams();
    if (params?.sort) search.set("sort", params.sort);
    if (params?.order) search.set("order", params.order);
    if (params?.limit != null) search.set("limit", String(params.limit));
    if (params?.skip != null) search.set("skip", String(params.skip));
    const qs = search.toString();
    const res = await fetch(`${agentLeaderboardBase()}${qs ? `?${qs}` : ""}`, { headers: getApiHeaders() });
    return handleRes(res);
  },
};
