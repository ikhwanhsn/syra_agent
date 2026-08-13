# Syra video quality bar (canonical)

**Gold reference composition:** [`compositions/LlmExchangePromo.tsx`](compositions/LlmExchangePromo.tsx)  
**Reusable primitives:** [`engine/promoKit.tsx`](engine/promoKit.tsx)  
**Routing rule:** [`.cursor/rules/video-creation.mdc`](../../.cursor/rules/video-creation.mdc)

Every new Syra promo / ship-log / launch film must meet or beat this bar. Do not ship a flat slide deck with fades.

## Skills (always)

| Intent | Skill |
|--------|--------|
| Generate from scratch (no footage) | `~/.cursor/skills/video-shotcraft` |
| Edit raw footage | `~/.cursor/skills/video-use` |

Follow video-shotcraft `references/pipeline.md` stages 0–7 for generated promos. Host Remotion under `web/src/video/`.

## Hard layout rules

1. **Scene shell:** every information scene uses header / body / caption zones (see `PromoSceneShell` in promoKit). Captions never collide with body cards.
2. **Reserve caption zone:** ~100–120px bottom safe area. Body content ends above it.
3. **No absolute scatter:** prefer CSS grid/flex for equal columns. Absolute positioning only for overlays (scan lines, particles, wipes).
4. **Mid-scene completeness:** tighten element reveal offsets so a still at ~40–50% of the scene shows the full layout (e.g. all 4 protocol cards visible, not 3).
5. **Equal columns:** 2×2 and 4-up grids use equal `1fr` tracks. Do not leave an empty cell when copy promises N items.
6. **Progress / connectors:** never draw lines *through* card text. Put tracks above/between cards with opaque card fills.
7. **Theme:** default [`SYRA_VIDEO_THEME`](style/theme.ts) — white `#FFFFFF`, dark type, gold `#F3BA2F`. Fonts: Inter / Space Grotesk / JetBrains Mono.

## Hard motion rules (minimum density)

Every promo must include most of these (LlmExchange is the floor):

- Deterministic particles (seeded hash, never `Math.random`)
- Ambient gold radial glows that drift
- Scene enter/exit scale + opacity (not opacity alone)
- Gold wipe flash between scenes
- Title shimmer sweep
- Spring card entrances (translateY + scale, slight overshoot OK)
- At least one hero camera move (Ken Burns / push-in on a real UI plate)
- At least one sequential highlight (policy cycle, progress fill, VS pop)
- Typewriter or staged mono reveal for API routes when relevant
- CTA radial burst + hold ≥1s on brand/CTA

One animation technique as the hero per scene. Hold brand marks ≥1s. Rest 0.5s after batch reveals.

## Audio

- Declarative cue table with relative frame expressions (`scene.from + offset`)
- BGM behind a `bgm` inputProp (default true)
- Deliver **two** mp4s: BGM + no-BGM (SFX kept)
- Assets live in `remotion-public/` (Remotion `publicDir`), not only `public/`

## Assets

- UI captures: fictional data only → `public/video-assets/<slug>/` **and** mirror into `remotion-public/video-assets/<slug>/`
- Audio: `remotion-public/audio/video/<slug>/`
- Deliverables: `public/videos/<slug>/`

## Format defaults

- 1920×1080 @ 30fps (~35–45s for feature launches)
- Founder-plain copy; commas/periods/colons; no em dashes
- Concrete product facts + clear CTA URLs (`syraa.fun/...`, docs)

## Definition of done

1. Registered in [`Root.tsx`](Root.tsx)
2. Per-scene `npx remotion still` QA (mid-scene frames) — verify grid completeness and caption clearance
3. Independent QA against video-shotcraft `final-review.md` + `aesthetic-rules.md`
4. Both mp4s rendered and copied to `public/videos/<slug>/`
5. This video is at least as dense as LlmExchangePromo; if thinner, keep iterating

## Scaffold checklist for a new promo

```
web/src/video/content/<slug>Promo.ts     # scenes, reveals, copy
web/src/video/compositions/<Slug>Promo.tsx
web/src/video/compositions/<slug>PromoAudio.tsx
web/src/video/<slug>/design-spec.md
web/src/video/<slug>/storyboard.md
remotion-public/video-assets/<slug>/
remotion-public/audio/video/<slug>/
public/videos/<slug>/
```

Import layout/motion helpers from `engine/promoKit.tsx`. Raise the bar: add shotcraft shot-card demos when a motion needs another level of polish.
