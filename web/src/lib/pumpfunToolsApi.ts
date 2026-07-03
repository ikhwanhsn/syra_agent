import { getApiBaseUrl } from "@/lib/chatApi";
import { syraFetch } from "@/lib/agentAuthApi";
import { isValidSolanaMint } from "@/lib/pumpfunAnalysisApi";

export type TokenDevSimilarToken = {
  mint: string;
  symbol: string;
  name: string | null;
  imageUri: string | null;
  marketCapUsd: number | null;
  createdAt: string | null;
  complete: boolean | null;
  status: string | null;
};

export type TokenDevInfoPayload = {
  mint: string;
  devWallet: string | null;
  devHoldingPct: number | null;
  devSoldPct: number | null;
  fundingAddress?: string | null;
  devBalance?: number | null;
  lastFundedAt?: string | null;
  similarTokens: TokenDevSimilarToken[];
  summary: {
    tokensLaunched: number;
    rugHistoryCount: number;
    migratedCount?: number | null;
    goldenGemCount?: number | null;
    devStillHolding: boolean | null;
    devFullySold: boolean | null;
  };
  source: string;
  errors?: string[];
  fetchedAt: string;
};

export type TokenSniperRow = {
  rank: number;
  wallet: string;
  holdingPct: number | null;
  boughtUsd: number | null;
  soldPct: number | null;
  pnlPct?: number | null;
  blockIndex: number | null;
  isFirstBlock: boolean;
  label: string | null;
};

export type TokenSnipersPayload = {
  mint: string;
  snipers: TokenSniperRow[];
  summary: {
    totalSnipers: number;
    bundleSupplyPct: number | null;
    firstBlockBuyerCount: number;
    sniperSupplyPct: number | null;
    stillHolding: number;
    fullySold: number;
    bundledValueNative?: number | null;
    totalHolders?: number | null;
    verdict: string;
    tone: "danger" | "warning" | "neutral" | string;
  };
  source: string;
  errors?: string[];
  fetchedAt: string;
};

export type TokenTradeRow = {
  id: string;
  side: "buy" | "sell" | null;
  amountUsd: number | null;
  amountToken: number | null;
  priceUsd: number | null;
  wallet: string | null;
  at: string | null;
  txHash: string | null;
  dexName?: string | null;
};

export type TokenTradesPayload = {
  mint: string;
  trades: TokenTradeRow[];
  summary: {
    total: number;
    buyCount: number;
    sellCount: number;
    buyVolumeUsd: number | null;
    sellVolumeUsd: number | null;
    buyPressurePct: number | null;
    verdict: string;
    tone: "safe" | "warning" | "danger" | string;
  };
  source: string;
  fetchedAt: string;
};

async function fetchPumpfunTool<T>(
  path: string,
  mint: string,
  opts?: { signal?: AbortSignal; limit?: number },
): Promise<T> {
  const trimmed = mint.trim();
  if (!isValidSolanaMint(trimmed)) {
    throw new Error("Enter a valid Solana mint address");
  }

  const base = getApiBaseUrl().replace(/\/$/, "");
  const params = new URLSearchParams({ mint: trimmed });
  if (opts?.limit != null) {
    params.set("limit", String(opts.limit));
  }
  const url = `${base}/agent/tokens/${path}?${params.toString()}`;
  const res = await syraFetch(url, {
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
  };

  if (!res.ok || body.success !== true || !body.data) {
    throw new Error(body.error || body.message || `Failed to load ${path}`);
  }

  return body.data;
}

export function fetchTokenDevInfo(
  mint: string,
  opts?: { signal?: AbortSignal },
): Promise<TokenDevInfoPayload> {
  return fetchPumpfunTool<TokenDevInfoPayload>("dev-info", mint, opts);
}

export function fetchTokenSnipers(
  mint: string,
  opts?: { signal?: AbortSignal },
): Promise<TokenSnipersPayload> {
  return fetchPumpfunTool<TokenSnipersPayload>("snipers", mint, opts);
}

export function fetchTokenTrades(
  mint: string,
  opts?: { signal?: AbortSignal; limit?: number },
): Promise<TokenTradesPayload> {
  return fetchPumpfunTool<TokenTradesPayload>("trades", mint, opts);
}
