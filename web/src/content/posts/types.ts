import type { LucideIcon } from "lucide-react";
import type { PostSlideLayoutTemplate } from "./layouts";

export type PostSlideKind =
  | "cover"
  | "statement"
  | "hero"
  | "flow"
  | "cards"
  | "surfaces"
  | "impact"
  | "closing";

export interface PostUpdateMeta {
  id: string;
  title: string;
  published: string;
  tagline: string;
  /** Ready-to-post X copy when sharing the video deck (screen recording). */
  shareCopyVideo: string;
  /** Ready-to-post X copy when sharing a photo card. */
  shareCopyPhoto: string;
}

export interface PostSlideBase {
  id: string;
  kind: PostSlideKind;
  /** Visual template (pick a unique one per slide in each update). */
  layout: PostSlideLayoutTemplate;
  label: string;
}

export interface PostCoverSlide extends PostSlideBase {
  kind: "cover";
  eyebrow: string;
  title: string;
  subtitle: string;
  badge: string;
}

export interface PostStatementSlide extends PostSlideBase {
  kind: "statement";
  kicker: string;
  headline: string;
  body: string;
}

export interface PostHeroSlide extends PostSlideBase {
  kind: "hero";
  kicker: string;
  headline: string;
  body: string;
  highlights: string[];
}

export interface PostFlowSlide extends PostSlideBase {
  kind: "flow";
  kicker: string;
  headline: string;
  steps: { step: string; title: string; description: string }[];
}

export interface PostCardsSlide extends PostSlideBase {
  kind: "cards";
  kicker: string;
  headline: string;
  cards: { title: string; subtitle: string; detail: string; accent?: "gold" | "default" }[];
}

export interface PostSurfacesSlide extends PostSlideBase {
  kind: "surfaces";
  kicker: string;
  headline: string;
  items: { icon: LucideIcon; title: string; description: string; href?: string }[];
}

export interface PostImpactSlide extends PostSlideBase {
  kind: "impact";
  kicker: string;
  headline: string;
  stats: { value: string; label: string }[];
  narrative: string;
}

export interface PostClosingSlide extends PostSlideBase {
  kind: "closing";
  headline: string;
  subline: string;
  links: { label: string; value: string; href: string }[];
}

export type PostSlide =
  | PostCoverSlide
  | PostStatementSlide
  | PostHeroSlide
  | PostFlowSlide
  | PostCardsSlide
  | PostSurfacesSlide
  | PostImpactSlide
  | PostClosingSlide;

export interface PostUpdate {
  meta: PostUpdateMeta;
  slides: PostSlide[];
}
