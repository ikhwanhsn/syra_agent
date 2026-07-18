import { SKILL_EARN_POST } from "../skillEarnUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { SKILL_EARN_PHOTO_SHARE_COPIES } from "./shareCopies/skillEarnShareCopies";

const copies = SKILL_EARN_PHOTO_SHARE_COPIES;

/** Photo-format content for Skill Endpoints Earn ship log - 15 cards, 15 X posts. */
export const SKILL_EARN_PHOTO = definePhotoUpdate(SKILL_EARN_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Earn · x402 · Creator rail",
      title: "Skill Endpoints",
      subtitle: "Publish paid Syra APIs. Agents pay USDC per call. Payout to your earn wallet.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Creators should not run payment infra.",
      body: "Syra already gates intelligence with x402. Now builders register an upstream URL, set a price, and expose a discoverable /skills/:slug route. payTo is the earn wallet.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Build the API. Syra handles pay.",
      narrative: "Host logic on your HTTPS endpoint. Syra proxies paid calls, lists skills for agents, and routes USDC to your earn wallet.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Creator path",
      headline: "Idea to paid endpoint in four steps.",
      steps: [
        { step: "01", title: "Open Earn", description: "Dashboard → Earn. Connect + Syra sign-in." },
        { step: "02", title: "Create skill", description: "Upstream HTTPS URL, price, optional auth header." },
        { step: "03", title: "Publish", description: "Earn wallet becomes x402 payTo. Slug goes live." },
        { step: "04", title: "Get paid", description: "Agents pay per call. Earnings on Earn page." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "Full earn rail in one pass.",
      steps: [
        { step: "01", title: "Earn UI", description: "Create skill form + skill cards on /overview/earn." },
        { step: "02", title: "Marketplace API", description: "Session-gated CRUD at /agent/marketplace/skills." },
        { step: "03", title: "Dispatcher", description: "Paid /skills/:slug proxy with dynamic payTo." },
        { step: "04", title: "Discovery", description: "GET /skills + entries in /.well-known/x402." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One endpoint.",
      cards: [
        { title: "payTo", subtitle: "Earn wallet", detail: "402 offers creator earn address. Direct USDC.", accent: "gold" },
        { title: "Proxy", subtitle: "Your API", detail: "HTTPS upstream after verify. SSRF guarded.", accent: "gold" },
        { title: "CRUD", subtitle: "Publish flow", detail: "Draft → publish with Syra JWT session." },
        { title: "Index", subtitle: "Agents", detail: "Public catalog for x402 callers." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Skill Endpoints are live now.",
      highlights: [
        "Publish upstream APIs as Syra x402 routes",
        "USDC settles to earn pillar wallet",
        "Agent discovery via /skills catalog",
        "Copy endpoint URL + curl from Earn UI",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Creator-native monetization.",
      stats: [
        { value: "100%", label: "To earn wallet" },
        { value: "1", label: "Publish flow" },
        { value: "x402", label: "Agent pay rail" },
      ],
      narrative: "Host logic anywhere. Syra gates access and addresses payment.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Direct payTo per skill.",
      stats: [{ value: "💰", label: "Earn wallet payout" }],
      narrative: "Each skill 402 offer points at the creator earn agent wallet on Solana.",
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
        body: "Build API, billing, and discovery docs. Hope agents integrate your pay flow.",
      },
      compareRight: {
        title: "Now",
        body: "Register URL on Syra Earn. x402 + discovery + payTo wired. Share /skills/:slug.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Now live",
      badge: "Earn · Skill Endpoints",
      headline: "Monetize agent skills",
      subtitle: "Publish paid APIs. Agents discover and pay via x402. USDC to your earn wallet.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Skill API for builders.",
      items: [
        "POST /agent/marketplace/skills: create draft skill",
        "POST .../skills/:id/publish: earn wallet payTo",
        "GET/POST /skills/:slug: x402 + upstream proxy",
        "GET /skills: published skill discovery catalog",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Machine Money · Earn",
      headline: "Creators publish. Agents pay.",
      body: "Earn pillar now includes skill endpoints alongside earnings attribution. One dashboard for monetizing agent-facing APIs.",
      highlights: [
        "Create skill on /overview/earn",
        "Manage earn wallet at /wallet?wallet=earn",
        "Agents use x402 + /.well-known/x402",
        "Per-call USDC to creator payTo",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Call a published skill.",
      terminalLines: [
        "$ curl api.syraa.fun/skills/token-sentiment",
        "< 402 Payment Required",
        "> payTo: creator earn wallet · USDC",
        "$ retry with PAYMENT-SIGNATURE header",
        "< 200 { success: true, data: {...} }",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Publish your first skill today.",
      subtitle: "Earn → Create skill. Set price. Share your endpoint with agents.",
      links: [
        { label: "Earn", value: "syraa.fun/overview/earn", href: "https://www.syraa.fun/overview/earn" },
        { label: "Skills", value: "api.syraa.fun/skills", href: "https://api.syraa.fun/skills" },
        { label: "x402", value: ".well-known/x402", href: "https://api.syraa.fun/.well-known/x402" },
      ],
    }),
  },
]);
