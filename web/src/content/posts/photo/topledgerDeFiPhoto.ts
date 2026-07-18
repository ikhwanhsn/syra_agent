import { TOPLEDGER_DEFI_POST } from "../topledgerDeFiUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { TOPLEDGER_DEFI_PHOTO_SHARE_COPIES } from "./shareCopies/topledgerDeFiShareCopies";

const copies = TOPLEDGER_DEFI_PHOTO_SHARE_COPIES;

/** Photo-format content for the TopLedger DeFi intelligence ship log. 15 cards, 15 X posts. */
export const TOPLEDGER_DEFI_PHOTO = definePhotoUpdate(TOPLEDGER_DEFI_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "DeFi · MPP · 9 tools",
      title: "TopLedger ?- Syra",
      subtitle: "Solana DeFi positions, net worth, and PnL wired into Grow, Portfolio, and paid agent tools.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "SPL tokens are not the whole wallet.",
      body: "Portfolio showed memecoins and USDC, but Kamino loans, Jupiter perps, and Meteora LP were invisible. TopLedger indexes 20+ protocols so Syra reports full net worth.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "You cannot grow what you cannot measure in DeFi.",
      narrative: "Lending health, LP value, pending rewards, and perps collateral now surface in Grow and Portfolio. Live USD, protocol by protocol.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Operator flow",
      headline: "Connect. Portfolio. Full DeFi stack.",
      steps: [
        { step: "01", title: "Open Portfolio", description: "Wallets ? Portfolio or Grow. Connect your Solana wallet." },
        { step: "02", title: "TopLedger analyze", description: "Treasury calls analyze_wallet for net worth + categories." },
        { step: "03", title: "DeFi panel", description: "Lending, perps, LP, staking, yield, rewards in one view." },
        { step: "04", title: "Agent tools", description: "External agents use topledger-* tools via x402 per call." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "Product + API + distribution.",
      steps: [
        { step: "01", title: "Adapter", description: "topledgerClient.js. MPP Solana USDC pay-per-call." },
        { step: "02", title: "Grow + Portfolio", description: "defiPositionsService enriches net worth and recommendations." },
        { step: "03", title: "9 agent tools", description: "analyze, holdings, lending, perps, LP, staking, yield, rewards, DEX PnL." },
        { step: "04", title: "Public routes", description: "GET /topledger/wallet/*. x402 resale + Ampersend listing." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four DeFi intelligence surfaces.",
      cards: [
        { title: "Lending", subtitle: "6 protocols", detail: "Deposits, borrows, net USD. Kamino, marginfi, Jupiter Lend.", accent: "gold" },
        { title: "Perps + LP", subtitle: "AMM + perps", detail: "Jupiter Perps, Flash, Meteora, Orca, Raydium positions.", accent: "gold" },
        { title: "Yield + stake", subtitle: "Vaults · SOL", detail: "Kamino vaults, Hylo, Exponent, native validator stakes." },
        { title: "DEX PnL", subtitle: "FIFO basis", detail: "Realized/unrealized PnL and 7-day trading performance." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "TopLedger ?- Syra. Verify it.",
      highlights: [
        "DeFi panel on Wallet Portfolio when positions exist",
        "Grow flags unclaimed rewards and lending leverage",
        "Agent tool topledger-analyze-wallet returns net worth",
        "GET /topledger/wallet/analyze. x402 public route",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "DeFi depth agents can pay for.",
      stats: [
        { value: "20+", label: "Protocols indexed" },
        { value: "9", label: "Agent tools" },
        { value: "$0.0004", label: "MPP upstream / call" },
      ],
      narrative: "Syra resells with x402 margin. Operators get treasury-paid enrichment on Portfolio and Grow.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Net worth that includes DeFi.",
      stats: [{ value: "100%", label: "Position categories" }],
      narrative: "Holdings, lending, perps, LP, staking, yield, rewards, governance. One analyze_wallet response.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Token portfolio vs DeFi intelligence.",
      compareLeft: {
        title: "Before",
        body: "SPL balances and USD prices. DeFi positions required manual protocol checks.",
      },
      compareRight: {
        title: "Now",
        body: "DeFi panel + net worth from TopLedger. Grow signals for rewards and lending risk.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · MPP · Solana",
      partnerName: "TopLedger",
      partnerLogo: "/images/partners/topledger.png",
      partnerLogoSolidBg: true,
      headline: "Syra ?- TopLedger",
      subtitle: "Solana DeFi intelligence in Grow, Portfolio, and nine paid agent tools.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Wired into Syra API.",
      items: [
        "api/libs/topledgerClient.js: callX402V2WithAgent / Treasury",
        "api/libs/defiPositionsService.js: analyze + 5 min cache",
        "GET /topledger/wallet/analyze?wallet=: public x402 proxy",
        "DefiPositionsPanel.tsx: Portfolio UI",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Two lanes",
      headline: "Operators see it. Agents pay for it.",
      body: "Treasury enriches Grow and Portfolio for connected users. External agents call topledger-* tools or /topledger routes with x402 USDC.",
      highlights: [
        "Portfolio DeFi panel",
        "Grow DeFi-aware recommendations",
        "9 MCP-synced agent tools",
        "Ampersend marketplace entries",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Agent tool: analyze wallet.",
      terminalLines: [
        "$ syra tools call topledger-analyze-wallet",
        '> params: {"wallet":"..."}',
        "> total_net_worth_usd: 12450.22",
        "> lending.net_usd: 3200.00",
        "> lp_positions.value_usd: 890.50",
        "> active_protocols: 7",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "See your full Solana DeFi stack.",
      subtitle: "Open Portfolio for the DeFi panel. Agents: topledger-analyze-wallet.",
      links: [
        { label: "Portfolio", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet?view=portfolio" },
        { label: "Grow", value: "syraa.fun/grow", href: "https://www.syraa.fun/grow" },
        { label: "TopLedger", value: "api.topledger.xyz", href: "https://api.topledger.xyz/" },
      ],
    }),
  },
]);
