import type { AlphaTechTeam } from "@/constants/alphaTechTeams";

const DEXSCREENER_SEARCH = "https://api.dexscreener.com/latest/dex/search";

type DexScreenerToken = {
  address?: string;
  name?: string;
  symbol?: string;
};

type DexScreenerPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: DexScreenerToken;
  quoteToken?: DexScreenerToken;
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  info?: { imageUrl?: string };
};

type DexScreenerSearchResponse = {
  pairs?: DexScreenerPair[] | null;
};

export type AlphaTechScreeningRow = {
  teamId: string;
  teamName: string;
  matched: boolean;
  symbol: string | null;
  name: string | null;
  tokenAddress: string | null;
  priceUsd: number | null;
  marketCap: number | null;
  fdv: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
  pairUrl: string | null;
  imageUrl: string | null;
  dexId: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeTokenName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function nameMatchScore(teamName: string, tokenName: string | undefined, tokenSymbol: string | undefined): number {
  const teamNorm = normalizeTokenName(teamName);
  const nameNorm = normalizeTokenName(tokenName ?? "");
  const symbolNorm = normalizeTokenName(tokenSymbol ?? "");

  if (!teamNorm) return 0;
  if (nameNorm === teamNorm || symbolNorm === teamNorm) return 100;
  if (nameNorm.includes(teamNorm) || teamNorm.includes(nameNorm)) return 70;
  if (symbolNorm.includes(teamNorm) || teamNorm.includes(symbolNorm)) return 60;
  return 0;
}

function pickBestSolanaPair(pairs: DexScreenerPair[], teamName: string): DexScreenerPair | null {
  const solanaPairs = pairs.filter((p) => p.chainId === "solana");
  if (solanaPairs.length === 0) return null;

  const scored = solanaPairs
    .map((pair) => ({
      pair,
      score: nameMatchScore(teamName, pair.baseToken?.name, pair.baseToken?.symbol),
      liquidity: pair.liquidity?.usd ?? 0,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.liquidity - a.liquidity;
    });

  if (scored.length > 0) return scored[0].pair;

  const byLiquidity = [...solanaPairs].sort(
    (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0),
  );
  return byLiquidity[0] ?? null;
}

function pairToRow(team: AlphaTechTeam, pair: DexScreenerPair | null): AlphaTechScreeningRow {
  if (!pair) {
    return {
      teamId: team.id,
      teamName: team.name,
      matched: false,
      symbol: null,
      name: null,
      tokenAddress: null,
      priceUsd: null,
      marketCap: null,
      fdv: null,
      liquidityUsd: null,
      volume24h: null,
      priceChange24h: null,
      pairUrl: null,
      imageUrl: null,
      dexId: null,
    };
  }

  return {
    teamId: team.id,
    teamName: team.name,
    matched: true,
    symbol: pair.baseToken?.symbol ?? null,
    name: pair.baseToken?.name ?? null,
    tokenAddress: pair.baseToken?.address ?? null,
    priceUsd: parseNumber(pair.priceUsd),
    marketCap: parseNumber(pair.marketCap),
    fdv: parseNumber(pair.fdv),
    liquidityUsd: parseNumber(pair.liquidity?.usd),
    volume24h: parseNumber(pair.volume?.h24),
    priceChange24h: parseNumber(pair.priceChange?.h24),
    pairUrl: pair.url ?? null,
    imageUrl: pair.info?.imageUrl ?? null,
    dexId: pair.dexId ?? null,
  };
}

export async function fetchAlphaTechTeamMatch(
  team: AlphaTechTeam,
  signal?: AbortSignal,
): Promise<AlphaTechScreeningRow> {
  const url = `${DEXSCREENER_SEARCH}?q=${encodeURIComponent(team.name)}`;

  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return pairToRow(team, null);
    }

    const raw: unknown = await res.json();
    if (!isRecord(raw)) return pairToRow(team, null);

    const data = raw as DexScreenerSearchResponse;
    const pairs = Array.isArray(data.pairs) ? data.pairs : [];
    const best = pickBestSolanaPair(pairs, team.name);
    return pairToRow(team, best);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    return pairToRow(team, null);
  }
}

export async function fetchAlphaTechScreener(
  teams: readonly AlphaTechTeam[],
  options?: {
    signal?: AbortSignal;
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  },
): Promise<AlphaTechScreeningRow[]> {
  const concurrency = Math.max(1, options?.concurrency ?? 5);
  const results: AlphaTechScreeningRow[] = new Array(teams.length);
  let nextIndex = 0;
  let completed = 0;

  async function worker(): Promise<void> {
    while (nextIndex < teams.length) {
      if (options?.signal?.aborted) return;
      const index = nextIndex;
      nextIndex += 1;
      const team = teams[index];
      results[index] = await fetchAlphaTechTeamMatch(team, options?.signal);
      completed += 1;
      options?.onProgress?.(completed, teams.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, teams.length) }, () => worker()));
  return results;
}

export type AlphaTechSortKey =
  | "teamName"
  | "symbol"
  | "priceUsd"
  | "priceChange24h"
  | "marketCap"
  | "liquidityUsd"
  | "volume24h";

export type AlphaTechSortOrder = "asc" | "desc";

export function sortAlphaTechRows(
  rows: AlphaTechScreeningRow[],
  key: AlphaTechSortKey,
  order: AlphaTechSortOrder,
): AlphaTechScreeningRow[] {
  const dir = order === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    if (key === "teamName") return a.teamName.localeCompare(b.teamName) * dir;
    if (key === "symbol") return (a.symbol ?? "").localeCompare(b.symbol ?? "") * dir;

    const av = a[key] ?? Number.NEGATIVE_INFINITY;
    const bv = b[key] ?? Number.NEGATIVE_INFINITY;
    if (av === bv) return a.teamName.localeCompare(b.teamName);
    return (av < bv ? -1 : 1) * dir;
  });
}

export function filterAlphaTechRows(
  rows: AlphaTechScreeningRow[],
  query: string,
  filter: "all" | "matched" | "unmatched",
): AlphaTechScreeningRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter === "matched" && !row.matched) return false;
    if (filter === "unmatched" && row.matched) return false;
    if (!q) return true;
    return (
      row.teamName.toLowerCase().includes(q) ||
      (row.symbol?.toLowerCase().includes(q) ?? false) ||
      (row.name?.toLowerCase().includes(q) ?? false) ||
      (row.tokenAddress?.toLowerCase().includes(q) ?? false)
    );
  });
}
