import type { PostSlideKind } from "./types";
import type { PostSlideLayoutTemplate } from "./layouts";

export type PostVideoSlideRole =
  | "cover"
  | "statement"
  | "hero"
  | "flow"
  | "cards"
  | "surfaces"
  | "impact"
  | "closing";

export interface PostVideoSlideSlotDef {
  role: PostVideoSlideRole;
  kind: PostSlideKind;
  label: string;
  description: string;
  defaultLayout: PostSlideLayoutTemplate;
}

/**
 * Canonical 8-slide video deck — every future ship log must follow this kind order.
 * Layouts may vary per update; kinds and count may not.
 */
export const POST_VIDEO_SLIDE_SLOTS: readonly PostVideoSlideSlotDef[] = [
  {
    role: "cover",
    kind: "cover",
    label: "Cover",
    description: "Hero announcement with title and hook",
    defaultLayout: "cover-brand-lockup",
  },
  {
    role: "statement",
    kind: "statement",
    label: "Thesis",
    description: "Why this matters — problem statement",
    defaultLayout: "statement-large-type",
  },
  {
    role: "hero",
    kind: "hero",
    label: "Shipped",
    description: "What we built with highlight bullets",
    defaultLayout: "hero-compact",
  },
  {
    role: "flow",
    kind: "flow",
    label: "Flow",
    description: "Step-by-step how it works",
    defaultLayout: "flow-numbered",
  },
  {
    role: "cards",
    kind: "cards",
    label: "Features",
    description: "Feature or coverage cards",
    defaultLayout: "cards-row",
  },
  {
    role: "surfaces",
    kind: "surfaces",
    label: "Surfaces",
    description: "Where operators and agents see it",
    defaultLayout: "surfaces-tiles",
  },
  {
    role: "impact",
    kind: "impact",
    label: "Impact",
    description: "Proof stats with narrative",
    defaultLayout: "impact-stats",
  },
  {
    role: "closing",
    kind: "closing",
    label: "CTA",
    description: "Closing call-to-action with links",
    defaultLayout: "closing-minimal",
  },
] as const;

export const POST_VIDEO_SLIDE_COUNT = POST_VIDEO_SLIDE_SLOTS.length;

export const POST_VIDEO_SLIDE_SLOT_BY_ROLE = new Map<PostVideoSlideRole, PostVideoSlideSlotDef>(
  POST_VIDEO_SLIDE_SLOTS.map((slot) => [slot.role, slot]),
);
