export type ArticleCalloutType = "tip" | "note" | "warning" | "important";

export interface ArticleAuthor {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  xHandle?: string;
  xUrl?: string;
}

export interface ArticleDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string;
  updatedAt?: string;
  readingTimeMinutes: number;
  tags: string[];
  category: string;
  author: ArticleAuthor;
  /** Original X post when applicable */
  externalUrl?: string;
  content: string;
}

const SYRA_AUTHOR: ArticleAuthor = {
  name: "Syra",
  role: "Machine Money for Agents",
  avatar: "/images/logo.jpg",
  bio: "Machine money for AI trading agents on Solana — x402 pay-per-call APIs, agent wallets, and treasury policy.",
  xHandle: "@syra_agent",
  xUrl: "https://x.com/syra_agent",
};

export const articleDetails: ArticleDetail[] = [
  {
    id: "syra-x402-mpp",
    slug: "syra-access-x402-mpp",
    title: "Syra Access: How x402 and MPP Actually Work (for Builders & Agents)",
    description:
      "Most APIs today are designed for humans. Syra approaches access differently — on-demand, request-level payments powered by x402 and MPP.",
    excerpt:
      "A deep dive into request-level payments, agent-native API access, and why x402 + MPP change how autonomous systems pay for intelligence.",
    coverImage: "/images/articles/article-one.webp",
    publishedAt: "2026-03-12",
    readingTimeMinutes: 9,
    tags: ["x402", "MPP", "API", "Agents", "Infrastructure"],
    category: "Engineering",
    author: SYRA_AUTHOR,
    externalUrl: "https://x.com/syra_agent/status/2042587572438982832",
    content: `## The problem with human-first APIs

Most APIs today are designed for humans. You sign up, get an API key, choose a pricing tier, and manage everything through a dashboard. That model works — until the user is no longer a human, but an **AI agent**, a script, or an automated system that needs to make decisions in real time.

> [!NOTE]
> Syra Access is built for the agent economy: pay per request, no subscriptions, no dashboard friction. Intelligence when you need it, priced at the moment of use.

Traditional API billing assumes monthly commitments, seat-based pricing, and human oversight. Agents need something fundamentally different: **micropayments at request time**, cryptographic proof of payment, and endpoints that respond without account setup.

## What is x402?

x402 revives the HTTP 402 "Payment Required" status code as a first-class protocol primitive. When an agent hits a protected endpoint:

1. The server responds with \`402 Payment Required\` and payment instructions
2. The client signs and submits a payment (USDC on supported chains)
3. The server verifies settlement and returns the resource

\`\`\`typescript
// Simplified x402 client flow
const response = await fetch("https://api.syraa.fun/v1/alpha/sentiment", {
  method: "GET",
  headers: { "X-Syra-Key": process.env.SYRA_KEY },
});

if (response.status === 402) {
  const payment = await response.json();
  const settled = await x402.pay(payment);
  const retry = await fetch(payment.resource, {
    headers: { "X-Payment": settled.proof },
  });
  return retry.json();
}
\`\`\`

> [!TIP]
> x402 is chain-agnostic at the protocol layer. Syra supports settlement on Base and Solana, with more networks on the roadmap.

## MPP: Multi-Party Payments

MPP (Multi-Party Payments) extends single-payer x402 into **split settlements**. When one API call touches multiple providers — data feeds, model inference, on-chain verification — MPP routes payment to each party atomically.

| Concept | Human API model | x402 + MPP |
| --- | --- | --- |
| Billing unit | Monthly subscription | Per request |
| Setup | Dashboard + API key | Wallet + proof |
| Multi-provider | Manual invoicing | Atomic split |
| Agent-ready | Rarely | Native |

### When MPP matters

Consider an agent that needs:

- Sentiment from social data
- Price from a DEX aggregator
- Risk scoring from an internal model

With MPP, a single x402 payment can settle all three providers in one transaction — no separate accounts, no reconciliation lag.

> [!WARNING]
> Always validate payment proofs server-side. Never trust client-reported settlement without on-chain or facilitator verification.

## Syra's access model

Syra exposes intelligence endpoints through this stack:

\`\`\`bash
# Discover payable endpoints
curl -s https://api.syraa.fun/.well-known/x402

# Hit an endpoint — 402 tells you the price
curl -i https://api.syraa.fun/v1/market/pulse
\`\`\`

![Syra API playground — request builder with x402 payment flow](/images/articles/article-one.webp)

Our [API playground](/playground) lets you test endpoints interactively. When a route requires payment, you'll see the 402 response, settlement flow, and final payload — exactly what your agent will experience in production.

> [!IMPORTANT]
> Production agents should cache discovery metadata and implement exponential backoff on 402 retries. Payment facilitators can take 1–3 seconds to confirm.

## Builder checklist

Before shipping an agent that calls Syra:

- [ ] Implement x402 retry logic with payment proof headers
- [ ] Set per-request budget caps in your agent config
- [ ] Log settlement hashes for audit trails
- [ ] Use MPP-aware routes when composing multi-source intelligence
- [ ] Test in the playground before mainnet spend

## What's next

We're expanding MPP splits to cover more data partners, adding Solana-native settlement paths, and publishing SDK helpers for TypeScript and Python agents.

The shift from "sign up and subscribe" to "pay and proceed" isn't cosmetic — it's the infrastructure layer the agent economy needs. x402 and MPP are how Syra delivers intelligence **on demand**, at the speed autonomous systems require.

---

*Originally published on [X @syra_agent](https://x.com/syra_agent/status/2042587572438982832).*
`,
  },
  {
    id: "syra-x",
    slug: "syra-explained-smart-intelligence-agent",
    title: "Syra Explained: Machine Money for AI Trading Agents on Solana",
    description:
      "How Syra delivers machine money infrastructure—x402 APIs, agent wallets, treasury policy, and execution-ready workflows for the agent economy on Solana.",
    excerpt:
      "From machine money infrastructure to execution-ready signals — how Syra combines x402 APIs, agent wallets, and agent workflows on Solana.",
    coverImage: "/images/articles/article-two.webp",
    publishedAt: "2026-02-18",
    readingTimeMinutes: 7,
    tags: ["Solana", "Trading", "Agents", "Intelligence"],
    category: "Product",
    author: SYRA_AUTHOR,
    externalUrl: "https://x.com/syra_agent/status/2021064952765874204",
    content: `## Machine money, not just data

Crypto markets move faster than any human can parse. Syra is **machine money for AI trading agents** — not a dashboard, not a chatbot toy — built to give agents x402 pay-per-call APIs, wallets, treasury policy, and actionable market context on Solana.

> [!NOTE]
> Syra separates *analysis* from *execution*. We surface probabilistic intelligence; you (or your agent) decide whether and how to act.

## What Syra does

At its core, Syra orchestrates three layers:

1. **Ingest** — Real-time feeds from Solana programs, DEX liquidity, and social channels
2. **Analyze** — Sentiment scoring, wallet clustering, narrative detection, risk flags
3. **Deliver** — Structured API responses and agent-ready workflows

\`\`\`typescript
// Example: market pulse via Syra API
const pulse = await syra.get("/v1/market/pulse", {
  params: { chain: "solana", window: "1h" },
});

console.log(pulse.sentiment.score);   // -1 to 1
console.log(pulse.narratives.top);    // trending themes
console.log(pulse.risk.flags);        // structural warnings
\`\`\`

## Built for the agent economy

Syra isn't optimized for humans clicking through charts. It's optimized for **agents that need to decide in milliseconds**:

| Capability | Description |
| --- | --- |
| Market pulse | Aggregated sentiment + volume anomalies |
| Token dossier | Holder distribution, liquidity depth, narrative fit |
| Social intel | X/Telegram signal extraction with spam filtering |
| Agent wallet | Funded execution environment with guardrails |

> [!TIP]
> Pair Syra intelligence with your own execution logic. Syra never assumes market direction — it provides probabilistic context, not certainty.

## The Syra stack

![Syra intelligence pipeline — from on-chain data to agent-ready signals](/images/articles/article-two.webp)

Our architecture follows a simple principle: **ground every insight in verifiable data**. Raw API responses pass through validation layers before they reach your agent. We don't hallucinate prices or invent wallet labels.

> [!WARNING]
> No intelligence system eliminates risk. Always size positions independently and treat Syra outputs as one input among many.

## Who Syra is for

- **Quant and algo traders** building Solana-native strategies
- **Agent developers** shipping autonomous trading or research bots
- **Teams** that need shared intelligence infrastructure without building data pipelines from scratch

## Getting started

1. Explore the [API playground](/playground) — no setup required for read-only routes
2. Fund an agent wallet for x402-paid endpoints
3. Wire Syra into your agent's decision loop via REST or MCP

> [!IMPORTANT]
> Syra is live on Solana mainnet intelligence routes. Check [docs.syraa.fun](https://docs.syraa.fun) for the latest endpoint catalog and pricing.

## The bigger picture

Solana's agent economy needs more than faster blocks — it needs **intelligence infrastructure** that agents can pay for, trust, and compose. Syra is that layer: real-time, request-priced, and built for machines that trade.

---

*Originally published on [X @syra_agent](https://x.com/syra_agent/status/2021064952765874204).*
`,
  },
];

export function getArticleBySlug(slug: string): ArticleDetail | undefined {
  return articleDetails.find((a) => a.slug === slug);
}

export function getRelatedArticles(
  currentSlug: string,
  limit = 3,
): ArticleDetail[] {
  return articleDetails
    .filter((a) => a.slug !== currentSlug)
    .slice(0, limit);
}
