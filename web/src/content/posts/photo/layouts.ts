import {
  POST_PHOTO_LAYOUTS_BATCH2,
  POST_PHOTO_LAYOUT_LABELS_BATCH2,
  type PostPhotoLayoutTemplateBatch2,
} from "./layoutsBatch2";

/** Batch 1 — original 25 photo templates */
export const POST_PHOTO_LAYOUTS_BASE = [
  "photo-cover-spotlight",
  "photo-cover-minimal",
  "photo-cover-split",
  "photo-cover-brand",
  "photo-statement-center",
  "photo-statement-accent",
  "photo-statement-large",
  "photo-statement-boxed",
  "photo-quote",
  "photo-announcement",
  "photo-hero-checklist",
  "photo-hero-split",
  "photo-hero-compact",
  "photo-stat-featured",
  "photo-stat-trio",
  "photo-stat-duo",
  "photo-metric-strip",
  "photo-cards-duo",
  "photo-cards-quad",
  "photo-timeline",
  "photo-flow-pipeline",
  "photo-numbered-list",
  "photo-comparison",
  "photo-closing-cta",
  "photo-terminal",
] as const;

export type PostPhotoLayoutTemplateBase = (typeof POST_PHOTO_LAYOUTS_BASE)[number];

const POST_PHOTO_LAYOUT_LABELS_BASE: Record<PostPhotoLayoutTemplateBase, string> = {
  "photo-cover-spotlight": "Cover spotlight",
  "photo-cover-minimal": "Cover minimal",
  "photo-cover-split": "Cover split",
  "photo-cover-brand": "Cover brand lockup",
  "photo-statement-center": "Statement center",
  "photo-statement-accent": "Statement accent bar",
  "photo-statement-large": "Statement large type",
  "photo-statement-boxed": "Statement boxed",
  "photo-quote": "Quote block",
  "photo-announcement": "Announcement",
  "photo-hero-checklist": "Hero checklist",
  "photo-hero-split": "Hero split",
  "photo-hero-compact": "Hero compact",
  "photo-stat-featured": "Featured stat",
  "photo-stat-trio": "Stat trio",
  "photo-stat-duo": "Stat duo",
  "photo-metric-strip": "Metric strip",
  "photo-cards-duo": "Cards duo",
  "photo-cards-quad": "Cards quad",
  "photo-timeline": "Timeline",
  "photo-flow-pipeline": "Flow pipeline",
  "photo-numbered-list": "Numbered list",
  "photo-comparison": "Compare columns",
  "photo-closing-cta": "Closing CTA",
  "photo-terminal": "Terminal",
};

export const POST_PHOTO_LAYOUTS = [...POST_PHOTO_LAYOUTS_BASE, ...POST_PHOTO_LAYOUTS_BATCH2] as const;

export type PostPhotoLayoutTemplate = PostPhotoLayoutTemplateBase | PostPhotoLayoutTemplateBatch2;

export const POST_PHOTO_LAYOUT_COUNT = POST_PHOTO_LAYOUTS.length;

export const POST_PHOTO_LAYOUT_LABELS: Record<PostPhotoLayoutTemplate, string> = {
  ...POST_PHOTO_LAYOUT_LABELS_BASE,
  ...POST_PHOTO_LAYOUT_LABELS_BATCH2,
};

export {
  POST_PHOTO_LAYOUTS_BATCH2,
  POST_PHOTO_LAYOUT_LABELS_BATCH2,
  type PostPhotoLayoutTemplateBatch2,
};
