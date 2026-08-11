# Locked generation prompts

Always attach [assets/syra-lynx-key.png](assets/syra-lynx-key.png) as the character reference. Do not start from a blank prompt. Overlay post copy in Figma, Canva, or Remotion. Do not trust baked-in AI type.

**Logo:** the official shield is a permanent decal on the **center chest armor**. Placement is hand-tuned per pose (upright, gentle foreshortening only). Cyan pip beside the badge. Never on the shoulder, collar, fist, or floating. After gen, stamp `syra-mark.png` via `apply-official-mark.py` using `PLACEMENTS`. Do not stack a second logo. Never warp so hard the S turns into a snake.

```bash
python3 brand/mascot/scripts/apply-official-mark.py --auto path/to/pose.png
```

Source: `web/public/images/logo.jpg` → [`assets/syra-mark.png`](assets/syra-mark.png).

## Settings

- Aspect: key `1:1`. Sheets and X templates `16:9`.
- Style strength: high (match the key, do not restyle).
- Seed: lock one seed per session if the tool allows it.
- One character only.

## Negative prompt (always)

```
photorealistic, cinematic fog, painterly, fur texture, realistic cat, cute chibi, disney, anime sparkles, giant robot, cyborg army, marching robots, human sitting in chair, overflowing coins, treasure chest, dollar sign, wealth porn, god pose, outstretched palms, Solana logo on the face or chest, redrawn S, new emblem, rainbow neon, purple pink gradients, busy holographic dashboards as subject, city skyline as subject, extra characters, second mascot, merch mockup clutter, misspelled text, broken kerning
```

## Base character (lock)

```
Syra mascot, compact geometric lynx agent-familiar, sticker not statue.
Hard-edged 2.5D cel shading, two or three gray values, almost no texture.
Body charcoal armor plates #1A1A1A to #3A3A3A, light gray muzzle and inner ears #E8E8E8, solid canvas #050505.
Tufted lynx ears, one ear slightly tipped, thick tail with squared geometric tip.
Eyes: two simple neon cyan slits #3EE0B8, no pupils.
White official shield decal permanently on the center chest armor plate. One cyan pip beside the badge on that plate. The badge follows the chest when the body turns.
Calm, precise, paid. Not cute, not menacing, not smiling.
Sitting or standing on a small dark node cube.
Readable silhouette at 32px.
```

## Shot prompts

Prefix every shot with the base character block + negative prompt. Then add only the shot line.

### Turnaround

```
Model sheet, three views in a row: FRONT, 3/4, SIDE profile facing right. Identical proportions and costume. Tiny gray labels FRONT / 3-4 / SIDE. Empty #050505, even spacing.
```

### Expressions

```
2x2 bust sheet. IDLE: calm cyan slits, one ear tipped. 402: brighter cyan eyes, small cyan pay-chip near the paw. SUCCESS: slight eye-narrow, cyan pip on. ERROR: ears flatter, cyan dimmed to gray. Tiny gray labels. Same head.
```

### X idle

```
16:9 social template. Lynx IDLE on the left third, sitting on the cube. Dim 15% grid b-roll behind, never the subject. Leave the right two-thirds empty for overlay type.
```

### X 402

```
16:9 social template. Lynx PAY face, brighter cyan eyes, small cyan chip with 402 at the paws. Left third. Dim 15% data-line b-roll only. Right two-thirds empty for overlay type.
```

### X proof

```
16:9 social template. Lynx SUCCESS face, cyan pip on. Small flat dark card near the cube (not a busy dashboard). Left third. Dim 15% city-grid b-roll only. Right two-thirds empty for overlay type.
```

## Overlay copy (set in a design tool)

| Template | Kicker | Headline | Sub |
| --- | --- | --- | --- |
| idle | SYRA | Machine money for agents | Waiting for the next paid call. |
| 402 | SYRA | Pay per call. | USDC settles. Then the route runs. |
| proof | SYRA | Proof, not a pitch. | Ranked signals. Observable settle. |

Type: Space Grotesk, white headline, muted gray sub, kicker uppercase tracking. One fact per post.

## Checklist before posting

- [ ] Same lynx as the key (ears, chest-plate badge, cyan slits, cube)
- [ ] Badge is the official file (`syra-mark.png` / `logo.jpg`), not a generated S or `$`
- [ ] One mark on the chest plate. Upright with gentle foreshortening. No nested shields, no distorted S.
- [ ] One accent color (`#3EE0B8`) unless a rare gold beat
- [ ] Character is the subject; cinematic art is background only
- [ ] Overlay type is spelled correctly in the design tool
