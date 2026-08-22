import { NEVERMINED_X402_POST } from "../neverminedX402Update";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { NEVERMINED_X402_PHOTO_SHARE_COPIES } from "./shareCopies/neverminedX402ShareCopies";

const copies = NEVERMINED_X402_PHOTO_SHARE_COPIES;

/** Photo-format content for Nevermined x402 pilot ship log. */
export const NEVERMINED_X402_PHOTO = definePhotoUpdate(NEVERMINED_X402_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "x402 · credits · pilot",
      title: "Syra × Nevermined",
      subtitle: "Parallel merchant path for crypto news.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "Activation gap",
      headline: "Not every agent starts with Solana USDC.",
      body: "Nevermined settles with credits and card mandates. Syra added /partners/nevermined/news so those agents can buy news without moving Exact /news.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Parallel merchant. Same intel.",
      narrative:
        "Nevermined credits on the pilot route. USDC on /news. Syra stays merchant on both paths.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Pilot path",
      headline: "Token → news → settle.",
      steps: [
        { step: "01", title: "Enable NVM", description: "API env + sandbox plan." },
        { step: "02", title: "Get token", description: "Nevermined payment-signature." },
        { step: "03", title: "Call Syra", description: "GET /partners/nevermined/news." },
        { step: "04", title: "Read JSON", description: "200 + payment-response." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "Nevermined pilot in the API.",
      steps: [
        { step: "01", title: "NVM middleware", description: "@nevermined-io/payments on Express." },
        { step: "02", title: "Pilot route", description: "/partners/nevermined/news." },
        { step: "03", title: "Quickstart doc", description: "NEVERMINED_X402_QUICKSTART.md." },
        { step: "04", title: "Exact untouched", description: "Dexter → GoPlausible → PayAI." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Two rails. One intel layer.",
      cards: [
        { title: "Exact /news", subtitle: "USDC", detail: "Default Spend path.", accent: "gold" },
        { title: "NVM pilot", subtitle: "Credits", detail: "Parallel merchant.", accent: "gold" },
        { title: "Syra news", subtitle: "Payload", detail: "Same aggregator both ways." },
        { title: "Boundary", subtitle: "No failover", detail: "NVM not in PayAI stack." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Prove the pilot in four steps.",
      highlights: [
        "Create Nevermined sandbox plan",
        "Set NVM_API_KEY and NVM_PLAN_ID",
        "Flip NEVERMINED_X402_ENABLED=true",
        "Call /partners/nevermined/news with payment-signature",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Exact rails keep shipping.",
      stats: [
        { value: "42.9k", label: "Paid calls · 7d" },
        { value: "2", label: "Merchant paths" },
        { value: "0", label: "Exact changes" },
      ],
      narrative: "Settled USDC volume on syraa.fun metrics. NVM pilot adds credits without moving that stack.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Pilot endpoint is live in code.",
      stats: [{ value: "GET", label: "/partners/nevermined/news" }],
      narrative: "503 when NVM env is off. Same ticker query as /news when enabled.",
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
        body: "Only Exact USDC /news for Syra crypto news.",
      },
      compareRight: {
        title: "Now",
        body: "Parallel Nevermined credits route with identical JSON.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Nevermined · x402 pilot",
      headline: "Syra × Nevermined",
      subtitle: "Credits meet pay-per-call crypto news on a feature-flagged API route.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Boundaries",
      headline: "What this pilot is not.",
      items: [
        "Not PayAI or Dexter failover",
        "Not a replacement for Crossmint onramp",
        "Not MCP default until receipt proven",
        "Not a change to Exact /news pricing",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Credits · USDC",
      headline: "Pick the rail. Same intel.",
      body: "Nevermined agents use credits on the pilot. USDC agents keep /news and MCP.",
      highlights: [
        "payment-signature header",
        "1 credit per news call",
        "facilitator: nevermined in JSON",
        "Exact stack unchanged",
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
        "$ export NVM_API_KEY=sandbox:...",
        "$ TOKEN=$(nvm x402 token --plan $PLAN)",
        '$ curl -H "payment-signature: $TOKEN" \\',
        '  "https://api.syraa.fun/partners/nevermined/news?ticker=BTC"',
        "< HTTP/200 · news payload",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Enable NVM. Settle one call.",
      subtitle: "Sandbox plan + API env. Then hit the pilot route.",
      links: [
        {
          label: "Pilot",
          value: "/partners/nevermined/news",
          href: "https://api.syraa.fun/partners/nevermined/news?ticker=BTC",
        },
        {
          label: "Marketplace",
          value: "syraa.fun/marketplace",
          href: "https://www.syraa.fun/marketplace",
        },
        {
          label: "Metrics",
          value: "syraa.fun",
          href: "https://www.syraa.fun",
        },
      ],
    }),
  },
]);
