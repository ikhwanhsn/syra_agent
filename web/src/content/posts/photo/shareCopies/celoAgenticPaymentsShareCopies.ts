import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Celo Agentic Payments photo deck. 15 distinct topics. */
export const CELO_AGENTIC_PAYMENTS_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover image marks Syra's entry into the Celo Agent Hackathon.

Syra is building agentic x402 payments on Celo, with tagged transaction volume feeding the Most Revenue and Most x402 Payments tracks. The agent is already registered on-chain.

syraa.fun/labs`,

  thesis: `This card names the rule that decides whether volume even counts.

The hackathon leaderboard on Dune only scores transactions carrying the locked ERC-8021 attribution suffix. Syra self-settles Exact USDC on Celo and appends that tag on every settle and refund, so the volume actually shows up on the board.

syraa.fun/labs`,

  quote: `The line on this card is the loop in plain words: pay per call, tag every settle, climb the board.

Labs runs the Celo rail through x402, then EIP-3009, then a self-settle step that stamps the ERC-8021 dataSuffix. Same Syra agent brain, new Celo rail underneath.

syraa.fun/labs`,

  flow: `This image walks the Celo volume loop in four steps.

1. Fund the Labs Celo wallet with CELO for gas and USDC to spend
2. A payer hits a paid /insights endpoint with chain set to celo
3. Syra self-settles with transferWithAuthorization and appends the ERC-8021 tag
4. An optional tagged refund keeps simulation runs clean

syraa.fun/labs`,

  timeline: `This timeline shows how the Celo rollout shipped.

1. Celo network config added, with USDC and a facilitator profile
2. Self-settle wired up with ERC-8021 attribution on every transaction
3. A Celo tab added to Labs, next to Solana and Base, for wallets, simulation, and scheduling
4. Syra registered ERC-8004 agent #9673 on Celo's Identity Registry

syraa.fun/labs`,

  pillars: `This bento layout breaks the Celo checkout into four layers.

Network is Celo mainnet, chain ID 42220. Asset is USDC settled through the Exact EIP-3009 scheme. Settle happens through Syra's own settler against Celo's x402 verify step. Tag is the ERC-8021 suffix that attributes every transaction to the hackathon.

syraa.fun/labs`,

  checklist: `This checklist is what is live for the hackathon.

1. A Labs Celo tab sits beside the existing Solana and Base tabs
2. USDC is self-settled on every paid insight call
3. The ERC-8021 tag is appended on both settle and refund
4. Syra's ERC-8004 identity, agent #9673, is discoverable on 8004scan
5. Entries are in for Most Revenue and Most x402 Payments

syraa.fun/labs`,

  metrics: `The numbers on this card summarize the Celo ship.

Agent #9673 is the registered ERC-8004 identity, entered in two prize tracks, with the ERC-8021 tag attached to every settle. All of it is aimed at driving tagged volume onto the Dune leaderboard.

syraa.fun/labs`,

  featured: `This featured card is about on-chain agent identity.

Syra registered as agent #9673 on Celo's Identity Registry, discoverable on 8004scan, with its x402 payTo address wired in ahead of running volume.

8004scan.io/agents/celo/9673`,

  comparison: `This before-and-after card compares untagged volume to a tagged settle path.

Before, there was no Labs rail on Celo and no self-settle path that stamped ERC-8021 for the hackathon's KPIs. Now, Labs routes through Celo, pays, self-settles with the tag, and even refunds stay tagged, using the same operating model as Solana and Base.

syraa.fun/labs`,

  launch: `This launch card marks Syra building for the Celo Agentic Payments and DeFAI hackathon.

It covers x402 USDC self-settle, ERC-8021 tagging, and the ERC-8004 identity at agent #9673, entered in the Most Revenue and Most x402 Payments tracks.

syraa.fun/labs
8004scan.io/agents/celo/9673`,

  deepDive: `This deep-dive card lists the technical surface behind the Celo rail.

celoX402Networks.js defines the CAIP-2 network, USDC asset, and facilitator. celoX402Settle.js runs the self-settle step and builds the ERC-8021 dataSuffix. labX402Payer.js runs the Exact EVM scheme on chain 42220, and the Labs UI adds a Celo tab for wallets, simulation, and scheduling.

syraa.fun/labs`,

  split: `This split card lays out Labs across three chains.

Solana runs an SPL USDC x402 loop. Base runs Exact EVM payers. Celo adds self-settle with ERC-8021 tags on top of the same operating model. One Labs surface, three rails to pick from.

syraa.fun/labs`,

  terminal: `This terminal card shows the Celo request path from the stack.

Labs creates a Celo wallet and takes a USDC deposit, then a call to /insights with the Celo chain header returns an HTTP 402 for USDC on chain 42220. The client self-settles and appends the ERC-8021 dataSuffix, and the response comes back as HTTP 200 with a tagged transaction ready for the Dune leaderboard.

syraa.fun/labs`,

  cta: `This closing card is the ship summary: Syra is building on Celo with tagged payments.

Fund Labs, run x402 volume, and watch it climb the Most Revenue and Most x402 Payments board.

syraa.fun/labs
8004scan.io/agents/celo/9673
dune.com/celo/agentic-payments-defai-hackathon`,
};
