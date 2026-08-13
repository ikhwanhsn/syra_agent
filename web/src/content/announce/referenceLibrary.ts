/**
 * Machine-readable studio-card reference catalog.
 * Agents: match user content → pickArchetype() / findBestReference(), then open the PNG.
 */

import type { XLayerArchetype } from "@/content/announce/xlayerCards";

export interface StudioReference {
  id: XLayerArchetype;
  /** Human name for studio UI / logs */
  name: string;
  /** When this reference is the right pick */
  useWhen: string;
  /** Keywords / phrases that signal a match (lowercase) */
  matchTerms: string[];
  /** Final composited reference (repo-relative) */
  referencePng: string;
  /** Atmospheric bg plate (repo-relative) */
  bgPlate: string;
  /** Public URL path when web is served */
  publicUrl: string;
}

export const STUDIO_REFERENCES: StudioReference[] = [
  {
    id: "showcase",
    name: "Showcase",
    useWhen: "Feature grid, winners, capability tiles, icon map",
    matchTerms: [
      "showcase",
      "winners",
      "features",
      "tiles",
      "icons",
      "capabilities",
      "grid",
      "products",
      "build winners",
    ],
    referencePng: "web/public/images/threads/syra-xlayer-showcase.png",
    bgPlate: "web/public/images/threads/bg/bg-02-winners.png",
    publicUrl: "/images/threads/syra-xlayer-showcase.png",
  },
  {
    id: "metrics",
    name: "Metrics",
    useWhen: "Numbers, KPIs, traction, uptime, this-week stats",
    matchTerms: [
      "metrics",
      "numbers",
      "kpi",
      "stats",
      "traction",
      "uptime",
      "calls",
      "wallets",
      "this week",
      "by the numbers",
    ],
    referencePng: "web/public/images/threads/syra-xlayer-metrics.png",
    bgPlate: "web/public/images/threads/bg/bg-metrics.png",
    publicUrl: "/images/threads/syra-xlayer-metrics.png",
  },
  {
    id: "pillars",
    name: "Pillars",
    useWhen: "2–4 value props, reasons, primitives",
    matchTerms: [
      "pillars",
      "why",
      "value props",
      "primitives",
      "reasons",
      "built for",
      "pay verify ship",
    ],
    referencePng: "web/public/images/threads/syra-xlayer-pillars.png",
    bgPlate: "web/public/images/threads/bg/bg-pillars.png",
    publicUrl: "/images/threads/syra-xlayer-pillars.png",
  },
  {
    id: "flow",
    name: "Flow",
    useWhen: "How it works, steps, pipeline, payment loop",
    matchTerms: [
      "flow",
      "how it works",
      "steps",
      "pipeline",
      "loop",
      "process",
      "discover pay call",
      "sequence",
    ],
    referencePng: "web/public/images/threads/syra-xlayer-flow.png",
    bgPlate: "web/public/images/threads/bg/bg-flow.png",
    publicUrl: "/images/threads/syra-xlayer-flow.png",
  },
  {
    id: "quote",
    name: "Quote",
    useWhen: "Thesis, manifesto, pull-quote",
    matchTerms: [
      "quote",
      "thesis",
      "manifesto",
      "pull quote",
      "agents need wallets",
      "one liner",
      "statement",
    ],
    referencePng: "web/public/images/threads/syra-xlayer-quote.png",
    bgPlate: "web/public/images/threads/bg/bg-quote.png",
    publicUrl: "/images/threads/syra-xlayer-quote.png",
  },
  {
    id: "comparison",
    name: "Comparison",
    useWhen: "Before/after, vs, old stack vs Syra",
    matchTerms: [
      "comparison",
      "before",
      "after",
      "vs",
      "versus",
      "keys vs wallets",
      "old vs",
      "instead of",
    ],
    referencePng: "web/public/images/threads/syra-xlayer-comparison.png",
    bgPlate: "web/public/images/threads/bg/bg-compare.png",
    publicUrl: "/images/threads/syra-xlayer-comparison.png",
  },
  {
    id: "checklist",
    name: "Checklist",
    useWhen: "Ship log, shipped list, wins, done items",
    matchTerms: [
      "checklist",
      "ship log",
      "shipped",
      "done",
      "wins",
      "bullet",
      "list",
      "release notes",
    ],
    referencePng: "web/public/images/threads/syra-xlayer-checklist.png",
    bgPlate: "web/public/images/threads/bg/bg-checklist.png",
    publicUrl: "/images/threads/syra-xlayer-checklist.png",
  },
];

export type ArchetypeMatch =
  | { kind: "match"; reference: StudioReference; score: number }
  | { kind: "no-match"; reason: string };

/** Score content text against the catalog. Returns best match or no-match. */
export function findBestReference(contentBrief: string): ArchetypeMatch {
  const text = contentBrief.toLowerCase();
  let best: { reference: StudioReference; score: number } | null = null;

  for (const ref of STUDIO_REFERENCES) {
    let score = 0;
    for (const term of ref.matchTerms) {
      if (text.includes(term)) score += term.includes(" ") ? 3 : 1;
    }
    if (!best || score > best.score) best = { reference: ref, score };
  }

  if (!best || best.score < 2) {
    return {
      kind: "no-match",
      reason:
        "No catalog archetype scored high enough. Invent a new layout using all studio references as the design system.",
    };
  }

  return { kind: "match", reference: best.reference, score: best.score };
}

export function getReference(id: XLayerArchetype): StudioReference | undefined {
  return STUDIO_REFERENCES.find((r) => r.id === id);
}

/** All reference PNG paths (for invent-new-design: study every plate). */
export function allReferencePngs(): string[] {
  return STUDIO_REFERENCES.map((r) => r.referencePng);
}
