import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Celo Agentic Payments photo deck. 15 distinct topics. */
export const CELO_AGENTIC_PAYMENTS_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra is in the Celo Agent Hackathon with pay-per-call payments on Celo.

Agents pay in USDC per request. Each settlement gets a locked tag so volume can count toward Most Revenue and Most x402 Payments. The agent is already registered on-chain.

syraa.fun/labs`,

  thesis: `No tag, no leaderboard credit.

The Dune board only scores transactions that carry Syra's locked ERC-8021 suffix. Syra completes Exact USDC payments on Celo itself and appends that tag on every settle and refund, so the volume can actually show up.

syraa.fun/labs`,

  quote: `Pay per call, tag every settle, and climb the board.

Labs is the experiment surface. The Celo rail uses x402, then EIP-3009, then a self-settle step that stamps the ERC-8021 suffix. Same Syra agent brain, Celo treasury underneath.

syraa.fun/labs`,

  flow: `Tagged Celo volume is a four-step loop.

1. Fund the Labs Celo wallet with CELO for gas and USDC to spend
2. A payer hits a paid insights endpoint with chain set to celo
3. Syra self-settles with transferWithAuthorization and appends the ERC-8021 tag
4. An optional tagged refund keeps simulation runs clean

syraa.fun/labs`,

  timeline: `How the Celo rail shipped.

1. Celo network config added, with USDC and a facilitator profile
2. Self-settle wired up with ERC-8021 attribution on every transaction
3. A Celo tab added to Labs, next to Solana and Base, for wallets, simulation, and scheduling
4. Syra registered ERC-8004 agent #9673 on Celo's Identity Registry

syraa.fun/labs`,

  pillars: `Four layers make one Celo checkout.

Network is Celo mainnet, chain ID 42220. The asset is USDC settled through the Exact EIP-3009 scheme. Settle runs through Syra's own settler against Celo's x402 verify step. The tag is the ERC-8021 suffix that attributes every transaction to the hackathon.

syraa.fun/labs`,

  checklist: `What is live for the hackathon.

1. A Labs Celo tab sits beside the existing Solana and Base tabs
2. USDC is self-settled on every paid insight call
3. The ERC-8021 tag is appended on both settle and refund
4. Syra's ERC-8004 identity, agent #9673, is discoverable on 8004scan
5. Entries are in for Most Revenue and Most x402 Payments

syraa.fun/labs`,

  metrics: `Agent #9673. Two prize tracks. ERC-8021 on every settle.

Attribution is locked on celobuilders. Identity is live. Volume runs through the Labs Celo experiment so tagged payments can hit the Dune leaderboard.

syraa.fun/labs`,

  featured: `Syra is on-chain as Celo agent #9673.

That is the ERC-8004 identity on Celo's Identity Registry, discoverable on 8004scan, with the x402 payTo address wired in ahead of running volume.

8004scan.io/agents/celo/9673`,

  comparison: `Untagged volume did not count, and tagged settle does.

Before, Labs had no Celo rail and no self-settle path that stamped ERC-8021 for the hackathon KPIs. Now Labs routes through Celo, pays, self-settles with the tag, and even refunds stay tagged, using the same operating model as Solana and Base.

syraa.fun/labs`,

  launch: `Syra is building for the Celo Agentic Payments and DeFAI hackathon.

Pay-per-call USDC self-settle, ERC-8021 tags, and ERC-8004 agent #9673, entered in Most Revenue and Most x402 Payments.

syraa.fun/labs
8004scan.io/agents/celo/9673`,

  deepDive: `The Celo rail is wired into the Syra API and Labs.

celoX402Networks.js defines the network, USDC asset, and facilitator. celoX402Settle.js runs the self-settle step and builds the ERC-8021 suffix. labX402Payer.js runs the Exact EVM scheme on chain 42220. The Labs UI adds a Celo tab for wallets, simulation, and scheduling.

syraa.fun/labs`,

  split: `Labs now runs the same experiment model on Solana, Base, and Celo.

Solana runs an SPL USDC x402 loop. Base runs Exact EVM payers. Celo adds self-settle with ERC-8021 tags on top. One Labs surface, three rails to pick from.

syraa.fun/labs`,

  terminal: `A Celo paid call looks like this in the lab.

Labs creates a Celo wallet and takes a USDC deposit. A call to /insights with the Celo chain header returns HTTP 402 for USDC on chain 42220. The client self-settles and appends the ERC-8021 suffix. The response comes back as HTTP 200 with a tagged transaction ready for the Dune leaderboard.

syraa.fun/labs`,

  cta: `Syra is building on Celo with tagged pay-per-call payments.

Fund Labs, run x402 volume, and watch it on the Most Revenue and Most x402 Payments board.

syraa.fun/labs
8004scan.io/agents/celo/9673
dune.com/celo/agentic-payments-defai-hackathon`,
};
