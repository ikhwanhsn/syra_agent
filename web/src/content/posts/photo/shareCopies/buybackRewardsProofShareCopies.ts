import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Revenue to $SYRA proof photo deck. */
export const BUYBACK_REWARDS_PROOF_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Revenue to $SYRA now has receipts.

Verifiable buybacks (using revenue to buy the token), claimable usage rewards, and live holder fee discounts.

syraa.fun/token`,

  thesis: `Token stories without receipts die at microcap.

Syra closes the loop: paid calls, then buyback, then rewards, then hold utility, with Solscan links.

syraa.fun/token`,

  quote: `Pay, then buyback, then rewards.

Visible on /token, claimable on /rewards, and useful as fee discounts.

syraa.fun/token`,

  flow: `Four steps, one flywheel.

1. Pay USDC. x402 settles the call (makes sure the payment actually completed)
2. Buy $SYRA. About 80% via Jupiter
3. Publish proof. Solscan on /token
4. Claim rewards. Payers on /rewards

syraa.fun/rewards`,

  timeline: `Receipts in the product.

1. Metrics: buyback on /api/metrics
2. Token page: proof panel live
3. Rewards: accrue and claim
4. Discounts: wired into pricing

syraa.fun/token`,

  pillars: `Live utility, honest roadmap.

Discounts are live: 5 to 30% off x402 by tier. Rewards are live: spend becomes claimable $SYRA. Buybacks are live, Solscan-linked flushes. Governance is roadmap only, and labeled as such.

syraa.fun/token`,

  checklist: `Check the receipts yourself.

1. /token for buyback proof
2. /rewards for the claim surface
3. /api/metrics for the same numbers as JSON
4. Solscan for every flush

syraa.fun/token`,

  metrics: `The loop in numbers.

80% of revenue to buyback. 4 discount tiers. 1 claim page.

syraa.fun/token`,

  featured: `Call, then proof, then claim, then hold.

Marketplace for the first paid call. Token page for receipts. Rewards for claim. Stake for deeper discounts.

syraa.fun/marketplace`,

  comparison: `Narrative vs receipts.

Before, a buyback story with an invisible loop and whale-only perks. Now Solscan proofs, claimable rewards, and tiered discounts in code.

syraa.fun/token`,

  launch: `Revenue to $SYRA proof is live.

Holders can verify, builders can earn, and discounts are real.

syraa.fun/token`,

  deepDive: `Hold or stake for fee off.

10k gets 5%. 100k gets 10% plus the Free Agent Starter Pack. 1M gets 20%. 10M gets 30%.

syraa.fun/staking`,

  split: `Builders pay and holders see receipts.

USDC x402 volume funds buybacks. Rewards close the loop to active payers: paid calls, buybacks, rewards, discounts.

syraa.fun/token`,

  terminal: `The loop in the API.

GET /api/metrics returns buyback, holders, and rewards. GET /rewards/me?wallet= returns claimable $SYRA. POST /rewards/claim triggers a treasury SPL transfer.

syraa.fun/token`,

  cta: `Ship a paid call. Then hold the token.

Verify on /token, claim on /rewards, and discount by holding $SYRA.

syraa.fun/marketplace
syraa.fun/token
syraa.fun/rewards`,
};
