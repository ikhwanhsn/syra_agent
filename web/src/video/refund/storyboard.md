# Refund promo · storyboard

Composition: `RefundPromo` · 1920×1080 · 30fps · 1260f (~42s)

| # | Time | Scene | Key picture | Hero motion | Caption |
|---|------|-------|-------------|-------------|---------|
| 1 | 0.0–4.0s | cover | Gold token drops onto a pad. Title: Money-back rail. | Token drop + ring expand | On-chain USDC. Same rail it paid on. |
| 2 | 3.7–8.3s | stakes | Agent node left, provider node right. Token flies out. Provider cracks `5xx`. | Outbound bezier + glitch stamp | One 402. One payment. No receipt if it breaks. |
| 3 | 8.0–13.7s | roundtrip | Same nodes. Arc reverses. Token returns. Settle burst. | Reverse payment-arc (signature hero) | Classify. Cap. Ledger. Send USDC back. |
| 4 | 13.3–18.0s | classify | Three failure chips + cap pill. Ledger row stamps pending → sent. | Ledger stamp | Idempotent. One payout per paid call. |
| 5 | 17.7–22.7s | rails | Four equal rail cards light in order. | Sequential spotlight | Treasury sends USDC. The receipt is the tx. |
| 6 | 22.3–28.0s | sdk | Code card `wrapFetchWithSyraRefund`. Notes: relay, $0.002, rolling out. | Code assemble | npm i @syra-ai/x402-refund. Check GET /refund/status first. |
| 7 | 27.7–33.3s | proof | Three scale chips + three fictional receipt rows. | Row cascade | Scale on Syra rails. Refunds return on those same rails. |
| 8 | 33.0–42.0s | cta | Title + three URL cards. Token settle payoff. Hold ≥1s. | Burst + token stamp | Internal refunds live. Hosted coverage rolling out. |

## Audio cues (relative)

- Scene enter: whoosh (roundtrip uses swoosh, reverse direction feel)
- Title: pop; **hit** on roundtrip + cta
- Stakes crack: impact
- Roundtrip reverse: riser into sparkle on settle
- Classify ledger: data-scan + pop stamp
- Rails: switch-tap per rail
- SDK: typewriter on code
- Proof: scan on rows
- CTA: riser → sparkle → swoosh, brand hold

BGM: `audio/video/llm-exchange-bgm.mp3` behind `bgm` inputProp. Deliver BGM + no-BGM.
