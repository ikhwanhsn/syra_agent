export type InternalAgentSlug = "trend-scout" | "partnership-scout" | "growth-scout";

export const INTERNAL_AGENT_SLUGS: readonly InternalAgentSlug[] = [
  "trend-scout",
  "partnership-scout",
  "growth-scout",
] as const;

export function isInternalAgentSlug(value: string): value is InternalAgentSlug {
  return (INTERNAL_AGENT_SLUGS as readonly string[]).includes(value);
}

export const INTERNAL_AGENTS: readonly {
  slug: InternalAgentSlug;
  name: string;
  subtitle: string;
  schedule: string;
}[] = [
  {
    slug: "trend-scout",
    name: "Trend Scout",
    subtitle: "Reads crypto news and events, then suggests posts to write and features to build.",
    schedule: "Runs daily at 6:00 WIB",
  },
  {
    slug: "partnership-scout",
    name: "Partnership Scout",
    subtitle: "Finds AI and on-chain projects worth partnering with or integrating into Syra.",
    schedule: "Runs daily at 6:15 WIB",
  },
  {
    slug: "growth-scout",
    name: "Growth Scout",
    subtitle: "Tracks users and TVL, then recommends what Syra should do next to grow.",
    schedule: "Runs daily at 6:30 WIB",
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
