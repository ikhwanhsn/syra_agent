import { LLM_EXCHANGE_POST } from "../llmExchangeUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { LLM_EXCHANGE_PHOTO_SHARE_COPIES } from "./shareCopies/llmExchangeShareCopies";

const copies = LLM_EXCHANGE_PHOTO_SHARE_COPIES;

/** Photo-format content for the LLM Exchange ship log. */
export const LLM_EXCHANGE_PHOTO = definePhotoUpdate(LLM_EXCHANGE_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Earn · x402 · Smart router",
      title: "LLM Exchange",
      subtitle:
        "Sell Claude, Gemini, DeepSeek, or any LLM endpoint. Agents pay once. Syra routes to the cheapest or most callable model.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-gold-frame",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The moment",
      headline: "Agents want one LLM checkout. Sellers want passive USDC.",
      body: "Syra already sells crypto intelligence on x402. Now anyone can list a live model and join a smart router with failover and a clear fee split.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "One route. Many models. Settled in USDC.",
      narrative:
        "Callers never pick a vendor. Sellers never run payment infra. Platform fees still buy $SYRA.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Money flow",
      headline: "List → route → split → buyback.",
      steps: [
        { step: "01", title: "List", description: "Seller adds HTTPS endpoint and price." },
        { step: "02", title: "Route", description: "Agent pays /llm/route with a policy." },
        { step: "03", title: "Split", description: "Fee to buyback. Rest to seller ledger." },
        { step: "04", title: "Claim", description: "Seller claims USDC from Earn → LLM." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Ship sequence",
      headline: "From Earn tab to public metrics.",
      steps: [
        { step: "01", title: "Earn UI", description: "List, price, activate, claim." },
        { step: "02", title: "Router", description: "Four policies + failover." },
        { step: "03", title: "Health", description: "Callability probes and auto-pause." },
        { step: "04", title: "Proof", description: "Volume on GET /api/metrics." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-stack",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four reasons this stack holds.",
      cards: [
        {
          title: "Sellers",
          subtitle: "Earn USDC",
          detail: "List Claude, Gemini, DeepSeek, or custom.",
          accent: "gold",
        },
        {
          title: "Callers",
          subtitle: "One route",
          detail: "Cheapest or most callable by policy.",
          accent: "gold",
        },
        {
          title: "Holders",
          subtitle: "Fee cut",
          detail: "Stake 100k+ $SYRA for featured placement.",
          accent: "gold",
        },
        {
          title: "Treasury",
          subtitle: "Buyback",
          detail: "Platform fee joins the Jupiter queue.",
        },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What you can do today.",
      highlights: [
        "List a model on Earn → LLM",
        "Discover prices on GET /llm/models",
        "Call POST /llm/route with X-Syra-Route",
        "Claim seller earnings from Earn",
        "Verify volume on /api/metrics",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Proof on LLM Exchange.",
      stats: [
        { value: "1", label: "x402 route" },
        { value: "4", label: "Routing policies" },
        { value: "20%", label: "Platform fee" },
      ],
      narrative: "Fees feed the same $SYRA buyback queue as the rest of Syra treasury revenue.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-monolith",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "POST /llm/route is the single agent entry.",
      stats: [{ value: "/llm/route", label: "Multi-protocol smart router" }],
      narrative: "Failover, policy headers, and syra_route metadata on every completion.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Hardcode a vendor vs let Syra route.",
      compareLeft: {
        title: "Weak play",
        body: "One LLM, one outage, no marketplace pressure on price.",
      },
      compareRight: {
        title: "Syra play",
        body: "One x402 call, policy routing, and a market that gets cheaper as supply grows.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-beacon",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Now open",
      badge: "LLM Exchange",
      partnerName: "Earn",
      headline: "Sellers and agents welcome",
      subtitle: "Earn → LLM for listings. POST /llm/route for callers. OpenRouter fallback always on.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Next stops",
      headline: "Where to go after this ship.",
      items: [
        "Earn LLM tab to list or claim",
        "API docs for /llm/route and /llm/models",
        "/.well-known/x402 for agent discovery",
        "/token and /api/metrics for buyback proof",
        "Stake $SYRA for lower seller fees",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Models · Settlement",
      headline: "Sellers own models. Syra owns settlement.",
      body: "You bring the endpoint and price. Syra brings x402, SSRF guards, encrypted keys, routing, and buyback.",
      highlights: [
        "Encrypted API keys",
        "HTTPS-only upstreams",
        "Policy + failover",
        "Fee → $SYRA buyback",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "From list to routed call.",
      terminalLines: [
        "$ list endpoint on Earn → LLM",
        "$ GET /llm/models",
        "$ POST /llm/route",
        "→ X-Syra-Route: cheapest",
        "$ settle 402",
        "< chat.completion + syra_route",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "List a model. Route a call.",
      subtitle: "Open Earn → LLM to sell access, or point your agent at POST /llm/route today.",
      links: [
        {
          label: "Earn LLM",
          value: "syraa.fun/earn?track=llm",
          href: "https://www.syraa.fun/earn?track=llm",
        },
        {
          label: "API docs",
          value: "docs.syraa.fun/docs/api/llm-route",
          href: "https://docs.syraa.fun/docs/api/llm-route",
        },
        {
          label: "Metrics",
          value: "api.syraa.fun/api/metrics",
          href: "https://api.syraa.fun/api/metrics",
        },
      ],
    }),
  },
]);
