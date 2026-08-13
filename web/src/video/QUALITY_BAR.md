# Syra video quality bar (canonical)

**Craft references (floor, not templates):**  
[`compositions/LlmExchangePromo.tsx`](compositions/LlmExchangePromo.tsx), [`compositions/BridgePromo.tsx`](compositions/BridgePromo.tsx)

**Reusable toolkit:** [`engine/promoKit.tsx`](engine/promoKit.tsx)  
**Routing rule:** [`.cursor/rules/video-creation.mdc`](../../.cursor/rules/video-creation.mdc)

Every new Syra promo / ship-log / launch film must **meet or beat** this craft bar **and** feel like a **new film** for that ship. Do not ship a flat slide deck with fades. Do not clone a prior promo's storyboard, cue table, or hero-motion order unless the brief explicitly asks for a sequel cut.

## Creative first (required)

Past promos prove density and Syra chrome. They are **not** a fixed script.

For each new video, the design spec must include a **Differentiation** section:

1. Story spine unique to this update (what changed, who cares, one emotional arc)
2. Scene count / duration choice and why
3. Shotcraft Gallery cards or custom motion heroes used (name them)
4. BGM choice + SFX palette (paths under `remotion-public/audio/video/<slug>/`)
5. What you deliberately did **not** copy from the last promo

If the new film could be mistaken for a reskin of LLM Exchange or Bridge after swapping titles, keep iterating.

## Skills (always)

| Intent | Skill |
|--------|-------|
| Generate from scratch (no footage) | `~/.cursor/skills/video-shotcraft` |
| Edit raw footage | `~/.cursor/skills/video-use` |

Follow video-shotcraft `references/pipeline.md` stages 0–7 for generated promos. Prefer autonomous free creation when maximizing creativity. Host Remotion under `web/src/video/`.

## Hard layout rules

1. **Readable hierarchy:** clear header / body / caption zones on information scenes. Prefer `PromoSceneShell` when it fits; invent layouts when the beat needs it, as long as captions never collide with body.
2. **Reserve caption zone:** ~100–120px bottom safe area. Body content ends above it.
3. **No absolute scatter for content grids:** prefer CSS grid/flex for equal columns. Absolute positioning for overlays (scan lines, particles, wipes, 2.5D cameras).
4. **Mid-scene completeness:** tighten reveals so a still at ~40–50% of the scene shows the full promised layout (all N cards, not N−1).
5. **Equal columns:** multi-up grids use equal `1fr` tracks. Do not leave an empty cell when copy promises N items.
6. **Progress / connectors:** never draw lines *through* card text. Opaque card fills.
7. **Theme:** default [`SYRA_VIDEO_THEME`](style/theme.ts) — white `#FFFFFF`, dark type, gold `#F3BA2F`. Fonts: Inter / Space Grotesk / JetBrains Mono. Override only when the brief says so.

## Hard motion rules (minimum density)

Every promo must include **most** of these (references set the floor; pick fresh combinations):

- Deterministic particles (seeded hash, never `Math.random`)
- Ambient gold radial glows that drift
- Scene enter/exit with scale + opacity (not opacity alone)
- Intentional transitions between scenes (wipe, flash, smear, or a stronger shotcraft transition; vary over time)
- At least one title treatment with energy (shimmer, mask reveal, stamp, etc.)
- Spring or physically motivated entrances for key modules
- At least one hero camera / UI move (Ken Burns, PageCam push, orbit, deck deal, etc.)
- At least one sequential or rhythmic highlight beat
- CTA or brand hold ≥1s with a payoff (burst, settle, stamp)

One animation technique as the **hero per scene**. Hold brand marks ≥1s. Rest ~0.5s after batch reveals. Prefer pulling a stronger shotcraft demo over repeating the last promo's motion recipe.

## Audio (vary every ship)

- Declarative cue table with relative frame expressions (`scene.from + offset`)
- BGM behind a `bgm` inputProp (default true)
- Deliver **two** mp4s: BGM + no-BGM (SFX kept)
- **Default:** new BGM and a distinct SFX set under `remotion-public/audio/video/<slug>/`
- Reusing a prior bed or SFX folder is allowed only when documented in Differentiation (e.g. sequel cut, missing assets, intentional brand sting)
- Prefer shotcraft `assets/audio/` catalogs and unused beds over always linking `llm-exchange/*.mp3`

## Assets

- UI captures: fictional data only → `public/video-assets/<slug>/` **and** mirror into `remotion-public/video-assets/<slug>/`
- Audio: `remotion-public/audio/video/<slug>/` (or documented shared reuse)
- Deliverables: `public/videos/<slug>/`

## Format defaults

- 1920×1080 @ 30fps (duration follows the story; ~30–50s typical for feature launches)
- Founder-plain copy; commas/periods/colons; no em dashes
- Concrete product facts + clear CTA URLs (`syraa.fun/...`, docs)

## Definition of done

1. Registered in [`Root.tsx`](Root.tsx)
2. Design spec includes **Differentiation**
3. Per-scene `npx remotion still` QA (mid-scene frames): layout completeness + caption clearance
4. Independent QA against video-shotcraft `final-review.md` + `aesthetic-rules.md`
5. Both mp4s in `public/videos/<slug>/`
6. Craft density ≥ craft references **and** the film is not a reskin of a prior promo

## Scaffold checklist for a new promo

```
web/src/video/content/<slug>Promo.ts     # scenes, reveals, copy (unique spine)
web/src/video/compositions/<Slug>Promo.tsx
web/src/video/compositions/<slug>PromoAudio.tsx  # unique bed + SFX when possible
web/src/video/<slug>/design-spec.md      # must include Differentiation
web/src/video/<slug>/storyboard.md
remotion-public/video-assets/<slug>/
remotion-public/audio/video/<slug>/
public/videos/<slug>/
```

Import helpers from `promoKit.tsx` when useful. Raise the bar each time: stronger shotcraft demos, fresher sound, story that only this ship could tell.
