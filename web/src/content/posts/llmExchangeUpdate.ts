import { Bot, Coins, Route, ShieldCheck, Terminal, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: LLM Exchange on Earn + x402 smart router.
 * Slide copy: avoid em dashes; use commas, periods, or colons instead.
 */
export const LLM_EXCHANGE_POST = defineVideoUpdate(
  {
    updateNumber: 48,
    id: "llm-exchange",
    title: "LLM Exchange",
    published: "August 2026",
    tagline:
      "Sell your LLM on Earn. Agents hit one x402 route. Syra picks cheapest or most callable.",
    shareCopyVideo: `SHIP LOG · Syra LLM Exchange is live.

List Claude, Gemini, DeepSeek, or any OpenAI-compatible endpoint on Earn → LLM, set your price, and earn USDC when agents call POST /llm/route.

Syra smart-routes by cheapest, reliable, fastest, or quality, keeps ~20% for $SYRA buyback, and pays sellers the rest.

syraa.fun/earn?track=llm
docs.syraa.fun/docs/api/llm-route`,
    shareCopyPhoto: `SHIP LOG · Decentralized OpenRouter on x402.

Sellers list LLMs. Agents call one route. Platform fees buy $SYRA.

Earn → LLM · POST /llm/route · GET /llm/models

syraa.fun/earn?track=llm`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-spotlight",
      label: "Cover",
      eyebrow: "Ship log",
      title: "LLM Exchange",
      subtitle:
        "Sell Claude, Gemini, DeepSeek, or any LLM endpoint. Agents pay once. Syra routes to the cheapest or most callable model.",
      badge: "Earn · x402 · Smart router",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agents want one LLM checkout. Sellers want passive USDC.",
      body: "Syra already proxies OpenRouter behind x402. Now anyone can list a live endpoint, set a price, and join a smart router that picks cheapest or most callable with failover.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-checklist",
      label: "Shipped",
      kicker: "What is live",
      headline: "Earn LLM tab + POST /llm/route",
      body: "Sellers manage listings, health, and payouts on Earn. Agents discover models and route with a policy header. Platform fees queue into the existing $SYRA buyback.",
      highlights: [
        "Earn → LLM: list, price, activate, claim",
        "POST /llm/route with X-Syra-Route policies",
        "GET /llm/models discovery + callability scores",
        "20% platform fee → buyback; 80% to sellers",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-pipeline",
      label: "Flow",
      kicker: "How money moves",
      headline: "List → route → split → buyback",
      steps: [
        {
          step: "01",
          title: "List",
          description: "Seller picks protocol (Claude, Gemini, OpenAI-compatible) and price.",
        },
        {
          step: "02",
          title: "Route",
          description: "Agent pays /llm/route. Syra picks by policy + failover.",
        },
        {
          step: "03",
          title: "Split",
          description: "Caller USDC settles to treasury. Seller share accrues.",
        },
        {
          step: "04",
          title: "Buyback",
          description: "Platform fee joins the 80% $SYRA buyback queue.",
        },
      ],
    },
    {
      id: "cards",
      kind: "cards",
      layout: "cards-bento",
      label: "Surfaces",
      kicker: "Who wins",
      headline: "Two-sided machine money",
      cards: [
        {
          title: "Sellers",
          subtitle: "Earn USDC",
          detail: "GPU hosts, fine-tunes, niche models. Zero listing fee.",
          accent: "gold",
        },
        {
          title: "Callers",
          subtitle: "One route",
          detail: "Always the cheapest or most callable completion.",
          accent: "gold",
        },
        {
          title: "Holders",
          subtitle: "Fee cut",
          detail: "Stake 100k+ $SYRA for lower seller fees + featured.",
          accent: "gold",
        },
        {
          title: "Treasury",
          subtitle: "Buyback",
          detail: "Platform fee feeds the same Jupiter $SYRA loop.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Why Syra",
      kicker: "Moat",
      headline: "Built on rails we already run",
      items: [
        {
          icon: Route,
          title: "Smart router",
          description: "Cheapest, reliable, fastest, quality with failover.",
        },
        {
          icon: ShieldCheck,
          title: "SSRF + secrets",
          description: "HTTPS-only upstreams. API keys encrypted at rest.",
        },
        {
          icon: Coins,
          title: "Fee → buyback",
          description: "Same queue as other treasury x402 revenue.",
        },
        {
          icon: Bot,
          title: "Never empty",
          description: "Syra OpenRouter is the system fallback provider.",
        },
        {
          icon: Zap,
          title: "x402 discovery",
          description: "Advertised on /.well-known/x402 for agents.",
        },
        {
          icon: Terminal,
          title: "OpenAI shape",
          description: "Drop-in chat.completions body and response.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Flywheel",
      headline: "More LLMs. Cheaper routes. More $SYRA demand.",
      stats: [
        { value: "1", label: "x402 route" },
        { value: "4", label: "Routing policies" },
        { value: "20%", label: "Platform fee" },
      ],
      narrative:
        "Supply of listed models improves routing quality. Demand increases treasury volume. Buybacks and holder fee discounts pull sellers to stake $SYRA.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Try it",
      headline: "List a model. Route a call.",
      subline: "Open Earn → LLM to sell, or POST /llm/route with X-Syra-Route: cheapest.",
      links: [
        { label: "Earn LLM", value: "syraa.fun/earn?track=llm", href: "https://www.syraa.fun/earn?track=llm" },
        { label: "API docs", value: "docs.syraa.fun/docs/api/llm-route", href: "https://docs.syraa.fun/docs/api/llm-route" },
        { label: "Metrics", value: "GET /api/metrics", href: "https://api.syraa.fun/api/metrics" },
      ],
    },
  ],
);
