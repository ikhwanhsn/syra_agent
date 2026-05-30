import bs58 from "bs58";
import { normalizeAgentChain, type AgentChain } from "@/lib/agentWalletUi";

import { getApiBaseUrl } from "@/lib/env";

const AUTH_BASE = () => `${getApiBaseUrl()}/agent/auth`;
const ACCESS_TOKEN_KEY = "syra_access_token";
const ACCESS_EXPIRES_KEY = "syra_access_expires";
const SESSION_WALLET_KEY = "syra_session_wallet";
const SESSION_CHAIN_KEY = "syra_session_chain";

let memoryAccessToken: string | null = null;
let memoryExpiresAt = 0;
let refreshInFlight: Promise<string | null> | null = null;
let signOutInFlight: Promise<void> | null = null;

export interface SyraSignInResult {
  accessToken: string;
  expiresAt: number;
  anonymousId: string;
  agentAddress: string;
  chain: AgentChain;
}

function readStoredAccessToken(): { token: string; expiresAt: number } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)?.trim();
    const expiresRaw = sessionStorage.getItem(ACCESS_EXPIRES_KEY);
    const expiresAt = expiresRaw ? Number.parseInt(expiresRaw, 10) : 0;
    if (!token || !Number.isFinite(expiresAt)) return null;
    return { token, expiresAt };
  } catch {
    return null;
  }
}

function persistAccessToken(token: string, expiresAt: number, wallet?: { address: string; chain: AgentChain }) {
  memoryAccessToken = token;
  memoryExpiresAt = expiresAt;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    sessionStorage.setItem(ACCESS_EXPIRES_KEY, String(expiresAt));
    if (wallet) {
      sessionStorage.setItem(SESSION_WALLET_KEY, wallet.address);
      sessionStorage.setItem(SESSION_CHAIN_KEY, wallet.chain);
    }
  } catch {
    /* quota / private mode */
  }
}

export function clearSyraSession(): void {
  memoryAccessToken = null;
  memoryExpiresAt = 0;
  refreshInFlight = null;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_EXPIRES_KEY);
    sessionStorage.removeItem(SESSION_WALLET_KEY);
    sessionStorage.removeItem(SESSION_CHAIN_KEY);
  } catch {
    /* ignore */
  }
}

export function getSyraSessionWallet(): { address: string; chain: AgentChain } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const address = sessionStorage.getItem(SESSION_WALLET_KEY)?.trim();
    const chain = sessionStorage.getItem(SESSION_CHAIN_KEY);
    if (!address) return null;
    return { address, chain: normalizeAgentChain(chain) };
  } catch {
    return null;
  }
}

function getCachedAccessToken(): string | null {
  const now = Date.now();
  if (memoryAccessToken && now < memoryExpiresAt - 30_000) return memoryAccessToken;
  const stored = readStoredAccessToken();
  if (stored && now < stored.expiresAt - 30_000) {
    memoryAccessToken = stored.token;
    memoryExpiresAt = stored.expiresAt;
    return stored.token;
  }
  return null;
}

async function parseAuthError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string })?.error || res.statusText || "Request failed";
}

function hasSessionHints(): boolean {
  if (getCachedAccessToken()) return true;
  return getSyraSessionWallet() != null;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${AUTH_BASE()}/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) {
        if (res.status !== 401) {
          // Keep stale access token on transient errors; caller can retry.
          return getCachedAccessToken();
        }
        clearSyraSession();
        return null;
      }
      const data = (await res.json()) as {
        success?: boolean;
        accessToken?: string;
        expiresAt?: number;
      };
      if (!data.accessToken || typeof data.expiresAt !== "number") {
        clearSyraSession();
        return null;
      }
      const wallet = getSyraSessionWallet();
      persistAccessToken(data.accessToken, data.expiresAt, wallet ?? undefined);
      return data.accessToken;
    } catch {
      clearSyraSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function ensureAccessToken(): Promise<string | null> {
  const cached = getCachedAccessToken();
  if (cached) return cached;
  // Guest users have no refresh cookie — skip the network round-trip.
  if (!hasSessionHints()) return null;
  return refreshAccessToken();
}

export async function fetchAuthNonce(
  chain: AgentChain,
  address: string,
): Promise<{ nonce: string; message: string }> {
  const res = await fetch(`${AUTH_BASE()}/nonce`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chain, address }),
  });
  if (!res.ok) throw new Error(await parseAuthError(res));
  const data = (await res.json()) as { success?: boolean; nonce?: string; message?: string };
  if (!data.message || !data.nonce) throw new Error("Invalid nonce response");
  return { nonce: data.nonce, message: data.message };
}

export async function signInWithWallet(params: {
  chain: AgentChain;
  address: string;
  message: string;
  signature: string;
  /** Guest anonymousId from localStorage — server migrates funded guest wallet on link. */
  anonymousId?: string | null;
}): Promise<SyraSignInResult> {
  const res = await fetch(`${AUTH_BASE()}/sign-in`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chain: params.chain,
      address: params.address,
      message: params.message,
      signature: params.signature,
      ...(params.anonymousId?.trim() ? { anonymousId: params.anonymousId.trim() } : {}),
    }),
  });
  if (!res.ok) throw new Error(await parseAuthError(res));
  const data = (await res.json()) as {
    success?: boolean;
    accessToken?: string;
    expiresAt?: number;
    anonymousId?: string;
    agentAddress?: string;
    chain?: AgentChain;
  };
  if (!data.accessToken || typeof data.expiresAt !== "number" || !data.anonymousId || !data.agentAddress) {
    throw new Error("Invalid sign-in response");
  }
  const chain = normalizeAgentChain(data.chain ?? params.chain);
  persistAccessToken(data.accessToken, data.expiresAt, { address: params.address, chain });
  return {
    accessToken: data.accessToken,
    expiresAt: data.expiresAt,
    anonymousId: data.anonymousId,
    agentAddress: data.agentAddress,
    chain,
  };
}

export async function signOutSyraSession(): Promise<void> {
  if (signOutInFlight) return signOutInFlight;
  signOutInFlight = (async () => {
    clearSyraSession();
    try {
      await fetch(`${AUTH_BASE()}/sign-out`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    } catch {
      /* ignore network errors on sign-out */
    }
  })().finally(() => {
    signOutInFlight = null;
  });
  return signOutInFlight;
}

/** Authenticated fetch for Syra API routes (session cookie + Bearer access token). */
export async function syraFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const doFetch = async (accessToken: string | null) => {
    const headers = new Headers(init?.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    if (!headers.has("Content-Type") && init?.body) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(input, {
      ...init,
      credentials: "include",
      headers,
    });
  };

  let token = await ensureAccessToken();
  let res = await doFetch(token);
  if (res.status === 401 && init?.method && init.method !== "GET" && hasSessionHints()) {
    const refreshed = await refreshAccessToken();
    if (refreshed && refreshed !== token) {
      token = refreshed;
      res = await doFetch(token);
    }
  }
  return res;
}

export function encodeSolanaSignature(signature: Uint8Array): string {
  return bs58.encode(signature);
}
