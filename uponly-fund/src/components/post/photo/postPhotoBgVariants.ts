import type { PostPhotoCardRole } from "@/content/posts/photo/photoCardSlots";

/** Per-card canvas background — emerald vault aesthetic (distinct from Syra gold). */
export type PostPhotoBgVariant =
  | "mandate"
  | "conviction"
  | "whisper"
  | "pipeline"
  | "rails"
  | "pillars"
  | "lattice"
  | "metrics"
  | "monolith"
  | "prism"
  | "aurora"
  | "depth"
  | "diagonal"
  | "matrix"
  | "close";

export const POST_PHOTO_BG_BY_ROLE: Record<PostPhotoCardRole, PostPhotoBgVariant> = {
  cover: "mandate",
  thesis: "conviction",
  quote: "whisper",
  flow: "pipeline",
  timeline: "rails",
  pillars: "pillars",
  checklist: "lattice",
  metrics: "metrics",
  featured: "monolith",
  comparison: "prism",
  launch: "aurora",
  deepDive: "depth",
  split: "diagonal",
  terminal: "matrix",
  cta: "close",
};

export function getPostPhotoBgVariant(role: PostPhotoCardRole): PostPhotoBgVariant {
  return POST_PHOTO_BG_BY_ROLE[role];
}

const WATERMARKS: Record<PostPhotoBgVariant, string> = {
  mandate: "↑",
  conviction: "01",
  whisper: "“",
  pipeline: "→",
  rails: "│",
  pillars: "◆",
  lattice: "✓",
  metrics: "80/20",
  monolith: "UOF",
  prism: "VS",
  aurora: "◎",
  depth: "§",
  diagonal: "╱",
  matrix: "$",
  close: "→",
};

export function getPostPhotoBgWatermark(variant: PostPhotoBgVariant): string {
  return WATERMARKS[variant];
}

const SIGNAL_TAGS: Record<PostPhotoBgVariant, string> = {
  mandate: "MANDATE",
  conviction: "THESIS",
  whisper: "QUOTE",
  pipeline: "ALLOCATE",
  rails: "STEPS",
  pillars: "PILLARS",
  lattice: "CHECK",
  metrics: "SLEEVE",
  monolith: "FOCUS",
  prism: "COMPARE",
  aurora: "LIVE",
  depth: "DILIGENCE",
  diagonal: "SPLIT",
  matrix: "TERMINAL",
  close: "BRIEF",
};

export function getPostPhotoBgSignalTag(variant: PostPhotoBgVariant): string {
  return SIGNAL_TAGS[variant];
}
