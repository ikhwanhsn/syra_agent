import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for TopLedger DeFi intelligence photo deck. 15 distinct topics. */
export const TOPLEDGER_DEFI_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces Syra wiring TopLedger DeFi intelligence into the product.

Portfolio and Grow now show lending, perps, LP, staking, yield, and rewards across more than 20 Solana protocols, instead of just SPL token balances.

syraa.fun/wallet?view=portfolio`,

  thesis: `This card names the gap TopLedger closes.

Token holdings were only half the wallet story: Kamino loans, Jupiter perps, Meteora LP, and staking positions were invisible in Syra Portfolio. TopLedger indexes more than 20 protocols so operators can finally see their full net worth.

syraa.fun/wallet?view=portfolio`,

  quote: `The line on this card is the reason the integration exists: you cannot grow what you cannot measure in DeFi.

TopLedger brings lending health, LP value, pending rewards, and perps collateral into Grow and Portfolio in one panel, priced live in USD.

syraa.fun/wallet?view=portfolio`,

  flow: `This image walks the full DeFi picture in four steps.

1. Connect your wallet on syraa.fun
2. Open Wallet, then Portfolio, or open Grow directly
3. TopLedger's analyze_wallet call runs through the Syra treasury
4. The DeFi panel shows lending, perps, LP, staking, yield, and rewards together

Agents can call the same data through the topledger-analyze-wallet tool.

syraa.fun/wallet?view=portfolio`,

  timeline: `This timeline shows how the TopLedger integration shipped end to end.

1. A defiPositionsService adapter enriches Grow's recommendations
2. A DeFi panel was added to the Wallet Portfolio UI
3. Nine agent tools cover analyze, lending, perps, LP, staking, yield, rewards, and DEX PnL
4. Public GET /topledger/wallet/* routes went live with x402 pricing

syraa.fun/wallet?view=portfolio`,

  pillars: `This bento layout groups the four surfaces that became DeFi-aware.

Wallet Portfolio gets a DeFi positions panel alongside net worth. Grow adds lending risk and unclaimed reward signals to its recommendations. Nine topledger-* agent tools sit behind the same x402 pricing as the rest of Syra. The public API exposes it all at /topledger/wallet/analyze.

syraa.fun/wallet?view=portfolio`,

  checklist: `This checklist is what shipped with TopLedger.

1. A DeFi panel shows on Wallet Portfolio whenever a wallet holds DeFi positions
2. Grow's recommendations reference lending risk and unclaimed rewards
3. The topledger-analyze-wallet agent tool returns full net worth
4. GET /topledger/wallet/analyze answers as a public x402 route

syraa.fun/wallet?view=portfolio`,

  metrics: `The numbers on this card describe the integration's reach.

More than 20 Solana DeFi protocols are indexed, spread across nine resellable agent tools, at roughly $0.0004 in upstream cost per call. Portfolio enrichment is cached for five minutes to keep it fast.

syraa.fun/wallet?view=portfolio`,

  featured: `This featured card is about what net worth means now that DeFi is included.

A single analyze_wallet response covers holdings, lending, perps, LP, staking, yield, rewards, and governance positions, all in one call.

syraa.fun/wallet?view=portfolio`,

  comparison: `This before-and-after card compares a token-only portfolio to a full DeFi picture.

Before, Portfolio only showed SPL balances and USD prices, so Kamino and Meteora positions needed a manual explorer check. Now, a DeFi breakdown panel folds lending, LP, and staking into net worth, and Grow flags unclaimed rewards and leverage risk automatically.

syraa.fun/wallet?view=portfolio`,

  launch: `This launch card marks Syra and TopLedger going live together.

Solana DeFi intelligence now runs through Grow, Portfolio, and nine paid agent tools, priced through TopLedger's MPP upstream and resold over x402. No TopLedger API key is required on the agent side.

syraa.fun/wallet?view=portfolio`,

  deepDive: `This deep-dive card lists the technical surface behind the integration.

api/libs/topledgerClient.js handles the MPP and x402 client calls, api/libs/defiPositionsService.js runs the analysis with a cache, and a public x402 proxy sits under api/routes/partner/topledger. The DefiPositionsPanel component renders it on Wallet Portfolio.

syraa.fun/wallet?view=portfolio`,

  split: `This split card explains the two ways TopLedger data reaches people.

Operators see DeFi positions directly inside Portfolio and Grow, funded by the Syra treasury. External agents pay per call through the topledger-* tools or the public /topledger routes, settled in USDC over x402.

syraa.fun/wallet?view=portfolio`,

  terminal: `This terminal card shows a real agent tool call in the request path.

Calling topledger-analyze-wallet with a wallet address returns a total net worth of $12,450.22, a lending net position of $3,200, LP value of $890.50, and seven active protocols.

syraa.fun/wallet?view=portfolio`,

  cta: `This closing card is the ship summary: see your full Solana DeFi stack in one place.

Open Portfolio for the DeFi panel, or call topledger-analyze-wallet directly as an agent.

syraa.fun/wallet?view=portfolio
syraa.fun/grow
api.topledger.xyz`,
};
