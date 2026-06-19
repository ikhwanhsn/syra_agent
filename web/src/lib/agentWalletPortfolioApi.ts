import { getApiBaseUrl } from "@/lib/env";
import type { AgentWalletPurpose } from "@/lib/agentWalletCatalog";

export interface PortfolioTokenHolding {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  amount: number;
  priceUsd: number | null;
  valueUsd: number | null;
  imageUrl?: string | null;
}

export interface AgentWalletPortfolio {
  address: string;
  solBalance: number;
  totalValueUsd: number | null;
  tokens: PortfolioTokenHolding[];
  fetchedAt: string;
}

export interface MergedPortfolioHolding extends PortfolioTokenHolding {
  wallets: AgentWalletPurpose[];
}

function isBetterTokenLabel(next: string, current: string): boolean {
  const cur = current.trim();
  const nxt = next.trim();
  if (!nxt) return false;
  if (!cur) return true;
  const curLooksLikeMint = cur.includes("…") || cur.length >= 32;
  const nextLooksLikeMint = nxt.includes("…") || nxt.length >= 32;
  if (curLooksLikeMint && !nextLooksLikeMint) return true;
  return false;
}

export interface MergedAgentPortfolio {
  totalValueUsd: number | null;
  tokens: MergedPortfolioHolding[];
  walletCount: number;
  fetchedAt: string;
}

/** Sum priced token rows — keeps header totals aligned with visible holdings. */
export function sumPortfolioTokenValues(
  tokens: Array<{ valueUsd: number | null }>,
): number | null {
  let sum = 0;
  let hasValue = false;

  for (const token of tokens) {
    if (token.valueUsd == null || !Number.isFinite(token.valueUsd)) continue;
    sum += token.valueUsd;
    hasValue = true;
  }

  return hasValue ? sum : null;
}

interface PortfolioApiResponse extends AgentWalletPortfolio {
  success?: boolean;
  error?: string;
}

export async function fetchAgentWalletPortfolio(address: string): Promise<AgentWalletPortfolio> {
  const url = `${getApiBaseUrl()}/wallet/solana/portfolio?address=${encodeURIComponent(address)}`;
  const res = await fetch(url, { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as PortfolioApiResponse;
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Portfolio fetch failed (${res.status})`);
  }
  if (!Array.isArray(data.tokens) || typeof data.address !== "string") {
    throw new Error("Invalid portfolio response");
  }
  return {
    address: data.address,
    solBalance: Number(data.solBalance) || 0,
    totalValueUsd:
      data.totalValueUsd != null && Number.isFinite(data.totalValueUsd) ? data.totalValueUsd : null,
    tokens: data.tokens,
    fetchedAt: data.fetchedAt ?? new Date().toISOString(),
  };
}

function conservativeUsdPrice(
  primary: number | null | undefined,
  secondary: number | null | undefined,
): number | null {
  const a = primary != null && Number.isFinite(primary) && primary > 0 ? primary : null;
  const b = secondary != null && Number.isFinite(secondary) && secondary > 0 ? secondary : null;
  if (a == null) return b;
  if (b == null) return a;
  const max = Math.max(a, b);
  const min = Math.min(a, b);
  return max / min > 3 ? min : a;
}

export function mergeAgentPortfolios(
  entries: Array<{ purpose: AgentWalletPurpose; portfolio: AgentWalletPortfolio }>,
): MergedAgentPortfolio {
  /** @type {Map<string, MergedPortfolioHolding>} */
  const byMint = new Map<string, MergedPortfolioHolding>();
  let totalValueUsd = 0;
  let hasValue = false;
  let latestFetchedAt = "";

  for (const { purpose, portfolio } of entries) {
    if (portfolio.fetchedAt > latestFetchedAt) latestFetchedAt = portfolio.fetchedAt;
    if (portfolio.totalValueUsd != null && Number.isFinite(portfolio.totalValueUsd)) {
      totalValueUsd += portfolio.totalValueUsd;
      hasValue = true;
    }

    for (const token of portfolio.tokens) {
      const existing = byMint.get(token.mint);
      if (existing) {
        existing.amount += token.amount;
        if (!existing.wallets.includes(purpose)) existing.wallets.push(purpose);
        if (existing.priceUsd == null && token.priceUsd != null) {
          existing.priceUsd = token.priceUsd;
        } else if (existing.priceUsd != null && token.priceUsd != null) {
          existing.priceUsd = conservativeUsdPrice(existing.priceUsd, token.priceUsd);
        }
        if (!existing.imageUrl && token.imageUrl) existing.imageUrl = token.imageUrl;
        if (isBetterTokenLabel(token.symbol, existing.symbol)) existing.symbol = token.symbol;
        if (isBetterTokenLabel(token.name, existing.name)) existing.name = token.name;
      } else {
        byMint.set(token.mint, {
          ...token,
          wallets: [purpose],
        });
      }
    }
  }

  const tokens = [...byMint.values()];

  for (const token of tokens) {
    if (token.priceUsd != null && Number.isFinite(token.priceUsd) && token.amount > 0) {
      token.valueUsd = token.amount * token.priceUsd;
    } else {
      token.valueUsd = null;
      token.priceUsd = null;
    }
  }

  tokens.sort((a, b) => {
    const av = a.valueUsd ?? -1;
    const bv = b.valueUsd ?? -1;
    if (bv !== av) return bv - av;
    return b.amount - a.amount;
  });

  const mergedTotal = sumPortfolioTokenValues(tokens);

  return {
    totalValueUsd: mergedTotal ?? (hasValue ? totalValueUsd : null),
    tokens,
    walletCount: entries.length,
    fetchedAt: latestFetchedAt || new Date().toISOString(),
  };
}
