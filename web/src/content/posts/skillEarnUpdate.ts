import {
  Bot,
  Coins,
  Globe,
  Link2,
  PiggyBank,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: Skill Endpoints Earn Rail — publish skills as paid x402 APIs, payTo = earn wallet.
 */
export const SKILL_EARN_POST: PostUpdate = {
  meta: {
    updateNumber: 17,
    id: "skill-endpoints-earn",
    title: "Skill Endpoints",
    published: "June 2026",
    tagline: "Publish skills as paid Syra x402 endpoints — USDC settles to your earn wallet",
    shareCopyVideo: `SHIP LOG · Syra just shipped Skill Endpoints on the Earn rail.

Creators publish an upstream HTTPS URL as a paid Syra API. Other agents discover it, pay USDC via x402, and you keep every micropayment — direct to your earn wallet.

→ Dashboard → Earn → Create skill
→ GET/POST api.syraa.fun/skills/:slug with dynamic payTo
→ Proxy to your logic · listed in GET /skills + /.well-known/x402
→ Wallet sign-in to publish · earn pillar wallet as payout address

Build once. Agents pay per call. You earn on-chain.

Full walkthrough in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · Skill Endpoints are live on Syra Earn.

Publish your API as a paid x402 endpoint. Agents call it. USDC goes straight to your earn wallet.

Create → publish → earn per call.

syraa.fun/overview/earn`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-tagline-stack",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Skill Endpoints",
      subtitle:
        "Publish skills as paid Syra x402 APIs. Agents pay USDC per call. Payout goes direct to your earn wallet.",
      badge: "Earn · x402 · Creator rail",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-highlight-line",
      label: "Context",
      kicker: "Why this matters",
      headline: "Creators should monetize APIs without running payment infra.",
      body: "Syra already gates intelligence with x402. Now any builder can register an upstream HTTPS endpoint, set a price, and expose it as a first-class Syra route — discoverable by agents, settled straight to the creator earn wallet.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-numbered-cards",
      label: "Shipped",
      kicker: "What we built",
      headline: "Earn rail + skill marketplace API",
      body: "Dashboard Earn page lets creators draft skills, publish with wallet sign-in, and manage live endpoints. The dispatcher proxies paid calls to upstream URLs with SSRF guards while x402 payTo points at the creator earn wallet.",
      highlights: [
        "POST /agent/marketplace/skills — create, publish, unpublish",
        "GET/POST /skills/:slug — x402 gate + upstream proxy",
        "Dynamic payTo per skill — creator earn wallet on Solana",
        "GET /skills + /.well-known/x402 discovery for agents",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-arrow-chain",
      label: "Flow",
      kicker: "Creator path",
      headline: "Four steps from idea to paid endpoint",
      steps: [
        {
          step: "01",
          title: "Open Earn",
          description:
            "Dashboard → Earn. Connect wallet and sign in with Syra session.",
        },
        {
          step: "02",
          title: "Create skill",
          description:
            "Set title, upstream HTTPS URL, price in USD, and optional auth header for your API.",
        },
        {
          step: "03",
          title: "Publish",
          description:
            "Syra resolves your earn pillar wallet as payTo. Skill goes live at /skills/:slug.",
        },
        {
          step: "04",
          title: "Get paid",
          description:
            "Every agent call pays USDC to your earn wallet. Earnings show on the Earn dashboard.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-mosaic",
      label: "Features",
      kicker: "Under the hood",
      headline: "Gateway + registry + ledger",
      cards: [
        {
          title: "Direct payTo",
          subtitle: "Earn wallet",
          detail: "x402 Payment Required offers the creator earn wallet — no treasury escrow on this rail.",
          accent: "gold",
        },
        {
          title: "Upstream proxy",
          subtitle: "Your HTTPS API",
          detail: "Syra forwards GET/POST after payment verify. HTTPS-only with SSRF protection.",
          accent: "gold",
        },
        {
          title: "Skill CRUD",
          subtitle: "Session gated",
          detail: "Draft, edit, publish, unpublish from /agent/marketplace/skills with Syra JWT.",
        },
        {
          title: "Discovery",
          subtitle: "Agent index",
          detail: "Published skills merge into /.well-known/x402 so external agents find paid routes.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Earn pillar, end to end",
      items: [
        {
          icon: Coins,
          title: "Earn page",
          description: "Create skill, view endpoints, copy curl, track calls and earnings.",
          href: "https://www.syraa.fun/overview/earn",
        },
        {
          icon: PiggyBank,
          title: "Earn wallet",
          description: "Custodial earn pillar wallet receives direct x402 USDC per skill call.",
          href: "https://www.syraa.fun/wallet?wallet=earn",
        },
        {
          icon: Bot,
          title: "Agent callers",
          description: "External agents pay 402, retry with signature, receive proxied JSON response.",
        },
        {
          icon: Globe,
          title: "Discovery",
          description: "GET /skills catalog plus dynamic entries in /.well-known/x402.",
          href: "https://api.syraa.fun/.well-known/x402",
        },
        {
          icon: Link2,
          title: "Public endpoint",
          description: "Each skill slug maps to api.syraa.fun/skills/:slug — shareable and callable.",
        },
        {
          icon: ShieldCheck,
          title: "Safe proxy",
          description: "HTTPS-only upstreams, private IP blocked, response size capped.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "For creators",
      headline: "Monetize agent skills without a billing stack",
      stats: [
        { value: "100%", label: "To creator wallet" },
        { value: "1", label: "Click to publish" },
        { value: "x402", label: "Agent-native pay" },
      ],
      narrative:
        "Host your logic anywhere. Syra handles discovery, payment gating, settlement addressing, and call logging. You focus on the API. Agents bring the USDC.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Publish your first skill endpoint today.",
      subline: "Open Dashboard → Earn, create a skill, publish, and share your /skills/:slug URL with agents.",
      links: [
        { label: "Earn", value: "syraa.fun/overview/earn", href: "https://www.syraa.fun/overview/earn" },
        { label: "Earn wallet", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet?wallet=earn" },
        { label: "x402 catalog", value: "api.syraa.fun/skills", href: "https://api.syraa.fun/skills" },
      ],
    },
  ],
};
