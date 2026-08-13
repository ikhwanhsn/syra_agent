# LLM Exchange promo — design spec (autonomous)

## Product brief

- **Product:** Syra LLM Exchange (Earn → LLM + `POST /llm/route`)
- **Audience:** Crypto agents builders, GPU/model sellers, $SYRA holders, x402 integrators
- **Job of the film:** Hype the launch, explain the two-sided marketplace in concrete steps, drive Earn listing + router usage
- **Must show:** list any LLM (Claude / Gemini / DeepSeek / custom), one OpenAI-shaped route, 4 routing policies, 20% fee → buyback / 80% seller, CTA
- **Format:** 1920×1080 @ 30fps, ~40s, English
- **Data:** fictional listings only (no real keys)

## Visual direction

- **Preset:** Professional trust (fintech) with startup energy — crisp geometry, restrained overshoot
- **Canvas:** Syra cinematic theme — white `#FFFFFF`, dark type `rgba(0,0,0,0.92)`, gold accent `#F3BA2F`
- **Fonts:** Inter (UI/body), Space Grotesk (display), JetBrains Mono (routes / code)
- **Motion tokens:** enter ~21f, `bezier(0,0,0.2,1)`, overshoot ≤1.02, hold brand marks ≥1s, rest 0.5s after batch reveals
- **Energy curve:** low cover → tension problem → reveal slam → UI hero → routing pulse → money flow → CTA impact

## Shot mapping (features → cards)

| Feature | Shot card / grammar | Notes |
|---------|---------------------|-------|
| Cover title | `paper-title-card` / type entrance | Gold underline, hold |
| Problem | `blur-slide` + dual cards | Vendor lock vs no payout |
| Reveal route | `typewriter-moves` + `cel-flash-stomp` | `POST /llm/route` |
| Protocols | `deck-deal-flyin` / pill stagger | OpenAI, Claude, Gemini, Custom |
| List UI | product UI assemble (hero panel) | Provider-type select |
| Policies | `pill-slot-cycle` | cheapest → reliable → fastest → quality |
| Money flow | `flow-pipeline` / step cards | List → Route → Split → Buyback |
| CTA | `spotlight-hero-card` energy | URLs + Earn |

## Frame timeline (30fps, 1200f ≈ 40s)

| # | id | from | dur | Content |
|---|----|------|-----|---------|
| 1 | cover | 0 | 120 | Title + tagline |
| 2 | problem | 108 | 150 | Two-sided pain |
| 3 | reveal | 246 | 150 | One route, any model |
| 4 | protocols | 384 | 150 | Claude / Gemini / DeepSeek / Custom deal-in |
| 5 | listUi | 522 | 180 | List-LLM hero + provider select |
| 6 | routing | 690 | 165 | Policies + failover |
| 7 | money | 843 | 180 | Fee split → buyback |
| 8 | cta | 1011 | 189 | Links + close |

Overlaps of ~12f for crossfades. Total duration: **1200 frames**.

## Audio

- BGM: `bgm-tech-house` (volume ~0.28, fade in/out)
- SFX: whoosh on scene enters, pop on card/pill reveals, riser into CTA, impact + sparkle on final logo
- Deliver `bgm: true` and `bgm: false` renders
