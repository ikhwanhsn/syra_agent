# Refund promo · design spec

## Product brief

| Field | Value |
|-------|--------|
| Product | In-house x402 refund layer |
| Ship | Money-back rail for failed paid calls (`REFUND_ENABLED`, inbound + outbound) |
| Audience | Agent builders paying x402, Syra route callers, `$SYRA` holders |
| Job of the film | Make the round-trip visceral: paid call fails, USDC comes back on the same rail |
| Format | 1920×1080 @ 30fps · 1260f (~42s) · English |
| Language | Founder-plain. Commas, periods, colons. No em dashes. |
| Mode | Autonomous free creation (video-shotcraft) |
| Floor | `LlmExchangePromo` + `promoKit` |

## Honesty contract

- Internal inbound + outbound refunds default on (`REFUND_ENABLED`, `REFUND_COVER_INBOUND`, `REFUND_COVER_OUTBOUND`).
- Hosted coverage for external agents is gated (`REFUND_HOSTED_ENABLED` default false, empty allowlist). Copy says "rolling out," never "live for everyone."
- Per-call cap default `$1`. Premium default `$0.002` flat.
- Rails: Solana, Base, X Layer, Algorand.
- Proof numbers frozen at build from `GET /api/metrics` (2026-08-17): **43,465 paid / 7d**, **$5,924 settled**. Those are paid-call scale, not refund counts. Ledger signatures on screen are fictional demo rows.

## Demand → execution

| Need | Decision |
|------|----------|
| Show the product | Hand-built Syra-chrome cards (ledger, code, rails). No live wallets, no real keys. |
| Mechanism | Classify (5xx / timeout / network) → cap → idempotent ledger → on-chain USDC send |
| Agent path | `wrapFetchWithSyraRefund(paid, { refundTo, payer })` + `POST /refund/relay` |
| CTA | npm package, docs.syraa.fun/docs/build/refund, api.syraa.fun/refund/status |
| Audio | Reuse licensed `llm-exchange` SFX + bed with a **new return-motif cue map**. Documented reuse: no fresh licensed bed on disk. User can drop a new track later. |
| Motion preset | Fintech trust + one cinematic reversal. Overshoot ≤1.05. Brand hold ≥1s. |

## Visual direction

Syra tokens only: white `#FFFFFF`, dark type, gold `#F3BA2F`, Inter / Space Grotesk / JetBrains Mono. `PromoSceneShell` on information scenes. Custom cover / roundtrip / CTA layouts. Particles + drifting gold glows. One hero technique per scene.

## Differentiation

1. **Story spine unique to this ship:** a paid call fails, and the money comes back. Not `cover → problem → reveal → protocols → listUi → routing → money → cta`.
2. **Duration / count:** 8 scenes, 42s (1260f). Extra hold on the round-trip settle and CTA brand stamp.
3. **Shotcraft / custom heroes:** payment-arc SVG (outbound then reverse), broken-node glitch stamp, ledger `pending → sent` stamp with rolling signature, four-rail sequential light-up, reverse gold wipe into the hero scene.
4. **Audio:** same licensed files, **new cue map** built around reversal (riser on reverse, sparkle on settle, scan on ledger stamp). Not the LLM Exchange / Bridge enter-pop pattern cloned beat-for-beat.
5. **Deliberately not copied:** dual VS cards as the second scene, typewriter route as the third, 4-up protocol deal, Ken Burns product plate, buyback 4-step pipeline, same hero-motion order.

If this film could be mistaken for a reskin of LLM Exchange or Bridge after swapping titles, it failed.

## Shot mapping

| Feature | Grammar | Notes |
|---------|---------|-------|
| Cover | Token drop + expanding rings | Gold USDC token settles onto a pad |
| Stakes | Outbound payment arc + node crack | Token flies out, provider stamps 5xx |
| Roundtrip | Reverse bezier hero | Arc reverses, token returns, settle burst |
| Classify | Chip stagger + ledger stamp | 5xx / timeout / network, pending → sent |
| Rails | Sequential spotlight | Solana → Base → X Layer → Algorand |
| SDK | Code card assemble | wrapFetch + three notes |
| Proof | Receipt rows + scale chips | Fictional ledger, live paid-call scale |
| CTA | Radial burst + token settle | URLs + ≥1s brand hold |

## Frame timeline (30fps, 1260f ≈ 42s)

| # | id | from | dur | Content |
|---|----|------|-----|---------|
| 1 | cover | 0 | 120 | Token settle + title |
| 2 | stakes | 110 | 140 | Outbound pay, then 5xx |
| 3 | roundtrip | 240 | 170 | Reverse arc (hero) |
| 4 | classify | 400 | 140 | Classifier + ledger stamp |
| 5 | rails | 530 | 150 | Four rails light up |
| 6 | sdk | 670 | 170 | wrapFetch + premium honesty |
| 7 | proof | 830 | 170 | Receipts + scale |
| 8 | cta | 990 | 270 | Links + token settle hold |

Overlaps of ~10–12f for wipes. Total duration: **1260 frames**.
