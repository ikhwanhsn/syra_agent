import { getApiBaseUrl } from "@/lib/env";

export type LabChain = "solana" | "base";

export interface LabWallet {
  id: string;
  label: string;
  address: string;
  role: "payer" | "payto";
  chain: LabChain;
  active: boolean;
  /** Native gas token balance (SOL or ETH). null when RPC unavailable. */
  nativeBalance: number | null;
  nativeSymbol: "SOL" | "ETH";
  /** @deprecated Prefer nativeBalance — kept for older simulation helpers. */
  solBalance: number | null;
  usdcBalance: number | null;
  balanceAvailable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabX402Settings {
  autoCallEnabled: boolean;
  intervalMs: number;
  refundEnabled: boolean;
  jitterPct: number;
  /** Inclusive daily cap range; system rolls a random value once per UTC day. */
  maxDailyCallsMin: number;
  maxDailyCallsMax: number;
  /** Today's rolled cap (or midpoint of range if not rolled yet). */
  maxDailyCalls: number;
  activeDailyCallCap?: number | null;
  activeDailyCallCapDay?: string | null;
  chain?: LabChain;
  updatedAt?: string;
}

export interface LabX402Endpoint {
  id: string;
  path: string;
  priceUsd: number;
  weight: number;
  description: string;
  facilitator?: "dexter" | "payai";
  dailyLimitMin?: number;
  dailyLimitMax?: number;
  dailyQuota?: {
    count: number;
    max: number;
    allowed: boolean;
    day: string;
  };
}

export interface LabX402Call {
  id: string;
  payerAddress: string;
  endpoint: string;
  priceUsd: number;
  chain?: LabChain;
  status: "success" | "payment_failed" | "refund_failed" | "refund_skipped" | "error";
  paymentTx: string | null;
  refundTx: string | null;
  error: string | null;
  trigger: "manual" | "scheduler";
  createdAt: string;
}

export interface LabX402RunResult {
  success: boolean;
  endpoint: string | null;
  priceUsd?: number;
  httpStatus?: number;
  data?: unknown;
  paymentTx?: string | null;
  /** true when the call was skipped because the payer could not be funded. */
  skipped?: boolean;
  reason?: string;
  error?: string;
}

function withChain(path: string, chain: LabChain): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}chain=${encodeURIComponent(chain)}`;
}

async function fetchLabsJson<T>(
  path: string,
  adminWallet: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("x-admin-wallet", adminWallet);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers, credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (typeof body.error === "string" && body.error) ||
      (typeof body.message === "string" && body.message) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

function normalizeWallet(raw: LabWallet): LabWallet {
  const chain: LabChain = raw.chain === "base" ? "base" : "solana";
  const nativeBalance = raw.nativeBalance ?? raw.solBalance ?? null;
  return {
    ...raw,
    chain,
    nativeBalance,
    nativeSymbol: raw.nativeSymbol ?? (chain === "base" ? "ETH" : "SOL"),
    solBalance: nativeBalance,
  };
}

export async function fetchLabWallets(
  adminWallet: string,
  chain: LabChain = "solana",
): Promise<LabWallet[]> {
  const res = await fetchLabsJson<{ success: boolean; data: LabWallet[] }>(
    withChain("/labs/x402/wallets", chain),
    adminWallet,
  );
  return res.data.map(normalizeWallet);
}

export async function createLabWallet(
  adminWallet: string,
  input: { label: string; role: "payer" | "payto"; chain?: LabChain },
): Promise<LabWallet> {
  const chain = input.chain ?? "solana";
  const res = await fetchLabsJson<{ success: boolean; data: LabWallet }>(
    withChain("/labs/x402/wallets", chain),
    adminWallet,
    { method: "POST", body: JSON.stringify({ ...input, chain }) },
  );
  return normalizeWallet(res.data);
}

export async function createLabWalletsBulk(
  adminWallet: string,
  input: { count: number; chain?: LabChain; labelPrefix?: string },
): Promise<LabWallet[]> {
  const chain = input.chain ?? "solana";
  const res = await fetchLabsJson<{ success: boolean; data: LabWallet[] }>(
    withChain("/labs/x402/wallets/bulk", chain),
    adminWallet,
    {
      method: "POST",
      body: JSON.stringify({
        count: input.count,
        chain,
        labelPrefix: input.labelPrefix ?? "Payer",
      }),
    },
  );
  return res.data.map(normalizeWallet);
}

export async function fetchLabX402Settings(
  adminWallet: string,
  chain: LabChain = "solana",
): Promise<LabX402Settings> {
  const res = await fetchLabsJson<{ success: boolean; data: LabX402Settings }>(
    withChain("/labs/x402/settings", chain),
    adminWallet,
  );
  return res.data;
}

export async function updateLabX402Settings(
  adminWallet: string,
  patch: Partial<LabX402Settings>,
  chain: LabChain = "solana",
): Promise<LabX402Settings> {
  const res = await fetchLabsJson<{ success: boolean; data: LabX402Settings }>(
    withChain("/labs/x402/settings", chain),
    adminWallet,
    { method: "PUT", body: JSON.stringify({ ...patch, chain }) },
  );
  return res.data;
}

export async function runLabX402(
  adminWallet: string,
  input?: { payerAddress?: string; endpoint?: string; chain?: LabChain },
): Promise<LabX402RunResult | { results: LabX402RunResult[] }> {
  const chain = input?.chain ?? "solana";
  const res = await fetchLabsJson<{
    success: boolean;
    data: LabX402RunResult | { results: LabX402RunResult[] };
  }>(withChain("/labs/x402/run", chain), adminWallet, {
    method: "POST",
    body: JSON.stringify({ ...input, chain }),
  });
  return res.data;
}

export async function fetchLabX402Calls(
  adminWallet: string,
  limit = 10,
  chain: LabChain = "solana",
): Promise<LabX402Call[]> {
  const res = await fetchLabsJson<{ success: boolean; data: LabX402Call[] }>(
    withChain(`/labs/x402/calls?limit=${limit}`, chain),
    adminWallet,
  );
  return res.data;
}

export async function fetchLabX402Endpoints(adminWallet: string): Promise<LabX402Endpoint[]> {
  const res = await fetchLabsJson<{ success: boolean; data: LabX402Endpoint[] }>(
    "/labs/x402/endpoints",
    adminWallet,
  );
  return res.data;
}
