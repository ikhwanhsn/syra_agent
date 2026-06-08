import type { PostUpdateMeta } from "@/content/posts/types";
import type { PostPhotoLayoutTemplate } from "./layouts";

export interface PostPhotoCard {
  title: string;
  subtitle?: string;
  detail?: string;
  accent?: "gold" | "default";
}

export interface PostPhotoStep {
  step: string;
  title: string;
  description: string;
}

export interface PostPhotoStat {
  value: string;
  label: string;
}

export interface PostPhotoLink {
  label: string;
  value: string;
  href?: string;
}

/** Shared fields templates pull from when rendering a photo post update. */
export interface PostPhotoContent {
  eyebrow: string;
  badge: string;
  title: string;
  subtitle: string;
  kicker: string;
  headline: string;
  body: string;
  quote: string;
  highlights: string[];
  steps: PostPhotoStep[];
  cards: PostPhotoCard[];
  stats: PostPhotoStat[];
  narrative: string;
  links: PostPhotoLink[];
  /** Short list items for numbered / comparison templates */
  items: string[];
  compareLeft: { title: string; body: string };
  compareRight: { title: string; body: string };
  terminalLines: string[];
}

export interface PostPhotoUpdate {
  meta: PostUpdateMeta;
  content: PostPhotoContent;
  /**
   * Curated best templates for this ship log (typically 4–6).
   * The photo UI surfaces these first; the full library stays available under "More templates".
   */
  picks: PostPhotoLayoutTemplate[];
}
