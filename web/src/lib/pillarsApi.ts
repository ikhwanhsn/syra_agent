import { syraFetch } from "@/lib/agentAuthApi";
import { getApiBaseUrl } from "@/lib/env";

const base = () => getApiBaseUrl().replace(/\/$/, "");

export type PillarId = "earn" | "treasury" | "invest" | "spend" | "grow";

export type PillarMeta = {
  id: PillarId;
  label: string;
  tagline: string;
  order: number;
  routePrefixes: string[];
  routeCount: number;
  toolCount: number;
};

export type PillarsDiscovery = {
  narrative: string;
  notice: string[];
  pillars: PillarMeta[];
};

export async function fetchPillarsDiscovery(): Promise<PillarsDiscovery> {
  const res = await fetch(`${base()}/pillars`, { headers: { Accept: "application/json" } });
  const json = (await res.json()) as { success: boolean; data?: PillarsDiscovery; error?: string };
  if (!json.success || !json.data) throw new Error(json.error ?? "Failed to load pillars");
  return json.data;
}

export async function fetchInvestOpportunities(anonymousId?: string) {
  const q = anonymousId ? `?anonymousId=${encodeURIComponent(anonymousId)}` : "";
  const res = await syraFetch(`${base()}/invest/opportunities${q}`);
  return res.json();
}

export async function fetchInvestPositions(anonymousId?: string) {
  const q = anonymousId ? `?anonymousId=${encodeURIComponent(anonymousId)}` : "";
  const res = await syraFetch(`${base()}/invest/positions${q}`);
  return res.json();
}

export async function fetchGrowRecommendations(address?: string, anonymousId?: string) {
  const params = new URLSearchParams();
  if (address) params.set("address", address);
  if (anonymousId) params.set("anonymousId", anonymousId);
  const q = params.toString() ? `?${params}` : "";
  const res = await syraFetch(`${base()}/grow/recommendations${q}`);
  return res.json();
}

export async function fetchGrowPortfolio(address: string) {
  const res = await syraFetch(`${base()}/grow/portfolio?address=${encodeURIComponent(address)}`);
  return res.json();
}

export async function fetchEarnSummary(walletOrAnonymousId: string) {
  const res = await fetch(
    `${base()}/earn/summary?wallet=${encodeURIComponent(walletOrAnonymousId)}`,
    { headers: { Accept: "application/json" } },
  );
  return res.json();
}

export const PILLAR_COPY: Record<
  PillarId,
  { headline: string; description: string; href: string }
> = {
  earn: {
    headline: "Earn",
    description: "Monetize agent skills — prompts, campaigns, and API work.",
    href: "/earn",
  },
  treasury: {
    headline: "Treasury",
    description: "Allocate capital across agent wallets with policy controls.",
    href: "/treasury",
  },
  invest: {
    headline: "Invest",
    description: "Deploy capital into yield, LP, and trading strategies.",
    href: "/invest",
  },
  spend: {
    headline: "Spend",
    description: "Pay per API call with x402 micropayments.",
    href: "/spend",
  },
  grow: {
    headline: "Grow",
    description: "Optimize your portfolio and compound returns.",
    href: "/grow",
  },
};
