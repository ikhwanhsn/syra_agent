import { BTC_INTELLIGENCE_POST } from "../btcIntelligenceUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { BTC_INTELLIGENCE_PHOTO_SHARE_COPIES } from "./shareCopies/btcIntelligenceShareCopies";

const copies = BTC_INTELLIGENCE_PHOTO_SHARE_COPIES;

/** Photo-format content for the BTC Intelligence Hub ship log — 15 cards, 15 X posts. */
export const BTC_INTELLIGENCE_PHOTO = definePhotoUpdate(BTC_INTELLIGENCE_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-split",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Dashboard · /btc",
      title: "BTC Intelligence Hub",
      subtitle: "One premium Bitcoin page — flow chart, 15 analysis blocks, shareable cards, sticky nav.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-boxed",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "BTC research lived in ten tabs.",
      body: "Spot on one exchange. Funding on another. Sentiment in a feed. Syra /btc unifies overview, cross-venue compare, flow bubblemap, and fifteen analysis sections — with export on every block.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "One page. Twenty sections. Every block shareable.",
      narrative: "Scroll technicals through supply, jump with sticky nav, or post any section as a branded card to X.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "User flow",
      headline: "Open. Scroll. Share.",
      steps: [
        { step: "01", title: "Open /btc", description: "Dashboard sidebar → BTC Intelligence." },
        { step: "02", title: "Load snapshots", description: "Overview + dashboard from precomputed API reads." },
        { step: "03", title: "Navigate sections", description: "Sticky right nav with smooth scroll to each block." },
        { step: "04", title: "Export a card", description: "Branded PNG + X copy from any section." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Page stack",
      headline: "Hero to supply in one scroll",
      steps: [
        { step: "01", title: "Overview", description: "Price, dominance, fear & greed, volume tiles." },
        { step: "02", title: "Flow chart", description: "Bubblemap on TradingView Lightweight Charts." },
        { step: "03", title: "Derivatives", description: "Funding, OI, long/short, taker flow." },
        { step: "04", title: "Conviction", description: "News, sentiment, trading signal, supply." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One command center.",
      cards: [
        { title: "Snapshots", subtitle: "MongoDB", detail: "Tiered scheduler precomputes overview + dashboard.", accent: "gold" },
        { title: "Rate limits", subtitle: "Provider budgets", detail: "CoinGecko/Binance refresh respects per-minute caps.", accent: "gold" },
        { title: "Bubblemap", subtitle: "LWC charts", detail: "Exchange + interval controls with share themes." },
        { title: "Share cards", subtitle: "Every section", detail: "Copy, download PNG, or native share to X." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "BTC Intelligence Hub is live.",
      highlights: [
        "20 scrollable sections with sticky nav",
        "15 analysis blocks in one dashboard payload",
        "Flow bubblemap with branded chart export",
        "DB-backed reads — no per-visit API hammering",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-metric-strip",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Bitcoin intelligence, by the numbers.",
      stats: [
        { value: "20", label: "Page sections" },
        { value: "15", label: "Analysis blocks" },
        { value: "3", label: "API endpoints" },
      ],
      narrative: "Researchers scroll one hub. Creators share any block. Backend refreshes on schedule.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-duo",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Share-ready from every section.",
      stats: [
        { value: "20", label: "Shareable cards" },
        { value: "1", label: "Tap to export" },
      ],
      narrative: "Hero, metrics, bubblemap, technicals, funding, sentiment — branded dark frame + X copy on each.",
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
        body: "Price, funding, and sentiment scattered across tabs. Nothing packaged for X.",
      },
      compareRight: {
        title: "Now",
        body: "One /btc page. Sticky nav. Fifteen analysis blocks. Export any section in one tap.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Now live",
      badge: "Free · Dashboard · /btc",
      title: "BTC Intelligence Hub",
      subtitle: "Premium Bitcoin command center — flow chart, analysis stack, shareable cards.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "API + scheduler wiring.",
      items: [
        "GET /btc/overview — price, dominance, fear & greed",
        "GET /btc/dashboard — 15 analysis sections",
        "GET /btc/bubblemap — exchange + interval presets",
        "btcIntelligenceScheduler — tiered MongoDB snapshots",
        "BtcShareableSection — branded export on every block",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Research → Distribution",
      headline: "Read the stack. Post the proof.",
      body: "Scroll fifteen analysis blocks for conviction — then share any section as a branded card without rebuilding the graphic.",
      highlights: [
        "Technicals through supply in one scroll",
        "Sticky section nav with smooth jump",
        "Chart share with theme picker",
        "X copy generated per section",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Read snapshots from the API.",
      terminalLines: [
        "$ curl api.syraa.fun/btc/overview",
        '{ "success": true, "data": { "price": { "usd": ... } } }',
        "$ curl api.syraa.fun/btc/dashboard",
        '{ "success": true, "data": { "sections": { ... } } }',
        "# 503 until background scheduler warms snapshots",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Open the BTC Intelligence Hub.",
      subtitle: "Dashboard → BTC. Scroll the stack, jump sections, share any card to X.",
      links: [
        { label: "BTC hub", value: "syraa.fun/btc", href: "https://www.syraa.fun/btc" },
        { label: "Dashboard API", value: "api.syraa.fun/btc/dashboard", href: "https://api.syraa.fun/btc/dashboard" },
        { label: "Bubblemap", value: "api.syraa.fun/btc/bubblemap", href: "https://api.syraa.fun/btc/bubblemap" },
      ],
    }),
  },
]);
