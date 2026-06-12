import { getApiBaseUrl } from "@/lib/env";



const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/spcx`;



export type VenueStatus =

  | "live"

  | "halted"

  | "no_dex_liquidity"

  | "pending_mint"

  | "impersonator_warning";



export type AgentBias = "observe" | "spread_alert" | "liquidity_caution" | "unavailable";



export interface SpcxVenueQuote {

  symbol: string;

  venue: string;

  mint: string;

  status: VenueStatus;

  statusNote: string;

  priceUsd: number | null;

  priceSource: string | null;

  spreadPct: number | null;

  spreadUsd: number | null;

  spreadLabel: "premium" | "discount" | "parity" | null;

  liquidityUsd: number | null;

  volume24h: number | null;

  priceChange24h: number | null;

  description?: string;

  isin?: string;

  tradingHalted?: boolean;

  accessNote?: string;

}



export function venueStatusLabel(status: VenueStatus): string {

  switch (status) {

    case "live":

      return "Live";

    case "halted":

      return "Halted";

    case "no_dex_liquidity":

      return "No DEX yet";

    case "pending_mint":

      return "Pending";

    case "impersonator_warning":

      return "Scam pools";

    default:

      return status;

  }

}



export interface SpcxIntelligenceReport {

  id?: string;

  tickAt?: string;

  symbol: string;

  nasdaqTicker: string;

  nasdaqPriceUsd: number | null;

  nasdaqSource: string | null;

  venues: SpcxVenueQuote[];

  agentBias: AgentBias;

  agentTake: string;

  riskNotes: string[];

  opportunities: string[];

  computedAt: string;

  disclaimer: string;

}



export interface SpcxCatalogMeta {

  symbols: string[];

  nasdaqTicker: string;

  ipoReferencePriceUsd: number;

}



export interface SpcxConfig {

  title: string;

  description: string;

  nasdaqTicker: string;

  ipoReferencePriceUsd: number;

  demoUrl: string;

  catalog: SpcxCatalogMeta;

}



export interface SpreadHistoryPoint {

  ts: number;

  label: string;

  nasdaq: number | null;

  onchain: number | null;

  spreadPct: number | null;

}



interface ApiEnvelope<T> {

  success: boolean;

  data?: T;

  error?: string;

}



async function spcxFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });

  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!res.ok || body.success === false) {

    throw new Error(body.error || res.statusText || "SPCX API error");

  }

  return body.data as T;

}



export async function fetchSpcxConfig(): Promise<SpcxConfig> {

  return spcxFetch<SpcxConfig>("/config");

}



export async function fetchSpcxLatest(): Promise<SpcxIntelligenceReport> {

  return spcxFetch<SpcxIntelligenceReport>("/latest");

}



export async function fetchSpcxFeed(limit = 20): Promise<{ entries: SpcxIntelligenceReport[] }> {
  const data = await spcxFetch<{ entries?: unknown }>(`/feed?limit=${limit}`);
  return { entries: normalizeFeedEntries(data?.entries) };
}



export async function tickSpcxAgent(): Promise<SpcxIntelligenceReport> {

  return spcxFetch<SpcxIntelligenceReport>("/tick", {

    method: "POST",

    body: JSON.stringify({}),

  });

}



export async function fetchSpcxTelegramPreview(): Promise<{

  message: string;

  report: SpcxIntelligenceReport;

}> {

  return spcxFetch<{ message: string; report: SpcxIntelligenceReport }>("/telegram-preview");

}



export function formatSpread(spreadPct: number | null): string {

  if (spreadPct == null || !Number.isFinite(spreadPct)) return "—";

  const sign = spreadPct >= 0 ? "+" : "";

  return `${sign}${spreadPct.toFixed(2)}%`;

}



export function spreadBadgeVariant(

  label: SpcxVenueQuote["spreadLabel"],

): "default" | "secondary" | "destructive" | "outline" {

  if (label === "premium") return "destructive";

  if (label === "discount") return "default";

  return "secondary";

}



export function formatUsd(n: number | null | undefined): string {

  if (n == null || !Number.isFinite(n)) return "—";

  return new Intl.NumberFormat("en-US", {

    style: "currency",

    currency: "USD",

    minimumFractionDigits: 0,

    maximumFractionDigits: 2,

  }).format(n);

}



export function formatUsdCompact(n: number | null | undefined): string {

  if (n == null || !Number.isFinite(n)) return "—";

  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;

  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;

  return formatUsd(n);

}



export function formatPctChange(n: number | null | undefined): string {

  if (n == null || !Number.isFinite(n)) return "—";

  const sign = n >= 0 ? "+" : "";

  return `${sign}${n.toFixed(2)}%`;

}



export function agentBiasLabel(bias: AgentBias | string | null | undefined): string {
  if (!bias || typeof bias !== "string") return "unknown";
  return bias.replace(/_/g, " ");
}

export function formatFeedTimestamp(ts: string | undefined): string {
  if (!ts) return "—";
  const ms = new Date(ts).getTime();
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleString();
}

export function normalizeFeedEntries(
  raw: unknown,
): SpcxIntelligenceReport[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is SpcxIntelligenceReport =>
      entry != null &&
      typeof entry === "object" &&
      typeof (entry as SpcxIntelligenceReport).agentTake === "string" &&
      Array.isArray((entry as SpcxIntelligenceReport).venues),
  );
}



export function agentBiasTone(bias: AgentBias): string {

  switch (bias) {

    case "spread_alert":

      return "border-destructive/35 bg-destructive/10 text-destructive";

    case "liquidity_caution":

      return "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200";

    case "observe":

      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

    default:

      return "border-border/50 bg-muted/30 text-muted-foreground";

  }

}



export function bestLiveVenue(report: SpcxIntelligenceReport): SpcxVenueQuote | undefined {
  const venues = Array.isArray(report.venues) ? report.venues : [];
  return venues.find((v) => v.status === "live" && v.priceUsd != null);
}



export function buildSpreadHistory(entries: SpcxIntelligenceReport[]): SpreadHistoryPoint[] {

  const points = entries

    .map((entry) => {

      const venue = bestLiveVenue(entry);

      const ts = new Date(entry.tickAt || entry.computedAt).getTime();

      if (!Number.isFinite(ts)) return null;

      return {

        ts,

        label: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),

        nasdaq: entry.nasdaqPriceUsd,

        onchain: venue?.priceUsd ?? null,

        spreadPct: venue?.spreadPct ?? null,

      };

    })

    .filter((p): p is SpreadHistoryPoint => p != null);



  return points.sort((a, b) => a.ts - b.ts);

}



export function isReportStale(computedAt: string, maxAgeMs = 5 * 60_000): boolean {

  const ts = new Date(computedAt).getTime();

  if (!Number.isFinite(ts)) return false;

  return Date.now() - ts > maxAgeMs;

}

export function isNasdaqReferenceFallback(report: SpcxIntelligenceReport): boolean {
  return report.nasdaqSource === "reference_fallback";
}

export interface VenueStatusSummary {
  total: number;
  live: number;
  halted: number;
  pending: number;
  scam: number;
  noLiquidity: number;
}

export function summarizeVenueStatus(report: SpcxIntelligenceReport): VenueStatusSummary {
  const venues = Array.isArray(report.venues) ? report.venues : [];
  return {
    total: venues.length,
    live: venues.filter((v) => v.status === "live").length,
    halted: venues.filter((v) => v.status === "halted").length,
    pending: venues.filter((v) => v.status === "pending_mint").length,
    scam: venues.filter((v) => v.status === "impersonator_warning").length,
    noLiquidity: venues.filter((v) => v.status === "no_dex_liquidity").length,
  };
}

export function officialVenues(report: SpcxIntelligenceReport): SpcxVenueQuote[] {
  return (Array.isArray(report.venues) ? report.venues : []).filter(
    (v) => v.status !== "impersonator_warning" && Boolean(v.mint),
  );
}

export function impersonatorVenues(report: SpcxIntelligenceReport): SpcxVenueQuote[] {
  return (Array.isArray(report.venues) ? report.venues : []).filter(
    (v) => v.status === "impersonator_warning",
  );
}

export type MintVerificationResult =
  | { verdict: "official"; venue: SpcxVenueQuote }
  | { verdict: "impersonator"; venue: SpcxVenueQuote }
  | { verdict: "unknown" };

export function verifyMintAddress(
  report: SpcxIntelligenceReport,
  rawMint: string,
): MintVerificationResult {
  const mint = rawMint.trim();
  if (!mint) return { verdict: "unknown" };

  const venues = Array.isArray(report.venues) ? report.venues : [];
  const impersonator = venues.find(
    (v) => v.status === "impersonator_warning" && v.mint.toLowerCase() === mint.toLowerCase(),
  );
  if (impersonator) return { verdict: "impersonator", venue: impersonator };

  const official = venues.find(
    (v) => v.status !== "impersonator_warning" && v.mint.toLowerCase() === mint.toLowerCase(),
  );
  if (official) return { verdict: "official", venue: official };

  return { verdict: "unknown" };
}

export function highestLiquidityVenue(
  report: SpcxIntelligenceReport,
): SpcxVenueQuote | undefined {
  const live = (Array.isArray(report.venues) ? report.venues : []).filter(
    (v) => v.status === "live" && v.liquidityUsd != null,
  );
  if (!live.length) return bestLiveVenue(report);
  return live.reduce((best, v) =>
    (v.liquidityUsd ?? 0) > (best.liquidityUsd ?? 0) ? v : best,
  );
}

export { solscanAccountUrl, solscanTxUrl, dexScreenerTokenUrl, xstocksAssetUrl } from "@/lib/spcxLinks";


