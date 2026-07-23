# $SYRA Liquidity, Listings & KOL Checklist

Proof-driven distribution checklist for the hybrid path from ~$70k → $1m market cap.
Lead with **verifiable** revenue → $SYRA buybacks (`/token`, `GET /api/metrics`), not empty utility claims.

## Narrative (single story)

> Agents pay real USDC for Syra x402 APIs. ~80% of settled revenue buys $SYRA on Jupiter. Flushes are on Solscan. Payers claim usage rewards. Holders get live fee discounts.

Do **not** lead with governance, “10% revenue share,” or price targets.

## Weekly proof content (ship-log / X)

- [ ] Pull live numbers from `GET https://api.syraa.fun/api/metrics` (`buyback`, `rewards`, `holders`, north-star paid calls)
- [ ] Publish from `/post` using update **#34 Revenue → $SYRA Proof** (or a fresh weekly clone)
- [ ] Include at least one Solscan buyback tx link
- [ ] CTA pair: `/marketplace` (builders) + `/token` or `/rewards` (holders)
- [ ] Kill criteria: if paid wallets are flat 2 weeks, fix activation before more token posts

## Liquidity

- [ ] Measure DexScreener liquidity USD vs daily volume (target: liquidity ≥ 10–15% of mcap as you grow)
- [ ] Prefer organic depth from usage narrative over mercenary LP incentives
- [ ] Document LP ownership / lock status publicly if team adds liquidity
- [ ] Avoid wash-volume optics; volume should track product announcements

## Trackers & listings

- [ ] DexScreener: socials, website (`syraa.fun`), description with “x402 pay-per-call + buyback proof”
- [ ] Birdeye / Jupiter token list metadata consistent with mint `8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump`
- [ ] CoinGecko / CMC application only after: public metrics + ≥N unique paying wallets + honest token page
- [ ] CEX: defer until mcap/liquidity and compliance review clear — listings without product usage reverse quickly

## KOL / builder seeding

- [ ] Seed **builders** first (MCP/SDK thread + first paid call demo), then holder KOLs with proof links
- [ ] Brief: one-pager with mint, `/token` proof panel screenshot, `/api/metrics` JSON snippet
- [ ] Require KOLs to link Solscan or `/token` — no “guaranteed returns” language
- [ ] Track UTM or unique referral codes where possible; measure paid-call lift, not just impressions

## Holder growth instrumentation

- Already in `GET /api/metrics` → `holders.history7d` + `buyback` + `rewards`
- [ ] Review weekly: mcap, liquidity, unique stakers, unique reward earners, paying wallets 7d
- [ ] If earners ↑ but mcap flat → liquidity/attention gap
- [ ] If mcap ↑ but paying wallets flat → narrative without product (risk of dump)

## Ungating Telegram (later)

Only after settlement fail rate &lt; 5% and paying wallets trending up 2 weeks (see `docs/TELEGRAM_MAINTENANCE_POLICY.md`):

- [ ] Soft-push TG referral as secondary holder/user loop
- [ ] Still do not make TG the homepage hero CTA

## Compliance reminders

- No guaranteed APY / revenue share claims unless code ships them
- Governance stays labeled **roadmap** until voting exists
- Buybacks are treasury-held for rewards — not a burn unless you change the program and disclose it
