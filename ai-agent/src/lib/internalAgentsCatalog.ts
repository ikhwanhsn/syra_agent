export type InternalAgentSlug =
  | "agent-team"
  | "x402-pulse"
  | "growth-syra-market"
  | "growth-syra-social"
  | "growth-sector-narrative"
  | "hr-coach";

export const INTERNAL_AGENT_SLUGS: readonly InternalAgentSlug[] = [
  "agent-team",
  "x402-pulse",
  "growth-syra-market",
  "growth-syra-social",
  "growth-sector-narrative",
  "hr-coach",
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
    subtitle: "15-slot roster: crawl + research + strategy roles (6 short Telegram digests per run)",
  },
  {
    slug: "x402-pulse",
    name: "Growth · x402 pulse",
    subtitle: "X recent search → digest (2 short Telegram messages: scout + ecosystem watch)",
  },
  {
    slug: "growth-syra-market",
    name: "Growth · SYRA market",
    subtitle: "DexScreener + Jupiter + macro → two short digests (market pulse + liquidity desk)",
  },
  {
    slug: "growth-syra-social",
    name: "Growth · SYRA social",
    subtitle: "X ($SYRA / syra_agent / syraa.fun) → two short digests (social pulse + community liaison)",
  },
  {
    slug: "growth-sector-narrative",
    name: "Growth · SYRA sector",
    subtitle: "Sector X + spot macro → two short digests (sector narrative + macro signal)",
  },
  {
    slug: "hr-coach",
    name: "Growth · HR coach (slot 15/15)",
    subtitle: "Reads latest saves from other pipelines → short skill-improvement note for the 15-slot internal team",
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
