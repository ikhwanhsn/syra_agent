import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Revenue → $SYRA proof photo deck. */
export const BUYBACK_REWARDS_PROOF_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Revenue → $SYRA is verifiable.

Agents pay USDC.
~80% buys $SYRA on Jupiter.
Solscan links on syraa.fun/token.

Proof > narrative.`,

  thesis: `Token stories without receipts die at microcap.

Syra closes the loop:
paid calls → buyback → rewards → hold utility.

→ syraa.fun/token`,

  quote: `"Pay → buyback → rewards."

Visible on /token.
Claimable on /rewards.
Useful as fee discounts.

→ syraa.fun`,

  flow: `The flywheel, 4 steps:

1. Agent pays USDC (x402)
2. ~80% queued → Jupiter buy
3. Flush published with Solscan link
4. Payers claim $SYRA on /rewards

→ syraa.fun/rewards`,

  timeline: `What shipped:

→ Public buyback metrics on /api/metrics
→ Revenue → $SYRA panel on /token
→ Usage rewards + claim on /rewards
→ Live holder/staker x402 discounts

→ syraa.fun/token`,

  pillars: `3 live utilities:

→ Fee discounts: 10k–10M tiers
→ Usage rewards from buyback treasury
→ Stake for higher scan limits

Governance = roadmap (we say so).

→ syraa.fun/token`,

  checklist: `Verify yourself:

→ syraa.fun/token — buyback proof
→ syraa.fun/rewards — claim surface
→ api.syraa.fun/api/metrics — JSON
→ Solscan links on every flush

→ syraa.fun`,

  metrics: `80% of settled revenue → $SYRA buys.

4 discount tiers.
1 claim surface.
0 governance theater.

→ syraa.fun/token`,

  featured: `Try this path:

1. Make a paid call on /marketplace
2. Check buybacks on /token
3. Look up rewards on /rewards
4. Hold $SYRA for fee off

→ syraa.fun/marketplace`,

  comparison: `Before: buyback narrative, invisible loop.

Now: Solscan receipts + claimable rewards + live fee discounts.

→ syraa.fun/token`,

  launch: `SHIP LOG · Revenue → $SYRA proof is live.

Holders can verify.
Builders can earn.
Discounts are in pricing code.

→ syraa.fun/token
→ syraa.fun/rewards`,

  deepDive: `Discount tiers (hold or stake):

→ 10k: 5%
→ 100k: 10%
→ 1M: 20% + free agent tools
→ 10M: 30%

→ syraa.fun/staking`,

  split: `Two sides of the same rails:

Builders pay USDC for intel.
Holders see buybacks + can claim rewards.

Product first. Token rides the receipts.

→ syraa.fun`,

  terminal: `In the API:

GET /api/metrics → buyback, holders, rewards
GET /rewards/me?wallet=
POST /rewards/claim

Proof is a JSON field away.`,

  cta: `Ship a paid call.
Then hold the token.

→ syraa.fun/marketplace
→ syraa.fun/token
→ syraa.fun/rewards`,
};
