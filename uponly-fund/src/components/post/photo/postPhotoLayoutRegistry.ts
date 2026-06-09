import type { PostPhotoLayoutTemplate } from "@/content/posts/photo/layouts";

export type PhotoBlockId =
  | "eyebrow"
  | "badge"
  | "title"
  | "subtitle"
  | "kicker"
  | "headline"
  | "body"
  | "quote"
  | "narrative"
  | "logo-lockup"
  | "logo-hero"
  | "brand-name"
  | "highlights-all"
  | "highlights-3"
  | "highlights-4"
  | "stats-all"
  | "stats-2"
  | "stats-1"
  | "stats-strip"
  | "cards-2"
  | "cards-4"
  | "steps-timeline"
  | "steps-pipeline"
  | "steps-numbered"
  | "steps-zigzag"
  | "steps-arrows"
  | "compare"
  | "links"
  | "items-all"
  | "terminal"
  | "url-inline";

export type PhotoBodyAlign =
  | "center"
  | "left"
  | "split"
  | "split-balanced"
  | "accent"
  | "box"
  | "compare"
  | "terminal"
  | "banner"
  | "editorial";

export interface PhotoTemplateDef {
  id: PostPhotoLayoutTemplate;
  chrome?: {
    hideBrand?: boolean;
    hideFooter?: boolean;
    className?: string;
  };
  bodyClassName: string;
  align: PhotoBodyAlign;
  blocks: PhotoBlockId[];
  asideBlocks?: PhotoBlockId[];
}

