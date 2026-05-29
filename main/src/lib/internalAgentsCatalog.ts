export type InternalAgentSlug = "trend-scout" | "partnership-scout";

export const INTERNAL_AGENT_SLUGS: readonly InternalAgentSlug[] = [
  "trend-scout",
  "partnership-scout",
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
    slug: "trend-scout",
    name: "Trend Scout",
    subtitle:
      "Daily news, events & trending themes → Syra post ideas + product features (Telegram dev digest)",
  },
  {
    slug: "partnership-scout",
    name: "Partnership Scout",
    subtitle:
      "On-chain AI & utility projects (8004, x402, Jupiter) → collaboration & integration ideas for Syra",
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
