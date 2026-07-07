import type { ExampleFlowPreset } from "@/hooks/useApiPlayground";
import { getFlowGroup } from "@/hooks/useApiPlayground";
import { getPlaygroundSyraPathname } from "@/lib/playgroundUrl";

/** Internal classification — data-provider routes roll up into the Partners filter. */
export type MarketplaceTier = "core" | "data-provider" | "partner";

/** UI filter tabs — Partners includes data-provider routes (external services). */
export type MarketplaceFilter = "core" | "partner" | "all";

/**
 * Syra-built endpoints: scraping, synthesis, signals, internal bundles.
 * Excludes third-party API wrappers (Jupiter, CoinGecko, Nansen, etc.).
 */
const SYRA_CORE_PATH_PREFIXES = [
  "brain",
  "news",
  "signal",
  "sentiment",
  "event",
  "trending-headline",
  "sundown-digest",
  "indicator",
  "spcx",
  "equity",
  "arbitrage",
  "bitcoin",
  "health",
  "mpp/health",
] as const;

/** Third-party data proxied through Syra (DEX, oracle, TVL, tokens.xyz, OpenRouter, etc.). */
const DATA_PROVIDER_PATH_PREFIXES = [
  "rise",
  "pumpfun/scout",
  "8004",
  "jupiter/quote",
  "pumpfun/trending",
  "pumpfun/movers",
  "pumpfun/analyzer",
  "coingecko",
  "dexscreener",
  "geckoterminal",
  "defillama",
  "rugcheck",
  "pyth",
  "assets",
  "assets/detail",
  "chat/completions",
  "images/generations",
  "videos/generations",
] as const;

const PARTNER_GROUP_SLUGS = new Set([
  "partner-gateway",
  "nansen",
  "binance",
  "bankr",
  "giza",
  "neynar",
  "siwa",
  "x",
  "x-analyzer",
  "quicknode",
  "heylol",
  "purch-vault",
  "8004scan",
  "squid",
  "tokens-dex",
  "agent",
  "mpp-lane",
]);

const DATA_PROVIDER_GROUP_SLUGS = new Set([
  "onchain-data",
  "coingecko",
  "pumpfun",
  "assets",
  "jupiter",
  "rise",
  "8004",
]);

function normalizePath(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
}

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function getMarketplaceTier(flow: ExampleFlowPreset): MarketplaceTier {
  const rawPath = getPlaygroundSyraPathname(flow.url);
  const path = normalizePath(rawPath || flow.url);

  for (const prefix of SYRA_CORE_PATH_PREFIXES) {
    if (matchesPrefix(path, prefix)) return "core";
  }

  for (const prefix of DATA_PROVIDER_PATH_PREFIXES) {
    if (matchesPrefix(path, prefix)) return "data-provider";
  }

  const group = getFlowGroup(flow).slug;
  if (PARTNER_GROUP_SLUGS.has(group)) return "partner";
  if (DATA_PROVIDER_GROUP_SLUGS.has(group)) return "data-provider";

  // External-origin example flows (Nansen direct, etc.)
  if (flow.id.startsWith("nansen-") || flow.id.startsWith("syra-gateway-")) {
    return "partner";
  }

  return "core";
}

export function filterFlowsByMarketplaceTier(
  flows: ExampleFlowPreset[],
  filter: MarketplaceFilter,
): ExampleFlowPreset[] {
  if (filter === "all") return flows;
  if (filter === "partner") {
    return flows.filter((f) => {
      const tier = getMarketplaceTier(f);
      return tier === "partner" || tier === "data-provider";
    });
  }
  return flows.filter((f) => getMarketplaceTier(f) === "core");
}

export function countFlowsByTier(flows: ExampleFlowPreset[]): Record<MarketplaceTier, number> {
  const counts: Record<MarketplaceTier, number> = {
    core: 0,
    "data-provider": 0,
    partner: 0,
  };
  for (const flow of flows) {
    counts[getMarketplaceTier(flow)] += 1;
  }
  return counts;
}

export const MARKETPLACE_FILTER_LABELS: Record<MarketplaceFilter, string> = {
  core: "Syra Core",
  partner: "Partners",
  all: "All APIs",
};

