import type { PostPhotoCardRole } from "@/content/posts/photo/photoCardSlots";

/** Distinct canvas background treatment — one per ship-log card role. */
export type PostPhotoBgVariant =
  | "brag"
  | "beam"
  | "whisper"
  | "conduit"
  | "rail"
  | "glass"
  | "lattice"
  | "halo"
  | "monolith"
  | "prism"
  | "aurora"
  | "vault"
  | "diagonal"
  | "matrix"
  | "gilded";

export const POST_PHOTO_BG_BY_ROLE: Record<PostPhotoCardRole, PostPhotoBgVariant> = {
  cover: "brag",
  thesis: "beam",
  quote: "whisper",
  flow: "conduit",
  timeline: "rail",
  pillars: "glass",
  checklist: "lattice",
  metrics: "halo",
  featured: "monolith",
  comparison: "prism",
  launch: "aurora",
  deepDive: "vault",
  split: "diagonal",
  terminal: "matrix",
  cta: "gilded",
};

export function getPostPhotoBgVariant(role: PostPhotoCardRole): PostPhotoBgVariant {
  return POST_PHOTO_BG_BY_ROLE[role];
}

const WATERMARKS: Partial<Record<PostPhotoBgVariant, string>> = {
  brag: "α",
  featured: "#1",
  launch: "GO",
  cta: "→",
};

export function getPostPhotoBgWatermark(variant: PostPhotoBgVariant): string | null {
  return WATERMARKS[variant] ?? null;
}

const SIGNAL_TAGS: Partial<Record<PostPhotoBgVariant, string>> = {
  brag: "SIGNAL",
  flow: "PIPELINE",
  timeline: "STEPS",
  metrics: "STATS",
  terminal: "TERMINAL",
  cta: "SHIP LOG",
};

export function getPostPhotoBgSignalTag(variant: PostPhotoBgVariant): string | null {
  return SIGNAL_TAGS[variant] ?? null;
}
