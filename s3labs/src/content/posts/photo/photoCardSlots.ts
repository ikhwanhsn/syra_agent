import type { PostPhotoLayoutTemplate } from "./layouts";

export type PostPhotoCardRole =
  | "cover"
  | "thesis"
  | "quote"
  | "flow"
  | "timeline"
  | "pillars"
  | "checklist"
  | "metrics"
  | "featured"
  | "comparison"
  | "launch"
  | "deepDive"
  | "split"
  | "terminal"
  | "cta";

export interface PostPhotoCardSlotDef {
  role: PostPhotoCardRole;
  label: string;
  description: string;
  defaultLayout: PostPhotoLayoutTemplate;
}

/** Fifteen fixed narrative slots — one image + one X post each per fund brief. */
export const POST_PHOTO_CARD_SLOTS: readonly PostPhotoCardSlotDef[] = [
  {
    role: "cover",
    label: "Cover",
    description: "Hero announcement with title and hook",
    defaultLayout: "photo-cover-spotlight",
  },
  {
    role: "thesis",
    label: "Thesis",
    description: "Why this matters — problem statement",
    defaultLayout: "photo-statement-accent",
  },
  {
    role: "quote",
    label: "Quote",
    description: "Pull quote with supporting narrative",
    defaultLayout: "photo-quote",
  },
  {
    role: "flow",
    label: "Flow",
    description: "Horizontal pipeline — how it works",
    defaultLayout: "photo-flow-pipeline",
  },
  {
    role: "timeline",
    label: "Timeline",
    description: "Vertical step-by-step walkthrough",
    defaultLayout: "photo-timeline",
  },
  {
    role: "pillars",
    label: "Pillars",
    description: "Four key pillars as feature cards",
    defaultLayout: "photo-cards-quad",
  },
  {
    role: "checklist",
    label: "Checklist",
    description: "Headline with highlight checklist",
    defaultLayout: "photo-hero-checklist",
  },
  {
    role: "metrics",
    label: "Metrics",
    description: "Three-up stats with narrative",
    defaultLayout: "photo-stat-trio",
  },
  {
    role: "featured",
    label: "Featured",
    description: "One dominant metric or proof point",
    defaultLayout: "photo-stat-featured",
  },
  {
    role: "comparison",
    label: "Comparison",
    description: "Before / after side by side",
    defaultLayout: "photo-comparison",
  },
  {
    role: "launch",
    label: "Launch",
    description: "Badge-led launch or feature announcement",
    defaultLayout: "photo-announcement",
  },
  {
    role: "deepDive",
    label: "Deep dive",
    description: "Technical numbered list or items",
    defaultLayout: "photo-numbered-list",
  },
  {
    role: "split",
    label: "Split",
    description: "Split hero with highlights aside",
    defaultLayout: "photo-hero-split",
  },
  {
    role: "terminal",
    label: "Terminal",
    description: "CLI / verification demo",
    defaultLayout: "photo-terminal",
  },
  {
    role: "cta",
    label: "CTA",
    description: "Closing call-to-action with links",
    defaultLayout: "photo-closing-cta",
  },
] as const;

export const POST_PHOTO_CARD_COUNT = POST_PHOTO_CARD_SLOTS.length;

export const POST_PHOTO_CARD_SLOT_BY_ROLE = new Map<PostPhotoCardRole, PostPhotoCardSlotDef>(
  POST_PHOTO_CARD_SLOTS.map((slot) => [slot.role, slot]),
);
