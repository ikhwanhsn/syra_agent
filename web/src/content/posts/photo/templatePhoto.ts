import { TEMPLATE_POST } from "../templateUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { TEMPLATE_PHOTO_SHARE_COPIES } from "./shareCopies/templateShareCopies";

const copies = TEMPLATE_PHOTO_SHARE_COPIES;

/** Photo-format content for the permanent Format Template — 15 cards, instructional copy. */
export const TEMPLATE_PHOTO = definePhotoUpdate(TEMPLATE_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log template",
      badge: "15 cards · locked",
      title: "Format Template",
      subtitle: "Permanent reference. Every future photo deck uses these 15 narrative slots in order.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "Why this exists",
      headline: "One format. Every ship log.",
      body: "Decks drifted without a contract. This template locks video kinds and photo roles so exports and X posts stay consistent.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Replace the copy. Keep the slots.",
      narrative: "defineVideoUpdate and definePhotoUpdate enforce the arc at import. The Format Template on /post cannot be deleted.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How to ship",
      headline: "Clone. Fill. Register. Export.",
      steps: [
        { step: "01", title: "Video file", description: "defineVideoUpdate: 8 kinds in order." },
        { step: "02", title: "Photo file", description: "definePhotoUpdate: 15 roles in order." },
        { step: "03", title: "Register", description: "Append the bundle in registry.ts." },
        { step: "04", title: "Export", description: "Record video or download PNGs from /post." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Video arc",
      headline: "Eight slides, fixed kinds.",
      steps: [
        { step: "01", title: "Cover", description: "Announce the ship with title and badge." },
        { step: "02", title: "Thesis", description: "Why it matters: problem statement." },
        { step: "03", title: "Shipped", description: "What you built with highlights." },
        { step: "04", title: "Flow → CTA", description: "Walkthrough, features, surfaces, impact, close." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four rules that never move.",
      cards: [
        { title: "8 video", subtitle: "Kind order", detail: "cover → … → closing via defineVideoUpdate.", accent: "gold" },
        { title: "15 photo", subtitle: "Role order", detail: "cover → … → cta via definePhotoUpdate.", accent: "gold" },
        { title: "Short copy", subtitle: "Export-safe", detail: "Prefer shorter lines over CSS shrinks." },
        { title: "Locked #0", subtitle: "Permanent", detail: "Format Template cannot be deleted." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      kicker: "Before register",
      headline: "Checklist for every new update",
      highlights: [
        "defineVideoUpdate: 8 kinds in template order",
        "definePhotoUpdate: 15 roles in slot order",
        "Share copy file for all 15 photo cards",
        "Field limits pass; bundle appended in registry",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      kicker: "Format contract",
      headline: "Numbers that stay fixed",
      stats: [
        { value: "8", label: "Video slides" },
        { value: "15", label: "Photo cards" },
        { value: "#0", label: "Locked template" },
      ],
      narrative: "Future ship logs take the next updateNumber. Update #0 stays as the permanent format reference.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      kicker: "Locked",
      headline: "One permanent reference on /post",
      stats: [{ value: "#0", label: "Format Template · meta.locked" }],
      narrative: "Studio delete UI and API soft-delete skip locked updates. Source files stay in the repo.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Freeform decks vs locked format",
      compareLeft: {
        title: "Before",
        body: "Uneven slide counts, missing CTAs, export overflows. Every ship log looked different.",
      },
      compareRight: {
        title: "After",
        body: "Same 8 + 15 arc every time. Clone the slots, replace copy, export for X.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Studio",
      badge: "Format locked",
      title: "Ship from the template",
      subtitle: "Open /post → Format Template → Video or Photo, then clone the structure for the next update.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Code map",
      headline: "Where the contract lives",
      items: [
        "videoSlideSlots.ts: 8 kind slots",
        "photoCardSlots.ts: 15 role slots",
        "defineVideoUpdate / definePhotoUpdate",
        "postLocked.ts: undeletable #0",
        "registry: TEMPLATE_POST + TEMPLATE_PHOTO",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      kicker: "Who it serves",
      headline: "Operators and builders share one format",
      body: "Pinned reference on /post for the team. Import-time enforcement for every new content file.",
      highlights: [
        "Pinned Format Template on the hub",
        "Import throws if slots are wrong",
        "Delete controls never remove #0",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      kicker: "CLI mental model",
      headline: "Enforce at define time",
      terminalLines: [
        "$ defineVideoUpdate(meta, slides)",
        "# 8 slides · cover → … → closing",
        "$ definePhotoUpdate(meta, cards)",
        "# 15 cards · cover → … → cta",
        "ok · format locked",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Build the next ship log from this format.",
      subline: "Clone the slots. Register the bundle. Export. Post.",
      links: [
        { label: "Studio", value: "syraa.fun/post", href: "https://www.syraa.fun/post" },
        { label: "Video", value: "/post/video/0", href: "https://www.syraa.fun/post/video/0" },
        { label: "Photo", value: "/post/photo/0", href: "https://www.syraa.fun/post/photo/0" },
      ],
    }),
  },
]);
