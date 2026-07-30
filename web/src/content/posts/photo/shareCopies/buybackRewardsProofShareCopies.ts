import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Revenue to $SYRA proof photo deck. */
export const BUYBACK_REWARDS_PROOF_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces that Revenue to $SYRA now has a public paper trail.

Every paid call feeds a buyback that shows up with a Solscan link, usage rewards are claimable, and holder fee discounts already work in pricing.

syraa.fun/token`,

  thesis: `This card names the problem Syra is solving with proof instead of promises.

Token stories without receipts die at microcap. Syra closes the loop end to end: a paid call triggers a buyback, the buyback shows up as a reward, and holding the token unlocks real utility, all backed by Solscan links.

syraa.fun/token`,

  quote: `The line on this card is the whole loop in three words: pay, buyback, rewards.

A payment is visible on /token as soon as it converts. The resulting reward is claimable on /rewards. Holding the token is useful today as a fee discount, not just a bet on the story.

syraa.fun/token`,

  flow: `This image walks the buyback flywheel in four steps.

1. An agent pays USDC and x402 settles the call
2. About 80% of that revenue queues into a $SYRA buy on Jupiter
3. The buyback is published with a Solscan link
4. The paying wallet can claim its share on /rewards

syraa.fun/rewards`,

  timeline: `This timeline shows the receipts that shipped inside the product.

1. Buyback numbers exposed on /api/metrics
2. A proof panel went live on the token page
3. Rewards started accruing and became claimable
4. Discounts were wired directly into pricing

syraa.fun/token`,

  pillars: `This bento layout separates what is live from what is still roadmap.

Discounts are live: 5 to 30% off x402 pricing by tier. Rewards are live: spending converts into claimable $SYRA. Buybacks are live and Solscan-linked. Governance is roadmap only, and the card says so instead of implying otherwise.

syraa.fun/token`,

  checklist: `This checklist is meant to be checked, not trusted on faith.

1. syraa.fun/token shows the buyback proof
2. syraa.fun/rewards is the claim surface
3. /api/metrics returns the same numbers as JSON
4. Every flush links out to Solscan

syraa.fun/token`,

  metrics: `Treasury-settled x402 revenue (~80%) queues into $SYRA buybacks. Labs routes that pay lab wallets skip that queue. Four discount tiers exist based on holdings, and there is one claim page for rewards.

syraa.fun/token`,

  featured: `This featured card lays out the path from first payment to holding the token.

Make a first paid call on the marketplace, see the receipt on the token page, claim your share on rewards, then stake for deeper discounts.

syraa.fun/marketplace`,

  comparison: `This before-and-after card compares a buyback narrative to an actual receipt trail.

Before, buyback claims were a story with an invisible loop and perks that mostly reached whales. Now every flush has a Solscan proof, rewards are claimable by anyone who paid, and discount tiers are enforced in pricing code.

syraa.fun/token`,

  launch: `This launch card marks Revenue to $SYRA proof as live.

Holders can verify the buybacks themselves, builders can earn from spend that flows through the loop, and the fee discounts are already active, not promised.

syraa.fun/token`,

  deepDive: `This deep-dive card lists the discount tiers for holding or staking $SYRA.

10k gets 5% off. 100k gets 10% off. 1M gets 20% off plus free agent tools. 10M gets 30% off.

syraa.fun/staking`,

  split: `This split card explains who is on each side of the same rails.

Builders pay USDC for intelligence through x402. That volume funds buybacks, and holders can see every one of them plus claim rewards tied to that spend.

syraa.fun/token`,

  terminal: `This terminal card shows the buyback loop from the API side.

GET /api/metrics returns buyback, holder, and reward totals. GET /rewards/me with a wallet returns what is claimable. POST /rewards/claim triggers a treasury SPL transfer.

syraa.fun/token`,

  cta: `This closing card is the ship summary: make a paid call, then hold the token.

Verify the buyback on /token, claim your reward on /rewards, and get a fee discount by holding $SYRA.

syraa.fun/marketplace
syraa.fun/token
syraa.fun/rewards`,
};
