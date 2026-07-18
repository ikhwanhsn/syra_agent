import { AMPERSEND_MARKETPLACE_POST } from "../ampersendMarketplaceUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { AMPERSEND_MARKETPLACE_PHOTO_SHARE_COPIES } from "./shareCopies/ampersendMarketplaceShareCopies";

const copies = AMPERSEND_MARKETPLACE_PHOTO_SHARE_COPIES;

/** Photo-format content for the Ampersend marketplace ship log - 15 cards, 15 X posts. */
export const AMPERSEND_MARKETPLACE_PHOTO = definePhotoUpdate(AMPERSEND_MARKETPLACE_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-brand",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Bazaar · Base · 26 APIs",
      title: "Syra × Ampersend",
      subtitle: "Paid intelligence APIs discoverable on the Ampersend agent marketplace. Base mainnet checkout. Pay per call.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-neon",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Agents need directories, not hidden URLs.",
      body: "Ampersend marketplace lists x402-payable services for autonomous agent wallets. Syra now ships Bazaar discovery on 402 and PayAI settle so 26 paid APIs index for agents on Base.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote-gilded",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "List on Bazaar. Show up on Ampersend.",
      narrative: "No manual submit form. First Base settlement indexes the endpoint. Ampersend pulls source bazaar into app.ampersend.ai/discover.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-conduit",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How listing works",
      headline: "402 → Base → Bazaar → Ampersend.",
      steps: [
        { step: "01", title: "402 + Bazaar", description: "Paid route returns Payment Required with discovery metadata." },
        { step: "02", title: "Pay on Base", description: "Agent wallet settles USDC on eip155:8453." },
        { step: "03", title: "PayAI indexes", description: "Facilitator registers endpoint in x402 Bazaar." },
        { step: "04", title: "Marketplace", description: "Listing appears on Ampersend (source: bazaar)." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-flow-ledger",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Ship sequence",
      headline: "From code to marketplace visibility.",
      steps: [
        { step: "01", title: "Bazaar on settle", description: "PayAI payloads carry discovery blob, not just B402." },
        { step: "02", title: "Catalog metadata", description: "Category, tags, descriptions per endpoint." },
        { step: "03", title: "Base mainnet", description: "Ampersend production filters to eip155:8453." },
        { step: "04", title: "Validate script", description: "npm run validate-ampersend checks readiness." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-glass-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One agent directory.",
      cards: [
        { title: "402", subtitle: "Bazaar ext", detail: "Discovery metadata on Payment Required.", accent: "gold" },
        { title: "Settle", subtitle: "PayAI", detail: "Facilitator indexes after Base payment.", accent: "gold" },
        { title: "Base", subtitle: "8453", detail: "Ampersend production network filter.", accent: "gold" },
        { title: "Catalog", subtitle: "26 APIs", detail: "/.well-known/x402 resource list." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-tiered",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What ships with this update.",
      highlights: [
        "Bazaar extensions on every paid 402 response",
        "PayAI settle indexing for Base mainnet",
        "Per-endpoint category + tags from catalog",
        "npm run validate-ampersend readiness script",
        "26 endpoints in /.well-known/x402",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-halo",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Marketplace-ready.",
      stats: [
        { value: "26", label: "x402 resources" },
        { value: "Base", label: "Ampersend network" },
        { value: "402", label: "Agent checkout" },
      ],
      narrative: "Production validated: Base accept on /health, full discovery manifest, Bazaar enabled for PayAI settles.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-monolith",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "api.syraa.fun checks out.",
      stats: [{ value: "26", label: "Discovery resources" }],
      narrative: "GET /health advertises Base mainnet. Payment-Required header on 402. Ready for Ampersend Bazaar ingestion.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-compare-gradient",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Hidden URL vs. agent marketplace.",
      compareLeft: {
        title: "Before",
        body: "Agents needed Syra URLs upfront. No Ampersend listing. Discovery was manual.",
      },
      compareRight: {
        title: "Now",
        body: "Bazaar indexes on Base settle. Ampersend marketplace lists source bazaar. Browse and pay.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · Bazaar · Base",
      partnerName: "Ampersend",
      partnerLogo: "/images/partners/ampersend.png",
      partnerLogoSolidBg: true,
      headline: "Syra × Ampersend",
      subtitle: "26 paid x402 APIs discoverable for agent wallets. Pay on Base. No API keys.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-statement-lattice",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "Bazaar discovery plumbing.",
      items: [
        "x402Bazaar.js: X402_BAZAAR_ENABLED toggle",
        "x402PaymentV2.js: Bazaar on 402 + PayAI settle",
        "x402ResourceCatalog.js: category per endpoint",
        "validateAmpersendDiscovery.js: readiness checks",
        "syraBranding.js: serviceName, tags, iconUrl",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-frost",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Multi-rail",
      headline: "Solana checkout. Base for Ampersend.",
      body: "Agents pay on Solana, PayAI EVM, BSC, or Algorand. Ampersend production marketplace filters to Base. We index Bazaar there first.",
      highlights: [
        "Solana: agent wallet auto-pay",
        "Base: Ampersend marketplace rail",
        "BSC: B402 Bazaar (parallel path)",
        "Algorand: GoPlausible USDC ASA",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Validate Ampersend readiness.",
      terminalLines: [
        "$ npm run validate-ampersend",
        "[OK] Bazaar discovery enabled",
        "[OK] GET /health · Base eip155:8453",
        "[OK] /.well-known/x402 · 26 resources",
        "$ npm run validate-ampersend -- --pay",
        "[OK] Paid Base E2E · Bazaar index triggered",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Discover Syra on Ampersend.",
      subtitle: "Browse the marketplace. Pay on Base. Unlock intelligence per call.",
      links: [
        { label: "Marketplace", value: "app.ampersend.ai/discover", href: "https://app.ampersend.ai/discover" },
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "Docs", value: "Ampersend marketplace", href: "https://docs.ampersend.ai/platform/marketplace" },
      ],
    }),
  },
]);
