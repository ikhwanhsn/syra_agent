import type { PostPhotoCardRole } from "@/content/posts/photo/photoCardSlots";

/** Shared Syra palette, aligned with landing monochrome. */
export const PHOTO = {
  bg: "#050505",
  fg: "rgba(255,255,255,0.95)",
  muted: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.35)",
  line: "rgba(255,255,255,0.12)",
  cardBorder: "rgba(255,255,255,0.12)",
  cardBg: "rgba(255,255,255,0.05)",
  accent: "#FFFFFF",
  accentSoft: "rgba(255,255,255,0.12)",
  accentLine: "rgba(255,255,255,0.40)",
  accentDim: "rgba(255,255,255,0.06)",
  black: "#000000",
  white: "#FFFFFF",
} as const;

export const PHOTO_SIZE = {
  width: 1200,
  height: 675,
  padX: 64,
  padY: 52,
  brandH: 48,
  footerH: 36,
} as const;

export const PHOTO_TYPE = {
  display: "Space Grotesk",
  body: "Inter",
  mono: "JetBrains Mono",
} as const;

/** Per-role ambient tint, graded white so the 15-card deck stays distinct. */
const ROLE_TINT: Record<PostPhotoCardRole, string> = {
  cover: "rgba(255,255,255,0.16)",
  thesis: "rgba(255,255,255,0.10)",
  quote: "rgba(255,255,255,0.08)",
  flow: "rgba(255,255,255,0.07)",
  timeline: "rgba(255,255,255,0.07)",
  pillars: "rgba(255,255,255,0.10)",
  checklist: "rgba(255,255,255,0.07)",
  metrics: "rgba(255,255,255,0.14)",
  featured: "rgba(255,255,255,0.20)",
  comparison: "rgba(255,255,255,0.06)",
  launch: "rgba(255,255,255,0.16)",
  deepDive: "rgba(255,255,255,0.07)",
  split: "rgba(255,255,255,0.10)",
  terminal: "rgba(255,255,255,0.06)",
  cta: "rgba(255,255,255,0.18)",
};

export function getRoleTint(role: PostPhotoCardRole): string {
  return ROLE_TINT[role] ?? PHOTO.accentSoft;
}

export const PHOTO_PIXEL_RATIO = 2;
