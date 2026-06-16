import { Bot, Layers, RefreshCw, Shield, Wallet } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: Pact Network x402 refund coverage for Syra agent outbound calls.
 */
export const PACT_NETWORK_POST: PostUpdate = {
  meta: {
    updateNumber: 10,
    id: "pact-network-integration",
    title: "Pact Network Integration",
    published: "June 2026",
    tagline: "Automatic x402 refunds when paid API calls fail",
    shareCopyVideo: `SHIP LOG · Syra just integrated Pact Network.

Your agents pay upstream APIs over x402. When a call fails after payment, the money is gone. Pact fixes that: automatic on-chain refunds for 5xx, timeouts, and bad payloads.

→ @q3labs/pact-sdk wraps every agent outbound fetch
→ Nansen, Birdeye, Zerion, Stableenrich, and more covered
→ Refunds settle back to the agent wallet on Solana
→ GET /agent/pact/refunds ledger for transparency

Pay for intelligence. Get your money back when providers fail.

Full breakdown in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · Pact Network is live on Syra.

Agent x402 calls now have buyer protection. Pay Nansen, Birdeye, or Zerion from your agent wallet. If the API fails after settlement, Pact refunds principal + premium on-chain.

No dispute form. No API key. Same fetch stack, new risk layer.

402 for price. Pact for recourse. Same Syra agent brain.

Try it at syraa.fun/chat`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Pact × Syra",
      subtitle: "Automatic x402 refunds when paid upstream API calls fail. Chargebacks for the agent economy.",
      badge: "Refund · Coverage · Solana",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agent payments had no buyer protection.",
      body: "Syra agents pay Nansen, Birdeye, Zerion, and dozens of x402 providers per chat turn. When a call fails after payment, the USDC is gone. Credit cards have chargebacks. Agent wallets did not. Until now.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What we built",
      headline: "Pact risk layer on agent fetch",
      body: "Every outbound paid fetch composes Sentinel audit, then Pact coverage via @q3labs/pact-sdk. Failed covered calls trigger automatic on-chain refunds to the same agent wallet that paid.",
      highlights: [
        "getAgentFetch(): fetch → Sentinel → Pact",
        "All agent*Client x402 upstream calls covered",
        "Refund ledger at GET /agent/pact/refunds",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How it works",
      headline: "Pay, call, fail, refund",
      steps: [
        {
          step: "01",
          title: "Agent pays x402",
          description: "Agent wallet settles USDC to the upstream provider via the existing @x402/fetch pipeline.",
        },
        {
          step: "02",
          title: "Pact watches",
          description: "Covered calls route through Pact Market proxy. Latency, status, and payload quality are classified.",
        },
        {
          step: "03",
          title: "Call fails",
          description: "5xx, timeout, or malformed response body triggers a covered breach classification.",
        },
        {
          step: "04",
          title: "Refund on-chain",
          description: "Settler submits SettleBatch. Principal + premium return to the agent wallet automatically.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-featured-trio",
      label: "Stack",
      kicker: "Under the hood",
      headline: "Composable, never breaks the call",
      cards: [
        {
          title: "agentFetch",
          subtitle: "Composition layer",
          detail: "Single resolver: globalThis.fetch → Sentinel wrap → Pact wrap. One swap covers all upstream clients.",
          accent: "gold",
        },
        {
          title: "Pact SDK",
          subtitle: "@q3labs/pact-sdk",
          detail: "Drop-in fetch wrapper. Unregistered hosts degrade to bare fetch. Golden rule: Pact never breaks a working call.",
          accent: "gold",
        },
        {
          title: "Refund ledger",
          subtitle: "MongoDB + API",
          detail: "Pact refund events persisted to PactRefund. Read-only GET /agent/pact/refunds for agent wallet transparency.",
        },
      ],
    },
    {
      id: "providers",
      kind: "cards",
      layout: "cards-bento",
      label: "Providers",
      kicker: "Covered upstream",
      headline: "Every major agent x402 client",
      cards: [
        {
          title: "Nansen",
          subtitle: "Smart money",
          detail: "Profiler, token god mode, and perp flows via agentNansenClient.",
        },
        {
          title: "Birdeye",
          subtitle: "Market data",
          detail: "Token prices, OHLCV, and wallet analytics via agentBirdeyeClient.",
        },
        {
          title: "Zerion",
          subtitle: "Portfolio",
          detail: "Multi-chain portfolio and transaction history via agentZerionClient.",
        },
        {
          title: "Stable suite",
          subtitle: "Enrich · Social · Crypto",
          detail: "Stableenrich, Stablesocial, Stablecrypto, Purch Vault, and AgentScore pay.",
        },
      ],
    },
    {
      id: "compare",
      kind: "statement",
      layout: "compare-columns",
      label: "Compare",
      kicker: "Before vs now",
      headline: "Without Pact vs with Pact",
      body: "Before: agent pays, API fails, money gone. Now: same call, small premium, automatic refund at next settlement window.",
      highlights: [
        "Before: no recourse on failed paid calls",
        "Now: principal + premium refunded on-chain",
        "No dispute form or manual claim",
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across agent stack",
      items: [
        {
          icon: Bot,
          title: "Agent chat",
          description: "Every paid tool call through Nansen, Birdeye, Zerion, and stable APIs is Pact-wrapped.",
          href: "https://www.syraa.fun/chat",
        },
        {
          icon: RefreshCw,
          title: "Refund ledger",
          description: "GET /agent/pact/refunds shows on-chain refunds attributed to your agent wallet.",
          href: "https://api.syraa.fun/agent/pact/refunds",
        },
        {
          icon: Shield,
          title: "Risk layer",
          description: "Pact sits underneath payment, not in front. Agent still pays provider. Pact watches and settles.",
        },
        {
          icon: Wallet,
          title: "Agent wallet",
          description: "Refunds settle to the same Solana wallet that paid. No new custody path.",
          href: "https://www.syraa.fun/wallet",
        },
        {
          icon: Layers,
          title: "Sentinel + Pact",
          description: "Audit and budget via Sentinel when enabled. Refund coverage via Pact always on.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "For builders",
      headline: "Pay with confidence",
      stats: [
        { value: "10+", label: "Upstream x402 clients" },
        { value: "0", label: "Dispute forms" },
        { value: "402", label: "Same payment rail" },
      ],
      narrative:
        "Autonomous agents burn USDC on flaky APIs every day. Pact gives Syra agents the recourse layer credit cards have had for decades, without changing how x402 checkout works.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Your agents deserve buyer protection.",
      subline: "Open agent chat, run a paid Nansen or Birdeye tool, and check /agent/pact/refunds if a covered call fails.",
      links: [
        { label: "Agent chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        { label: "Pact docs", value: "pactnetwork.io/docs", href: "https://www.pactnetwork.io/docs" },
        { label: "Refund API", value: "api.syraa.fun/agent/pact/refunds", href: "https://api.syraa.fun/agent/pact/refunds" },
      ],
    },
  ],
};
