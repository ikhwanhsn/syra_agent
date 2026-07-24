import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy: OKX ASP + X Layer x402 + $SYRA flywheel. */
export const OKX_ASP_XLAYER_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces that Syra is now an official Agent Service Provider on OKX, registered as ASP #2311.

Payments settle over x402 on X Layer, and the badge on this card ties that directly to the $SYRA buyback: every paid call an OKX agent makes on Syra adds revenue that flows into buying $SYRA for the community airdrop pool.

syraa.fun/playground`,

  thesis: `This card states the thesis in one line: OKX's distribution meets $SYRA's demand.

OKX has millions of wallets, and Syra now sits inside that ecosystem as ASP #2311 with more than 28 paid APIs. Around 80% of the x402 revenue those calls generate is used to buy $SYRA for holder airdrops, so more agent usage means more on-chain buy pressure.

syraa.fun`,

  quote: `The line on this card ties every payment back to the token: every agent payment is effectively a vote for $SYRA.

Discovery happens on the OKX marketplace, settlement happens on X Layer in USDT, and the resulting revenue funds Jupiter buybacks. It is usage driving the number, not a promise.

syraa.fun`,

  flow: `This image walks the flywheel from a single agent payment to a buyback in four steps.

1. An OKX Agentic Wallet discovers Syra as ASP #2311
2. It pays USDT on X Layer through x402 for a single API call
3. Syra returns the intelligence, whether that is a signal, news, or a brain response
4. About 80% of that revenue goes into the Jupiter buyback pool for $SYRA

syraa.fun/playground`,

  timeline: `This timeline covers what shipped to make Syra live on OKX.

1. ASP #2311 registered as an ERC-8004 identity on X Layer mainnet
2. An A2MCP catalog published, listing more than 28 pay-per-call crypto APIs
3. An A2A service added for Syra's Brain research agent
4. An OKX x402 facilitator wired in, settling USDT0 on eip155:196

syraa.fun`,

  pillars: `This bento layout names the four things driving demand for $SYRA.

OKX.AI is the discovery layer, putting Syra's ASP listing in front of OKX's agent wallets. X Layer is the checkout, with native USDT x402 payments. Roughly 80% of the resulting fees go into the buyback, and staking $SYRA gives holders a discount on API usage, encouraging more of it.

syraa.fun`,

  checklist: `This checklist explains what the OKX integration means for $SYRA holders.

1. OKX agent payments are real x402 revenue, not projected revenue
2. That revenue buys $SYRA on Jupiter in production, not on paper
3. The resulting buyback pool is reserved for community airdrops
4. Staking $SYRA earns tiered discounts on API usage
5. This listing went live before OKX's public marketplace review finished

syraa.fun`,

  metrics: `The numbers on this card summarize the setup.

Syra holds ASP #2311 on OKX, with more than 28 paid APIs live, and roughly 80% of the revenue those calls generate routes into the buyback. OKX agents pay per call, Syra captures the revenue, and $SYRA holders share in what comes back.

syraa.fun`,

  featured: `This featured card is about where the revenue actually goes.

Around 80% of x402 fees route into the $SYRA buyback pool. These are production settlements, not projections, and the buyback runs on every paid call before the OKX listing even goes fully public.

syraa.fun`,

  comparison: `This before-and-after card compares Syra's reach before and after the OKX integration.

Before, Syra's x402 checkout only reached Solana and Base wallets, with no connection between usage and the $SYRA token story. Now Syra is listed as an ASP on OKX.AI, settles in USDT on X Layer, and every one of those OKX payments feeds the $SYRA buyback.

syraa.fun`,

  launch: `This partnership card marks Syra and OKX as live, with the listing still in review.

Syra is registered as ASP #2311, giving OKX's Agentic Wallets machine money to pay for intelligence per call, with $SYRA capturing a share of the resulting revenue.

syraa.fun`,

  deepDive: `This deep-dive card lists the technical surface connecting OKX to $SYRA.

OKXFacilitatorClient runs on api.syraa.fun and handles verify and settle. USDT0 is accepted on eip155:196. buybackSYRAFromRevenue runs in production on every settlement. Staking tiers reduce API cost for holders, and the whole thing sits behind an OpenAPI spec with a 28-route x402 catalog.

syraa.fun`,

  split: `This split card shows both sides of the same loop: agents pay, and holders win.

OKX Agentic Wallets discover Syra and pay USDT per intelligence call. On the other side, $SYRA stakers get usage discounts and a share of the buyback airdrop pool. Usage turns into revenue, and revenue turns into buybacks.

syraa.fun`,

  terminal: `This terminal card shows a real X Layer payment triggering a buyback.

Calling a news endpoint returns 402 with a USDT0 accept on eip155:196. Paying through an OKX wallet on X Layer returns 200 with the content unlocked, and a $SYRA buyback swap gets queued from that revenue.

syraa.fun`,

  cta: `This closing card is the summary: OKX agents are on the way, and $SYRA is the way to be positioned for it.

Stake for discounts, hold for the buyback flywheel, or just try the playground today.

syraa.fun/playground
syraa.fun
www.okx.ai`,
};
