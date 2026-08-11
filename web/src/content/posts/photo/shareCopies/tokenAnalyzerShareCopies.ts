import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Token Analyzer Multi-Chain photo deck. 15 distinct topics. */
export const TOKEN_ANALYZER_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Token Analyzer now scans more than Solana.

Paste a Solana mint or an EVM address. You get the same Syra Alpha score, plus live feeds capped at ten with search.

syraa.fun/analyzer`,

  thesis: `Alpha used to be Solana-only. Tokens are not.

Paste a mint or a 0x and get the same Syra Alpha. Live feeds stay capped at ten and searchable.

syraa.fun/analyzer`,

  quote: `Paste a mint or a 0x and get the same score.

Solana keeps its full depth. EVM ships market data and KOL mentions first.

syraa.fun/analyzer`,

  flow: `The scan loop is four steps.

1. Paste a mint or a 0x address
2. Detect Solana or EVM
3. Score with Syra Alpha
4. Track it on the latest 10, with search and filter

syraa.fun/analyzer`,

  timeline: `From Pumpfun Alpha to multi-chain Analyzer.

1. Rename: /analyzer, with /pumpfun redirect
2. EVM path: DexScreener plus KOL
3. Solana depth kept
4. Feeds: latest 10, plus search and filter

syraa.fun/analyzer`,

  pillars: `Four surfaces, one Analyzer.

Scan accepts a mint or a 0x. Live shows the ten most recent community scans. My calls filters your history by 2x or 10x views. Callers ranks the top 10 by peak gain.

syraa.fun/analyzer`,

  checklist: `Token Analyzer is live now.

1. /analyzer with /pumpfun redirect
2. Solana plus Ethereum, Base, BSC, Arbitrum
3. EVM market MVP with a chain badge
4. Feeds: latest 10, search, and filter
5. 450ms delayed list skeletons

syraa.fun/analyzer`,

  metrics: `More chains and cleaner feeds.

4+ EVM chains. 10 latest per feed. 1 Analyzer route.

Solana depth stays intact. EVM market alpha ships first.

syraa.fun/analyzer`,

  featured: `The EVM path that just shipped.

DexScreener plus Syra Alpha. Market data and KOL mentions first. Holders and honeypot checks come next.

syraa.fun/analyzer`,

  comparison: `Pumpfun Alpha vs Token Analyzer.

Before, only a Solana mint worked, and feeds ran long with no filter. Now Solana and EVM both work, and every feed caps at the latest 10 with search and filter.

syraa.fun/analyzer`,

  launch: `Syra × Robinhood: Token Analyzer is multi-chain.

Solana depth and EVM market alpha on one /analyzer surface.

syraa.fun/analyzer
syraa.fun/assets`,

  deepDive: `Wired into Analyzer and the memecoin API.

tokenChainDetect plus tokenAnalysisService handle Solana. evmTokenAnalysisService pulls DexScreener for EVM. Both flow through GET /agent/tokens/memecoin-analysis. List views use a delayed skeleton.

syraa.fun/analyzer`,

  split: `Solana keeps the full stack. EVM ships a market MVP.

Holders and security stay Solana. EVM gets price, liquidity (how much is in the pool so people can trade), volume, and KOL. Verdicts carry a chain badge and the same Syra Alpha score. Solana-only tabs stay gated on EVM. Feeds cap at ten.

syraa.fun/analyzer`,

  terminal: `A real scan in the stack.

GET /agent/tokens/memecoin-analysis with a 0x address detects EVM, pulls the best DexScreener pair plus KOL, computes Syra Alpha, and returns chain, market, and score together.

syraa.fun/analyzer`,

  cta: `Open Analyzer. Paste any token.

A Solana mint or an Ethereum address runs on the same Syra Alpha surface.

syraa.fun/analyzer
syraa.fun/assets
syraa.fun/swap`,
};
