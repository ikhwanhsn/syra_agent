import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for settlement recovery proof photo deck. */
export const SETTLEMENT_RECOVERY_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Settlement is healthy again.

Settlement means making sure the payment actually completed. Fail rate fell from about 62% to 0.03% in 24 hours. Paid calls, wallets, and rails you can verify.

syraa.fun`,

  thesis: `Broken settle kills trust faster than missing features.

Agents stop paying when settlement fails, when the payment does not actually complete. We removed the broken Celo Labs path and the 24h fail rate dropped to 0.03% on 3,370 attempts.

syraa.fun`,

  quote: `Pay, settle, and prove.

Public metrics count only paid outcomes. Failures are not marketed as revenue.

api.syraa.fun/api/metrics`,

  flow: `Pay, settle, then prove.

1. Hit a paid route. x402 asks for USDC
2. Settle on a healthy rail. Solana and Algorand lead
3. Count paid only. GMV is outcome paid
4. Verify live on /api/metrics and Solscan

syraa.fun/token`,

  timeline: `Recovery plus shipping, this week.

1. Celo Labs path out: broken facilitator removed
2. 0.03% fail in 24h on 3,370 settle attempts
3. Crossmint onramp: card to USDC on /wallet
4. Flint plus OKX Genesis: depth and finance surfaces

syraa.fun`,

  pillars: `Interesting user signals.

72 wallets paid in 7 days. 100% of wallets that saw 402 converted to paid. 61% D7 repeat: 22 of 36 eligible payers returned in 7 days. $207 settled in 24h across 3,369 paid calls, about $0.05 each.

api.syraa.fun/api/metrics`,

  checklist: `What you can verify yourself.

1. 24h settle fail rate: 0.03%
2. 3,369 paid calls and about $207 settled in 24h
3. 72 unique paying wallets in 7 days
4. Buyback Solscan links on /token
5. Crossmint, Flint, and OKX Genesis live this week

syraa.fun/token`,

  metrics: `Healthy settle and real demand.

0.03% settle fail in 24h. 3,369 paid calls in 24h. 72 payers in 7 days.

Top paths: gas-oracle, network-health, market-pulse. Leading rails: Algorand and Solana.

api.syraa.fun/api/metrics`,

  featured: `The trust number is 0.03%.

That is the 24h settle fail rate, down from about 62% the day before. Same public /api/metrics endpoint.

syraa.fun`,

  comparison: `Broken settle vs healthy settle.

Before, about 62% of settle attempts failed in a day, and agents could not trust paid calls. Now 0.03% fail on 3,370 attempts, with 3,369 paid calls and about $207 settled in 24h.

api.syraa.fun/api/metrics`,

  launch: `Settlement proof is public.

Metrics, Solscan buybacks (using revenue to buy the token), and paid-call surfaces stay open for everyone.

syraa.fun/token`,

  deepDive: `What users are actually calling.

Top paths: /gas-oracle, /network-health, /market-pulse. Leading rails by settled USDC: Algorand, then Solana. Lifetime: about 16.8k paid calls, $812 settled, 77 payers. 62 usage reward earners accruing points. Buyback treasury holding about 165k $SYRA.

api.syraa.fun/api/metrics`,

  split: `Builders pay and holders verify.

Fund a wallet, make a paid call, or check buybacks and rewards. Everyone reads the same metrics. Builders: /marketplace and /wallet. Holders: /token and /rewards. Everyone: /api/metrics. On-chain: Solscan buyback txs.

syraa.fun/marketplace`,

  terminal: `Verify in one request.

GET https://api.syraa.fun/api/metrics returns settlement.last24h.settleFailRate, northStar.uniquePayingWalletsLast7d, last24h calls and usdSettled, byPath, byNetwork, buyback, and funnel.d7RepeatRate.

api.syraa.fun/api/metrics`,

  cta: `Verify the settle. Then make a paid call.

Read public metrics, check buybacks on /token, start on marketplace if you are building.

syraa.fun/marketplace
api.syraa.fun/api/metrics`,
};