export const MARKETPLACE_FILTER_DESCRIPTIONS: Record<MarketplaceFilter, string> = {
  core: "Internal intelligence — scraping, signals, and Syra-built synthesis. No third-party API passthrough.",
  partner:
    "External services — onchain data providers (Jupiter, DexScreener, …) and partner gateways (Nansen, Binance, Bankr, …).",
  all: "All x402 endpoints — Syra Core and external partners.",
};

/** Brand / service label for grouping partner-tier APIs in the marketplace. */
export interface PartnerServiceBrand {
  slug: string;
  name: string;
}

const PARTNER_BRAND_ORDER: string[] = [
  "jupiter",
  "pumpfun",
  "dexscreener",
  "geckoterminal",
  "defillama",
  "pyth",
  "rugcheck",
  "coingecko",
  "rise",
  "tokens-xyz",
  "openrouter",
  "erc-8004",
  "nansen",
  "binance",
  "bankr",
  "giza",
  "neynar",
  "siwa",
  "x",
  "x-analyzer",
  "quicknode",
  "squid",
  "heylol",
  "8004scan",
  "purch-vault",
  "tokens-dex",
  "syra-agent",
];

const PATH_BRAND_RULES: ReadonlyArray<{ prefix: string; brand: PartnerServiceBrand }> = [
  { prefix: "jupiter/", brand: { slug: "jupiter", name: "Jupiter" } },
  { prefix: "pumpfun/", brand: { slug: "pumpfun", name: "pump.fun" } },
  { prefix: "rise", brand: { slug: "rise", name: "RISE Scout" } },
  { prefix: "coingecko", brand: { slug: "coingecko", name: "CoinGecko" } },
  { prefix: "dexscreener/", brand: { slug: "dexscreener", name: "DexScreener" } },
  { prefix: "geckoterminal/", brand: { slug: "geckoterminal", name: "GeckoTerminal" } },
  { prefix: "defillama/", brand: { slug: "defillama", name: "DefiLlama" } },
  { prefix: "rugcheck/", brand: { slug: "rugcheck", name: "RugCheck" } },
  { prefix: "pyth/", brand: { slug: "pyth", name: "Pyth" } },
  { prefix: "assets/detail", brand: { slug: "tokens-xyz", name: "tokens.xyz" } },
  { prefix: "assets", brand: { slug: "tokens-xyz", name: "tokens.xyz" } },
  { prefix: "chat/completions", brand: { slug: "openrouter", name: "OpenRouter" } },
  { prefix: "images/generations", brand: { slug: "openrouter", name: "OpenRouter" } },
  { prefix: "videos/generations", brand: { slug: "openrouter", name: "OpenRouter" } },
  { prefix: "8004/", brand: { slug: "erc-8004", name: "ERC-8004" } },
  { prefix: "nansen/", brand: { slug: "nansen", name: "Nansen" } },
  { prefix: "binance/", brand: { slug: "binance", name: "Binance" } },
  { prefix: "bankr/", brand: { slug: "bankr", name: "Bankr" } },
  { prefix: "giza/", brand: { slug: "giza", name: "Giza" } },
  { prefix: "neynar/", brand: { slug: "neynar", name: "Neynar" } },
  { prefix: "siwa/", brand: { slug: "siwa", name: "SIWA" } },
  { prefix: "x-analyzer", brand: { slug: "x-analyzer", name: "X Analyzer" } },
  { prefix: "quicknode/", brand: { slug: "quicknode", name: "Quicknode" } },
];

