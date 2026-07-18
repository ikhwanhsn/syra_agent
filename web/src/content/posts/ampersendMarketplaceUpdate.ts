import { Bot, Globe, Layers, Network, Store, Terminal } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: Syra x402 APIs discoverable on the Ampersend marketplace via x402 Bazaar.
 */
export const AMPERSEND_MARKETPLACE_POST: PostUpdate = {
  meta: {
    updateNumber: 18,
    id: "ampersend-marketplace",
    title: "Ampersend Marketplace",
    published: "June 2026",
    tagline: "Syra x402 APIs are listed on the Ampersend agent marketplace via Bazaar discovery",
    shareCopyVideo: `SHIP LOG · Syra is on the Ampersend marketplace.

Every paid Syra API is now Bazaar-discoverable for agent wallets on Base mainnet: 26 endpoints, catalog metadata, and PayAI settle indexing wired for app.ampersend.ai/discover.

→ x402 Bazaar extensions on 402 + PayAI settle
→ Base mainnet (eip155:8453) for Ampersend production listings
→ Per-endpoint category, tags, and service metadata from our catalog
→ npm run validate-ampersend readiness script

Agents find Syra. Pay per call. No API keys.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Syra x402 APIs are on the Ampersend marketplace.

Bazaar discovery is live: Base mainnet checkout, 26 paid endpoints, agent-readable metadata. Ampersend agents can browse and pay from their wallet.

402 → pay on Base → unlock intelligence.

Discover → app.ampersend.ai/discover
Try → syraa.fun/playground`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Syra �- Ampersend",
      subtitle: "Paid intelligence APIs discoverable on the Ampersend agent marketplace via x402 Bazaar.",
      badge: "Bazaar · Base · 26 endpoints",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-boxed",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agents need a directory, not a spreadsheet of URLs.",
      body: "Ampersend is the control layer for agent payments. Its marketplace lists x402-payable services so autonomous agents can discover, pay, and call APIs without contracts or API keys. Syra belongs in that catalog.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-numbered-cards",
      label: "Shipped",
      kicker: "What we built",
      headline: "Bazaar discovery for every paid Syra API",
      body: "We extended x402 Bazaar indexing beyond BSC B402 to PayAI settles on Base mainnet, the network Ampersend production filters to, with per-endpoint categories, tags, and service metadata from our resource catalog.",
      highlights: [
        "Bazaar extensions on every 402 Payment Required response",
        "PayAI settle payloads include Bazaar blob for facilitator indexing",
        "Base mainnet eip155:8453: Ampersend production network filter",
        "validate-ampersend npm script for readiness + optional paid E2E",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-arrow-chain",
      label: "Flow",
      kicker: "How listing works",
      headline: "No submit form. Index on first settle.",
      steps: [
        {
          step: "01",
          title: "402 with Bazaar metadata",
          description: "Paid routes return Payment Required with discoverable extensions and catalog descriptions.",
        },
        {
          step: "02",
          title: "Agent pays on Base",
          description: "Ampersend wallet or any x402 client settles USDC on eip155:8453.",
        },
        {
          step: "03",
          title: "Facilitator indexes Bazaar",
          description: "PayAI verify + settle registers the endpoint in the x402 Bazaar discovery layer.",
        },
        {
          step: "04",
          title: "Ampersend marketplace",
          description: "Listings appear at app.ampersend.ai/discover (source: bazaar, subject to review).",
        },
      ],
    },
    {
      id: "catalog",
      kind: "cards",
      layout: "cards-mosaic",
      label: "Catalog",
      kicker: "What agents find",
      headline: "26 discoverable Syra endpoints",
      cards: [
        {
          title: "Intelligence",
          subtitle: "Brain · Signal · News",
          detail: "AI synthesis, trading signals, headlines, sentiment, and event calendars.",
          accent: "gold",
        },
        {
          title: "Market data",
          subtitle: "Indicator · Arbitrage",
          detail: "Multi-indicator OHLCV bundles and cross-CEX spread scouting.",
          accent: "gold",
        },
        {
          title: "DeFi · Assets",
          subtitle: "Jupiter · Pumpfun",
          detail: "Swap quotes, trending tokens, analyzers, and asset dossiers.",
        },
        {
          title: "Discovery",
          subtitle: ".well-known/x402",
          detail: "Full resource list at api.syraa.fun/.well-known/x402 for agent crawlers.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-orbit",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across the agent economy",
      items: [
        {
          icon: Store,
          title: "Ampersend marketplace",
          description: "Browse Syra under source bazaar at app.ampersend.ai/discover.",
          href: "https://app.ampersend.ai/discover",
        },
        {
          icon: Terminal,
          title: "API Playground",
          description: "Test paid routes with Base USDC before agents discover them.",
          href: "https://www.syraa.fun/playground",
        },
        {
          icon: Bot,
          title: "External agents",
          description: "Any x402 v2 client can call api.syraa.fun and pay on Base or Solana.",
        },
        {
          icon: Globe,
          title: "Open discovery",
          description: "GET /.well-known/x402 and GET /openapi.json: no API key required.",
        },
        {
          icon: Network,
          title: "Multi-rail checkout",
          description: "Solana, PayAI EVM, BSC B402, and Algorand. Ampersend filters to Base in prod.",
        },
        {
          icon: Layers,
          title: "x402 v2 core",
          description: "One middleware. Bazaar on 402 and settle. Catalog-backed descriptions.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-duo",
      label: "Impact",
      kicker: "Coverage",
      headline: "Machine money meets agent directories",
      stats: [
        { value: "26", label: "x402 resources" },
        { value: "Base", label: "Ampersend network" },
        { value: "402", label: "HTTP-native checkout" },
      ],
      narrative:
        "Syra intelligence APIs are no longer only reachable if you already know the URL. Bazaar discovery plus Ampersend marketplace visibility puts pay-per-call crypto data in front of every agent wallet on Base.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-stack-links",
      label: "Try it",
      headline: "Discover Syra on Ampersend.",
      subline: "Browse the marketplace, hit a paid endpoint on Base, and unlock intelligence per call.",
      links: [
        { label: "Marketplace", value: "app.ampersend.ai/discover", href: "https://app.ampersend.ai/discover" },
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "Ampersend docs", value: "Marketplace API", href: "https://docs.ampersend.ai/platform/marketplace" },
      ],
    },
  ],
};
