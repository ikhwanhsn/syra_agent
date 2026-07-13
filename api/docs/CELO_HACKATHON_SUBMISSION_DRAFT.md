# Syra — Celo hackathon submission (PUBLISHED 2026-07-13)

Published on celobuilders.xyz · status=`published` · attribution `celo_3ef93c3cb10b`

X post: https://x.com/syra_agent/status/2076644733162869156

## Attribution tag (LOCKED — use in every tx)
`celo_3ef93c3cb10b`

```ts
import { toDataSuffix } from '@celo/attribution-tags'
await wallet.sendTransaction({ to, value, data: toDataSuffix('celo_3ef93c3cb10b') })
```

Set in `api/.env`: `CELO_ATTRIBUTION_TAG=celo_3ef93c3cb10b`

## Tracks
- `most-revenue-generated`
- `most-x402-payments`

## Draft fields
- projectName: Syra
- tagline: Agentic x402 payment rails with real on-chain volume on Celo, Solana, and Base
- description: Syra is an agentic payments and DeFAI platform. For this hackathon we added a Celo Labs x402 engine that self-settles Exact EIP-3009 USDC payments on Celo mainnet with ERC-8021 attribution tags on every settlement and refund transfer, so tagged revenue and payment count climb on the live Dune leaderboard.
- githubUrl: https://github.com/ikhwanhsn/syra_agent/
- celoNetwork: celo-mainnet
- trackIds: ["most-revenue-generated", "most-x402-payments"]
- bountyIds: ["most-revenue-generated-1st", "most-x402-payments-1st"]
- customFields.telegram: @ikhwanhsn
- customFields.agentWalletAddress: 0xD85Ec8eCD3C04c4843d4E354f4Dd95A081007DFA
- customFields.erc8004Url: https://8004scan.io/agents/celo/9673
- socialLink: <X post URL tagging @CeloDevs + @Celo — paste after posting>
- demoUrl: https://syraa.fun/labs (admin)
- agentContributionNotes: Agent implemented Celo chain plumbing, self-settlement with ERC-8021 tagging, Labs Celo tab, and registration/submission flow.

## Example X post (also on Post Studio #24 cover share copy)
I am building for the @CeloDevs Agent Hackathon

Working on: Syra — agentic x402 payments with tagged Celo volume for Most Revenue + Most x402 Payments.

Registered onchain → https://8004scan.io/agents/celo/9673

Let's go! @celo

Post Studio: /post/photo/24 (cover) or /post/video/24

## Leaderboard
https://dune.com/celo/agentic-payments-defai-hackathon
