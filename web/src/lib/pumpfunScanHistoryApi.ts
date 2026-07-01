import { getApiBaseUrl } from "@/lib/chatApi";
import { syraFetch } from "@/lib/agentAuthApi";

export interface PumpfunScanRecord {
  callId: string;
  callerWallet: string;
  mint: string;
  symbol: string;
  name: string;
  imageUri: string | null;
  scanPriceUsd: number | null;
  scanMarketCapUsd: number | null;
  currentMarketCapUsd: number | null;
  peakMarketCapUsd: number | null;
  gainMultiplier: number | null;
  peakGainMultiplier: number | null;
  syraAlphaScore: number;
  syraAlphaVerdict: string;
  syraAlphaTone: string;
  scannedAt: string;
  lastRefreshedAt: string | null;
}

export interface PumpfunLiveCallRecord {
  callId: string;
  callerWallet: string;
  mint: string;
  symbol: string;
  name: string;
  imageUri: string | null;
  scanMarketCapUsd: number | null;
  peakGainMultiplier: number | null;
  syraAlphaScore: number;
  syraAlphaVerdict: string;
  syraAlphaTone: string;
  scannedAt: string;
  feedAt: string;
}

export interface PumpfunLiveCallsPage {
  items: PumpfunLiveCallRecord[];
  total: number;
  hasMore: boolean;
}

export interface PumpfunCallerLeaderboardEntry {
  rank: number;
  callerWallet: string;
  totalCalls: number;
  bestPeakGain: number;
  bestCurrentGain: number;
  avgPeakGain: number;
  calls10x: number;
  calls100x: number;
  lastCallAt: string;
  topCall: {
    callId: string;
    mint: string;
    symbol: string;
    name: string;
    imageUri: string | null;
    peakGainMultiplier: number;
    scanMarketCapUsd: number | null;
    peakMarketCapUsd: number | null;
    scannedAt: string;
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
  };
  if (!res.ok || body.success !== true) {
    throw new Error(body.error || body.message || "Request failed");
  }
  return body.data as T;
}

export async function fetchPumpfunScanHistory(
  opts?: { limit?: number; signal?: AbortSignal },
): Promise<PumpfunScanRecord[]> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const limit = opts?.limit ?? 30;
  const url = `${base}/agent/tokens/memecoin-analysis/history?limit=${limit}`;
  const res = await syraFetch(url, {
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });
  return parseJson<PumpfunScanRecord[]>(res);
}

export async function fetchPumpfunLiveCalls(
  opts?: { limit?: number; offset?: number; signal?: AbortSignal },
): Promise<PumpfunLiveCallsPage> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const url = `${base}/agent/tokens/memecoin-analysis/live?limit=${limit}&offset=${offset}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });
  return parseJson<PumpfunLiveCallsPage>(res);
}

export async function fetchPumpfunScanCall(
  callId: string,
  opts?: { signal?: AbortSignal },
): Promise<PumpfunScanRecord> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}/agent/tokens/memecoin-analysis/calls/${encodeURIComponent(callId)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });
  return parseJson<PumpfunScanRecord>(res);
}

export async function fetchPumpfunCallerLeaderboard(
  opts?: { limit?: number; signal?: AbortSignal },
): Promise<PumpfunCallerLeaderboardEntry[]> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const limit = opts?.limit ?? 25;
  const url = `${base}/agent/tokens/memecoin-analysis/callers?limit=${limit}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });
  return parseJson<PumpfunCallerLeaderboardEntry[]>(res);
}

export function formatGainMultiplier(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 1) return "—";
  if (value >= 1000) return `${Math.round(value)}x`;
  if (value >= 100) return `${Math.round(value)}x`;
  if (value >= 10) return `${value.toFixed(1).replace(/\.0$/, "")}x`;
  return `${value.toFixed(2).replace(/\.00$/, "")}x`;
}

export function formatCompactUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(6)}`;
}

export function truncateWallet(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 1) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

export function buildPumpfunCallShareUrl(callId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/pumpfun/call/${callId}`;
  }
  return `https://syraa.fun/pumpfun/call/${callId}`;
}

export function buildPumpfunCallShareText(record: PumpfunScanRecord): string {
  const gain = formatGainMultiplier(record.peakGainMultiplier ?? record.gainMultiplier);
  const lines = [
    `🚀 ${gain} on $${record.symbol} — called via Syra Pumpfun Alpha`,
    "",
    `Called at ${formatCompactUsd(record.scanMarketCapUsd)} mcap`,
    record.peakMarketCapUsd
      ? `Peak ${formatCompactUsd(record.peakMarketCapUsd)} mcap`
      : "",
    "",
    buildPumpfunCallShareUrl(record.callId),
  ].filter(Boolean);
  return lines.join("\n");
}
