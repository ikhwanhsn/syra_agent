import { BookOpen, CreditCard, Layers, Shield, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Nevermined x402 pilot for Syra crypto news (parallel merchant path).
 */
export const NEVERMINED_X402_POST = defineVideoUpdate(
  {
    updateNumber: 52,
    id: "nevermined-x402",
    title: "Nevermined × Syra",
    published: "August 2026",
    tagline:
      "Nevermined credits pay Syra news. Exact /news stays USDC. Pilot route: /partners/nevermined/news.",
    shareCopyVideo: `SHIP LOG · Nevermined x402 pilot is live on Syra.

Agents with Nevermined credits or card mandates can call GET /partners/nevermined/news. Syra stays merchant. Exact /news on Dexter → GoPlausible → PayAI is unchanged.

→ Pilot path: api.syraa.fun/partners/nevermined/news
→ Quickstart: docs in repo NEVERMINED_X402_QUICKSTART.md
→ Enable NEVERMINED_X402_ENABLED + NVM plan on the API host.

Full breakdown in the video.`,
    shareCopyPhoto: `SHIP LOG · Nevermined → Syra news pilot.

Parallel x402 merchant path for agents on Nevermined credits. Same news JSON as /news. Exact USDC rails untouched.

api.syraa.fun/partners/nevermined/news`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Syra × Nevermined",
      subtitle:
        "Credits and card mandates meet pay-per-call crypto news. Syra stays the merchant on a parallel pilot route.",
      badge: "x402 · credits · pilot",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Not every agent wallet starts with Solana USDC.",
      body: "Nevermined settles x402 with credits, cards, and USDC via their facilitator. Syra already sells crypto intel on HTTP 402. This pilot lets Nevermined-funded agents buy news without touching the Exact /news stack.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "Nevermined merchant pilot on Syra API",
      body: "Feature-flagged route GET /partners/nevermined/news uses @nevermined-io/payments Express middleware. Same news payload as /news. Returns 503 when NVM env is missing. No silent fallthrough to Exact USDC.",
      highlights: [
        "api/libs/neverminedPayments.js",
        "api/routes/neverminedNews.js",
        "docs/NEVERMINED_X402_QUICKSTART.md",
        "Exact /news unchanged",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "Pilot path",
      headline: "Token → news → settle",
      steps: [
        {
          step: "01",
          title: "Enable pilot",
          description: "NEVERMINED_X402_ENABLED, NVM_API_KEY, NVM_PLAN_ID on the API host.",
        },
        {
          step: "02",
          title: "Get x402 token",
          description: "Nevermined client issues payment-signature for the plan (1 credit per call).",
        },
        {
          step: "03",
          title: "Call Syra",
          description: "GET /partners/nevermined/news?ticker=BTC with payment-signature header.",
        },
        {
          step: "04",
          title: "Read receipt",
          description: "HTTP 200 + news JSON. payment-response header from Nevermined settle.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-row",
      label: "Stack",
      kicker: "Two rails",
      headline: "Parallel merchants. One intel layer.",
      cards: [
        {
          title: "Exact /news",
          subtitle: "USDC",
          detail: "Dexter → GoPlausible → PayAI. Default Spend path.",
          accent: "gold",
        },
        {
          title: "Nevermined pilot",
          subtitle: "Credits",
          detail: "/partners/nevermined/news via NVM middleware.",
          accent: "gold",
        },
        {
          title: "Syra intel",
          subtitle: "Payload",
          detail: "Same news aggregator and ticker resolve for both routes.",
        },
        {
          title: "Facilitators",
          subtitle: "Boundary",
          detail: "Nevermined is not inserted into Exact failover.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Where to start",
      headline: "Pilot endpoints and docs",
      items: [
        {
          icon: Zap,
          title: "Pilot route",
          description: "GET /partners/nevermined/news on api.syraa.fun.",
          href: "https://api.syraa.fun/partners/nevermined/news?ticker=BTC",
        },
        {
          icon: BookOpen,
          title: "Quickstart",
          description: "Env vars, sandbox hosts, curl flow in repo docs.",
        },
        {
          icon: CreditCard,
          title: "Nevermined facilitator",
          description: "Credits, cards, and USDC via nevermined.ai facilitator.",
          href: "https://nevermined.ai/facilitator/",
        },
        {
          icon: Layers,
          title: "Exact /news",
          description: "Default USDC Spend path for MCP and SDK.",
          href: "https://api.syraa.fun/news?ticker=BTC",
        },
        {
          icon: Shield,
          title: "Do not merge rails",
          description: "Nevermined is a parallel merchant, not PayAI failover.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Activation",
      headline: "Card and credit agents can buy intel without a new Syra wallet flow.",
      stats: [
        { value: "1", label: "Credit per news call" },
        { value: "2", label: "Merchant paths" },
        { value: "0", label: "Changes to Exact /news" },
      ],
      narrative:
        "Syra settled 42,901 paid calls in the last 7 days on Exact rails. This pilot opens Nevermined-funded agents without moving that stack.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "Enable NVM. Call the pilot. Confirm settle.",
      subline:
        "Set sandbox env on the API, obtain a Nevermined x402 token, and settle one /partners/nevermined/news call.",
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
    },
  ],
);
