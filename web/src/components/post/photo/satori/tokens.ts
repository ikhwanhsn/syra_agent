import type { PostPhotoCardRole } from "@/content/posts/photo/photoCardSlots";

/** Shared Syra palette — aligned with video style presets. */
export const PHOTO = {
  bg: "#050505",
  fg: "rgba(255,255,255,0.95)",
  muted: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.35)",
  line: "rgba(255,255,255,0.12)",
  cardBorder: "rgba(255,255,255,0.12)",
  cardBg: "rgba(255,255,255,0.05)",
  accent: "#F3BA2F",
  accentSoft: "rgba(243,186,47,0.18)",
  accentLine: "rgba(243,186,47,0.55)",
  accentDim: "rgba(243,186,47,0.08)",
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

/** Per-role ambient tint — keeps the 15-card deck visually distinct. */
const ROLE_TINT: Record<PostPhotoCardRole, string> = {
  cover: "rgba(243,186,47,0.22)",
  thesis: "rgba(243,186,47,0.14)",
  quote: "rgba(180,140,60,0.18)",
  flow: "rgba(80,160,220,0.14)",
  timeline: "rgba(100,180,160,0.14)",
  pillars: "rgba(243,186,47,0.16)",
  checklist: "rgba(90,200,140,0.14)",
  metrics: "rgba(243,186,47,0.20)",
  featured: "rgba(243,186,47,0.28)",
  comparison: "rgba(220,100,80,0.12)",
  launch: "rgba(243,186,47,0.24)",
  deepDive: "rgba(120,140,220,0.14)",
  split: "rgba(243,186,47,0.12)",
  terminal: "rgba(80,200,120,0.12)",
  cta: "rgba(243,186,47,0.26)",
};

export function getRoleTint(role: PostPhotoCardRole): string {
  return ROLE_TINT[role] ?? PHOTO.accentSoft;
}

export const PHOTO_PIXEL_RATIO = 2;
