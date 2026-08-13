# Bridge promo · design spec

## Product brief

| Field | Value |
|-------|--------|
| Product | Syra `/bridge` |
| Ship | Relay-powered cross-chain bridge |
| Audience | Solana + EVM users, agents funding wallets |
| Core beats | Bridge live · Relay routes · 0.25% app fee · 24h buyback batch · CTA |
| Format | 1920×1080 @ 30fps · ~38s |
| Language | EN, founder-plain, no em dashes |
| Mode | Autonomous free creation (video-shotcraft) |
| Floor | `LlmExchangePromo` + `promoKit` |

## Demand → execution

| Need | Decision |
|------|----------|
| Show real product | Stylized Syra-chrome bridge plate (fictional balances); not live wallet data |
| Fee | Exact copy: 0.25% app fee funds $SYRA buybacks |
| Buyback | Aggregate first, Jupiter swap once every 24h (no spam) |
| CTA | `syraa.fun/bridge`, docs.relay.link, metrics |
| Audio | Reuse llm-exchange SFX bed + `llm-exchange-bgm.mp3`; `bgm` inputProp |
| Motion preset | Professional trust (fintech) with gold overshoot ≤1.05 |

## Visual direction

Syra tokens only: white `#FFFFFF`, dark type, gold `#F3BA2F`, Inter / Space Grotesk / JetBrains Mono. Scene shell header/body/caption. Particles + drifting gold glows + wipe flashes + spring cards + one Ken Burns plate + sequential fee/buyback highlight + CTA burst hold ≥1s.

## Storyboard (summary)

| # | Frames | Scene | Hero motion |
|---|--------|-------|-------------|
| 1 | 0–120 | cover | Brand ring + title shimmer |
| 2 | 108–258 | problem | VS spring cards |
| 3 | 246–396 | reveal | Mono path typewriter `/bridge` |
| 4 | 384–534 | chains | 2×2 spring grid |
| 5 | 522–702 | widget | Ken Burns push on UI plate |
| 6 | 690–855 | fee | Sequential 0.25% highlight |
| 7 | 843–1023 | buyback | Progress fill + 4 steps |
| 8 | 1011–1140 | cta | Radial burst + link cards |

Full timing in `storyboard.md` and `content/bridgePromo.ts`.
