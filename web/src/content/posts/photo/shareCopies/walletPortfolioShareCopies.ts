import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Wallet Portfolio photo deck: 15 distinct topics. */
export const WALLET_PORTFOLIO_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Wallet Portfolio is live.

It audits everything your agent holds: every Solana token across Chat and LP wallets, with live USD, allocation percent, and Solscan proof.

syraa.fun/wallet?view=portfolio`,

  thesis: `Funding is not the same as holdings.

Treasuries track SOL and USDC for day to day ops. Agent wallets still pick up swap leftovers, memecoins, and dust from providing tokens so others can trade. Portfolio puts Chat and LP balances into one operator audit.

syraa.fun/wallet?view=portfolio`,

  quote: `You cannot rebalance what you cannot see.

Portfolio lists every Solana token balance: names, USD value, allocation bars, and Solscan links across Chat and LP on one page.

syraa.fun/wallet?view=portfolio`,

  flow: `How an operator audits agent holdings.

1. Connect with Solana. That is your operator identity
2. Open Portfolio under Wallets, or land on ?view=portfolio
3. Filter All wallets, Chat only, or LP only to see which treasury holds each token
4. Hide dust, refresh prices, open Solscan per mint for on-chain proof

syraa.fun/wallet?view=portfolio`,

  timeline: `What shipped for Portfolio, end to end.

1. Segmented Treasuries / Portfolio tabs on /wallet
2. Server RPC reads every token account per agent wallet
3. Names and prices from DexScreener, Jupiter, pump.fun, plus on-chain metadata
4. All wallets merges Chat and LP with live allocation percent

syraa.fun/wallet?view=portfolio`,

  pillars: `Four things operators use every day.

A hero total shows portfolio value, asset count, and one-click refresh. Each token row has logo, balance, live price, USD, and an allocation bar. A wallet filter tags whether Chat or LP holds it. A dust toggle hides anything under one cent.

syraa.fun/wallet?view=portfolio`,

  checklist: `Wallet Portfolio is live. Verify it.

1. Portfolio tab sits beside Treasuries on /wallet
2. Real token symbols from DEX and on-chain metadata
3. Human-readable balances with live USD and allocation bars
4. Shareable /wallet?view=portfolio deep link

syraa.fun/wallet?view=portfolio`,

  metrics: `Built for operators who verify before they act.

2 agent wallet types. 5+ metadata sources. 1 merged audit view.

Chat and LP treasuries sit in one holdings table, priced in USD, filterable, refreshable.

syraa.fun/wallet?view=portfolio`,

  featured: `Zero blind spots on agent holdings.

Every Solana token your agents picked up is named and priced, not just the SOL and USDC totals treasuries already tracked.

syraa.fun/wallet?view=portfolio`,

  comparison: `Wallet explorer tabs vs one audit view.

Before, Treasuries showed operational SOL and USDC, and swap leftovers meant checking explorers wallet by wallet. Now Portfolio lists every Solana token with live USD, allocation percent, a wallet filter, and Solscan links.

syraa.fun/wallet?view=portfolio`,

  launch: `Wallet Portfolio is live on the Wallets page.

Switch to Portfolio. See every Solana token across Chat and LP, with live USD and on-chain proof.

syraa.fun/wallet?view=portfolio`,

  deepDive: `How Portfolio is built.

GET /wallet/solana/portfolio?address= runs per agent wallet. DexScreener, Jupiter, and pump.fun supply price and metadata. Metaplex is the on-chain fallback for unlisted mints. The client merges results and recomputes USD for All wallets.

syraa.fun/wallet?view=portfolio`,

  split: `Fund in Treasuries. Verify in Portfolio.

Treasuries handles deposit, withdraw, and billing caps. Portfolio surfaces everything your agents actually hold, with proof. Filter All, Chat, or LP. Hide dust under one cent. Refresh prices on demand.

syraa.fun/wallet?view=portfolio`,

  terminal: `A real Portfolio response.

LP wallet scan: SOL 8.3321 at $565.25 (96.1%), PUMP 14,879 at $22.66 (3.9%), USDC 8.2648 at $8.27. Total value $587.92 across four assets. Refresh ok.

syraa.fun/wallet?view=portfolio`,

  cta: `Stop guessing what your agents hold.

Open Wallets, switch to Portfolio, and audit every Solana token with live USD and Solscan links.

syraa.fun/wallet
syraa.fun/wallet?view=portfolio
syraa.fun/settings`,
};
