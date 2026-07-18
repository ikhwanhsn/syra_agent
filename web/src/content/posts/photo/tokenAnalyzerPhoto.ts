import { TOKEN_ANALYZER_POST } from "../tokenAnalyzerUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { TOKEN_ANALYZER_PHOTO_SHARE_COPIES } from "./shareCopies/tokenAnalyzerShareCopies";

const copies = TOKEN_ANALYZER_PHOTO_SHARE_COPIES;

/** Photo-format content for Token Analyzer Multi-Chain ship log. 15 cards, 15 X posts. */
export const TOKEN_ANALYZER_PHOTO = definePhotoUpdate(TOKEN_ANALYZER_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Solana · EVM",
      title: "Token Analyzer",
      subtitle:
        "Multi-chain scans. Solana depth. EVM market alpha. Feeds with search.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The shift",
      headline: "Alpha was Solana-only. Tokens are not.",
      body: "Paste a mint or a 0x. Same Syra Alpha. Live feeds capped at ten with search.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Paste a mint or a 0x. Same score.",
      narrative: "Solana keeps depth. EVM ships market + KOL first.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Scan loop",
      headline: "Paste. Detect. Score. Track.",
      steps: [
        { step: "01", title: "Paste", description: "Mint or 0x address." },
        { step: "02", title: "Detect", description: "Solana or EVM path." },
        { step: "03", title: "Score", description: "Syra Alpha verdict." },
        { step: "04", title: "Track", description: "Latest 10 + filter." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "From Pumpfun Alpha to multi-chain Analyzer.",
      steps: [
        { step: "01", title: "Rename", description: "/analyzer + redirect." },
        { step: "02", title: "EVM", description: "DexScreener + KOL." },
        { step: "03", title: "Depth", description: "Solana stack kept." },
        { step: "04", title: "Feeds", description: "10 + search + filter." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four surfaces. One Analyzer.",
      cards: [
        { title: "Scan", subtitle: "Multi", detail: "Mint or 0x input.", accent: "gold" },
        { title: "Live", subtitle: "10", detail: "Community scans.", accent: "gold" },
        { title: "My calls", subtitle: "Filter", detail: "2x / 10x views." },
        { title: "Callers", subtitle: "Top 10", detail: "Peak gain board." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Token Analyzer checklist. Live now.",
      highlights: [
        "/analyzer with /pumpfun redirect",
        "Solana + Ethereum, Base, BSC, Arbitrum",
        "EVM market MVP + chain badge",
        "Feeds: latest 10 + search + filter",
        "450ms delayed list skeletons",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "More chains. Cleaner feeds.",
      stats: [
        { value: "4+", label: "EVM chains" },
        { value: "10", label: "Latest / feed" },
        { value: "1", label: "Analyzer route" },
      ],
      narrative: "Solana depth intact. EVM market alpha first.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "The EVM path that just shipped.",
      stats: [{ value: "EVM", label: "Market + KOL" }],
      narrative: "DexScreener + Syra Alpha. Holders and honeypot next.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Pumpfun Alpha vs Token Analyzer.",
      compareLeft: {
        title: "Before",
        body: "Solana mint only. Long unfiltered feeds.",
      },
      compareRight: {
        title: "Now",
        body: "Solana + EVM. Latest 10 with search and filter.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Analyzer × Robinhood",
      partnerName: "Robinhood",
      partnerLogo: "/images/partners/robinhood.png",
      partnerLogoSolidBg: false,
      headline: "Syra × Robinhood",
      subtitle: "Solana depth. EVM market alpha. One /analyzer surface.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Wired into Analyzer + memecoin API.",
      items: [
        "tokenChainDetect + tokenAnalysisService",
        "evmTokenAnalysisService (DexScreener)",
        "GET /agent/tokens/memecoin-analysis",
        "PumpfunListToolbar + delayed skeleton",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Two depths",
      headline: "Solana full stack. EVM market MVP.",
      body: "Holders and security stay Solana. EVM gets price, liquidity, volume, and KOL.",
      highlights: [
        "Chain badge on verdict",
        "Shared Syra Alpha score",
        "Solana-only tabs gated on EVM",
        "Feeds capped at ten",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Scan in the stack.",
      terminalLines: [
        "$ GET .../memecoin-analysis?mint=0x…",
        "> detectTokenChainKind → evm",
        "> DexScreener best pair + KOL",
        "> computeSyraAlphaScore",
        "< chain · market · syraAlpha",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Open Analyzer. Paste any token.",
      subtitle: "Solana mint or Ethereum address. Same Syra Alpha surface.",
      links: [
        {
          label: "Analyzer",
          value: "syraa.fun/analyzer",
          href: "https://www.syraa.fun/analyzer",
        },
        { label: "Assets", value: "syraa.fun/assets", href: "https://www.syraa.fun/assets" },
        { label: "Swap", value: "syraa.fun/swap", href: "https://www.syraa.fun/swap" },
      ],
    }),
  },
]);
