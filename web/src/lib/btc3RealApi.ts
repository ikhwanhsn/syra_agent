import { getApiBaseUrl } from "@/lib/chatApi";

const realBase = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/btc3-real`;

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatBtc3Usd(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return usdCompact.format(n);
}

export interface Btc3RealWalletAllocation {
  usdcAmount: number;
  btcAmount: number;
  btcUsd: number;
  totalUsd: number;
  btcPct: number;
  usdcPct: number;
}

export interface Btc3RealState {
  enabled: boolean;
  experimentId: string | null;
  title: string;
  startedAt: string | null;
  agentAddress: string | null;
  maxNotionalUsd: number;
  reserveUsdc: number;
  minRebalancePct: number;
  slippageBps: number;
  lastRebalanceAt: string | null;
  lastError: string | null;
  capitalBaselineUsd: number | null;
  executedRebalances: number;
  realizedNetPnlUsd: number;
  equityUsd: number | null;
  returnPct: number | null;
  walletAllocation: Btc3RealWalletAllocation | null;
  canEnable: boolean;
  cronEnabled: boolean;
  onchain: {
    venue: string;
    inputMint: string;
    outputMint: string;
    execution: string;
  };
}

async function parseJson<T>(res: Response): Promise<{ ok: boolean; body: T }> {
  const body = (await res.json()) as T;
  return { ok: res.ok, body };
}

export async function fetchBtc3RealState(): Promise<Btc3RealState> {
  const res = await fetch(`${realBase()}/state`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: Btc3RealState;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load BTC3 real state");
  }
  return body.data;
}

export async function enableBtc3Real(options: {
  maxNotionalUsd?: number;
  minRebalancePct?: number;
} = {}): Promise<Btc3RealState> {
  const res = await fetch(`${realBase()}/enable`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: Btc3RealState;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to enable BTC3 real agent");
  }
  return body.data;
}

export async function disableBtc3Real(): Promise<Btc3RealState> {
  const res = await fetch(`${realBase()}/disable`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: Btc3RealState;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to disable BTC3 real agent");
  }
  return body.data;
}
