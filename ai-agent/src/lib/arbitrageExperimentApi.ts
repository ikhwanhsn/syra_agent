import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/trading-agent`;

export type ArbitrageQuoteUnit = "USDT" | "USD" | "KRW" | "unknown";

export type ArbitrageVenueOk = {
  ok: true;
  source: string;
  instrument: string;
  quoteUnit: ArbitrageQuoteUnit;
  price: number;
  formattedPrice: string;
  anchorCloseMs: number | null;
};

export type ArbitrageVenueErr = {
  ok: false;
  source: string;
  error: string;
};

export type ArbitrageVenueRow = ArbitrageVenueOk | ArbitrageVenueErr;

export interface ArbitrageStrategySummary {
  scope: string;
  buyAt: ArbitrageVenueOk | null;
  sellAt: ArbitrageVenueOk | null;
  grossSpreadPct: number | null;
  note: string;
}

export type ArbitragePriceSource = "websocket" | "ticker";

export interface ArbitrageSnapshotData {
  token: string;
  priceSource: ArbitragePriceSource;
  fetchedAt: string;
  venues: ArbitrageVenueRow[];
  strategy: ArbitrageStrategySummary;
}

export async function fetchArbitrageSnapshot(options: { token?: string }): Promise<ArbitrageSnapshotData> {
  const q = new URLSearchParams();
  if (options.token?.trim()) q.set("token", options.token.trim());
  const qs = q.toString();
  const url = `${base()}/arbitrage-snapshot${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: ArbitrageSnapshotData;
    error?: string;
  };
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load arbitrage snapshot");
  }
  return body.data;
}

export interface CmcTopAsset {
  cmcRank: number;
  symbol: string;
  name: string;
  cexToken: string;
}

export interface CmcTopData {
  source: "coinmarketcap" | "fallback";
  fetchedAt: string;
  assets: CmcTopAsset[];
}

export async function fetchCmcTop(options: { limit?: number } = {}): Promise<CmcTopData> {
  const q = new URLSearchParams();
  if (options.limit != null && Number.isFinite(options.limit)) {
    q.set("limit", String(Math.min(25, Math.max(1, Math.floor(options.limit)))));
  }
  const qs = q.toString();
  const url = `${base()}/cmc-top${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: CmcTopData;
    error?: string;
  };
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load CoinMarketCap top list");
  }
  return body.data;
}
