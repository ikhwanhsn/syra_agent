import type { MetricShareVariantMeta } from "@/components/info/metricsShare/types";

/** Each section has 3 bespoke layouts — no shared template IDs across sections. */
export const SECTION_VARIANT_REGISTRY: Record<string, MetricShareVariantMeta[]> = {
  headline: [
    { index: 0, id: "monolith", label: "Monolith", description: "Centered hero stat on full canvas" },
    { index: 1, id: "band", label: "Signal band", description: "Title band + stat with orbit ring" },
    { index: 2, id: "ticker", label: "Edge ticker", description: "Floating card + vertical rail" },
  ],
  monetization: [
    { index: 0, id: "funnel", label: "Conversion funnel", description: "Cascading paid-rail steps" },
    { index: 1, id: "vault", label: "Gold vault", description: "Vault monolith + ledger column" },
    { index: 2, id: "receipt", label: "Rail receipt", description: "Monospace receipt strip" },
  ],
  charts: [
    { index: 0, id: "wall", label: "Chart wall", description: "Dual bar charts edge-to-edge" },
    { index: 1, id: "velocity", label: "Velocity row", description: "Counter strip + trend areas" },
    { index: 2, id: "timeline", label: "Timeline", description: "Single hero trend + corner stats" },
  ],
  revenue: [
    { index: 0, id: "ladder", label: "Rank ladder", description: "Full-width proportional bars" },
    { index: 1, id: "facets", label: "Source facets", description: "Source pills + ranked paths" },
    { index: 2, id: "marquee", label: "Marquee stack", description: "Stacked gold revenue cards" },
  ],
  traffic: [
    { index: 0, id: "river", label: "Pulse river", description: "Dominant area chart + chips" },
    { index: 1, id: "command", label: "Command grid", description: "6-tile traffic dashboard" },
    { index: 2, id: "terminal", label: "Terminal stream", description: "Dev-native log layout" },
  ],
  engagement: [
    { index: 0, id: "depth", label: "Depth dial", description: "Chat depth hero + growth bars" },
    { index: 1, id: "counter", label: "Counter rail", description: "Unified metric counter strip" },
    { index: 2, id: "zigzag", label: "Zigzag flow", description: "Session velocity timeline" },
  ],
  agents: [
    { index: 0, id: "podium", label: "Podium", description: "Top agents on victory podium" },
    { index: 1, id: "board", label: "Rank board", description: "Numbered agent leaderboard" },
    { index: 2, id: "matrix", label: "Tool matrix", description: "Agents + tools split grid" },
  ],
  playground: [
    { index: 0, id: "curve", label: "Adoption curve", description: "Area chart + share KPIs" },
    { index: 1, id: "orbit", label: "Chain orbit", description: "Chain pills + share stats" },
    { index: 2, id: "stack", label: "Share stack", description: "Vertical adoption cards" },
  ],
  health: [
    { index: 0, id: "rings", label: "Latency rings", description: "Conic gauge trio" },
    { index: 1, id: "histogram", label: "Status histogram", description: "Status code bar chart" },
    { index: 2, id: "spectrum", label: "Error spectrum", description: "Latency + error heat list" },
  ],
  endpoints: [
    { index: 0, id: "editorial", label: "Editorial rank", description: "Light canvas numbered list" },
    { index: 1, id: "terminal", label: "Dark terminal", description: "Mono path leaderboard" },
    { index: 2, id: "champion", label: "Champion", description: "#1 spotlight + chip grid" },
  ],
};

export function getSectionVariants(sectionId: string): MetricShareVariantMeta[] {
  return SECTION_VARIANT_REGISTRY[sectionId] ?? SECTION_VARIANT_REGISTRY.headline!;
}

export function getVariantMeta(sectionId: string, index: number): MetricShareVariantMeta {
  const variants = getSectionVariants(sectionId);
  return variants[index] ?? variants[0]!;
}

export function variantIndexFromId(sectionId: string, id: string): 0 | 1 | 2 {
  const idx = getSectionVariants(sectionId).findIndex((v) => v.id === id);
  return (idx >= 0 ? idx : 0) as 0 | 1 | 2;
}
