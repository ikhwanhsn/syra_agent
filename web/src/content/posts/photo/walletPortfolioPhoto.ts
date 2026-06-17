import { WALLET_PORTFOLIO_POST } from "../walletPortfolioUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { WALLET_PORTFOLIO_PHOTO_SHARE_COPIES } from "./shareCopies/walletPortfolioShareCopies";

const copies = WALLET_PORTFOLIO_PHOTO_SHARE_COPIES;

/** Photo-format content for the Wallet Portfolio ship log — 15 cards, 15 X posts. */
export const WALLET_PORTFOLIO_PHOTO = definePhotoUpdate(WALLET_PORTFOLIO_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-minimal",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Portfolio · Chat + LP",
      title: "Wallet Portfolio",
      subtitle: "Audit every SPL token your agent wallets hold — live USD, allocation %, Solscan proof.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Funding is not the same as holdings.",
      body: "Treasuries track SOL and USDC for ops. Agent wallets still accumulate swap receipts, memecoins, and LP dust. Portfolio unifies Chat + LP SPL balances into one operator-grade audit.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "You cannot rebalance what you cannot see.",
      narrative: "Portfolio surfaces every SPL balance — names, USD value, allocation bars, and Solscan links — across Chat and LP on one page.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Operator flow",
      headline: "Connect. Open Portfolio. Verify.",
      steps: [
        { step: "01", title: "Connect wallet", description: "Sign in with Solana on Syra — your operator identity." },
        { step: "02", title: "Open Portfolio", description: "Wallets → Portfolio tab, or land directly at ?view=portfolio." },
        { step: "03", title: "Filter wallets", description: "All wallets, Chat only, or LP only — see which treasury holds each token." },
        { step: "04", title: "Audit holdings", description: "Hide dust, refresh prices, open Solscan per mint for on-chain proof." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "Portfolio tab, end to end.",
      steps: [
        { step: "01", title: "UI tabs", description: "Segmented Treasuries / Portfolio on /wallet." },
        { step: "02", title: "SPL scan", description: "Server RPC reads every token account per agent wallet." },
        { step: "03", title: "Enrichment", description: "DexScreener, Jupiter, pump.fun, plus on-chain metadata." },
        { step: "04", title: "Merged view", description: "All wallets combines Chat + LP with live allocation %." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four primitives operators use daily.",
      cards: [
        { title: "USD total", subtitle: "Portfolio value", detail: "Hero card: total value, asset count, one-click refresh.", accent: "gold" },
        { title: "Token rows", subtitle: "Logo + balance", detail: "Symbol, live price, USD value, allocation bar per asset.", accent: "gold" },
        { title: "Wallet filter", subtitle: "All · Chat · LP", detail: "Pills tag which agent treasury holds each token." },
        { title: "Dust toggle", subtitle: "< $0.01", detail: "Cut noise — focus on positions that matter." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Wallet Portfolio is live — verify it.",
      highlights: [
        "Portfolio tab beside Treasuries on /wallet",
        "Real token symbols from DEX + on-chain metadata",
        "Human-readable balances with live USD and allocation bars",
        "Shareable /wallet?view=portfolio deep link",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Built for operators who verify before they act.",
      stats: [
        { value: "2", label: "Agent wallet types" },
        { value: "5+", label: "Metadata sources" },
        { value: "1", label: "Merged audit view" },
      ],
      narrative: "Chat and LP treasuries in one holdings table — priced in USD, filterable, refreshable.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Zero blind spots on agent holdings.",
      stats: [{ value: "100%", label: "SPL balances surfaced" }],
      narrative: "Not just SOL/USDC totals — every token your agents picked up, named and priced.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Explorer tabs vs one audit view.",
      compareLeft: {
        title: "Before",
        body: "Treasuries showed operational SOL/USDC. Swap leftovers required wallet-by-wallet explorer checks.",
      },
      compareRight: {
        title: "Now",
        body: "Portfolio lists every SPL token — live USD, allocation %, wallet filter, Solscan links.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live",
      title: "Wallet Portfolio",
      subtitle: "Full agent holdings audit on the Wallets page.",
      body: "Switch to Portfolio — see every SPL token across Chat and LP with live USD and on-chain proof.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "How Portfolio is built.",
      items: [
        "GET /wallet/solana/portfolio?address= per agent wallet",
        "DexScreener + Jupiter + pump.fun for price and metadata",
        "Metaplex on-chain fallback for unlisted mints",
        "Client merge + USD recompute for the All wallets view",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Two tabs",
      headline: "Fund in Treasuries. Verify in Portfolio.",
      body: "Treasuries handles deposit, withdraw, and billing caps. Portfolio surfaces every SPL token your agents actually hold — with proof.",
      highlights: [
        "Segmented Treasuries / Portfolio tabs",
        "Wallet filter: All, Chat, LP",
        "Hide dust under one cent",
        "Refresh prices on demand",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Real API. Real balances.",
      terminalLines: [
        "$ syra wallet portfolio --lp",
        "> SOL     8.3321   $565.25   96.1%",
        "> PUMP   14,879    $22.66    3.9%",
        "> USDC    8.2648    $8.27   26.7%",
        "> totalValueUsd: 587.92",
        "< 4 assets · refresh ok",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Stop guessing what your agents hold.",
      subtitle: "Open Wallets → Portfolio. Audit every SPL token with live USD and Solscan links.",
      links: [
        { label: "Wallets", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet" },
        { label: "Portfolio", value: "?view=portfolio", href: "https://www.syraa.fun/wallet?view=portfolio" },
        { label: "Settings", value: "Agent wallets", href: "https://www.syraa.fun/settings" },
      ],
    }),
  },
]);
