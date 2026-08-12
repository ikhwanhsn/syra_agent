# QA Report — TokensExplainer

**Date:** 2026-08-10  
**Composition:** TokensExplainer · 1920×1080 @ 30fps · 3150 frames (105.0s)

## Passed

| Check | Evidence |
|-------|----------|
| Composition loads | `npx remotion compositions` lists TokensExplainer |
| Full render (BGM) | `out/tokens-explainer.mp4` · 12.3 MB · 3150/3150 frames |
| Hook still | `out/qa/hook-f60.png` · logo, title, flow pill, caption |
| Problem still | `out/qa/problem-f400.png` |
| Board still | `out/qa/board-f1100.png` · rows + filters + caption |
| Dossier still | `out/qa/dossier-f1500.png` · OHLCV, grade A/92, markets |
| Agent still | `out/qa/agent-f2200.png` |
| Depth still | `out/qa/depth-f2550.png` |
| CTA still | `out/qa/cta-f2900.png` · syraa.fun/assets + docs.tokens.xyz |
| Brand contrast | Gold `#F3BA2F` on `#050505`; captions readable |
| No em dash in shot copy | Only unused copied lib comments contain U+2014 |
| Facts match repo story | OSS · 13 tools · 1 research path · resolve→risk→intel→action |

## Defects

None found in tested scope.

## Blocked / Not Tested

| Gap | Why |
|-----|-----|
| System `ffmpeg` not installed | Homebrew unavailable; Remotion bundled encoder used instead |
| Audio waveform scrub at every cut | No ffprobe on PATH; SFX pin table reviewed in code |
| Live page captures of `/assets` | Plan defaulted to brand-styled mock panels |
| Independent subagent final-review | Optional video-shotcraft stage 7; stills + full encode used instead |

## Residual Risk

- Demo prices/volumes are fictional; do not present as live market data.
- Remotion company license may be required before commercial distribution.
- BGM loop length vs 105s not beat-grid analyzed (house bed, not hard sync grid).

## Deliverables

- `out/tokens-explainer.mp4` (BGM + SFX)
- `out/tokens-explainer-nobgm.mp4` (SFX only, if render succeeded)
- `out/qa/*.png` keyframe stills
- `STORYBOARD.md`
