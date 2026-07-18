import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Token Analyzer Multi-Chain photo deck. 15 distinct topics. */
export const TOKEN_ANALYZER_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Token Analyzer goes multi-chain.

Solana mint or EVM 0x address.
Same Syra Alpha. New /analyzer route.

Try it → syraa.fun/analyzer`,

  thesis: `Alpha was Solana-only. Tokens are not.

Operators chase runners on Ethereum and Base too.
One analyzer. Chain detect. Syra Alpha score.

Paste. Scan. Track.`,

  quote: `"Paste a mint or a 0x. Same score."

Solana keeps holders and security.
EVM ships market + KOL first.
Live feeds stay at the latest 10.`,

  flow: `Analyzer loop:

1. Paste Solana mint or EVM address
2. Detect chain (solana vs 0x)
3. Score with Syra Alpha
4. Track on Live / My calls / Best callers

One surface. Multi-chain.`,

  timeline: `What shipped:

→ /analyzer rename + /pumpfun redirect
→ EVM path: DexScreener + KOL + Syra Alpha
→ Solana depth unchanged
→ Live / history / callers: latest 10
→ Search + filter + 450ms skeleton`,

  pillars: `3 layers. One Analyzer:

→ DETECT: Solana mint vs EVM 0x
→ ANALYZE: Solana depth or EVM market
→ SURFACE: 10 latest + search + filter`,

  checklist: `Token Analyzer is live:

→ /analyzer (legacy /pumpfun redirects)
→ Solana + Ethereum, Base, BSC, Arbitrum
→ EVM market MVP + chain badge
→ Live / My calls / Best callers: top 10
→ Search and filter on every feed

Open → syraa.fun/analyzer`,

  metrics: `By the numbers:

→ 4+ EVM chains supported
→ 10 latest items per community feed
→ 1 analyzer route for all chains

Solana depth. EVM market alpha.`,

  featured: `The EVM path that just shipped:

DexScreener price, liquidity, volume.
KOL / X mentions.
Shared Syra Alpha score.

Holders and honeypot checks come next.`,

  comparison: `Before: Pumpfun Alpha. Solana mint only. Long feeds.

Now: Token Analyzer. Solana + EVM.
Latest 10 with search and filter.
Same Syra Alpha verdict.`,

  launch: `SHIP LOG · Token Analyzer multi-chain.

Paste Solana or Ethereum.
Scan. Score. Track the latest 10.

→ syraa.fun/analyzer
→ syraa.fun/assets`,

  deepDive: `Technical surface:

→ tokenChainDetect + tokenAnalysisService
→ evmTokenAnalysisService (DexScreener)
→ GET /agent/tokens/memecoin-analysis
→ PumpfunListToolbar + delayed skeleton
→ /analyzer routes with /pumpfun redirect`,

  split: `Two depths. One Analyzer:

SOLANA: holders, security, trades, pump.fun
EVM: market stats + KOL (MVP)

Chain badge on the verdict either way.`,

  terminal: `Scan from the stack:

$ GET /agent/tokens/memecoin-analysis?mint=0x…
> detectTokenChainKind → evm
> DexScreener best pair + KOL
> computeSyraAlphaScore
< chain · token · market · syraAlpha`,

  cta: `Ready to scan multi-chain?

Analyzer → syraa.fun/analyzer
Assets → syraa.fun/assets
Swap → syraa.fun/swap`,
};
