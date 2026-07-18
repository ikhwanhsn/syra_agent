import { ExternalLink, Landmark, Layers, Terminal, TrendingUp, Wallet } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Invest page with 5 onchain Solana protocols (Marinade, Jito, Kamino, marginfi, Meteora).
 */
export const INVEST_SOLANA_POST = defineVideoUpdate(
  {
    updateNumber: 28,
    id: "invest-solana",
    title: "Invest Solana Protocols",
    published: "July 2026",
    tagline:
      "Five onchain Solana protocols on Invest. Live APY/TVL. Marinade and Jito deposits from your invest wallet.",
    shareCopyVideo: `SHIP LOG · Invest just got real Solana yield.

Five onchain protocols on the Invest board.
Live APY and TVL from DefiLlama.

→ Marinade + Jito: deposit SOL in-app
→ Kamino, marginfi, Meteora: open their dApps
→ Signs from your invest agent wallet (policy-gated)

Browse yields. Deploy capital. Onchain.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Invest × Solana DeFi.

Marinade. Jito. Kamino. marginfi. Meteora.
Live APY/TVL. LST deposits from your invest wallet.

Try it → syraa.fun/invest`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Invest × Solana",
      subtitle:
        "Five onchain protocols. Live APY/TVL. Liquid stake from your invest agent wallet.",
      badge: "LST · Lending · LP",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Invest was a swap card. Now it is a yield board.",
      body: "Operators need real Solana venues, not a single Jupiter link. Invest now lists Marinade, Jito, Kamino, marginfi, and Meteora with live APY and TVL, plus in-app LST deposits from the invest wallet.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What we built",
      headline: "Catalog, yields, and brokered deposits",
      body: "A single invest catalog drives the board. DefiLlama fills APY/TVL. Marinade and Jito build unsigned txs that walletBroker signs from the invest agent wallet.",
      highlights: [
        "GET /invest/opportunities with live yields",
        "POST /invest/deposit for marinade + jito",
        "Deep-links for Kamino, marginfi, Meteora",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How it works",
      headline: "Browse. Fund. Deposit or open.",
      steps: [
        {
          step: "01",
          title: "Open Invest",
          description: "See five Solana protocols with live APY and TVL.",
        },
        {
          step: "02",
          title: "Fund invest wallet",
          description: "Deposits sign from your invest agent treasury.",
        },
        {
          step: "03",
          title: "Liquid stake",
          description: "Deposit SOL into Marinade (mSOL) or Jito (JitoSOL) in-app.",
        },
        {
          step: "04",
          title: "Or open dApps",
          description: "Kamino, marginfi, and Meteora deep-link to their venues.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-featured-trio",
      label: "Stack",
      kicker: "Under the hood",
      headline: "Three layers. One Invest surface.",
      cards: [
        {
          title: "Catalog",
          subtitle: "5 protocols",
          detail: "investCatalog.js: kind, executable, deep links, DefiLlama slugs.",
          accent: "gold",
        },
        {
          title: "Yields",
          subtitle: "Live",
          detail: "DefiLlama pools + TVL, cached and validated per adapter.",
          accent: "gold",
        },
        {
          title: "Broker",
          subtitle: "Onchain",
          detail: "Marinade + Jito txs via walletBroker from the invest wallet.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live on Invest",
      items: [
        {
          icon: TrendingUp,
          title: "Opportunities",
          description: "Cards with APY badge, TVL, kind, and clear next action.",
          href: "https://www.syraa.fun/invest",
        },
        {
          icon: Landmark,
          title: "Marinade + Jito",
          description: "Deposit modal. SOL in, LST out to the invest wallet.",
        },
        {
          icon: ExternalLink,
          title: "Kamino · marginfi · Meteora",
          description: "Invest buttons open each protocol dApp in a new tab.",
        },
        {
          icon: Wallet,
          title: "Invest wallet",
          description: "Policy-gated signing through walletBroker.executeIntent.",
        },
        {
          icon: Terminal,
          title: "API routes",
          description: "GET /invest/opportunities. POST /invest/deposit.",
        },
        {
          icon: Layers,
          title: "DefiLlama",
          description: "Live APY/TVL sourced and timestamped. Not guaranteed returns.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "For operators",
      headline: "Real venues. Live numbers. Onchain deposits.",
      stats: [
        { value: "5", label: "Protocols" },
        { value: "2", label: "In-app LST" },
        { value: "1", label: "Invest wallet" },
      ],
      narrative:
        "APY and TVL are live from DefiLlama. Deposits are probabilistic yield, not guaranteed returns. Execution stays policy-gated.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Open Invest. Deploy on Solana.",
      subline: "Fund your invest wallet, then liquid stake or open a protocol dApp.",
      links: [
        { label: "Invest", value: "syraa.fun/invest", href: "https://www.syraa.fun/invest" },
        { label: "Wallet", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet" },
        { label: "Swap", value: "syraa.fun/swap", href: "https://www.syraa.fun/swap" },
      ],
    },
  ],
);
