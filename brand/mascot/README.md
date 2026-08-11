# Syra mascot brief

Status: v1 kit. Character, not a scene. One face only.

**Syra** is a compact geometric lynx (signal hunter / agent-familiar). Personality: calm, precise, paid. Not cute, not a deity, not a robot army.

Product metaphor: an agent you send out to settle x402, fetch intel, and come back. Sticker, not statue.

## Silhouette (must read at 32px)

- Lynx: tufted ears, short compact body, thick tail with a squared tip.
- Default: sit or stand on a small node cube. One ear slightly tipped.
- Eyes: two simple slits or dots. No pupils, no brows, no eyelashes.
- Chest plate: the **official shield mark** is a permanent decal on the sternum armor. Cyan pip sits beside it. Never on the collar, shoulder, or floating.
- No extra costume. No second character.

## Palette

| Role | Hex | Use |
| --- | --- | --- |
| Background | `#050505` | Canvas |
| Body | `#1A1A1A` to `#3A3A3A` | Armor plates |
| Edge / face | `#E8E8E8` | Ears, muzzle, badge outline |
| Accent (live) | `#3EE0B8` | Eyes, ear inner, one collar pip |
| Gold (rare) | `#F3BA2F` | Premium beats only, never default |

Cap: dark + gray + **one** cyan accent. No rainbow neon.

## Style

Flat / 2.5D cel. Hard edges. Two or three gray values. Almost no texture, no fog, no photoreal fur. Same line weight every time.

## Expressions (only these four)

| Key | Face | Use |
| --- | --- | --- |
| idle | Neutral slits, one ear tipped | Default PFP, waiting, brand posts |
| 402 | Eyes brighter cyan, small pay-chip or pulse at the paw | Payment required / settle |
| success | Slight eye-narrow, cyan pip on | Call succeeded, proof |
| error | Ears flatter, cyan dimmed to gray | Fail, retry, limits |

Same head, same proportions. Do not invent a fifth face until this sheet is tired.

## Logo rule

The product mark stays the product mark: [`web/public/images/logo.jpg`](../../web/public/images/logo.jpg).

It is a **chest-plate decal**. Placement is hand-tuned per pose in [`scripts/apply-official-mark.py`](scripts/apply-official-mark.py) (`PLACEMENTS`). The mark stays upright with only gentle foreshortening. Never a strong wrap that distorts the S. White strokes only, on the sternum plate. Side view: thin edge on the front of the chest, never a floating badge.

```bash
python3 brand/mascot/scripts/apply-official-mark.py --auto poses/01-intro.png
```

Do not ask a model to invent a new S or `$`. Side view: thin edge on the front of the chest, never moved to the shoulder. Transparent mark: [`assets/syra-mark.png`](assets/syra-mark.png).

## Do

- Foreground the lynx. One product fact per post.
- Crop to the silhouette. It must still be Syra.
- Dim cinematic B-roll behind the character if you want mood.
- Keep the turnaround proportions.

## Don't

- New robots, coin-god poses, overflowing chests, marching armies.
- Redraw the badge as `$`, a new S, or the Solana logo.
- Move the badge to the collar, shoulder, or a floating sticker.
- Photoreal, painterly, or a different costume per post.
- A second mascot (human in a chair, sidekick drone).
- Triumphant / wealth-porn tone. Voice is direct, technical, proof-first.

## Kit files

| File | What |
| --- | --- |
| [assets/syra-mark.png](assets/syra-mark.png) | Official shield mark, transparent. Stamp this. Do not redraw. |
| [assets/syra-lynx-key.png](assets/syra-lynx-key.png) | Canonical key. Attach this to every new gen. |
| [assets/turnaround.png](assets/turnaround.png) | Front, 3/4, side |
| [assets/expressions.png](assets/expressions.png) | idle, 402, success, error |
| [assets/x-idle.png](assets/x-idle.png) | X template: idle |
| [assets/x-402.png](assets/x-402.png) | X template: pay |
| [assets/x-proof.png](assets/x-proof.png) | X template: proof |
| [announce/x-announce-4x5.png](announce/x-announce-4x5.png) | X announcement (use this) |
| [announce/POST.md](announce/POST.md) | Caption + alt text |
| [series/](series/) | 5-post growth series + captions |
| [og/og-banner.png](og/og-banner.png) | Site OG / link preview (1200x630). Mark + type only, no mascot. Also `web/public/images/og-banner.png`. |
| [og/og-square.png](og/og-square.png) | Square crop (1200x1200) for WhatsApp / iMessage. |
| [PROMPTS.md](PROMPTS.md) | Locked generation prompts |

Regenerate OG assets:

```bash
python3 brand/mascot/scripts/render-og-banner.py
```

X copy is a layout reference. Set final type in a design tool using the overlay table in `PROMPTS.md`.

## Website

Product uses a transparent sticker at `web/public/images/mascot.png` via `SyraMascot`.

| Surface | Why |
| --- | --- |
| `/agent` empty state | First meet. Idle. |
| Marketplace 402 card | Pay-per-call moment. |
| `/brand#mascot` | Canonical rules. |

Keep the official mark in nav, footer, and page loader.
