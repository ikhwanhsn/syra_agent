import { PACT_NETWORK_POST } from "../pactNetworkUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { PACT_NETWORK_PHOTO_SHARE_COPIES } from "./shareCopies/pactNetworkShareCopies";

const copies = PACT_NETWORK_PHOTO_SHARE_COPIES;

/** Photo-format content for the Pact Network ship log: 15 cards, 15 X posts. */
export const PACT_NETWORK_PHOTO = definePhotoUpdate(PACT_NETWORK_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Refund · Coverage · Solana",
      title: "Pact × Syra",
      subtitle: "Paid API call fails? USDC returns on-chain. Buyer protection for agent wallets.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Agent wallets had no chargebacks.",
      body: "Syra agents pay Nansen, Birdeye, Zerion, and dozens of x402 providers per chat turn. Call fails after payment: USDC is gone. Pact adds automatic on-chain refunds for covered breaches.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "402 settles the bill. Pact settles the refund.",
      narrative: "Same agent brain. Same upstream checkout. Pact watches underneath and returns principal + premium when a covered call fails.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Refund flow",
      headline: "Pay. Fail. Refund. On-chain.",
      steps: [
        { step: "01", title: "Agent pays x402", description: "USDC settles upstream via @x402/fetch." },
        { step: "02", title: "Pact watches", description: "Covered calls route through Pact Market proxy." },
        { step: "03", title: "Call fails", description: "5xx, timeout, or bad body triggers breach classification." },
        { step: "04", title: "Refund settles", description: "Principal + premium return to agent wallet." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Coverage path",
      headline: "Same checkout. Refund on failure.",
      steps: [
        { step: "01", title: "Paid tool call", description: "Agent chat invokes Nansen, Birdeye, or Zerion tool." },
        { step: "02", title: "x402 settlement", description: "Agent wallet pays via existing facilitator path." },
        { step: "03", title: "Pact classifies", description: "Proxy watches latency, status, and payload quality." },
        { step: "04", title: "Auto refund", description: "SettleBatch returns USDC to the paying agent wallet." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One fetch stack.",
      cards: [
        { title: "agentFetch", subtitle: "Composition", detail: "fetch → Sentinel → Pact in one resolver.", accent: "gold" },
        { title: "Pact SDK", subtitle: "@q3labs/pact-sdk", detail: "Drop-in wrapper. Never breaks a working call.", accent: "gold" },
        { title: "Upstream", subtitle: "10+ clients", detail: "Nansen, Birdeye, Zerion, Stable suite covered." },
        { title: "Ledger", subtitle: "Refunds API", detail: "GET /agent/pact/refunds for transparency." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Pact is live on Syra today.",
      highlights: [
        "Always on for agent outbound paid fetch",
        "All major agent*Client x402 upstream calls covered",
        "Auto pact.setup() SPL approve on first covered fetch",
        "Refund events persisted + read-only API",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Buyer protection, by the numbers.",
      stats: [
        { value: "10+", label: "Upstream x402 clients" },
        { value: "0", label: "Dispute forms" },
        { value: "402", label: "Same payment rail" },
      ],
      narrative: "Agents burn USDC on flaky APIs. Pact returns funds when covered calls fail. No ticket queue.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Refunds settle without a claim.",
      stats: [{ value: "0", label: "Manual steps required" }],
      narrative: "Covered breach → SettleBatch → principal + premium back to agent wallet. The protocol classifies. Not a support desk.",
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
        body: "Agent pays x402. Call fails. USDC gone. No recourse.",
      },
      compareRight: {
        title: "Now",
        body: "Same call, small premium. Pact refunds principal + premium on-chain automatically.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · Refund coverage · Solana",
      partnerName: "Pact Network",
      partnerLogo: "/images/partners/pact-network.png",
      headline: "Syra × Pact Network",
      subtitle: "Failed paid API call? Get USDC back on-chain. Buyer protection for agent wallets.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Wired into the fetch stack.",
      items: [
        "agentFetch.js: globalThis.fetch → Sentinel → Pact",
        "pactFetch.js: @q3labs/pact-sdk per agent keypair",
        "agentX402Client + all agent*Clients migrated",
        "PactRefund model + GET /agent/pact/refunds",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Composable",
      headline: "Audit optional. Refunds always on.",
      body: "Sentinel wraps fetch for budget and compliance when enabled. Pact wraps on top. Refund coverage on every paid upstream call.",
      highlights: [
        "Sentinel: optional audit + spend caps",
        "Pact: always-on refund coverage",
        "Golden rule: Pact never breaks a call",
        "Unregistered hosts degrade to bare fetch",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Verify refunds from the API.",
      terminalLines: [
        "$ curl api.syraa.fun/agent/pact/status",
        '{ "enabled": true, "network": "mainnet" }',
        "$ curl api.syraa.fun/agent/pact/refunds?anonymousId=...",
        '{ "refunds": [{ "providerHost": "api.nansen.ai" }] }',
        "# Refunds settle on-chain regardless of API poll",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Pay upstream APIs. Get refunded on failure.",
      subtitle: "Run agent chat with x402 tools. Covered call fails: principal + premium return on-chain.",
      links: [
        { label: "Agent chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        { label: "Pact docs", value: "pactnetwork.io/docs", href: "https://www.pactnetwork.io/docs" },
        { label: "Refunds API", value: "api.syraa.fun/agent/pact/refunds", href: "https://api.syraa.fun/agent/pact/refunds" },
      ],
    }),
  },
]);
