/**
 * Visual layout templates for /post slides.
 * Pick a different layout per slide in each update (see validatePostUpdate).
 */
import {
  POST_LAYOUT_KIND_EXTENDED,
  POST_LAYOUT_LABELS_EXTENDED,
  POST_SLIDE_LAYOUTS_EXTENDED,
  type PostSlideLayoutTemplateExtended,
} from "./layoutsExtended";

export const POST_SLIDE_LAYOUTS_BASE = [
  "cover-spotlight",
  "cover-split",
  "cover-minimal",
  "statement-centered",
  "statement-accent-bar",
  "statement-large-type",
  "hero-checklist",
  "hero-split",
  "hero-compact",
  "flow-pipeline",
  "flow-timeline",
  "flow-numbered",
  "cards-grid",
  "cards-bento",
  "cards-row",
  "surfaces-tiles",
  "surfaces-list",
  "impact-stats",
  "impact-featured-stat",
  "closing-links",
  "closing-minimal",
  "pillars-three",
  "metric-strip",
  "compare-columns",
] as const;

export type PostSlideLayoutTemplateBase = (typeof POST_SLIDE_LAYOUTS_BASE)[number];

const POST_LAYOUT_LABELS_BASE: Record<PostSlideLayoutTemplateBase, string> = {
  "cover-spotlight": "Cover spotlight",
  "cover-split": "Cover split",
  "cover-minimal": "Cover minimal",
  "statement-centered": "Statement center",
  "statement-accent-bar": "Statement accent",
  "statement-large-type": "Statement large",
  "hero-checklist": "Hero checklist",
  "hero-split": "Hero split",
  "hero-compact": "Hero compact",
  "flow-pipeline": "Flow pipeline",
  "flow-timeline": "Flow timeline",
  "flow-numbered": "Flow numbered",
  "cards-grid": "Cards grid",
  "cards-bento": "Cards bento",
  "cards-row": "Cards row",
  "surfaces-tiles": "Surface tiles",
  "surfaces-list": "Surface list",
  "impact-stats": "Impact stats",
  "impact-featured-stat": "Impact featured",
  "closing-links": "Closing links",
  "closing-minimal": "Closing minimal",
  "pillars-three": "Three pillars",
  "metric-strip": "Metric strip",
  "compare-columns": "Compare columns",
};

const POST_LAYOUT_KIND_BASE: Record<PostSlideLayoutTemplateBase, string> = {
  "cover-spotlight": "cover",
  "cover-split": "cover",
  "cover-minimal": "cover",
  "statement-centered": "statement",
  "statement-accent-bar": "statement",
  "statement-large-type": "statement",
  "hero-checklist": "hero",
  "hero-split": "hero",
  "hero-compact": "hero",
  "flow-pipeline": "flow",
  "flow-timeline": "flow",
  "flow-numbered": "flow",
  "cards-grid": "cards",
  "cards-bento": "cards",
  "cards-row": "cards",
  "surfaces-tiles": "surfaces",
  "surfaces-list": "surfaces",
  "impact-stats": "impact",
  "impact-featured-stat": "impact",
  "closing-links": "closing",
  "closing-minimal": "closing",
  "pillars-three": "hero",
  "metric-strip": "impact",
  "compare-columns": "statement",
};

export const POST_SLIDE_LAYOUTS = [...POST_SLIDE_LAYOUTS_BASE, ...POST_SLIDE_LAYOUTS_EXTENDED] as const;

export type PostSlideLayoutTemplate = PostSlideLayoutTemplateBase | PostSlideLayoutTemplateExtended;

export const POST_LAYOUT_TEMPLATE_COUNT = POST_SLIDE_LAYOUTS.length;

export const POST_LAYOUT_LABELS: Record<PostSlideLayoutTemplate, string> = {
  ...POST_LAYOUT_LABELS_BASE,
  ...POST_LAYOUT_LABELS_EXTENDED,
};

export const POST_LAYOUT_KIND: Record<PostSlideLayoutTemplate, string> = {
  ...POST_LAYOUT_KIND_BASE,
  ...POST_LAYOUT_KIND_EXTENDED,
};

export {
  POST_SLIDE_LAYOUTS_EXTENDED,
  POST_LAYOUT_LABELS_EXTENDED,
  POST_LAYOUT_KIND_EXTENDED,
  type PostSlideLayoutTemplateExtended,
};
