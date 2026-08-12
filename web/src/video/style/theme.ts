/**
 * Single source of truth for the Syra cinematic video look.
 * All preview + export compositions read from this object.
 */

export interface PostVideoTheme {
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  accentSoft: string;
  accentLine: string;
  cardBorder: string;
  cardBg: string;
  faint: string;
  vignette: string;
  revealOffsetY: number;
  enterFrames: number;
  exitFrames: number;
  enterY: number;
  exitY: number;
  spring: {
    reveal: { damping: number; mass: number; stiffness: number };
    slide: { damping: number; mass: number; stiffness: number };
    chrome: { damping: number; mass: number; stiffness: number };
    scene: { damping: number; mass: number; stiffness: number };
  };
}

/** Syra Cinematic, white canvas / dark type / gold accent, depth stage, smooth springs. */
export const SYRA_VIDEO_THEME: PostVideoTheme = {
  bg: "#FFFFFF",
  fg: "rgba(0,0,0,0.92)",
  muted: "rgba(0,0,0,0.55)",
  accent: "#F3BA2F",
  accentSoft: "rgba(243,186,47,0.16)",
  accentLine: "rgba(243,186,47,0.55)",
  cardBorder: "rgba(0,0,0,0.12)",
  cardBg:
    "linear-gradient(165deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.015) 55%, transparent 100%)",
  faint: "rgba(0,0,0,0.12)",
  vignette: "rgba(0,0,0,0.08)",
  revealOffsetY: 28,
  enterFrames: 24,
  exitFrames: 12,
  enterY: 18,
  exitY: -10,
  spring: {
    reveal: { damping: 200, mass: 0.8, stiffness: 135 },
    slide: { damping: 200, mass: 1.1, stiffness: 105 },
    chrome: { damping: 200, mass: 0.65, stiffness: 150 },
    scene: { damping: 200, mass: 1.1, stiffness: 110 },
  },
};
