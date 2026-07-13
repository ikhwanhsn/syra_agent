import { getApiBaseUrl } from "@/lib/env";

export interface LabWallet {
  id: string;
  label: string;
  address: string;
  role: "payer" | "payto";
  chain: "solana";
  active: boolean;
  /** null when the on-chain balance could not be read (RPC unavailable) — not a real zero. */
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
  updatedAt?: string;
}

export interface LabX402Endpoint {
  id: string;
  path: string;
  priceUsd: number;
  weight: number;
  description: string;
}

export interface LabX402Call {
  id: string;
  payerAddress: string;
  endpoint: string;
  priceUsd: number;
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

export async function fetchLabWallets(adminWallet: string): Promise<LabWallet[]> {
  const res = await fetchLabsJson<{ success: boolean; data: LabWallet[] }>(
    "/labs/x402/wallets",
    adminWallet,
  );
  return res.data;
}

export async function createLabWallet(
  adminWallet: string,
  input: { label: string; role: "payer" | "payto" },
): Promise<LabWallet> {
  const res = await fetchLabsJson<{ success: boolean; data: LabWallet }>(
    "/labs/x402/wallets",
    adminWallet,
    { method: "POST", body: JSON.stringify(input) },
  );
  return res.data;
}

export async function fetchLabX402Settings(adminWallet: string): Promise<LabX402Settings> {
  const res = await fetchLabsJson<{ success: boolean; data: LabX402Settings }>(
    "/labs/x402/settings",
    adminWallet,
  );
  return res.data;
}

export async function updateLabX402Settings(
  adminWallet: string,
  patch: Partial<LabX402Settings>,
): Promise<LabX402Settings> {
  const res = await fetchLabsJson<{ success: boolean; data: LabX402Settings }>(
    "/labs/x402/settings",
    adminWallet,
    { method: "PUT", body: JSON.stringify(patch) },
  );
  return res.data;
}

export async function runLabX402(
  adminWallet: string,
  input?: { payerAddress?: string; endpoint?: string },
): Promise<LabX402RunResult | { results: LabX402RunResult[] }> {
  const res = await fetchLabsJson<{ success: boolean; data: LabX402RunResult | { results: LabX402RunResult[] } }>(
    "/labs/x402/run",
    adminWallet,
    { method: "POST", body: JSON.stringify(input ?? {}) },
  );
  return res.data;
}

export async function fetchLabX402Calls(
  adminWallet: string,
  limit = 10,
): Promise<LabX402Call[]> {
  const res = await fetchLabsJson<{ success: boolean; data: LabX402Call[] }>(
    `/labs/x402/calls?limit=${limit}`,
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
