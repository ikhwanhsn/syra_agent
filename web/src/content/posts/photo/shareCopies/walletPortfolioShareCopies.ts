import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Wallet Portfolio photo deck — 15 distinct topics. */
export const WALLET_PORTFOLIO_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Agent Wallet Portfolio is live on Syra.

New tab on Wallets: see every token your Chat and LP agent wallets hold, with USD value and allocation.

Treasuries for funding. Portfolio for the full bag.

→ syraa.fun/wallet?view=portfolio`,

  thesis: `Treasuries showed SOL and USDC for operations.

But agent wallets also hold memecoins, swap dust, and tokens agents pick up while trading.

Portfolio answers: what do I actually own across every agent wallet?`,

  quote: `"Treasuries show funding. Portfolio shows the bag."

One page. Two tabs. Full SPL holdings with names, prices, and Solscan links.`,

  flow: `How to use Wallet Portfolio:

1. Connect on syraa.fun
2. Open Wallets → Portfolio tab
3. Filter All, Chat, or LP
4. Hide dust, refresh, verify on Solscan

Your agents' full holdings in one view.`,

  timeline: `Portfolio tab shipped:

→ Segmented Treasuries / Portfolio on /wallet
→ Server-side SPL scan for Chat + LP wallets
→ Multi-source token names and USD prices
→ Merged All wallets view with allocation %
→ Shareable ?view=portfolio URL`,

  pillars: `4 things Portfolio gives you:

→ Total USD value across agent wallets
→ Per-token balance with readable formatting
→ Chat / LP / All wallet filters
→ Hide dust + Solscan verify links`,

  checklist: `Wallet Portfolio checklist:

→ Portfolio tab next to Treasuries
→ Real token symbols from DEX + on-chain metadata
→ Live USD value and allocation bars
→ Refresh without page reload`,

  metrics: `2 wallet filters. 5+ metadata sources. 1 merged view.

Portfolio turns agent wallet chaos into an auditable holdings table operators can trust.`,

  featured: `One tab. Every agent token.

SOL, USDC, memecoins, LP receipts: all in one portfolio with USD totals and wallet badges.`,

  comparison: `Before:
Treasuries showed SOL/USDC totals. Swap leftovers and agent trades were invisible until you checked explorers manually.

Now:
Portfolio tab lists every SPL holding, USD value, allocation %, and Solscan links.`,

  launch: `SHIP LOG · Wallet Portfolio is live.

See every token in your Chat and LP agent wallets. USD value. Allocation. Filters. Refresh.

syraa.fun/wallet?view=portfolio`,

  deepDive: `Portfolio data pipeline:

→ GET /wallet/solana/portfolio per agent address
→ DexScreener + Jupiter + pump.fun metadata
→ On-chain Metaplex fallback for bare mints
→ Client merge for All wallets view`,

  split: `Treasuries vs Portfolio:

Treasuries: fund, withdraw, billing caps, SOL/USDC totals.

Portfolio: full SPL bag, USD value, per-token rows, dust filter.

Same page. Different job.`,

  terminal: `Portfolio API surface:

$ curl syraa.fun/wallet/solana/portfolio?address=...
> SOL 8.33 · $565
> PUMP 14,879 · $22.65
> USDC 8.26 · $8.27
> totalValueUsd: 587.92`,

  cta: `Open Portfolio on Wallets today.

Connect → Wallets → Portfolio → see what your agents hold.

syraa.fun/wallet?view=portfolio`,
};
