import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Wallet Portfolio photo deck: 15 distinct topics. */
export const WALLET_PORTFOLIO_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Wallet Portfolio is live on Syra.

One tab shows every SPL token across Chat and LP agent wallets: live USD, allocation %, and Solscan links.

Treasuries fund ops. Portfolio proves what you actually hold.

→ syraa.fun/wallet?view=portfolio`,

  thesis: `Treasuries answer: "Can my agents keep running?"

Portfolio answers: "What did they actually accumulate?"

Memecoins, swap receipts, LP dust. All surfaced in one auditable view across Chat + LP wallets.`,

  quote: `"You cannot rebalance what you cannot see."

Wallet Portfolio lists every SPL holding with names, USD value, allocation bars, and Solscan proof. One page, two tabs.`,

  flow: `Audit your agent bag in 4 steps:

1. Connect your Solana wallet on syraa.fun
2. Wallets → Portfolio (or ?view=portfolio)
3. Filter All, Chat, or LP
4. Hide dust, refresh prices, verify on Solscan

Full holdings. No explorer tab hopping.`,

  timeline: `Wallet Portfolio shipped end to end:

→ Treasuries / Portfolio tabs on /wallet
→ Server-side SPL scan per agent wallet
→ DexScreener + Jupiter + pump.fun + on-chain metadata
→ Merged All-wallets view with allocation %
→ Shareable ?view=portfolio deep link`,

  pillars: `4 primitives operators actually use:

→ USD total + asset count at a glance
→ Per-token rows: logo, balance, price, allocation bar
→ Wallet filter: All · Chat · LP with treasury badges
→ Dust toggle + Solscan verify per mint`,

  checklist: `Wallet Portfolio checklist. Verify it yourself:

→ Portfolio tab beside Treasuries on /wallet
→ Real symbols from DEX + on-chain metadata (not raw mints)
→ Human-readable balances, live USD, allocation bars
→ On-demand refresh without reload
→ Shareable /wallet?view=portfolio URL`,

  metrics: `2 agent wallet types. 5+ metadata sources. 1 merged audit view.

Portfolio turns scattered SPL balances into a holdings table operators can verify before they rebalance or withdraw.`,

  featured: `100% of SPL holdings surfaced. Not just SOL/USDC totals.

Every token your Chat and LP agents picked up: named, priced in USD, tagged by wallet, linked to Solscan.`,

  comparison: `Before:
Treasuries showed operational SOL/USDC. Swap leftovers and agent trades stayed invisible until you opened explorers wallet by wallet.

Now:
Portfolio tab. Every SPL token, live USD, allocation %, wallet filter, and one-click Solscan proof.`,

  launch: `SHIP LOG · Wallet Portfolio is live.

See the full agent bag: every SPL token, USD value, allocation %, Chat/LP filters, dust toggle, refresh on demand.

syraa.fun/wallet?view=portfolio`,

  deepDive: `Portfolio data pipeline (production surface):

→ GET /wallet/solana/portfolio?address= per agent wallet
→ DexScreener + Jupiter + pump.fun for price + metadata
→ Metaplex on-chain fallback for unlisted mints
→ Client-side merge + USD recompute for All wallets`,

  split: `Same page. Two jobs.

Treasuries: deposit, withdraw, billing caps, operational SOL/USDC.

Portfolio: full SPL bag audit. Per-token USD, allocation bars, dust filter, refresh.

Fund in one tab. Verify in the other.`,

  terminal: `Portfolio API. Real response shape:

$ syra wallet portfolio --lp
> SOL     8.3321   $565.25   96.1%
> PUMP   14,879    $22.66    3.9%
> totalValueUsd: 587.92

Operators get structured data, not explorer archaeology.`,

  cta: `Stop guessing what your agents hold.

Connect → Wallets → Portfolio → audit every SPL token with live USD and Solscan links.

syraa.fun/wallet?view=portfolio`,
};
