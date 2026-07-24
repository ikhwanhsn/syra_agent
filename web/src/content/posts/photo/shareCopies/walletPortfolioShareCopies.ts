import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Wallet Portfolio photo deck: 15 distinct topics. */
export const WALLET_PORTFOLIO_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces the new Wallet Portfolio tab.

It audits every SPL token your agent wallets hold, with live USD values, allocation percentages, and Solscan links for on-chain proof.

syraa.fun/wallet?view=portfolio`,

  thesis: `This card states the gap Portfolio closes.

Treasuries track SOL and USDC for day to day operations, but agent wallets still accumulate swap receipts, memecoins, and LP dust along the way. Portfolio unifies Chat and LP SPL balances into one operator-grade audit.

syraa.fun/wallet?view=portfolio`,

  quote: `This card carries the line behind the feature: you cannot rebalance what you cannot see.

Portfolio surfaces every SPL balance with names, USD value, allocation bars, and Solscan links across both Chat and LP wallets on one page.

syraa.fun/wallet?view=portfolio`,

  flow: `This image walks through auditing your agent wallets, in four steps.

1. Connect your Solana wallet to sign in as an operator
2. Open the Portfolio tab under Wallets, or go straight to the portfolio view link
3. Filter by all wallets, Chat only, or LP only to see which treasury holds each token
4. Hide dust, refresh prices, and open Solscan per mint for on-chain proof

syraa.fun/wallet?view=portfolio`,

  timeline: `This timeline traces how the Portfolio tab was built.

1. A segmented Treasuries and Portfolio toggle was added to the wallet page
2. A server-side RPC scan reads every token account for each agent wallet
3. Prices and names get enriched from DexScreener, Jupiter, pump.fun, and on-chain metadata
4. The All wallets view merges Chat and LP balances with live allocation percentages

syraa.fun/wallet?view=portfolio`,

  pillars: `This bento layout shows the four primitives operators use daily.

A hero card totals portfolio value, asset count, and a one-click refresh. Each token row shows its logo, live price, USD value, and an allocation bar. A wallet filter tags which agent treasury, Chat or LP, holds each token. A dust toggle hides anything under one cent so only positions that matter stay visible.

syraa.fun/wallet?view=portfolio`,

  checklist: `This checklist covers what's live in Wallet Portfolio.

1. A Portfolio tab sits beside Treasuries on the wallet page
2. Real token symbols come from DEX and on-chain metadata, not raw mint addresses
3. Balances show human-readable amounts with live USD and allocation bars
4. A shareable wallet link with the portfolio view deep links straight into it

syraa.fun/wallet?view=portfolio`,

  metrics: `This card lists the numbers behind the Portfolio feature.

Two agent wallet types, Chat and LP, both feed into it. More than five metadata sources fill in token names and prices. All of it merges into one audit view that operators can filter, refresh, and verify before they act.

syraa.fun/wallet?view=portfolio`,

  featured: `This featured card highlights how complete the holdings view is.

Every SPL token your agents picked up gets named and priced, not just the SOL and USDC totals treasuries already tracked.

syraa.fun/wallet?view=portfolio`,

  comparison: `This before and after card compares explorer checks with one audit view.

Before, Treasuries only showed operational SOL and USDC, so checking swap leftovers meant opening an explorer wallet by wallet. Now, Portfolio lists every SPL token with live USD value, allocation percentage, a wallet filter, and Solscan links in one place.

syraa.fun/wallet?view=portfolio`,

  launch: `This launch card marks Wallet Portfolio as live on the Wallets page.

Switching to the Portfolio tab shows every SPL token across Chat and LP wallets, with live USD values and on-chain proof for each one.

syraa.fun/wallet?view=portfolio`,

  deepDive: `This deep-dive card lists the technical surface behind Portfolio.

A GET request to the wallet solana portfolio endpoint runs per agent wallet address. DexScreener, Jupiter, and pump.fun supply price and metadata, with a Metaplex on-chain fallback for unlisted mints. The client merges results and recomputes USD totals for the All wallets view.

syraa.fun/wallet?view=portfolio`,

  split: `This split card explains how Treasuries and Portfolio divide the work.

Treasuries handles deposits, withdrawals, and billing caps for day to day operations. Portfolio surfaces every SPL token your agents actually hold, with proof, a wallet filter for All, Chat, or LP, a dust toggle, and on-demand price refresh.

syraa.fun/wallet?view=portfolio`,

  terminal: `This terminal card shows a real Portfolio API response.

Querying the LP wallet portfolio returns SOL at 8.3321 tokens worth $565.25 and 96.1 percent of the total, PUMP worth $22.66 at 3.9 percent, and USDC worth $8.27 at 26.7 percent, for a total value of $587.92 across four assets.

syraa.fun/wallet?view=portfolio`,

  cta: `This closing card points to where to check what your agents hold.

Open Wallets and switch to the Portfolio tab, or jump straight to the portfolio view link to audit every SPL token with live USD and Solscan links. Fund additional agent wallets from settings.

syraa.fun/wallet
syraa.fun/wallet?view=portfolio
syraa.fun/settings`,
};
