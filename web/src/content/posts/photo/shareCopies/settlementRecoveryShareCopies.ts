import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for settlement recovery proof photo deck. */
export const SETTLEMENT_RECOVERY_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover is the settlement recovery ship log.

Settle fail rate fell from about 62% to 0.03% in 24 hours. Paid volume is back on healthy rails, and the numbers are public.

syraa.fun`,

  thesis: `This card names why settle health matters more than another feature slide.

Agents stop paying when settlement fails. We removed the broken Celo Labs facilitator path and tightened settle so the 24h fail rate dropped to 0.03% on 3,370 attempts.

syraa.fun`,

  quote: `The line on this card is the product promise in plain words: pay, settle, prove.

Public metrics count only outcome=paid. Failures are not marketed as revenue.

api.syraa.fun/api/metrics`,

  flow: `This image walks the settle path in four steps.

1. An agent hits a paid route and sees payment required
2. The wallet pays USDC on a healthy rail (Solana and Algorand lead live traffic)
3. Syra counts only paid outcomes toward settled GMV
4. Anyone can verify on GET /api/metrics and Solscan buyback links on /token

syraa.fun/token`,

  timeline: `This timeline shows what shipped around the recovery.

1. Celo Labs x402 settle path removed from production
2. 24h settle fail rate moved from ~62% to 0.03%
3. Crossmint card to USDC onramp shipped on /wallet
4. Flint market data and OKX Genesis finance surfaces landed the same week

syraa.fun`,

  pillars: `This bento layout is the user story in the live numbers.

72 unique paying wallets in 7 days. 100% of wallets that saw a 402 converted to paid. 61% D7 repeat among eligible first-time payers. About $207 settled across 3,369 paid calls in the last day.

api.syraa.fun/api/metrics`,

  checklist: `This checklist is what you can verify yourself.

1. 24h settle fail rate is 0.03%
2. Last-day paid calls and settled USDC are public
3. Unique paying wallets (7d) are public
4. Buyback Solscan links live on /token
5. Card onramp, Flint, and OKX Genesis surfaces are live this week

syraa.fun/token`,

  metrics: `The numbers on this card are from the last 24 hours.

0.03% settle fail rate. 3,369 paid calls. 72 paying wallets in 7 days. Average paid call is about $0.05.

api.syraa.fun/api/metrics`,

  featured: `This featured card highlights the recovery headline.

Settle fail rate: 0.03% in 24 hours, down from about 62% the day before. That is the trust number that unlocks the rest of the product story.

syraa.fun`,

  comparison: `This before-and-after card compares broken settle to healthy settle.

Before, roughly 62% of settle attempts failed in a day and trust collapsed. Now 24h fail rate is 0.03%, with 3,369 paid calls and about $207 settled.

api.syraa.fun/api/metrics`,

  launch: `This launch card marks settlement health as a public ship log, not a private ops note.

Live metrics, Solscan buybacks, and paid-call surfaces stay open so builders and holders can check the same receipts.

syraa.fun/token`,

  deepDive: `This deep-dive card lists what is interesting in the current traffic mix.

Top paid paths: gas-oracle, network-health, market-pulse. Leading rails by settled USDC: Algorand and Solana. Lifetime so far: about 16.8k paid calls, $812 settled, 77 unique paying wallets. 62 usage reward earners are accruing points.

api.syraa.fun/api/metrics`,

  split: `This split card separates builders from holders without splitting the proof.

Builders fund a wallet, make a paid call, and keep shipping agents. Holders verify buybacks on /token and watch usage rewards accrue on /rewards. Same public metrics for both.

syraa.fun/marketplace`,

  terminal: `This terminal card shows the verification path.

GET /api/metrics returns settleFailRate, paid calls, unique wallets, path and network breakdowns. Buyback signatures link out to Solscan from /token.

api.syraa.fun/api/metrics`,

  cta: `This closing card is the ship summary: verify settle, then make a paid call.

Read the metrics, check /token for buybacks, start on marketplace if you are building.

syraa.fun/marketplace
api.syraa.fun/api/metrics`,
};
