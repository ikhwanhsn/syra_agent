import { Filter, Globe2, Radar, Search, Terminal, Trophy } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Token Analyzer multi-chain (Solana + EVM) at /analyzer, plus Live/My calls/Best callers UX.
 */
export const TOKEN_ANALYZER_POST = defineVideoUpdate(
  {
    updateNumber: 29,
    id: "token-analyzer",
    title: "Token Analyzer Multi-Chain",
    published: "July 2026",
    tagline:
      "Pumpfun Alpha is now Token Analyzer. Solana plus Ethereum, Base, BSC, Arbitrum. Live feeds capped at 10 with search and filter.",
    shareCopyVideo: `SHIP LOG · Token Analyzer goes multi-chain.

Paste a Solana mint or an EVM 0x address.
Same Syra Alpha score. Chain badge on the verdict.

→ Solana: full depth (holders, security, trades)
→ EVM: market + KOL (DexScreener)
→ Live / My calls / Best callers: latest 10 + search

Analyze any token. One surface.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Token Analyzer × multi-chain.

Solana + Ethereum, Base, BSC, Arbitrum.
Live feeds with search and filter.

Try it → syraa.fun/analyzer`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Token Analyzer",
      subtitle:
        "Multi-chain scans. Solana depth. EVM market alpha. Live calls with search.",
      badge: "Solana · EVM",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Alpha was Solana-only. Tokens are not.",
      body: "Operators chase runners on Ethereum and Base too. Token Analyzer accepts Solana mints and EVM addresses, keeps Syra Alpha scoring, and tightens Live, My calls, and Best callers to the latest 10 with search and filter.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What we built",
      headline: "Rename, multi-chain route, feed UX",
      body: "Route moved to /analyzer with /pumpfun redirects. Backend detects chain kind, dispatches Solana or EVM analysis, and the three community tabs ship search, filters, and delayed skeletons.",
      highlights: [
        "/analyzer with legacy /pumpfun redirect",
        "EVM via DexScreener + KOL + Syra Alpha",
        "Live / history / callers: 10 + search",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How it works",
      headline: "Paste. Detect. Score. Track.",
      steps: [
        {
          step: "01",
          title: "Paste address",
          description: "Solana mint or 0x EVM token.",
        },
        {
          step: "02",
          title: "Chain detect",
          description: "Router picks Solana depth or EVM market path.",
        },
        {
          step: "03",
          title: "Syra Alpha",
          description: "Score, verdict, liquidity, and social signals.",
        },
        {
          step: "04",
          title: "Track calls",
          description: "Latest 10 on Live, My calls, Best callers. Search + filter.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-featured-trio",
      label: "Stack",
      kicker: "Under the hood",
      headline: "Detect. Analyze. Surface.",
      cards: [
        {
          title: "Detect",
          subtitle: "Chain kind",
          detail: "tokenChainDetect: Solana mint vs 0x EVM address.",
          accent: "gold",
        },
        {
          title: "Analyze",
          subtitle: "Dispatcher",
          detail: "Solana memecoin stack or EVM DexScreener + KOL.",
          accent: "gold",
        },
        {
          title: "Surface",
          subtitle: "Feeds",
          detail: "Ten latest. Search. Filter. 450ms delayed skeleton.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live on Token Analyzer",
      items: [
        {
          icon: Search,
          title: "Analyzer",
          description: "Paste mint or 0x. Chain badge on the verdict card.",
          href: "https://www.syraa.fun/analyzer",
        },
        {
          icon: Globe2,
          title: "EVM market MVP",
          description: "Price, liquidity, volume, KOL. Holders later.",
        },
        {
          icon: Radar,
          title: "Live calls",
          description: "Latest 10 community scans. High alpha / runners filter.",
        },
        {
          icon: Filter,
          title: "My calls",
          description: "Search + 2x / 10x filters on your latest ten.",
        },
        {
          icon: Trophy,
          title: "Best callers",
          description: "Top 10 by peak gain. 10x / 100x caller filters.",
        },
        {
          icon: Terminal,
          title: "API",
          description: "GET /agent/tokens/memecoin-analysis accepts EVM.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "For operators",
      headline: "One analyzer. More chains. Cleaner feeds.",
      stats: [
        { value: "4+", label: "EVM chains" },
        { value: "10", label: "Latest per feed" },
        { value: "1", label: "Analyzer route" },
      ],
      narrative:
        "Solana keeps full depth. EVM ships market-focused alpha first. Feeds stay scannable with search and filter.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Open Analyzer. Paste any token.",
      subline: "Solana mint or Ethereum address. Same Syra Alpha surface.",
      links: [
        {
          label: "Analyzer",
          value: "syraa.fun/analyzer",
          href: "https://www.syraa.fun/analyzer",
        },
        { label: "Assets", value: "syraa.fun/assets", href: "https://www.syraa.fun/assets" },
        { label: "Swap", value: "syraa.fun/swap", href: "https://www.syraa.fun/swap" },
      ],
    },
  ],
);
