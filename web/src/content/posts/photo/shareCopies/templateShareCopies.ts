import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for the permanent format template — instructional, not a product ship. */
export const TEMPLATE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `FORMAT TEMPLATE · Syra ship log (reference — not a product post).

Video: 8 slides in fixed kind order.
Photo: 15 cards in fixed role order.

Clone this structure for every future ship log.`,

  thesis: `Why a locked template?

Decks drifted — extra slides, missing CTAs, export overflows.
One format keeps every ship log growth-ready and export-safe.`,

  quote: `"Replace the copy. Keep the slots."

defineVideoUpdate() and definePhotoUpdate() enforce the format at import time.
The Format Template entry on /post cannot be deleted.`,

  flow: `Ship a new log in 4 steps:

1. Create *Update.ts with defineVideoUpdate (8 kinds)
2. Create *Photo.ts with definePhotoUpdate (15 roles)
3. Add shareCopies + register the bundle
4. Export from /post/video or /post/photo`,

  timeline: `Canonical video arc:

01 Cover — announce
02 Thesis — why it matters
03 Shipped — what we built
04 Flow — how it works
05 Features — cards
06 Surfaces — where it lives
07 Impact — proof
08 CTA — links`,

  pillars: `Four rules for every ship log:

→ 8 video slides, kind order fixed
→ 15 photo cards, role order fixed
→ Prefer shorter copy over CSS tweaks
→ Template on /post stays forever`,

  checklist: `Before you register a new update:

→ defineVideoUpdate — 8 kinds in order
→ definePhotoUpdate — 15 roles in order
→ Share copy per photo card
→ Field limits pass (validatePhotoPostContent)
→ Bundle appended in registry.ts`,

  metrics: `Format contract:

8 — video slides
15 — photo cards
0 — template updateNumber (locked)

Future logs use the next updateNumber. Never delete #0.`,

  featured: `One permanent reference.

Update #0 · Format Template · meta.locked: true

Studio delete controls skip it. API soft-delete skips it.`,

  comparison: `Before vs after this template:

Before — freeform decks, uneven depth
After — same arc every time, clone and fill

Growth posts stay consistent on X.`,

  launch: `FORMAT LOCKED · Syra ship log studio.

New content follows the template.
Open /post → Format Template → Video or Photo.`,

  deepDive: `Technical checklist:

→ videoSlideSlots.ts — 8 kind slots
→ photoCardSlots.ts — 15 role slots
→ defineVideoUpdate / definePhotoUpdate
→ postLocked.ts — undeletable template
→ registry: TEMPLATE_POST + TEMPLATE_PHOTO`,

  split: `Operators get a pinned reference on /post.

Builders get import-time enforcement.
Design stays stable; only the story changes.`,

  terminal: `$ defineVideoUpdate(meta, slides)
# 8 slides · cover→…→closing

$ definePhotoUpdate(meta, cards)
# 15 cards · cover→…→cta

ok · format locked`,

  cta: `Ready for the next ship?

Clone the Format Template structure.
Register the bundle. Export. Post.

→ syraa.fun/post`,
};
