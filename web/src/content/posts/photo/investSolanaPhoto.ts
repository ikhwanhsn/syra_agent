import { INVEST_SOLANA_POST } from "../investSolanaUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { INVEST_SOLANA_PHOTO_SHARE_COPIES } from "./shareCopies/investSolanaShareCopies";

const copies = INVEST_SOLANA_PHOTO_SHARE_COPIES;

/** Photo-format content for Invest Solana Protocols ship log. 15 cards, 15 X posts. */
export const INVEST_SOLANA_PHOTO = definePhotoUpdate(INVEST_SOLANA_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "LST · Lending · LP",
      title: "Invest × Solana",
      subtitle:
        "Five onchain protocols. Live APY/TVL. Liquid stake from your invest wallet.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The shift",
      headline: "Invest was a swap card. Now a yield board.",
      body: "Five Solana venues with live APY/TVL. Marinade and Jito deposits from the invest wallet.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Browse yields. Deposit onchain.",
      narrative: "LST in-app. Lending and DLMM via protocol dApps. Policy-gated.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Deploy loop",
      headline: "Browse. Fund. Deposit or open.",
      steps: [
        { step: "01", title: "Browse", description: "Live APY and TVL cards." },
        { step: "02", title: "Fund", description: "Invest agent treasury." },
        { step: "03", title: "Stake", description: "Marinade or Jito in-app." },
        { step: "04", title: "Open", description: "Kamino, marginfi, Meteora." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "From one swap to five Solana venues.",
      steps: [
        { step: "01", title: "Catalog", description: "Five protocols listed." },
        { step: "02", title: "Yields", description: "DefiLlama APY/TVL." },
        { step: "03", title: "Deposit", description: "POST /invest/deposit." },
        { step: "04", title: "Broker", description: "Invest wallet signs." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four protocol kinds. One Invest board.",
      cards: [
        { title: "Marinade", subtitle: "LST", detail: "SOL → mSOL deposit.", accent: "gold" },
        { title: "Jito", subtitle: "LST", detail: "SOL → JitoSOL deposit.", accent: "gold" },
        { title: "Kamino", subtitle: "Lend", detail: "Deep-link to vaults." },
        { title: "Meteora", subtitle: "LP", detail: "DLMM deep-link." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Invest Solana checklist. Live now.",
      highlights: [
        "Five protocols on /invest",
        "Live APY badge + TVL",
        "Marinade + Jito deposit modal",
        "Kamino, marginfi, Meteora links",
        "Invest wallet signs deposits",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Real venues. Live numbers. Onchain.",
      stats: [
        { value: "5", label: "Protocols" },
        { value: "2", label: "In-app LST" },
        { value: "1", label: "Invest wallet" },
      ],
      narrative: "APY/TVL from DefiLlama. Yield is not guaranteed.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "The two deposits that stay in Syra.",
      stats: [{ value: "LST", label: "Marinade · Jito" }],
      narrative: "Unsigned tx on the API. Signed by your invest agent wallet.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Swap-only board vs Solana yield board.",
      compareLeft: {
        title: "Before",
        body: "Invest showed Jupiter swap only. No live yields.",
      },
      compareRight: {
        title: "Now",
        body: "Five protocols. Live APY/TVL. In-app LST deposits.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Invest × Solana",
      partnerName: "Solana",
      partnerLogo: "/images/partners/solana.png",
      partnerLogoSolidBg: true,
      headline: "Syra × Solana DeFi",
      subtitle: "Five onchain venues. Live yields. Deposits from your invest wallet.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Wired into Invest + walletBroker.",
      items: [
        "investCatalog.js: five protocols",
        "investYieldsService: DefiLlama",
        "marinade + jito stake-pool executors",
        "POST /invest/deposit → walletBroker",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Two paths",
      headline: "In-app LST. External lending and LP.",
      body: "Marinade and Jito deposit in Syra. Kamino, marginfi, and Meteora open their dApps.",
      highlights: [
        "Live APY/TVL on every card",
        "Invest wallet for LST deposits",
        "Policy + simulation before sign",
        "Deep-links for the rest",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Deposit in the stack.",
      terminalLines: [
        "$ GET /invest/opportunities",
        "> catalog + DefiLlama yields",
        "$ POST /invest/deposit",
        "> build marinade|jito tx",
        "> walletBroker.executeIntent",
        "< LST in invest wallet",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Open Invest. Deploy on Solana.",
      subtitle: "Fund your invest wallet, then liquid stake or open a dApp.",
      links: [
        { label: "Invest", value: "syraa.fun/invest", href: "https://www.syraa.fun/invest" },
        { label: "Wallet", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet" },
        { label: "Swap", value: "syraa.fun/swap", href: "https://www.syraa.fun/swap" },
      ],
    }),
  },
]);
