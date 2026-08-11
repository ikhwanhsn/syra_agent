import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for TopLedger DeFi intelligence photo deck. 15 distinct topics. */
export const TOPLEDGER_DEFI_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra now shows full Solana DeFi, onchain lending and trading, not just token balances.

Portfolio and Grow pull TopLedger data for lending, perps, LP, staking, yield, and rewards across more than 20 protocols, plus paid agent tools.

syraa.fun/wallet?view=portfolio`,

  thesis: `SPL tokens are not the whole wallet.

Portfolio showed memecoins and USDC, but Kamino loans, Jupiter perps, and Meteora LP were invisible. TopLedger indexes 20+ protocols so Syra can report full net worth.

syraa.fun/wallet?view=portfolio`,

  quote: `You cannot grow what you cannot measure in DeFi.

Lending health, LP value, pending rewards, and perps collateral now surface in Grow and Portfolio, live in USD, protocol by protocol.

syraa.fun/wallet?view=portfolio`,

  flow: `From connect to a full DeFi stack in four steps.

1. Open Portfolio or Grow and connect your Solana wallet
2. Treasury calls TopLedger analyze_wallet for net worth and categories
3. The DeFi panel shows lending, perps, LP, staking, yield, and rewards in one view
4. External agents use topledger-* tools via x402 per call

syraa.fun/wallet?view=portfolio`,

  timeline: `How the TopLedger integration shipped.

1. Adapter: topledgerClient.js, MPP Solana USDC pay-per-call
2. Grow and Portfolio: defiPositionsService enriches net worth and recommendations
3. Nine agent tools: analyze, holdings, lending, perps, LP, staking, yield, rewards, DEX PnL
4. Public routes: GET /topledger/wallet/*, x402 resale plus Ampersend listing

syraa.fun/wallet?view=portfolio`,

  pillars: `Four DeFi intelligence surfaces.

Lending covers 6 protocols, including Kamino, marginfi, and Jupiter Lend, with deposits, borrows, and net USD. Perps and LP cover Jupiter Perps, Flash, Meteora, Orca, and Raydium. Yield and stake cover Kamino vaults, Hylo, Exponent, and native validator stakes. DEX PnL uses FIFO basis for realized and unrealized results and 7-day trading performance.

syraa.fun/wallet?view=portfolio`,

  checklist: `How to verify TopLedger on Syra.

1. DeFi panel on Wallet Portfolio when positions exist
2. Grow flags unclaimed rewards and lending leverage
3. Agent tool topledger-analyze-wallet returns net worth
4. GET /topledger/wallet/analyze as a public x402 route

syraa.fun/wallet?view=portfolio`,

  metrics: `20+ protocols indexed. 9 agent tools. $0.0004 MPP upstream per call.

Syra resells with x402 margin. Operators get treasury-paid enrichment on Portfolio and Grow.

syraa.fun/wallet?view=portfolio`,

  featured: `Net worth that includes DeFi, not just tokens.

A single analyze_wallet response covers holdings, lending, perps, LP, staking, yield, rewards, and governance. One hundred percent of those position categories in one call.

syraa.fun/wallet?view=portfolio`,

  comparison: `A token portfolio versus DeFi intelligence.

Before, Portfolio only showed SPL balances and USD prices, so DeFi positions needed manual protocol checks. Now a DeFi panel plus net worth from TopLedger, and Grow signals for rewards and lending risk.

syraa.fun/wallet?view=portfolio`,

  launch: `Syra and TopLedger are live together.

Solana DeFi intelligence now runs through Grow, Portfolio, and nine paid agent tools, priced through TopLedger's MPP upstream and resold over x402.

syraa.fun/wallet?view=portfolio`,

  deepDive: `Wired into the Syra API.

api/libs/topledgerClient.js handles MPP and x402 calls. api/libs/defiPositionsService.js runs analyze with a 5 minute cache. GET /topledger/wallet/analyze is the public x402 proxy. DefiPositionsPanel.tsx renders it on Portfolio.

syraa.fun/wallet?view=portfolio`,

  split: `Operators see it, and agents pay for it.

Treasury enriches Grow and Portfolio for connected users. External agents call topledger-* tools or /topledger routes with x402 USDC. Portfolio DeFi panel, Grow recommendations, nine MCP-synced tools, Ampersend marketplace entries.

syraa.fun/wallet?view=portfolio`,

  terminal: `An agent can call topledger-analyze-wallet and get a full net worth breakdown.

The example response shows total net worth $12,450.22, lending net $3,200, LP value $890.50, and seven active protocols.

syraa.fun/wallet?view=portfolio`,

  cta: `See your full Solana DeFi stack.

Open Portfolio for the DeFi panel. Agents can call topledger-analyze-wallet.

syraa.fun/wallet?view=portfolio
syraa.fun/grow
api.topledger.xyz`,
};
