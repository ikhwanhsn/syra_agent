import { Activity, BarChart3, LayoutGrid, Newspaper, Search } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: Assets board + detail intelligence on /assets.
 */
export const ASSETS_HUB_POST: PostUpdate = {
  meta: {
    updateNumber: 9,
    id: "assets-hub-intelligence",
    title: "Assets Hub + Intelligence",
    published: "June 2026",
    tagline: "Browse every Tokens.xyz asset, open clean detail URLs, and read Syra intelligence per asset",
    shareCopyVideo: `SHIP LOG · Syra Assets just leveled up.

The /assets board now lists the full Tokens.xyz universe with search, filters, and pagination — not a tiny preset list.

Open any asset at clean URLs like /assets/solana, then scroll into Syra intelligence:
→ Sentiment + trading signal
→ Asset-scoped news
→ Related events

All server-side. Free on the dashboard. No x402 from the detail page.

Full walkthrough in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · Assets Hub + per-asset intelligence on Syra.

Browse the full Tokens.xyz board, open /assets/{assetId}, and get sentiment, signal, news, and events scoped to that asset.

Try it at syraa.fun/assets`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-minimal",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Assets Hub",
      subtitle: "Full Tokens.xyz board, clean /assets/{id} URLs, and Syra intelligence on every detail page.",
      badge: "Board · Detail · Intel",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Discovery and conviction belong on one page.",
      body: "Traders needed the whole Tokens.xyz universe in Syra — not eight hardcoded rows. They also needed dossier market data plus news, sentiment, events, and signal without leaving the asset.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "Assets board + detail intelligence",
      body: "A paginated board backed by the Tokens.xyz catalog, canonical /assets/{assetId} routes, and a free intelligence aggregate that loads in parallel with the dossier.",
      highlights: [
        "Full asset universe with search and class filters",
        "Clean detail URLs with legacy query redirects",
        "Sentiment, signal, news, and events per asset",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "From board to conviction",
      steps: [
        {
          step: "01",
          title: "Open Assets",
          description: "Browse /assets with search, crypto/equity filters, and 10-row pagination.",
        },
        {
          step: "02",
          title: "Pick an asset",
          description: "Tap any row or command-palette hit — navigates to /assets/{assetId}.",
        },
        {
          step: "03",
          title: "Read the dossier",
          description: "Price, chart, risk, and markets from Tokens.xyz in MintDossierView.",
        },
        {
          step: "04",
          title: "Scan intelligence",
          description: "Sentiment, trading signal, news, and events load in parallel below the chart.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-row",
      label: "Features",
      kicker: "Under the hood",
      headline: "Built for any asset — crypto or xStock",
      cards: [
        {
          title: "Board API",
          subtitle: "Full catalog",
          detail: "GET /agent/tokens/board paginates tokens-assets-curated with list=all.",
          accent: "gold",
        },
        {
          title: "Intelligence API",
          subtitle: "Four blocks",
          detail: "GET /agent/tokens/intelligence aggregates news, sentiment, events, and signal server-side.",
          accent: "gold",
        },
        {
          title: "Asset keywords",
          subtitle: "Name-first search",
          detail: "Roblox matches roblox — not unrelated crypto headlines.",
        },
        {
          title: "35+ RSS + Google",
          subtitle: "Broader coverage",
          detail: "Crypto, markets, tech, and gaming feeds plus per-asset Google News RSS.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "One hub, one detail page",
      items: [
        {
          icon: LayoutGrid,
          title: "Assets board",
          description: "Searchable table of the full Tokens.xyz universe with pagination.",
          href: "https://www.syraa.fun/assets",
        },
        {
          icon: Search,
          title: "Command palette",
          description: "Jump to any asset from the board with clean /assets/{id} paths.",
          href: "https://www.syraa.fun/assets",
        },
        {
          icon: BarChart3,
          title: "Sentiment + signal",
          description: "Two-column intelligence row with distribution bars and confidence meter.",
        },
        {
          icon: Newspaper,
          title: "News + events",
          description: "Asset-scoped headlines and event rows with empty states when nothing matches.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "For researchers",
      headline: "Every asset gets a research surface",
      stats: [
        { value: "4", label: "Intelligence blocks" },
        { value: "35+", label: "RSS sources" },
        { value: "1", label: "Clean URL per asset" },
      ],
      narrative:
        "Whether it is SOL or a tokenized equity, the same page loads dossier market data and Syra intelligence without paid x402 calls from the browser.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Try it",
      headline: "Open the Assets board today.",
      subline: "Pick any asset, read the dossier, and scroll into sentiment, signal, news, and events.",
      links: [
        { label: "Assets", value: "syraa.fun/assets", href: "https://www.syraa.fun/assets" },
        { label: "Example", value: "/assets/solana", href: "https://www.syraa.fun/assets/solana" },
        { label: "xStock", value: "/assets/rblxx", href: "https://www.syraa.fun/assets/rblxx" },
      ],
    },
  ],
};
