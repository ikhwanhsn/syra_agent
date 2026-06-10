import type { PostPhotoLayoutTemplate } from "./layouts";

export interface PostPhotoContextVariant {
  template: PostPhotoLayoutTemplate;
  style: string;
}

export interface PostPhotoContext {
  id: string;
  label: string;
  description: string;
  variants: [PostPhotoContextVariant, PostPhotoContextVariant, PostPhotoContextVariant];
}

/**
 * 25 content contexts × 3 visual styles = 75 photo templates.
 * Each context shares the same narrative role; variants differ in layout and art direction.
 */
export const POST_PHOTO_CONTEXTS: PostPhotoContext[] = [
  {
    id: "cover-spotlight",
    label: "Cover spotlight",
    description: "Hero cover with logo lockup and ship-log eyebrow",
    variants: [
      { template: "photo-cover-spotlight", style: "Classic" },
      { template: "photo-cover-gradient", style: "Gradient" },
      { template: "photo-cover-aurora", style: "Aurora" },
    ],
  },
  {
    id: "cover-minimal",
    label: "Cover minimal",
    description: "Type-forward cover with badge and subtitle",
    variants: [
      { template: "photo-cover-minimal", style: "Minimal" },
      { template: "photo-cover-type-hero", style: "Hero type" },
      { template: "photo-cover-whisper", style: "Whisper" },
    ],
  },
  {
    id: "cover-split",
    label: "Cover split",
    description: "Split cover with logo aside and narrative copy",
    variants: [
      { template: "photo-cover-split", style: "Split" },
      { template: "photo-cover-diagonal", style: "Diagonal" },
      { template: "photo-cover-prism", style: "Prism" },
    ],
  },
  {
    id: "cover-brand",
    label: "Cover brand",
    description: "Full brand lockup with URL and product title",
    variants: [
      { template: "photo-cover-brand", style: "Vault classic" },
      { template: "photo-cover-eyebrow-stack", style: "Eyebrow stack" },
      { template: "photo-cover-vault", style: "Vault premium" },
    ],
  },
  {
    id: "statement-center",
    label: "Statement center",
    description: "Centered thesis with kicker, headline, and body",
    variants: [
      { template: "photo-statement-center", style: "Center" },
      { template: "photo-statement-large", style: "Large type" },
      { template: "photo-statement-beam", style: "Light beam" },
    ],
  },
  {
    id: "statement-accent",
    label: "Statement accent",
    description: "Left-rail accent bar statement layout",
    variants: [
      { template: "photo-statement-accent", style: "Accent bar" },
      { template: "photo-statement-underline", style: "Underline" },
      { template: "photo-statement-neon", style: "Neon rail" },
    ],
  },
  {
    id: "statement-boxed",
    label: "Statement boxed",
    description: "Contained panel for focused narrative",
    variants: [
      { template: "photo-statement-boxed", style: "Boxed" },
      { template: "photo-statement-inverted", style: "Inverted" },
      { template: "photo-statement-lattice", style: "Lattice" },
    ],
  },
  {
    id: "statement-refined",
    label: "Statement refined",
    description: "Narrow column and premium frame treatments",
    variants: [
      { template: "photo-statement-narrow", style: "Narrow" },
      { template: "photo-statement-gold-frame", style: "Gold frame" },
      { template: "photo-statement-serif", style: "Editorial serif" },
    ],
  },
  {
    id: "statement-kinetic",
    label: "Statement kinetic",
    description: "Headline-first with kicker as closing anchor",
    variants: [
      { template: "photo-statement-kicker-bottom", style: "Kicker bottom" },
      { template: "photo-hero-quote", style: "Quote body" },
      { template: "photo-statement-kinetic", style: "Kinetic" },
    ],
  },
  {
    id: "quote",
    label: "Quote pull",
    description: "Pull quote with supporting narrative",
    variants: [
      { template: "photo-quote", style: "Pull quote" },
      { template: "photo-quote-centered", style: "Centered" },
      { template: "photo-quote-gilded", style: "Gilded" },
    ],
  },
  {
    id: "announcement",
    label: "Announcement",
    description: "Badge-led launch or feature announcement",
    variants: [
      { template: "photo-announcement", style: "Announcement" },
      { template: "photo-hero-compact", style: "Compact" },
      { template: "photo-editorial", style: "Editorial" },
    ],
  },
  {
    id: "hero-checklist",
    label: "Hero checklist",
    description: "Headline with highlight checklist",
    variants: [
      { template: "photo-hero-checklist", style: "Checklist" },
      { template: "photo-hero-numbered", style: "Numbered" },
      { template: "photo-hero-tiered", style: "Tiered" },
    ],
  },
  {
    id: "hero-split",
    label: "Hero split",
    description: "Split hero with highlights aside",
    variants: [
      { template: "photo-hero-split", style: "Split" },
      { template: "photo-hero-masonry", style: "Masonry" },
      { template: "photo-hero-frost", style: "Frost glass" },
    ],
  },
  {
    id: "stat-featured",
    label: "Stat featured",
    description: "One dominant metric with narrative",
    variants: [
      { template: "photo-stat-featured", style: "Featured" },
      { template: "photo-stat-narrative-first", style: "Narrative first" },
      { template: "photo-stat-monolith", style: "Monolith" },
    ],
  },
  {
    id: "stat-trio",
    label: "Stat trio",
    description: "Three-up metrics with headline",
    variants: [
      { template: "photo-stat-trio", style: "Trio grid" },
      { template: "photo-stat-counter-row", style: "Counter row" },
      { template: "photo-stat-facet", style: "Facet prism" },
    ],
  },
  {
    id: "stat-duo",
    label: "Stat duo",
    description: "Dual metrics or metric strip layout",
    variants: [
      { template: "photo-stat-duo", style: "Duo" },
      { template: "photo-metric-strip", style: "Metric strip" },
      { template: "photo-stat-gradient-bar", style: "Gradient bar" },
    ],
  },
  {
    id: "stat-orbit",
    label: "Stat orbit",
    description: "Orbital metric presentation",
    variants: [
      { template: "photo-stat-orbit", style: "Orbit" },
      { template: "photo-stat-halo", style: "Halo ring" },
      { template: "photo-stat-podium", style: "Podium" },
    ],
  },
  {
    id: "cards-duo",
    label: "Cards duo",
    description: "Two feature cards with headline",
    variants: [
      { template: "photo-cards-duo", style: "Duo grid" },
      { template: "photo-cards-stack", style: "Stack" },
      { template: "photo-cards-glass-duo", style: "Glass duo" },
    ],
  },
  {
    id: "cards-quad",
    label: "Cards quad",
    description: "Four-up token or feature cards",
    variants: [
      { template: "photo-cards-quad", style: "Quad grid" },
      { template: "photo-cards-bento", style: "Bento" },
      { template: "photo-cards-glass-quad", style: "Glass quad" },
    ],
  },
  {
    id: "cards-spotlight",
    label: "Cards spotlight",
    description: "One hero card with supporting tiles",
    variants: [
      { template: "photo-cards-spotlight", style: "Spotlight" },
      { template: "photo-cards-marquee", style: "Marquee" },
      { template: "photo-items-grid", style: "Feature grid" },
    ],
  },
  {
    id: "flow-timeline",
    label: "Flow timeline",
    description: "Step-by-step vertical or zigzag flow",
    variants: [
      { template: "photo-timeline", style: "Timeline" },
      { template: "photo-flow-zigzag", style: "Zigzag" },
      { template: "photo-flow-rail", style: "Vertical rail" },
    ],
  },
  {
    id: "flow-pipeline",
    label: "Flow pipeline",
    description: "Horizontal pipeline with connected nodes",
    variants: [
      { template: "photo-flow-pipeline", style: "Pipeline" },
      { template: "photo-flow-arrow-chain", style: "Arrow chain" },
      { template: "photo-flow-conduit", style: "Conduit" },
    ],
  },
  {
    id: "flow-numbered",
    label: "Flow numbered",
    description: "Numbered step list for technical flows",
    variants: [
      { template: "photo-numbered-list", style: "Numbered list" },
      { template: "photo-flow-ledger", style: "Ledger" },
      { template: "photo-terminal", style: "Terminal" },
    ],
  },
  {
    id: "comparison",
    label: "Before / after",
    description: "Side-by-side comparison columns",
    variants: [
      { template: "photo-comparison", style: "Classic" },
      { template: "photo-compare-gradient", style: "Gradient shift" },
      { template: "photo-compare-slide", style: "Slide panels" },
    ],
  },
  {
    id: "closing-cta",
    label: "Closing CTA",
    description: "Closing headline with links and subtitle",
    variants: [
      { template: "photo-closing-cta", style: "Center CTA" },
      { template: "photo-closing-banner", style: "Gold banner" },
      { template: "photo-closing-split", style: "Split CTA" },
    ],
  },
];

/** Flat list of all 75 templates in context order (A → B → C per context). */
export const POST_PHOTO_CONTEXT_ORDERED_LAYOUTS: PostPhotoLayoutTemplate[] = POST_PHOTO_CONTEXTS.flatMap(
  (ctx) => ctx.variants.map((v) => v.template),
);

export const POST_PHOTO_CONTEXT_COUNT = POST_PHOTO_CONTEXTS.length;

export const POST_PHOTO_CONTEXT_BY_TEMPLATE = new Map<PostPhotoLayoutTemplate, PostPhotoContext>(
  POST_PHOTO_CONTEXTS.flatMap((ctx) => ctx.variants.map((v) => [v.template, ctx] as const)),
);
