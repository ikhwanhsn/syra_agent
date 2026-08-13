# Syra studio-card reference library

Canonical square (1:1) announcement system. Gold standard: **Design 2 / Showcase** (`syra-xlayer-showcase.png`).

Agents creating any Syra post image must read this file first, then open the matching reference PNG(s) with the Read tool before designing or exporting.

## System chrome (never invent a different brand frame)

Shared across every card:

- White / off-white atmospheric background plate (AI plate under vector overlay)
- Top-left: Syra logo mark + `SYRA` wordmark
- Top-right: small mono uppercase label (content type)
- Boxed headline: white Space Grotesk on solid black sticker bars
- Glossy dark surfaces for content modules (radial/linear black gradients, soft shadow, thin white border)
- Bottom: mono uppercase legal disclaimer (`PHOTO_XLAYER_DISCLAIMER`)
- Palette: black / white / gray only (no gold, no purple) unless the user explicitly asks otherwise
- Format: **1080×1080** @ 2× export (`PHOTO_SQUARE`, `PHOTO_PIXEL_RATIO`)

Code:

- Content defs: `web/src/content/announce/xlayerCards.ts`
- Templates: `web/src/components/post/photo/satori/templatesXLayer.tsx`
- Catalog (match table): `web/src/content/announce/referenceLibrary.ts`
- Studio UI: `/post/announce`
- Regenerate: `npm run generate:xlayer` (from `web/`)

## Archetypes (pick best match)

| ID | Use when content is about… | Reference PNG | Background plate |
|----|----------------------------|---------------|------------------|
| `showcase` | Feature grid, product tiles, winners, icons, capability map | `web/public/images/threads/syra-xlayer-showcase.png` | `web/public/images/threads/bg/bg-02-winners.png` |
| `metrics` | Numbers, KPIs, this-week stats, traction, uptime | `web/public/images/threads/syra-xlayer-metrics.png` | `web/public/images/threads/bg/bg-metrics.png` |
| `pillars` | 2–4 value props / reasons / primitives | `web/public/images/threads/syra-xlayer-pillars.png` | `web/public/images/threads/bg/bg-pillars.png` |
| `flow` | How it works, 3-step process, pipeline, loop | `web/public/images/threads/syra-xlayer-flow.png` | `web/public/images/threads/bg/bg-flow.png` |
| `quote` | Thesis, pull-quote, manifesto line | `web/public/images/threads/syra-xlayer-quote.png` | `web/public/images/threads/bg/bg-quote.png` |
| `comparison` | Before/after, vs, old vs Syra, keys vs wallets | `web/public/images/threads/syra-xlayer-comparison.png` | `web/public/images/threads/bg/bg-compare.png` |
| `checklist` | Ship log, shipped this week, bullet wins, done list | `web/public/images/threads/syra-xlayer-checklist.png` | `web/public/images/threads/bg/bg-checklist.png` |

Public URL paths (when web is served): `/images/threads/syra-xlayer-<id>.png`.

## Matching rules

1. Classify the user’s content into one row above (intent > wording).
2. **If a clear match:** reuse that archetype’s layout + chrome. Swap copy / modules only. Prefer regenerating via Satori (`xlayerCards` + `templatesXLayer`) over freehand AI full-frame text.
3. **If several could fit:** pick the one whose *primary* content module matches (numbers → metrics, steps → flow, list → checklist, etc.). Prefer fewer competing elements.
4. **If nothing matches well:** invent a **new** archetype. Still keep system chrome. Study **all** reference PNGs + bg plates for density, lighting, glossy tiles, boxed headlines, and spacing. Do not flatten into a slide deck.
5. After a new archetype is approved by the user, **add it to this library** (table row + PNG + bg plate + `xlayerCards` + `referenceLibrary.ts` + template layout).

## Quality bar (non-negotiable)

- Mid-frame still must show full layout (all modules visible, nothing clipped off canvas).
- Headline boxed stickers fully on-canvas; content rows centered with explicit widths (Satori does not flatten fragments the way browsers do — use real wrapper components).
- Atmospheric bg plate required; never flat white alone.
- Crisp vector text via Satori on top of the plate (no AI-baked body text on final deliverable).
- Founder-plain copy; no em dashes; concrete Syra facts when claiming product truth.

## Adding a new reference

1. Generate a bg-only plate (no text/logos), save under `web/public/images/threads/bg/bg-<id>.png`.
2. Add card def + layout module; export with `npm run generate:xlayer`.
3. Save final at `web/public/images/threads/syra-xlayer-<id>.png`.
4. Register in this file and in `referenceLibrary.ts`.
