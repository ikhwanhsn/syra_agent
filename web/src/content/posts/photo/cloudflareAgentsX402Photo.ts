import { CLOUDFLARE_AGENTS_X402_POST } from "../cloudflareAgentsX402Update";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { CLOUDFLARE_AGENTS_X402_PHOTO_SHARE_COPIES } from "./shareCopies/cloudflareAgentsX402ShareCopies";

const copies = CLOUDFLARE_AGENTS_X402_PHOTO_SHARE_COPIES;

/** Photo-format content for Cloudflare Agents x402 ship log. */
export const CLOUDFLARE_AGENTS_X402_PHOTO = definePhotoUpdate(CLOUDFLARE_AGENTS_X402_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Agents SDK · x402 · Base",
      title: "Syra × Cloudflare Agents",
      subtitle: "Workers pay per call. Syra stays the merchant.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Agent builders needed a payer recipe.",
      body: "Cloudflare Agents SDK handles HTTP 402. Syra sells pay-per-call crypto intel. Fund Base USDC, wrap fetch, call api.syraa.fun. No API keys.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Agent pays. Syra settles.",
      narrative:
        "Your Worker signs Base USDC. Syra returns intel after x402 settle. Do not double-charge behind Monetization Gateway.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Payer path",
      headline: "402 → sign → intel.",
      steps: [
        { step: "01", title: "Fund Base", description: "USDC + gas on the payer wallet." },
        { step: "02", title: "Wrap fetch", description: "x402Client + Exact EVM in Agent." },
        { step: "03", title: "Call Syra", description: "GET /news or any Spend route." },
        { step: "04", title: "Read JSON", description: "200 + X-PAYMENT-RESPONSE receipt." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "Docs for Cloudflare builders.",
      steps: [
        { step: "01", title: "Repo quickstart", description: "SyraPayAgent sample in docs/." },
        { step: "02", title: "Docs site page", description: "/docs/build/cloudflare-agents-x402." },
        { step: "03", title: "Base payer path", description: "@x402/fetch + Exact EVM." },
        { step: "04", title: "GTM partner row", description: "Outreach-ready in AGENT_BUILDER_GTM." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four roles. One path.",
      cards: [
        { title: "CF Agent", subtitle: "Payer", detail: "Signs Base USDC from Worker.", accent: "gold" },
        { title: "Syra API", subtitle: "Merchant", detail: "402 + crypto intel JSON.", accent: "gold" },
        { title: "Facilitators", subtitle: "Settle", detail: "Dexter, GoPlausible, PayAI." },
        { title: "Builders", subtitle: "Ship", detail: "Copy quickstart. No custody rewrite." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Prove it in five steps.",
      highlights: [
        "Create a Cloudflare Agents Worker",
        "Set SYRA_EVM_PAYER_PRIVATE_KEY secret",
        "Fund Base USDC on the payer wallet",
        "Paste SyraPayAgent from docs",
        "Call /news?ticker=BTC and confirm settle",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Distribution-ready.",
      stats: [
        { value: "Base", label: "Payer chain" },
        { value: "1", label: "Demo HTTP call" },
        { value: "0", label: "API keys" },
      ],
      narrative: "Trending agent host meets live x402 merchant. Settled receipts on syraa.fun metrics.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Quickstart on docs.syraa.fun.",
      stats: [{ value: "HTTP", label: "Primary path" }],
      narrative:
        "wrapFetchWithPayment against api.syraa.fun. MCP stays @syra-ai/mcp-server off-Worker.",
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
        body: "No documented Syra merchant for Cloudflare Worker Agents.",
      },
      compareRight: {
        title: "Now",
        body: "Copy-paste Base x402 payer. Call /news. Get settled intel.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Cloudflare Agents · x402",
      headline: "Syra × Cloudflare Agents",
      subtitle: "Worker Agents pay Syra per call on Base. Docs and quickstart are live.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Boundaries",
      headline: "What this integration is not.",
      items: [
        "Not a second merchant via paidTool or Monetization Gateway",
        "Not a facilitator replacement on Syra APIs",
        "Not Solana MCP inside Workers by default",
        "Not a custody or wallet stack rewrite",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Payer · Merchant",
      headline: "Workers pay. Syra delivers.",
      body: "Fund Base USDC once. The Agent micropays every Spend call. Humans stay out of the retry loop.",
      highlights: [
        "@x402/fetch in Worker Agent",
        "Syra returns 402 then JSON",
        "Settled USDC on facilitators",
        "MCP path documented separately",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Demo call.",
      terminalLines: [
        "$ wrangler secret put SYRA_EVM_PAYER_PRIVATE_KEY",
        "> fund Base USDC",
        "$ fetch https://api.syraa.fun/news?ticker=BTC",
        "< HTTP/402 Payment Required",
        "> sign · retry with X-PAYMENT",
        "< HTTP/200 · news payload",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Fund Base. Wrap fetch. Call Syra.",
      subtitle: "Copy the quickstart. Settle one paid call from your Worker.",
      links: [
        {
          label: "Docs",
          value: "Cloudflare → Syra",
          href: "https://docs.syraa.fun/docs/build/cloudflare-agents-x402",
        },
        {
          label: "Marketplace",
          value: "syraa.fun/marketplace",
          href: "https://www.syraa.fun/marketplace",
        },
        {
          label: "MCP",
          value: "Install MCP",
          href: "https://docs.syraa.fun/docs/build/mcp",
        },
      ],
    }),
  },
]);
