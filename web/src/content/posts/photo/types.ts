import type { PostUpdateMeta } from "@/content/posts/types";
import type { PostPhotoLayoutTemplate } from "./layouts";
import type { PostPhotoCardRole } from "./photoCardSlots";

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

/** Fields templates pull from when rendering a photo card. */
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
  /** Partner brand for integration / partnership lockup templates */
  partnerName: string;
  /** Public path, e.g. /images/partners/jupiter.png */
  partnerLogo: string;
}

export interface PostPhotoCardDef {
  role: PostPhotoCardRole;
  layout: PostPhotoLayoutTemplate;
  content: PostPhotoContent;
  shareCopy: string;
  /** Optional unique link appended on copy when shareCopy has no URL of its own. */
  shareCopyFooter?: string;
}

export interface PostPhotoUpdate {
  meta: PostUpdateMeta;
  /** Exactly 15 cards — one per narrative slot in POST_PHOTO_CARD_SLOTS order. */
  cards: PostPhotoCardDef[];
}
