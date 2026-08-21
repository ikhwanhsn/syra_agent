/**
 * Image + short text hype catalog.
 * Two golds: working copy (left thesis) and original door (foot sticker).
 * Agents: findBestHypeReference(), Read that PNG, then a new plate. Never clone the subject.
 */

import type { PortalVariant } from "@/content/announce/xlayerCards";

export interface HypeReference {
  id: string;
  name: string;
  portalVariant: PortalVariant;
  useWhen: string;
  matchTerms: string[];
  referencePng: string;
  bgPlate: string;
  publicUrl: string;
  subject: string;
}

export const HYPE_REFERENCES: HypeReference[] = [
  {
    id: "hype-working",
    name: "Working copy",
    portalVariant: "thesis",
    useWhen:
      "One-liner invite, manifesto, pull-quote. Type on the left, still open on the right.",
    matchTerms: [
      "one liner",
      "one-liner",
      "quote",
      "thesis",
      "manifesto",
      "first call",
      "invite",
      "pull quote",
      "statement",
      "the other side",
    ],
    referencePng: "web/public/images/threads/syra-xlayer-hype.png",
    bgPlate: "web/public/images/threads/bg/bg-portal.png",
    publicUrl: "/images/threads/syra-xlayer-hype.png",
    subject: "lone wooden door in fog",
  },
  {
    id: "hype-door",
    name: "Original door",
    portalVariant: "bottom",
    useWhen: "Centered caption on the still. Foot-sticker mood card.",
    matchTerms: [
      "sticker",
      "centered",
      "foot",
      "bottom caption",
      "mood still",
      "door",
      "portal",
    ],
    referencePng: "web/public/images/threads/syra-xlayer-portal.png",
    bgPlate: "web/public/images/threads/bg/bg-portal.png",
    publicUrl: "/images/threads/syra-xlayer-portal.png",
    subject: "lone wooden door in fog",
  },
];

export const HYPE_DEFAULT_ID = "hype-working";

export type HypeMatch =
  | { kind: "match"; reference: HypeReference; score: number }
  | { kind: "default"; reference: HypeReference; reason: string };

function scoreHype(text: string, ref: HypeReference): number {
  let score = 0;
  for (const term of ref.matchTerms) {
    if (text.includes(term)) score += term.includes(" ") ? 3 : 1;
  }
  return score;
}

/** Pick a hype layout. Defaults to the working copy (left thesis). */
export function findBestHypeReference(contentBrief: string): HypeMatch {
  const text = contentBrief.toLowerCase();
  let best: { reference: HypeReference; score: number } | null = null;

  for (const ref of HYPE_REFERENCES) {
    const score = scoreHype(text, ref);
    if (!best || score > best.score) best = { reference: ref, score };
  }

  const fallback =
    HYPE_REFERENCES.find((r) => r.id === HYPE_DEFAULT_ID) ?? HYPE_REFERENCES[0];

  if (!best || best.score < 2) {
    return {
      kind: "default",
      reference: fallback,
      reason: "No hype layout scored high enough. Default to working copy (left thesis).",
    };
  }

  return { kind: "match", reference: best.reference, score: best.score };
}

export function getHypeReference(id: string): HypeReference | undefined {
  return HYPE_REFERENCES.find((r) => r.id === id);
}

export function allHypeReferencePngs(): string[] {
  return HYPE_REFERENCES.map((r) => r.referencePng);
}
