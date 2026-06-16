import { ASSETS_HUB_POST } from "../assetsHubUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import {
  ASSETS_HUB_PHOTO_SHARE_COPIES,
  ASSETS_HUB_PHOTO_SHARE_FOOTERS,
} from "./shareCopies/assetsHubShareCopies";

const copies = ASSETS_HUB_PHOTO_SHARE_COPIES;
const footers = ASSETS_HUB_PHOTO_SHARE_FOOTERS;

/** Photo-format content for the Assets Hub ship log — 15 cards, 15 X posts. */
export const ASSETS_HUB_PHOTO = definePhotoUpdate(ASSETS_HUB_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-brand",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Board · Detail · Intel",
      title: "Assets Hub",
      subtitle: "Full Tokens.xyz board, clean detail URLs, and Syra intelligence on every asset page.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-center",
    shareCopy: copies.thesis,
    shareCopyFooter: footers.thesis,
    content: photoContent({
      kicker: "Why this matters",
      headline: "Discovery and conviction belong on one page.",
      body: "Traders needed the whole Tokens.xyz universe in Syra — not eight hardcoded rows. They also needed dossier data plus news, sentiment, events, and signal without leaving the asset.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    shareCopyFooter: footers.quote,
    content: photoContent({
      quote: "Discovery and conviction belong on one page.",
      narrative: "Board → detail → dossier → sentiment, signal, news, events.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "From board to conviction.",
      steps: [
        { step: "01", title: "Open Assets", description: "Browse /assets with search, filters, and pagination." },
        { step: "02", title: "Pick an asset", description: "Tap any row — navigates to /assets/{assetId}." },
        { step: "03", title: "Read dossier", description: "Price, chart, risk, and markets from Tokens.xyz." },
        { step: "04", title: "Scan intelligence", description: "Sentiment, signal, news, and events below the chart." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "Assets Hub end to end.",
      steps: [
        { step: "01", title: "Full board", description: "GET /agent/tokens/board with list=all and pagination." },
        { step: "02", title: "Clean URLs", description: "/assets/{assetId} with legacy query redirects." },
        { step: "03", title: "Intelligence API", description: "GET /agent/tokens/intelligence aggregates four blocks." },
        { step: "04", title: "Asset keywords", description: "35+ RSS feeds + Google News per asset name." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    shareCopyFooter: footers.pillars,
    content: photoContent({
      headline: "Four intelligence blocks.",
      cards: [
        { title: "Sentiment", subtitle: "Headline tone", detail: "Bullish / bearish / neutral from asset-matched news.", accent: "gold" },
        { title: "Signal", subtitle: "OHLC engine", detail: "CoinGecko recommendation with confidence meter.", accent: "gold" },
        { title: "News", subtitle: "Scoped headlines", detail: "Primary keyword required — no unrelated crypto fallback." },
        { title: "Events", subtitle: "Calendar rows", detail: "Filtered events plus headline-derived items." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    shareCopyFooter: footers.checklist,
    content: photoContent({
      headline: "Assets Hub is live.",
      highlights: [
        "Full Tokens.xyz universe with 10-row pagination",
        "Simplified board table UI",
        "Intelligence always visible with empty states",
        "Parallel dossier + intelligence loading skeletons",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-metric-strip",
    shareCopy: copies.metrics,
    shareCopyFooter: footers.metrics,
    content: photoContent({
      headline: "Built for any asset.",
      stats: [
        { value: "4", label: "Intel blocks" },
        { value: "35+", label: "RSS sources" },
        { value: "1", label: "URL per asset" },
      ],
      narrative: "Crypto and tokenized equities share the same research surface.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    shareCopyFooter: footers.featured,
    content: photoContent({
      headline: "One detail page. Every block.",
      stats: [{ value: "4", label: "Intelligence panels" }],
      narrative: "Price chart, risk, sentiment, signal, news, and events — without leaving /assets/{assetId}.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    shareCopyFooter: footers.comparison,
    content: photoContent({
      headline: "Before vs now.",
      compareLeft: {
        title: "Before",
        body: "Hardcoded asset list. Query-string URLs. Dossier only — no news or signal on the page.",
      },
      compareRight: {
        title: "Now",
        body: "Full board, /assets/solana URLs, and free server-side intelligence below the chart.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · Board · Intelligence",
      partnerName: "Tokens.xyz",
      partnerLogo: "/images/partners/tokens.png",
      headline: "Syra × Tokens.xyz",
      subtitle: "Full asset board, dossier detail, and per-asset intelligence on Syra.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    shareCopyFooter: footers.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Intelligence data pipeline.",
      items: [
        "GET /agent/tokens/intelligence?assetId= aggregates four blocks",
        "assetIntelligenceResolver maps name → keywordQuery",
        "35+ RSS feeds + on-demand Google News RSS",
        "CoinGecko signal with 15s timeout fallback",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    shareCopyFooter: footers.split,
    content: photoContent({
      badge: "Two surfaces",
      headline: "Board discovers. Detail convinces.",
      body: "The board paginates the full catalog. The detail page loads dossier market data and four intelligence panels in parallel.",
      highlights: [
        "Search + crypto/equity filters",
        "Canonical /assets/{assetId} routes",
        "Empty states per intelligence block",
        "Ask Syra includes intel context",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Intelligence API response.",
      terminalLines: [
        "$ curl syraa.fun/agent/tokens/intelligence?assetId=solana",
        "> sentiment: ok · bullish 42% · bearish 18%",
        "> signal: HOLD · MEDIUM · coingecko",
        "> news: 8 items · events: 2 items",
        "> query.primaryKeywords: [\"solana\",\"sol\"]",
        "< 200 ok · free aggregate",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Open the Assets board today.",
      subtitle: "Pick any asset, read the dossier, and scroll into intelligence.",
      links: [
        { label: "Assets", value: "syraa.fun/assets", href: "https://www.syraa.fun/assets" },
        { label: "SOL", value: "/assets/solana", href: "https://www.syraa.fun/assets/solana" },
        { label: "RBLXX", value: "/assets/rblxx", href: "https://www.syraa.fun/assets/rblxx" },
      ],
    }),
  },
]);