const ID_BRAND_RULES: ReadonlyArray<{ prefix: string; brand: PartnerServiceBrand }> = [
  { prefix: "nansen-", brand: { slug: "nansen", name: "Nansen" } },
  { prefix: "syra-gateway-nansen", brand: { slug: "nansen", name: "Nansen" } },
  { prefix: "binance-", brand: { slug: "binance", name: "Binance" } },
  { prefix: "syra-gateway-binance", brand: { slug: "binance", name: "Binance" } },
  { prefix: "syra-gateway-bankr", brand: { slug: "bankr", name: "Bankr" } },
  { prefix: "syra-gateway-giza", brand: { slug: "giza", name: "Giza" } },
  { prefix: "syra-gateway-neynar", brand: { slug: "neynar", name: "Neynar" } },
  { prefix: "syra-gateway-siwa", brand: { slug: "siwa", name: "SIWA" } },
  { prefix: "purch-", brand: { slug: "purch-vault", name: "Purch Vault" } },
  { prefix: "8004scan-", brand: { slug: "8004scan", name: "8004scan" } },
  { prefix: "8004-", brand: { slug: "erc-8004", name: "ERC-8004" } },
  { prefix: "x402-8004", brand: { slug: "erc-8004", name: "ERC-8004" } },
  { prefix: "x-feed", brand: { slug: "x", name: "X (Twitter)" } },
  { prefix: "x-user", brand: { slug: "x", name: "X (Twitter)" } },
  { prefix: "x-search-recent", brand: { slug: "x", name: "X (Twitter)" } },
  { prefix: "jupiter-", brand: { slug: "jupiter", name: "Jupiter" } },
  { prefix: "x402-pumpfun", brand: { slug: "pumpfun", name: "pump.fun" } },
  { prefix: "pumpfun-", brand: { slug: "pumpfun", name: "pump.fun" } },
  { prefix: "x402-rise", brand: { slug: "rise", name: "RISE Scout" } },
  { prefix: "rise-", brand: { slug: "rise", name: "RISE Scout" } },
  { prefix: "x402-coingecko", brand: { slug: "coingecko", name: "CoinGecko" } },
  { prefix: "coingecko-", brand: { slug: "coingecko", name: "CoinGecko" } },
  { prefix: "assets-", brand: { slug: "tokens-xyz", name: "tokens.xyz" } },
  { prefix: "squid-", brand: { slug: "squid", name: "Squid" } },
  { prefix: "quicknode-", brand: { slug: "quicknode", name: "Quicknode" } },
  { prefix: "heylol-", brand: { slug: "heylol", name: "HeyLol" } },
  { prefix: "agent-", brand: { slug: "syra-agent", name: "Syra Agent" } },
  { prefix: "token-god-mode", brand: { slug: "tokens-dex", name: "Tokens & DEX" } },
  { prefix: "bubblemaps-maps", brand: { slug: "tokens-dex", name: "Tokens & DEX" } },
  { prefix: "trending-jupiter", brand: { slug: "tokens-dex", name: "Tokens & DEX" } },
];

function brandFromPath(path: string): PartnerServiceBrand | null {
  for (const { prefix, brand } of PATH_BRAND_RULES) {
    if (matchesPrefix(path, prefix)) return brand;
  }
  return null;
}

function brandFromId(id: string): PartnerServiceBrand | null {
  const lower = id.toLowerCase();
  for (const { prefix, brand } of ID_BRAND_RULES) {
    if (lower === prefix || lower.startsWith(prefix)) return brand;
  }
  return null;
}

/** Resolve the external service brand for a partner-tier flow. */
export function getPartnerServiceBrand(flow: ExampleFlowPreset): PartnerServiceBrand {
  const rawPath = getPlaygroundSyraPathname(flow.url);
  const path = normalizePath(rawPath || flow.url);
  const fromPath = brandFromPath(path);
  if (fromPath) return fromPath;

  const fromId = brandFromId(flow.id);
  if (fromId) return fromId;

  const group = getFlowGroup(flow);
  if (group.slug === "onchain-data") {
    return { slug: "onchain-data", name: "Onchain data" };
  }
  if (group.slug !== "partner-gateway" && group.slug !== "syra-core") {
    return { slug: group.slug, name: group.name };
  }

  return { slug: "other", name: "Other partners" };
}

export interface PartnerBrandGroup {
  brand: PartnerServiceBrand;
  flows: ExampleFlowPreset[];
}

/** Group partner flows by external service brand, preserving catalog sort order. */
export function groupPartnerFlowsByBrand(flows: ExampleFlowPreset[]): PartnerBrandGroup[] {
  const bySlug = new Map<string, PartnerBrandGroup>();
  for (const flow of flows) {
    const brand = getPartnerServiceBrand(flow);
    const existing = bySlug.get(brand.slug);
    if (existing) {
      existing.flows.push(flow);
    } else {
      bySlug.set(brand.slug, { brand, flows: [flow] });
    }
  }

  const ordered: PartnerBrandGroup[] = [];
  for (const slug of PARTNER_BRAND_ORDER) {
    const group = bySlug.get(slug);
    if (group) ordered.push(group);
  }
  for (const [slug, group] of bySlug) {
    if (!PARTNER_BRAND_ORDER.includes(slug)) ordered.push(group);
  }
  return ordered;
}
