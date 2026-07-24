import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Token Analyzer Multi-Chain photo deck. 15 distinct topics. */
export const TOKEN_ANALYZER_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces Token Analyzer replacing the old Solana-only Pumpfun Alpha.

The same scoring model now reads a Solana mint or an EVM address, and lives at a new /analyzer route.

syraa.fun/analyzer`,

  thesis: `This card names the shift behind the rename.

Alpha scoring used to be Solana-only, but tokens are not. Pasting either a Solana mint or an EVM 0x address now runs through the same analyzer, with live feeds capped at the ten most recent scans.

syraa.fun/analyzer`,

  quote: `The line on this card is the pitch in plain words: paste a mint or a 0x, get the same score.

Solana keeps its full depth, including holders and security checks, while EVM chains ship market data and KOL mentions first.

syraa.fun/analyzer`,

  flow: `This image walks the scan loop in four steps.

1. Paste a Solana mint or an EVM address
2. The analyzer detects which chain it belongs to
3. A Syra Alpha score gets computed either way
4. The result gets tracked on the Live, My calls, or Best callers feed

syraa.fun/analyzer`,

  timeline: `This timeline shows how Pumpfun Alpha became Token Analyzer.

1. The page moved to /analyzer, with the old /pumpfun URL redirecting
2. An EVM path was added, pulling from DexScreener and KOL mentions
3. The existing Solana analysis stack stayed intact
4. Every feed got capped at the latest 10 results, with search and filter added

syraa.fun/analyzer`,

  pillars: `This bento layout groups the four surfaces inside the analyzer.

Scan accepts either a mint or a 0x address. Live shows the ten most recent community scans. My calls lets you filter your own history by 2x or 10x outcomes. Callers ranks the top 10 by peak gain.

syraa.fun/analyzer`,

  checklist: `This checklist is what shipped with Token Analyzer.

1. The page now lives at /analyzer, with /pumpfun redirecting automatically
2. Supported chains cover Solana plus Ethereum, Base, BSC, and Arbitrum
3. The EVM path ships a market data MVP with a chain badge on results
4. The Live, My calls, and Best callers feeds are capped at the latest 10
5. List views show a delayed skeleton after 450ms

syraa.fun/analyzer`,

  metrics: `The numbers on this card describe the expansion.

More than four EVM chains are now supported alongside Solana, every community feed caps out at the latest 10 entries, and it all runs through the single /analyzer route. Solana keeps its full depth while EVM ships market data first.

syraa.fun/analyzer`,

  featured: `This featured card is about the EVM path that just shipped.

It pulls price, liquidity, and volume from DexScreener, adds KOL mentions, and runs the same Syra Alpha score used on Solana. Holders and honeypot checks are planned next.

syraa.fun/analyzer`,

  comparison: `This before-and-after card compares the old Pumpfun Alpha to the new Token Analyzer.

Before, only a Solana mint worked, and feeds ran long with no filtering. Now, Solana and EVM addresses both work, and every feed caps at the latest 10 with search and filter built in.

syraa.fun/analyzer`,

  launch: `This launch card marks Token Analyzer going multi-chain.

Pasting a Solana mint or an Ethereum address now runs through the same scan, score, and track flow.

syraa.fun/analyzer
syraa.fun/assets`,

  deepDive: `This deep-dive card lists the technical surface behind the analyzer.

tokenChainDetect and tokenAnalysisService handle Solana, evmTokenAnalysisService pulls from DexScreener for EVM chains, and both flow through GET /agent/tokens/memecoin-analysis. The PumpfunListToolbar component adds the delayed skeleton on list views.

syraa.fun/analyzer`,

  split: `This split card explains the difference in depth between chains.

Solana keeps its full stack: holders, security checks, trades, and pump.fun data. EVM chains get a market-first MVP: price, liquidity, volume, and KOL mentions. Either way, the verdict carries a chain badge and the same Syra Alpha score.

syraa.fun/analyzer`,

  terminal: `This terminal card shows a scan in a real request path.

A call to GET /agent/tokens/memecoin-analysis with an 0x address detects it as EVM, pulls the best pair and KOL data from DexScreener, and computes the Syra Alpha score before returning chain, market, and score fields together.

syraa.fun/analyzer`,

  cta: `This closing card is the ship summary: open Analyzer and paste any token.

A Solana mint or an Ethereum address both run through the same Syra Alpha surface.

syraa.fun/analyzer
syraa.fun/assets
syraa.fun/swap`,
};
