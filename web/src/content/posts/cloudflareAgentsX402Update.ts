import { BookOpen, Bot, Cloud, Code2, Shield, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Cloudflare Agents pay Syra Spend APIs over x402 (Base USDC payer path).
 */
export const CLOUDFLARE_AGENTS_X402_POST = defineVideoUpdate(
  {
    updateNumber: 50,
    id: "cloudflare-agents-x402",
    title: "Cloudflare Agents × Syra",
    published: "August 2026",
    tagline:
      "Cloudflare Agents pay Syra crypto intel per call. Syra stays the merchant. Base USDC via @x402/fetch.",
    shareCopyVideo: `SHIP LOG · Cloudflare Agents can pay Syra over x402.

Syra stays the merchant. Your Cloudflare Agent is the payer: wrap fetch with @x402/fetch, fund Base USDC, call /news or any Spend route.

→ Quickstart: docs.syraa.fun/docs/build/cloudflare-agents-x402
→ Agent pays. Syra settles. No double-charge behind Monetization Gateway.
→ MCP builders: still use @syra-ai/mcp-server on Solana outside Workers.

Full breakdown in the video.`,
    shareCopyPhoto: `SHIP LOG · Cloudflare Agents → Syra x402.

Fund a Base wallet. Wrap fetch in your Agent. Pay per call for crypto news and intel.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Syra × Cloudflare Agents",
      subtitle:
        "Machine money for Workers. Agents pay Syra Spend APIs in Base USDC. Syra stays the x402 merchant.",
      badge: "Agents SDK · x402 · Base",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agent builders need a payer recipe, not another billing stack.",
      body: "Cloudflare Agents SDK ships x402 client support. Syra already settles pay-per-call crypto intel on HTTP 402. Together: fund a Base wallet, wrap fetch in your Worker Agent, and call api.syraa.fun without API keys or subscriptions.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "Cloudflare Agents → Syra quickstart",
      body: "Repo quickstart and docs site page show a SyraPayAgent pattern: x402Client, Exact EVM on Base, wrapFetchWithPayment, then GET /news. Syra facilitators stay authoritative. No Monetization Gateway double-charge.",
      highlights: [
        "docs/CLOUDFLARE_AGENTS_X402_QUICKSTART.md in repo",
        "docs.syraa.fun/docs/build/cloudflare-agents-x402",
        "Agent = payer. Syra = merchant.",
        "MCP path documented for HTTP MCP only",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "402 → sign → intel",
      steps: [
        {
          step: "01",
          title: "Fund Base USDC",
          description: "Store the EVM payer key in Worker secrets. Keep USDC + gas on Base.",
        },
        {
          step: "02",
          title: "Wrap fetch",
          description: "x402Client + ExactEvmScheme + wrapFetchWithPayment in your Agent onStart.",
        },
        {
          step: "03",
          title: "Call Syra",
          description: "GET /news, /insights/market-pulse, or any Spend route on api.syraa.fun.",
        },
        {
          step: "04",
          title: "Settle and read",
          description: "HTTP 200 with JSON. X-PAYMENT-RESPONSE confirms on-chain settle.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-row",
      label: "Stack",
      kicker: "Who does what",
      headline: "Four roles. One payment path.",
      cards: [
        {
          title: "Cloudflare Agent",
          subtitle: "Payer",
          detail: "Signs Base USDC x402 payments from a Worker via @x402/fetch.",
          accent: "gold",
        },
        {
          title: "Syra API",
          subtitle: "Merchant",
          detail: "Returns 402 with accepts. Delivers crypto intel after settle.",
          accent: "gold",
        },
        {
          title: "Facilitators",
          subtitle: "Settle",
          detail: "Dexter → GoPlausible → PayAI verify and settle USDC.",
        },
        {
          title: "Builders",
          subtitle: "Ship",
          detail: "Copy the quickstart. No new Syra custody or wallet rewrite.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Where to start",
      headline: "Docs and Spend routes",
      items: [
        {
          icon: BookOpen,
          title: "Quickstart",
          description: "Cloudflare Agents → Syra x402 on docs.syraa.fun.",
          href: "https://docs.syraa.fun/docs/build/cloudflare-agents-x402",
        },
        {
          icon: Cloud,
          title: "CF payments docs",
          description: "Agentic payments and Pay from Agents SDK on Cloudflare.",
          href: "https://developers.cloudflare.com/agents/tools/payments/",
        },
        {
          icon: Bot,
          title: "MCP (off-Worker)",
          description: "Cursor and Claude: @syra-ai/mcp-server with Solana payer key.",
          href: "https://docs.syraa.fun/docs/build/mcp",
        },
        {
          icon: Zap,
          title: "Marketplace",
          description: "Browse paid Spend routes after your Agent wallet is funded.",
          href: "https://www.syraa.fun/marketplace",
        },
        {
          icon: Code2,
          title: "Example route",
          description: "GET /news?ticker=BTC is the default demo call.",
        },
        {
          icon: Shield,
          title: "Do not double-charge",
          description: "Do not wrap Syra behind paidTool or Monetization Gateway as a second merchant.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Distribution",
      headline: "One more agent host can pay Syra in minutes.",
      stats: [
        { value: "Base", label: "Default payer chain" },
        { value: "1", label: "HTTP call to prove" },
        { value: "0", label: "API keys required" },
      ],
      narrative:
        "Cloudflare is trending in agentic payments. This path gives their builders a concrete merchant: pay-per-call crypto intel with settled USDC receipts on Syra metrics.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "Fund Base. Wrap fetch. Call Syra.",
      subline:
        "Copy the SyraPayAgent quickstart, fund USDC on Base, and settle one /news call from your Worker.",
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
          label: "Metrics",
          value: "syraa.fun",
          href: "https://www.syraa.fun",
        },
      ],
    },
  ],
);