export const POST_PHOTO_LAYOUT_REGISTRY: PhotoTemplateDef[] = [
  { id: "photo-cover-spotlight", bodyClassName: "post-photo-tmpl-cover-spotlight", align: "center", blocks: ["eyebrow", "badge", "logo-lockup", "subtitle"] },
  { id: "photo-cover-minimal", bodyClassName: "post-photo-tmpl-cover-minimal", align: "center", chrome: { hideBrand: true }, blocks: ["badge", "title", "eyebrow", "subtitle"] },
  { id: "photo-cover-split", bodyClassName: "post-photo-tmpl-cover-split", align: "split", blocks: ["eyebrow", "title", "subtitle"], asideBlocks: ["badge", "logo-hero"] },
  { id: "photo-cover-brand", bodyClassName: "post-photo-tmpl-cover-brand", align: "center", chrome: { hideBrand: true, hideFooter: true }, blocks: ["logo-hero", "brand-name", "badge", "title", "subtitle", "url-inline"] },
  { id: "photo-cover-gradient", bodyClassName: "post-photo-tmpl-cover-gradient", align: "center", chrome: { className: "post-photo-canvas--gradient" }, blocks: ["eyebrow", "badge", "logo-lockup", "subtitle"] },
  { id: "photo-cover-eyebrow-stack", bodyClassName: "post-photo-tmpl-cover-eyebrow-stack", align: "center", blocks: ["eyebrow", "title", "badge", "subtitle"] },
  { id: "photo-cover-diagonal", bodyClassName: "post-photo-tmpl-cover-diagonal", align: "split-balanced", blocks: ["kicker", "title", "subtitle"], asideBlocks: ["badge", "logo-hero"] },
  { id: "photo-cover-type-hero", bodyClassName: "post-photo-tmpl-cover-type-hero", align: "center", chrome: { hideBrand: true }, blocks: ["title", "badge", "eyebrow"] },

  { id: "photo-statement-center", bodyClassName: "post-photo-tmpl-statement-center", align: "center", blocks: ["kicker", "headline", "body"] },
  { id: "photo-statement-accent", bodyClassName: "post-photo-tmpl-statement-accent", align: "accent", blocks: ["kicker", "headline", "body"] },
  { id: "photo-statement-large", bodyClassName: "post-photo-tmpl-statement-large", align: "center", blocks: ["kicker", "headline", "body"] },
  { id: "photo-statement-boxed", bodyClassName: "post-photo-tmpl-statement-boxed", align: "box", blocks: ["kicker", "headline", "body"] },
  { id: "photo-statement-underline", bodyClassName: "post-photo-tmpl-statement-underline", align: "center", blocks: ["kicker", "headline", "body"] },
  { id: "photo-statement-inverted", bodyClassName: "post-photo-tmpl-statement-inverted", align: "box", blocks: ["kicker", "headline", "body"] },
  { id: "photo-statement-narrow", bodyClassName: "post-photo-tmpl-statement-narrow", align: "center", blocks: ["kicker", "headline", "body"] },
  { id: "photo-statement-gold-frame", bodyClassName: "post-photo-tmpl-statement-gold-frame", align: "box", blocks: ["kicker", "headline", "body"] },
  { id: "photo-statement-kicker-bottom", bodyClassName: "post-photo-tmpl-statement-kicker-bottom", align: "center", blocks: ["headline", "body", "kicker"] },

  { id: "photo-quote", bodyClassName: "post-photo-tmpl-quote", align: "center", blocks: ["kicker", "quote", "narrative"] },
  { id: "photo-quote-centered", bodyClassName: "post-photo-tmpl-quote-centered", align: "center", blocks: ["quote", "narrative"] },
  { id: "photo-announcement", bodyClassName: "post-photo-tmpl-announcement", align: "center", blocks: ["badge", "headline", "body"] },

  { id: "photo-hero-checklist", bodyClassName: "post-photo-tmpl-hero-checklist", align: "center", blocks: ["kicker", "headline", "highlights-4"] },
  { id: "photo-hero-split", bodyClassName: "post-photo-tmpl-hero-split", align: "split-balanced", blocks: ["kicker", "headline", "body"], asideBlocks: ["highlights-3"] },
  { id: "photo-hero-compact", bodyClassName: "post-photo-tmpl-hero-compact", align: "center", blocks: ["badge", "headline", "highlights-3"] },
  { id: "photo-hero-numbered", bodyClassName: "post-photo-tmpl-hero-numbered", align: "center", blocks: ["kicker", "headline", "highlights-4"] },
  { id: "photo-hero-masonry", bodyClassName: "post-photo-tmpl-hero-masonry", align: "center", blocks: ["kicker", "headline", "highlights-4"] },
  { id: "photo-hero-quote", bodyClassName: "post-photo-tmpl-hero-quote", align: "center", blocks: ["kicker", "quote", "body"] },

  { id: "photo-stat-featured", bodyClassName: "post-photo-tmpl-stat-featured", align: "center", blocks: ["kicker", "headline", "stats-1", "narrative"] },
  { id: "photo-stat-trio", bodyClassName: "post-photo-tmpl-stat-trio", align: "center", blocks: ["kicker", "headline", "stats-all", "narrative"] },
  { id: "photo-stat-duo", bodyClassName: "post-photo-tmpl-stat-duo", align: "center", blocks: ["headline", "stats-2", "narrative"] },
  { id: "photo-metric-strip", bodyClassName: "post-photo-tmpl-metric-strip", align: "center", blocks: ["kicker", "headline", "stats-strip", "narrative"] },
  { id: "photo-stat-counter-row", bodyClassName: "post-photo-tmpl-stat-counter-row", align: "center", blocks: ["kicker", "headline", "stats-all", "narrative"] },
  { id: "photo-stat-narrative-first", bodyClassName: "post-photo-tmpl-stat-narrative-first", align: "center", blocks: ["kicker", "narrative", "stats-all"] },
  { id: "photo-stat-orbit", bodyClassName: "post-photo-tmpl-stat-orbit", align: "center", blocks: ["headline", "stats-all", "narrative"] },

  { id: "photo-cards-duo", bodyClassName: "post-photo-tmpl-cards-duo", align: "center", blocks: ["kicker", "headline", "cards-2"] },
  { id: "photo-cards-quad", bodyClassName: "post-photo-tmpl-cards-quad", align: "center", blocks: ["kicker", "headline", "cards-4"] },
  { id: "photo-cards-stack", bodyClassName: "post-photo-tmpl-cards-stack", align: "center", blocks: ["kicker", "headline", "cards-2"] },
  { id: "photo-cards-bento", bodyClassName: "post-photo-tmpl-cards-bento", align: "center", blocks: ["kicker", "headline", "cards-4"] },
  { id: "photo-cards-spotlight", bodyClassName: "post-photo-tmpl-cards-spotlight", align: "center", blocks: ["kicker", "headline", "cards-4"] },

  { id: "photo-timeline", bodyClassName: "post-photo-tmpl-timeline", align: "left", blocks: ["kicker", "headline", "steps-timeline"] },
  { id: "photo-flow-pipeline", bodyClassName: "post-photo-tmpl-flow-pipeline", align: "center", blocks: ["kicker", "headline", "steps-pipeline"] },
  { id: "photo-numbered-list", bodyClassName: "post-photo-tmpl-numbered-list", align: "left", blocks: ["kicker", "headline", "steps-numbered"] },
  { id: "photo-flow-zigzag", bodyClassName: "post-photo-tmpl-flow-zigzag", align: "left", blocks: ["kicker", "headline", "steps-zigzag"] },
  { id: "photo-flow-arrow-chain", bodyClassName: "post-photo-tmpl-flow-arrow-chain", align: "center", blocks: ["kicker", "headline", "steps-arrows"] },

  { id: "photo-comparison", bodyClassName: "post-photo-tmpl-comparison", align: "compare", blocks: ["kicker", "headline", "compare"] },
  { id: "photo-items-grid", bodyClassName: "post-photo-tmpl-items-grid", align: "center", blocks: ["kicker", "headline", "items-all"] },

  { id: "photo-closing-cta", bodyClassName: "post-photo-tmpl-closing-cta", align: "center", blocks: ["headline", "subtitle", "links"] },
  { id: "photo-closing-banner", bodyClassName: "post-photo-tmpl-closing-banner", align: "banner", blocks: ["headline", "subtitle", "links"] },
  { id: "photo-closing-split", bodyClassName: "post-photo-tmpl-closing-split", align: "split-balanced", blocks: ["headline", "subtitle"], asideBlocks: ["links"] },

  { id: "photo-terminal", bodyClassName: "post-photo-tmpl-terminal", align: "terminal", blocks: ["terminal"] },
  { id: "photo-editorial", bodyClassName: "post-photo-tmpl-editorial", align: "editorial", blocks: ["eyebrow", "headline", "body", "badge"] },
];

export const POST_PHOTO_LAYOUT_REGISTRY_MAP = new Map(
  POST_PHOTO_LAYOUT_REGISTRY.map((def) => [def.id, def]),
);
