export const getApiBaseUrl = () => {
  const env = import.meta.env?.VITE_API_URL;
  if (env && typeof env === "string") return env.replace(/\/$/, "");
  return "http://localhost:3000";
};

const base = () => getApiBaseUrl() + "/agent/chat";
const agentWalletBase = () => getApiBaseUrl() + "/agent/wallet";

export interface ApiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string | Date;
  toolUsage?: { name: string; status: "running" | "complete" | "error" };
}

export interface ApiChat {
  id: string;
  title: string;
  preview: string;
  agentId?: string;
  systemPrompt?: string;
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
    const res = await fetch(`${base()}?${params}`);
    return handleRes(res);
  },

  /** Get one chat (must belong to anonymousId). */
  async get(id: string, anonymousId: string): Promise<ApiChat> {
    const params = new URLSearchParams({ anonymousId });
    const res = await fetch(`${base()}/${id}?${params}`);
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
    const res = await fetch(url);
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

  /** Create a chat scoped to anonymousId (wallet/user). */
  async create(anonymousId: string, options?: {
    title?: string;
    preview?: string;
    agentId?: string;
    systemPrompt?: string;
  }): Promise<{ chat: ApiChat }> {
    const res = await fetch(base(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(options ?? {}), anonymousId }),
    });
    return handleRes(res);
  },

  async update(
    id: string,
    anonymousId: string,
    payload: { title?: string; preview?: string; agentId?: string; systemPrompt?: string; isPublic?: boolean }
  ): Promise<{ chat: ApiChat }> {
    const res = await fetch(`${base()}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousId, messages: normalized }),
    });
    return handleRes(res);
  },

  /** Delete a chat (must belong to anonymousId). */
  async delete(id: string, anonymousId: string): Promise<{ success: boolean }> {
    const params = new URLSearchParams({ anonymousId });
    const res = await fetch(`${base()}/${id}?${params}`, { method: "DELETE" });
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
    /** Client anonymous id; agent wallet pays x402 (pay-402 then retry) */
    anonymousId?: string | null;
    /** When false, do not attempt pay-402 on 402; throw WALLET_REQUIRED_FOR_TOOLS instead */
    walletConnected?: boolean;
    /** Optional: request a paid x402 v2 tool */
    toolRequest?: { toolId: string; params?: Record<string, string> } | null;
    /** Internal: payment header for retry after 402 (set by completion wrapper) */
    paymentHeader?: string | null;
  }): Promise<{ response: string }> {
    const stepStart = Date.now();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
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
        anonymousId: params.anonymousId ?? undefined,
        toolRequest: params.toolRequest ?? undefined,
        walletConnected: params.walletConnected,
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

    const data = await handleRes<{ success: boolean; response: string; amountChargedUsd?: number }>(res);
    return {
      response: data.response ?? "",
      ...(typeof data.amountChargedUsd === "number" && data.amountChargedUsd > 0
        ? { amountChargedUsd: data.amountChargedUsd }
        : {}),
    };
  },
};

/** Agent wallet API: get/create agent wallet by anonymousId or by connected wallet. Private key stored on server for permissionless x402. */
export const agentWalletApi = {
  /** Get or create agent wallet by connected wallet address (checks database first). */
  async getOrCreateByWallet(walletAddress: string): Promise<{ anonymousId: string; agentAddress: string }> {
    const res = await fetch(`${agentWalletBase()}/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    });
    const data = await handleRes<{ success: boolean; anonymousId: string; agentAddress: string }>(res);
    return { anonymousId: data.anonymousId, agentAddress: data.agentAddress };
  },

  /** Get or create agent wallet. Pass existing anonymousId or omit to get a new one. Returns anonymousId + agentAddress. */
  async getOrCreate(anonymousId?: string | null): Promise<{ anonymousId: string; agentAddress: string }> {
    const res = await fetch(agentWalletBase(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(anonymousId ? { anonymousId } : {}),
    });
    const data = await handleRes<{ success: boolean; anonymousId: string; agentAddress: string }>(res);
    return { anonymousId: data.anonymousId, agentAddress: data.agentAddress };
  },

  /** Get agent wallet address by anonymousId (404 if not created yet). */
  async get(anonymousId: string): Promise<{ agentAddress: string }> {
    const res = await fetch(`${agentWalletBase()}/${encodeURIComponent(anonymousId)}`);
    return handleRes(res);
  },

  /** Get agent wallet SOL and USDC balance. */
  async getBalance(anonymousId: string): Promise<{
    agentAddress: string;
    solBalance: number;
    usdcBalance: number;
  }> {
    const res = await fetch(
      `${agentWalletBase()}/${encodeURIComponent(anonymousId)}/balance`
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousId, paymentRequired }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string })?.error || res.statusText || "Payment failed");
    }
    return data as { paymentHeader: string; signature?: string };
  },
};

/** Agent tools API: list x402 v2 resources and call them (balance checked first; pay with agent wallet). */
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
    const res = await fetch(agentToolsBase());
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
      headers: { "Content-Type": "application/json" },
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
