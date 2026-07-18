import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Celo Agentic Payments photo deck. 15 distinct topics. */
export const CELO_AGENTIC_PAYMENTS_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `I am building for the @CeloDevs Agent Hackathon

Working on: Syra, agentic x402 payments with tagged Celo volume for Most Revenue + Most x402 Payments.

Registered onchain → https://8004scan.io/agents/celo/9673

Let's go! @celo`,

  thesis: `Hackathon leaderboards only count txs with your ERC-8021 tag.

Syra self-settles Exact USDC on Celo and appends the locked attribution suffix on every settle and refund, so Most Revenue and Most x402 Payments can actually score.

@CeloDevs @celo`,

  quote: `"Pay per call. Tag every settle. Climb the board."

Syra Labs on Celo: x402 → EIP-3009 → self-settle → ERC-8021 dataSuffix.

Same agent brain. New Celo rail.`,

  flow: `Celo x402 volume loop:

1. Fund Labs Celo wallet (CELO + USDC)
2. Payer hits paid /insights with chain=celo
3. Self-settle transferWithAuthorization + tag
4. Optional tagged refund for clean sims

Ops → syraa.fun/labs`,

  timeline: `Celo Agentic Payments rollout:

→ Celo network + USDC + facilitator profile
→ Self-settle with ERC-8021 attribution
→ Labs Celo tab (wallets, sim, schedule)
→ ERC-8004 Syra agent #9673 minted on Celo

Registered. Shipping volume.`,

  pillars: `4 layers. One Celo checkout:

→ NETWORK: eip155:42220 mainnet
→ ASSET: Celo USDC · Exact EIP-3009
→ SETTLE: self-settle + Celo x402 verify
→ TAG: ERC-8021 hackathon attribution`,

  checklist: `Live for the @CeloDevs hackathon:

→ Labs Celo tab next to Solana + Base
→ Self-settled USDC on every paid insight call
→ ERC-8021 tag on settle + refund
→ ERC-8004 identity on 8004scan
→ Tracks: Most Revenue + Most x402 Payments

Ops → syraa.fun/labs`,

  metrics: `Celo ship by the numbers:

→ 9673 ERC-8004 agent ID
→ 2 prize tracks entered
→ 8021 attribution on every settle

Tagged volume → Dune leaderboard.`,

  featured: `On-chain identity is live.

Syra agent #9673 on Celo Identity Registry.

→ https://8004scan.io/agents/celo/9673

x402 payTo wired. Attribution locked. Volume next.`,

  comparison: `Before: Celo agents had no Syra Labs rail. No tagged self-settle path for hackathon KPIs.

Now: Labs → Celo → pay → settle with ERC-8021 → refund tagged. Same ops model as Solana and Base.

Friction gone. Leaderboard ready.`,

  launch: `SHIP LOG · Syra × Celo for Agentic Payments & DeFAI.

x402 USDC self-settle. ERC-8021 tags. ERC-8004 agent #9673.

Building for @CeloDevs. Most Revenue + Most x402 Payments.

Try Labs → syraa.fun/labs
Identity → 8004scan.io/agents/celo/9673

@celo`,

  deepDive: `Celo x402 technical surface:

→ celoX402Networks.js: CAIP-2 + USDC + facilitator
→ celoX402Settle.js: self-settle + toDataSuffix
→ labX402Payer.js: ExactEvmScheme on 42220
→ Labs UI: Celo tab wallets / sim / schedule
→ ERC-8004: Identity Registry mint #9673`,

  split: `Multi-chain Labs on Syra:

SOLANA: SPL USDC x402 loop
BASE: EVM Exact + Labs payers
CELO: self-settle + ERC-8021 tags

One ops surface. Pick the rail. Run volume.`,

  terminal: `Celo Labs from the stack:

$ Labs → Celo → create wallet + deposit
$ sim /insights with x-lab-x402-chain: celo
< HTTP/402 · eip155:42220 · USDC
$ self-settle + ERC-8021 dataSuffix
< HTTP/200 · Payment-Response · tagged tx`,

  cta: `Building on Celo with Syra.

Fund Labs. Run tagged x402. Climb Most Revenue + Most x402 Payments.

Labs → syraa.fun/labs
8004 → 8004scan.io/agents/celo/9673
Board → dune.com/celo/agentic-payments-defai-hackathon

@CeloDevs @celo`,
};
