import { getApiBaseUrl } from "@/lib/chatApi";
import { SYRA_MINT } from "@/lib/swapPresets";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/lp-agent`;

export interface MeteoraLpPool {
  poolAddress: string;
  poolName: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseMint: string | null;
  quoteMint: string | null;
  binStep: number;
  activeBinId: number;
  tvlUsd: number;
  fee24hUsd: number;
  volume24hUsd: number;
  feeTvlRatio: number;
  currentPrice: number;
}

export type MeteoraPoolSortKey = "apr" | "tvl" | "volume" | "fees" | "feeTvlRatio";

export interface FetchMeteoraLpPoolsParams {
  sortKey?: string;
  order?: "asc" | "desc";
  limit?: number;
  pages?: number;
  hideLowTvl?: boolean;
  search?: string;
  mint?: string;
}

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const usdFull = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const percentFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentDailyFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export function feeAprFromDailyRatio(feeTvlRatio: number | null | undefined): number {
  const n = Number(feeTvlRatio);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n * 365;
}

export function formatUsdCompact(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000) return usdCompact.format(n);
  return usdFull.format(n);
}

export function formatPercent(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return percentFmt.format(n);
}

export function formatDailyFeeYield(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return percentDailyFmt.format(n);
}

export function formatPrice(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  if (n >= 0.0001) return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
  return n.toExponential(3);
}

export function volumeToTvlRatio(volume24hUsd: number, tvlUsd: number): number | null {
  if (!Number.isFinite(volume24hUsd) || !Number.isFinite(tvlUsd) || tvlUsd <= 0) return null;
  return volume24hUsd / tvlUsd;
}

export function meteoraDeepLink(poolAddress: string): string {
  return `https://app.meteora.ag/dlmm/${encodeURIComponent(poolAddress.trim())}`;
}

export function poolPairLabel(pool: Pick<MeteoraLpPool, "baseSymbol" | "quoteSymbol" | "poolName">): string {
  const base = pool.baseSymbol?.trim();
  const quote = pool.quoteSymbol?.trim();
  if (base && quote) return `${base}/${quote}`;
  return pool.poolName || "Unknown pool";
}

export function sortMeteoraPools(
  pools: MeteoraLpPool[],
  sortKey: MeteoraPoolSortKey,
  order: "asc" | "desc" = "desc",
): MeteoraLpPool[] {
  const dir = order === "asc" ? 1 : -1;
  const sorted = [...pools].sort((a, b) => {
    let av = 0;
    let bv = 0;
    switch (sortKey) {
      case "apr":
        av = feeAprFromDailyRatio(a.feeTvlRatio);
        bv = feeAprFromDailyRatio(b.feeTvlRatio);
        break;
      case "tvl":
        av = a.tvlUsd;
        bv = b.tvlUsd;
        break;
      case "volume":
        av = a.volume24hUsd;
        bv = b.volume24hUsd;
        break;
      case "fees":
        av = a.fee24hUsd;
        bv = b.fee24hUsd;
        break;
      case "feeTvlRatio":
        av = a.feeTvlRatio;
        bv = b.feeTvlRatio;
        break;
      default:
        av = a.tvlUsd;
        bv = b.tvlUsd;
    }
    return (av - bv) * dir;
  });
  return sorted;
}

async function parseJson<T>(res: Response): Promise<{ ok: boolean; body: T }> {
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, body };
}

export async function fetchMeteoraLpPools(
  params: FetchMeteoraLpPoolsParams = {},
): Promise<{ pools: MeteoraLpPool[]; count: number }> {
  const q = new URLSearchParams();
  if (params.sortKey) q.set("sort_key", params.sortKey);
  if (params.order) q.set("order", params.order);
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.pages != null) q.set("pages", String(params.pages));
  if (params.hideLowTvl === false) q.set("hideLowTvl", "false");
  const search = params.search?.trim();
  if (search) q.set("search", search);
  const mint = params.mint?.trim();
  if (mint) q.set("mint", mint);

  const res = await fetch(`${base()}/pools?${q.toString()}`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { pools?: MeteoraLpPool[]; count?: number };
    error?: string;
  }>(res);

  if (!ok || !body.success || !body.data?.pools) {
    throw new Error(body.error || "Failed to load Meteora pools");
  }

  return {
    pools: body.data.pools,
    count: body.data.count ?? body.data.pools.length,
  };
}

export function poolIncludesMint(pool: MeteoraLpPool, mint: string): boolean {
  const m = mint.trim();
  return pool.baseMint === m || pool.quoteMint === m;
}

export async function fetchSyraMeteoraLpPools(): Promise<{ pools: MeteoraLpPool[]; count: number }> {
  return fetchMeteoraLpPools({ mint: SYRA_MINT, search: "syra" });
}
