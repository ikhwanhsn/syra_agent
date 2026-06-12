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
      subtitle: "See every token your agent wallets hold, with live USD value and allocation.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "Why this matters",
      headline: "Treasuries show funding. Portfolio shows the bag.",
      body: "Agent wallets pick up SOL, USDC, memecoins, and swap leftovers. Portfolio lists every SPL holding across Chat and LP in one auditable view.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Treasuries show funding. Portfolio shows the bag.",
      narrative: "One Wallets page. Two tabs. Full holdings with names, USD value, and Solscan links.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How to use it",
      headline: "Connect → Wallets → Portfolio.",
      steps: [
        { step: "01", title: "Connect wallet", description: "Sign in with your Solana wallet on Syra." },
        { step: "02", title: "Open Portfolio", description: "Wallets page → Portfolio tab or ?view=portfolio." },
        { step: "03", title: "Filter wallets", description: "All wallets, Chat only, or LP only." },
        { step: "04", title: "Audit holdings", description: "Hide dust, refresh, open Solscan per token." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "Portfolio tab end to end.",
      steps: [
        { step: "01", title: "UI tabs", description: "Treasuries and Portfolio on /wallet." },
        { step: "02", title: "SPL scan", description: "Server RPC reads all token accounts per agent wallet." },
        { step: "03", title: "Enrichment", description: "DexScreener, Jupiter, pump.fun, on-chain metadata." },
        { step: "04", title: "Merged view", description: "All wallets combines Chat + LP with allocation %." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four portfolio primitives.",
      cards: [
        { title: "USD total", subtitle: "Portfolio value", detail: "Hero card with asset count and refresh.", accent: "gold" },
        { title: "Token rows", subtitle: "Logo + balance", detail: "Symbol, price, value, allocation bar per asset.", accent: "gold" },
        { title: "Wallet filter", subtitle: "All · Chat · LP", detail: "Pills show which treasury holds each token." },
        { title: "Dust toggle", subtitle: "< $0.01", detail: "Focus on meaningful positions only." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Wallet Portfolio is live.",
      highlights: [
        "Portfolio tab on the Wallets page",
        "Real token names from multi-source metadata",
        "Readable balances (no scientific notation)",
        "Shareable /wallet?view=portfolio URL",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Built for agent operators.",
      stats: [
        { value: "2", label: "Agent wallet types" },
        { value: "5+", label: "Metadata sources" },
        { value: "1", label: "Merged portfolio view" },
      ],
      narrative: "Chat and LP treasuries in one holdings table with live USD pricing.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Every agent token. One tab.",
      stats: [{ value: "100%", label: "SPL holdings surfaced" }],
      narrative: "No more guessing what agents picked up while trading. Portfolio shows the full bag.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Before vs now.",
      compareLeft: {
        title: "Before",
        body: "Treasuries showed SOL/USDC. Swap leftovers required manual explorer checks.",
      },
      compareRight: {
        title: "Now",
        body: "Portfolio lists every SPL token, USD value, allocation %, and Solscan links.",
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
      subtitle: "Full agent holdings on the Wallets page.",
      body: "Switch to Portfolio to audit Chat and LP tokens with live USD value.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Portfolio data pipeline.",
      items: [
        "GET /wallet/solana/portfolio?address= per agent wallet",
        "DexScreener + Jupiter + pump.fun price and metadata",
        "On-chain Metaplex metadata for unlisted mints",
        "Client merge + recompute USD value for All wallets",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Two tabs",
      headline: "Treasuries fund. Portfolio audits.",
      body: "Treasuries handles deposit, withdraw, and billing. Portfolio surfaces every token the agents actually hold.",
      highlights: [
        "Segmented Treasuries / Portfolio tabs",
        "Wallet filter: All, Chat, LP",
        "Hide dust under one cent",
        "Refresh on demand",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Portfolio API response.",
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
      headline: "See what your agents hold.",
      subtitle: "Open Wallets, switch to Portfolio, and audit the full bag.",
      links: [
        { label: "Wallets", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet" },
        { label: "Portfolio", value: "?view=portfolio", href: "https://www.syraa.fun/wallet?view=portfolio" },
        { label: "Settings", value: "Agent wallets", href: "https://www.syraa.fun/settings" },
      ],
    }),
  },
]);
