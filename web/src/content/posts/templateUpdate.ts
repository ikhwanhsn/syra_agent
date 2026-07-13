import { FileImage, Film, LayoutTemplate, Lock, Sparkles, Type } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Permanent format template — cannot be deleted from the studio.
 * All future ship logs must follow this 8-slide video + 15-card photo structure.
 */
export const TEMPLATE_POST = defineVideoUpdate(
  {
    updateNumber: 0,
    id: "ship-log-format-template",
    title: "Format Template",
    published: "Permanent",
    tagline: "Locked reference for every future ship-log video + photo deck",
    locked: true,
    shareCopyVideo: `SHIP LOG FORMAT · Syra template (do not post as a product update).

Every ship log follows this deck:
1. Cover — announce the ship
2. Thesis — why it matters
3. Shipped — what we built
4. Flow — how it works
5. Features — cards
6. Surfaces — where to find it
7. Impact — proof stats
8. CTA — links

Photo decks use 15 fixed narrative slots. Copy only — keep layouts in slot order.`,
    shareCopyPhoto: `FORMAT TEMPLATE · Syra ship log.

Video: 8 slides (cover → thesis → shipped → flow → features → surfaces → impact → CTA).
Photo: 15 cards (cover → thesis → quote → flow → … → CTA).

Replace placeholder copy. Keep the slot order.`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log template",
      title: "Format Template",
      subtitle: "Locked reference deck — every future video update uses these 8 slide kinds in order.",
      badge: "8 slides · locked",
    },
    {
      id: "statement",
      kind: "statement",
      layout: "statement-large-type",
      label: "Thesis",
      kicker: "Why this exists",
      headline: "One format. Every ship log.",
      body: "Without a fixed narrative, decks drift — different slide counts, missing CTAs, broken exports. This template locks the story arc so growth posts stay consistent.",
    },
    {
      id: "hero",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What to fill in",
      headline: "Replace placeholders — keep the structure",
      body: "New updates clone this arc: announce, explain, prove, and close. Change copy and layouts within each kind; do not add, remove, or reorder slide kinds.",
      highlights: [
        "8 video slides in fixed kind order via defineVideoUpdate()",
        "15 photo cards in fixed role order via definePhotoUpdate()",
        "Template entry on /post cannot be deleted from the studio",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How to ship a log",
      headline: "From idea to X-ready deck",
      steps: [
        {
          step: "01",
          title: "Clone the slots",
          description: "Create *Update.ts + *Photo.ts using defineVideoUpdate and definePhotoUpdate.",
        },
        {
          step: "02",
          title: "Fill the copy",
          description: "Respect photo field limits. Prefer shorter lines over CSS tweaks.",
        },
        {
          step: "03",
          title: "Register the bundle",
          description: "Append { video, photo } to POST_UPDATE_BUNDLES in registry.ts.",
        },
        {
          step: "04",
          title: "Export and post",
          description: "Record video or download PNGs from /post — share copy is per card.",
        },
      ],
    },
    {
      id: "cards",
      kind: "cards",
      layout: "cards-row",
      label: "Features",
      kicker: "Slide kinds",
      headline: "Eight narrative beats",
      cards: [
        {
          title: "Cover",
          subtitle: "Announce",
          detail: "Eyebrow, title, subtitle, badge — the ship headline.",
          accent: "gold",
        },
        {
          title: "Thesis + Shipped",
          subtitle: "Explain",
          detail: "Problem statement, then what you built with highlights.",
          accent: "gold",
        },
        {
          title: "Flow + Features",
          subtitle: "Walkthrough",
          detail: "Numbered steps plus feature cards for coverage.",
        },
        {
          title: "Surfaces → CTA",
          subtitle: "Prove + close",
          detail: "Where it lives, impact stats, then links.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Studio surfaces",
      headline: "Where this template lives",
      items: [
        {
          icon: LayoutTemplate,
          title: "/post hub",
          description: "Pinned Format Template — always visible, never deletable.",
          href: "https://www.syraa.fun/post",
        },
        {
          icon: Film,
          title: "Video deck",
          description: "8 slides · 16:9 · defineVideoUpdate enforces kind order.",
          href: "https://www.syraa.fun/post/video/0",
        },
        {
          icon: FileImage,
          title: "Photo cards",
          description: "15 roles · 1200×675 · definePhotoUpdate enforces slot order.",
          href: "https://www.syraa.fun/post/photo/0",
        },
        {
          icon: Type,
          title: "Share copy",
          description: "Per-card X copy files under content/posts/photo/shareCopies.",
        },
        {
          icon: Lock,
          title: "Locked meta",
          description: "meta.locked: true — studio delete UI and API skip this update.",
        },
        {
          icon: Sparkles,
          title: "Future logs",
          description: "Append new bundles only — never remove this template entry.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "Format contract",
      headline: "Numbers that stay fixed",
      stats: [
        { value: "8", label: "Video slides" },
        { value: "15", label: "Photo cards" },
        { value: "1", label: "Locked template" },
      ],
      narrative:
        "Video kinds: cover → statement → hero → flow → cards → surfaces → impact → closing. Photo roles: cover through cta. New ship logs must match both.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "CTA",
      headline: "Build the next ship log from this format.",
      subline: "Open /post, clone the slots, register the bundle, export, then post.",
      links: [
        { label: "Studio", value: "syraa.fun/post", href: "https://www.syraa.fun/post" },
        { label: "Video", value: "syraa.fun/post/video/0", href: "https://www.syraa.fun/post/video/0" },
        { label: "Photo", value: "syraa.fun/post/photo/0", href: "https://www.syraa.fun/post/photo/0" },
      ],
    },
  ],
);
