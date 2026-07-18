import { AGENTSCORE_POST } from "../agentscoreUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { AGENTSCORE_PHOTO_SHARE_COPIES } from "./shareCopies/agentscoreShareCopies";

const copies = AGENTSCORE_PHOTO_SHARE_COPIES;

/** Photo-format content for the AgentScore ship log: 15 cards, 15 X posts. */
export const AGENTSCORE_PHOTO = definePhotoUpdate(AGENTSCORE_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Passport · Gate · Pay",
      title: "AgentScore × Syra",
      subtitle: "Pay with x402. Comply with Passport. Gate when regulation matters.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Payments worked. Identity didn't.",
      body: "Syra sells intelligence over x402. Regulated merchants need KYC before checkout. AgentScore adds merchant gates and buyer Passport, without replacing payment middleware.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "402 for price. Passport for identity.",
      narrative: "Permissionless x402 stays unchanged. Compliance is optional, route-specific, and buyer-side with one Passport.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "Anonymous 402 → pay → gate → buy.",
      steps: [
        { step: "01", title: "Anonymous 402", description: "First request returns x402 pricing. Permissionless unchanged." },
        { step: "02", title: "Pay with x402", description: "Payment-Signature verified via existing facilitator." },
        { step: "03", title: "Gate if required", description: "Assess on paid retry. 403 + verify_url without Passport." },
        { step: "04", title: "Buy merchants", description: "agentscore-pay with X-Operator-Token from agent wallet." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Checkout path",
      headline: "Verify once. Buy everywhere.",
      steps: [
        { step: "01", title: "Discover merchant", description: "agentscore-discover from agent chat or GET /agentscore/discover." },
        { step: "02", title: "Pay with x402", description: "402 pricing → USDC Payment-Signature on paid retry." },
        { step: "03", title: "Passport if gated", description: "403 + verify_url. Complete KYC once, save operator token." },
        { step: "04", title: "Order confirmed", description: "Retry with X-Operator-Token. HTTP/200 from gated merchant." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Compliance when it matters. Permissionless when it doesn't.",
      cards: [
        { title: "Gate", subtitle: "Merchant", detail: "KYC, sanctions, age, jurisdiction on paid retry.", accent: "gold" },
        { title: "Passport", subtitle: "Buyer", detail: "Verify once. Works at every gated merchant.", accent: "gold" },
        { title: "Pay tools", subtitle: "4 tools", detail: "Discover, check, status, pay from agent chat." },
        { title: "Policy", subtitle: "Boost", detail: "Higher caps for KYC-verified operators." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What's live in Syra × AgentScore.",
      highlights: [
        "AgentScore Gate on 8004 registration + Tempo payouts",
        "agentscore-discover, check, passport-status, pay",
        "Public /agentscore routes, MCP, and skill.md",
        "Policy engine boost for verified operators",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Identity + payments + intelligence.",
      stats: [
        { value: "4", label: "New agent tools" },
        { value: "2", label: "Gated routes" },
        { value: "1", label: "Passport, many merchants" },
      ],
      narrative: "Sell intelligence with optional compliance. Buy from regulated merchants with one Passport.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "One Passport. No re-KYC per checkout.",
      stats: [{ value: "1", label: "Passport · every gated merchant" }],
      narrative: "Martin Estate, Sayer & Stone, and the full AgentScore network. Verify once, buy anywhere.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Pay for data vs. buy from merchants.",
      compareLeft: {
        title: "Before",
        body: "No KYC gates on Syra. Agents couldn't checkout at AgentScore-gated merchants.",
      },
      compareRight: {
        title: "Now",
        body: "Optional Gate on sensitive routes. Passport + pay tools for regulated agent commerce.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live",
      title: "AgentScore × Syra",
      subtitle: "Merchant gates. Buyer Passport. Pay tools in agent chat.",
      body: "Syra is an x402 merchant with optional compliance gates, and an x402 buyer for regulated commerce.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "Built for agents. API-first.",
      items: [
        "Agent tools: agentscore-discover through agentscore-pay",
        "Public GET /agentscore/discover and /check",
        "Gate on 8004 register-agent and Tempo payouts",
        "MCP syra_agentscore_* tools for external agents",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Two sides",
      headline: "Sell intelligence. Buy from merchants.",
      body: "Merchant side: optional Gate on high-risk routes. Buyer side: Passport + agentscore-pay from agent wallet.",
      highlights: [
        "Gate: KYC, sanctions, age, jurisdiction",
        "Passport: verify once, many merchants",
        "Pay tools: discover → check → pay",
        "Policy boost for verified operators",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "AgentScore checkout from terminal.",
      terminalLines: [
        "$ curl api.syraa.fun/agentscore/discover",
        "< merchants: Martin Estate, Sayer & Stone, …",
        "$ agentscore-pay passport login",
        "> verify_url opened · KYC complete · opc_… saved",
        "$ syra agent tools call agentscore-pay --url https://agents.martinestate.com/purchase",
        "> 402 → pay USDC → X-Operator-Token attached",
        "< HTTP/200 · order confirmed",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Ship compliant agent commerce.",
      subtitle: "Verify once with Passport. Pay per call. Gate when it matters.",
      links: [
        { label: "Agent chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        { label: "skill.md", value: "api.syraa.fun/skill.md", href: "https://api.syraa.fun/skill.md" },
        { label: "AgentScore", value: "docs.agentscore.sh", href: "https://docs.agentscore.sh" },
      ],
    }),
  },
]);
