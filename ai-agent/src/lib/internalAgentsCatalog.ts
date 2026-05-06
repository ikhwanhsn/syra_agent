export type InternalAgentSlug =
  | "agent-team"
  | "x402-pulse"
  | "growth-syra-market"
  | "growth-syra-social"
  | "growth-sector-narrative";

export const INTERNAL_AGENT_SLUGS: readonly InternalAgentSlug[] = [
  "agent-team",
  "x402-pulse",
  "growth-syra-market",
  "growth-syra-social",
  "growth-sector-narrative",
] as const;

export function isInternalAgentSlug(value: string): value is InternalAgentSlug {
  return (INTERNAL_AGENT_SLUGS as readonly string[]).includes(value);
}

export const INTERNAL_AGENTS: readonly {
  slug: InternalAgentSlug;
  name: string;
  subtitle: string;
}[] = [
  {
    slug: "agent-team",
    name: "Growth · Agent team",
    subtitle: "Crawl Syra surfaces → internal research → business strategy → Telegram",
  },
  {
    slug: "x402-pulse",
    name: "Growth · x402 pulse",
    subtitle: "X recent search → OpenRouter digest → Telegram",
  },
  {
    slug: "growth-syra-market",
    name: "Growth · SYRA market",
    subtitle: "DexScreener + Jupiter quote + CoinGecko macro → liquidity & path to ~$1M-class FDV (informational)",
  },
  {
    slug: "growth-syra-social",
    name: "Growth · SYRA social",
    subtitle: "X ($SYRA / syra_agent / syraa.fun) → community & distribution signals",
  },
  {
    slug: "growth-sector-narrative",
    name: "Growth · SYRA sector",
    subtitle: "X (AI agents / x402) + SOL·BTC·ETH spot → positioning ideas for Syra",
  },
] as const;

export function getInternalAgentMeta(slug: InternalAgentSlug) {
  return INTERNAL_AGENTS.find((a) => a.slug === slug);
}

export function requireInternalAgentMeta(slug: InternalAgentSlug) {
  const m = getInternalAgentMeta(slug);
  if (!m) throw new Error(`Missing internal agent meta for ${slug}`);
  return m;
}
