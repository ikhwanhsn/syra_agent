import type { PostPhotoCardRole } from "@/content/posts/photo/photoCardSlots";

/** Shared Syra palette for photo posts: white canvas, dark type. */
export const PHOTO = {
  bg: "#FFFFFF",
  fg: "rgba(0,0,0,0.92)",
  muted: "rgba(0,0,0,0.55)",
  faint: "rgba(0,0,0,0.38)",
  line: "rgba(0,0,0,0.10)",
  cardBorder: "rgba(0,0,0,0.12)",
  cardBg: "rgba(0,0,0,0.03)",
  accent: "#000000",
  accentSoft: "rgba(0,0,0,0.06)",
  accentLine: "rgba(0,0,0,0.35)",
  accentDim: "rgba(0,0,0,0.04)",
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

/** Per-role ambient tint, soft ink so the 15-card deck stays distinct on white. */
const ROLE_TINT: Record<PostPhotoCardRole, string> = {
  cover: "rgba(0,0,0,0.07)",
  thesis: "rgba(0,0,0,0.045)",
  quote: "rgba(0,0,0,0.035)",
  flow: "rgba(0,0,0,0.03)",
  timeline: "rgba(0,0,0,0.03)",
  pillars: "rgba(0,0,0,0.045)",
  checklist: "rgba(0,0,0,0.03)",
  metrics: "rgba(0,0,0,0.06)",
  featured: "rgba(0,0,0,0.08)",
  comparison: "rgba(0,0,0,0.03)",
  launch: "rgba(0,0,0,0.07)",
  deepDive: "rgba(0,0,0,0.03)",
  split: "rgba(0,0,0,0.045)",
  terminal: "rgba(0,0,0,0.03)",
  cta: "rgba(0,0,0,0.075)",
};

export function getRoleTint(role: PostPhotoCardRole): string {
  return ROLE_TINT[role] ?? PHOTO.accentSoft;
}

export const PHOTO_PIXEL_RATIO = 2;
