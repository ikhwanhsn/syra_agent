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
  role: "Pay-per-call crypto APIs for agents",
  avatar: "/images/logo.jpg",
  bio: "Pay-per-call crypto intelligence for agents on Solana: x402 APIs, MCP, and typed SDK.",
  xHandle: "@syra_agent",
  xUrl: "https://x.com/syra_agent",
};

export const articleDetails: ArticleDetail[] = [
  {
    id: "syra-sdk-guide",
    slug: "syra-sdk-guide",
    title: "Syra SDK: Build Agents That Pay for Intelligence on Every Call",
    description:
      "Complete guide to @syra-ai/sdk, TypeScript client, x402 auto-pay, pillar modules, MCP, and production patterns for agent developers.",
    excerpt:
      "Install @syra-ai/sdk, wire x402 auto-pay, call intelligence routes, and ship production agents with typed pillar modules and MCP distribution.",
    coverImage: "/images/articles/cover-syra-sdk-guide.webp",
    publishedAt: "2026-07-09",
    readingTimeMinutes: 12,
    tags: ["SDK", "TypeScript", "x402", "Developers", "MCP"],
    category: "Engineering",
    author: SYRA_AUTHOR,
    content: `## Why the SDK exists

Agents do not browse dashboards. They call HTTP endpoints, receive structured JSON, and decide in milliseconds. Syra's API gateway exposes **pay-per-call crypto intelligence** over standard REST with **x402** micropayments.

The **@syra-ai/sdk** package wraps that gateway in a typed TypeScript client so your agent can:

1. Discover live routes at runtime
2. Auto-settle USDC payments on 402 responses
3. Call Spend (x402) intelligence routes with consistent response shapes
4. Ship in Node.js, serverless, or agent frameworks without hand-rolling payment retry logic

> [!NOTE]
> Syra also publishes **@syra-ai/x402-payer** (low-level x402 helpers) and **@syra-ai/mcp-server** (MCP distribution for Cursor and Claude). The SDK is the recommended integration path for TypeScript agents.

## Package landscape

| Package | Purpose |
| --- | --- |
| \`@syra-ai/sdk\` | Typed Syra client + x402 auto-pay + Spend routes |
| \`@syra-ai/x402-payer\` | MIT x402 v2 fetch wrapper, sign, retry, safe billing |
| \`@syra-ai/mcp-server\` | MCP tools for Cursor / Claude, \`npx -y @syra-ai/mcp-server\` |

All packages target **Node 18+**, publish under the \`@syra-ai\` scope on npm, and point at \`https://api.syraa.fun\` by default.

## Install

\`\`\`bash
npm install @syra-ai/sdk
\`\`\`

For MCP-only workflows (no custom code):

\`\`\`bash
npx -y @syra-ai/mcp-server@latest
\`\`\`

## Quick start, auto-pay (recommended)

The fastest path is \`createSyraPaidClient\`. It reads payer credentials from environment variables and handles 402 → sign → retry automatically.

\`\`\`typescript
import { createSyraPaidClient } from "@syra-ai/sdk";

const syra = await createSyraPaidClient({
  baseUrl: "https://api.syraa.fun",
});

const pulse = await syra.get("/v1/market/pulse", {
  chain: "solana",
  window: "1h",
});

if (pulse.success) {
  console.log(pulse.data);
} else {
  console.error(pulse.error);
}
\`\`\`

Every method returns a consistent envelope:

\`\`\`typescript
type SyraApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
\`\`\`

> [!TIP]
> Start in the [API playground](https://syraa.fun/playground) to see exact paths, params, and x402 prices before wiring the SDK.

## Environment variables

| Rail | Variables |
| --- | --- |
| Solana (default) | \`SYRA_PAYER_KEYPAIR\`, base58 or JSON byte array |
| Base | \`X402_PREFERRED_NETWORK=base\` + \`SYRA_EVM_PAYER_PRIVATE_KEY\` |
| Algorand | \`X402_PREFERRED_NETWORK=algorand\` + \`SYRA_ALGORAND_PAYER_PRIVATE_KEY\` |

For MCP auto-pay, the same \`SYRA_PAYER_KEYPAIR\` is used by \`@syra-ai/mcp-server\`.

### Inline payer (scripts and CI)

\`\`\`typescript
const syra = await createSyraPaidClient({
  payer: { solanaKeypair: process.env.MY_AGENT_KEY! },
  // or: payer: { evmPrivateKey: "0x...", network: "base" }
});
\`\`\`

Never commit keypairs. Use secrets managers in production.

## Manual payment signer

If you bring your own wallet adapter or custom signing flow, implement \`SyraPaymentSigner\`:

\`\`\`typescript
import { createSyraClient, type SyraPaymentSigner } from "@syra-ai/sdk";

const signer: SyraPaymentSigner = {
  async signPayment(challenge, context) {
    // Build x402 payment proof, return PAYMENT-SIGNATURE header value
    return signedHeader;
  },
};

const syra = createSyraClient({ signer, maxPaymentRetries: 2 });
const res = await syra.get("/news", { ticker: "BTC" });
\`\`\`

Without a signer, \`request()\` stops at the first **HTTP 402** and returns \`{ success: false, error: "HTTP 402" }\`.

> [!WARNING]
> Always validate settlement server-side in your own services. Client-reported payment proofs are not sufficient for accounting, log facilitator hashes for audit trails.

## Low-level paid fetch

When you only need x402-wrapped \`fetch\` without the full client:

\`\`\`typescript
import { getPaidFetch, hasPaidFetchConfigured } from "@syra-ai/sdk/payment";

if (hasPaidFetchConfigured()) {
  const paidFetch = await getPaidFetch();
  const res = await paidFetch("https://api.syraa.fun/signal?token=solana");
  const data = await res.json();
}
\`\`\`

Or use the standalone payer package:

\`\`\`typescript
import { fetchWithX402Payment, microUsdcToUsd } from "@syra-ai/x402-payer";

const result = await fetchWithX402Payment(url, { method: "GET" }, {
  async signPayment(requirement) {
    const usd = microUsdcToUsd(requirement.amount);
    // sign and return PAYMENT-SIGNATURE
    return header;
  },
});
\`\`\`

## Spend routes and platform modules

**Spend (x402)** is the live GTM wedge. Discover paid routes and optional platform modules at runtime:

\`\`\`typescript
const pillars = await syra.get("/pillars");
// Spend is live GTM; Earn · Treasury · Invest · Grow are platform roadmap
\`\`\`

Typed helpers attach to the client:

\`\`\`typescript
// High-value routes with known paths
import { SYRA_HIGH_VALUE_ROUTES } from "@syra-ai/sdk";

const route = SYRA_HIGH_VALUE_ROUTES.sentiment;
await syra.get(route.path, route.params);

// Spend-scoped intelligence (live)
await syra.pillars.spend.signal({ token: "solana" });
// Platform roadmap modules (same rails, not GTM hero)
await syra.pillars.invest.rise.scout({ query: "SOL yield" });
\`\`\`

| Module | SDK surface | Status |
| --- | --- | --- |
| Spend | \`syra.pillars.spend\` | **Live GTM**, x402 intelligence, sentiment, risk, signals |
| Earn | \`syra.pillars.earn\` | Platform roadmap |
| Treasury | \`syra.pillars.treasury\` | Platform roadmap |
| Invest | \`syra.pillars.invest\` | Platform roadmap |
| Grow | \`syra.pillars.grow\` | Platform roadmap |

## MCP integration

For Cursor, Claude Desktop, or ElizaOS, use the MCP server instead of embedding the SDK:

\`\`\`bash
claude mcp add syra -- npx -y @syra-ai/mcp-server@latest
\`\`\`

Configuration:

| Env | Purpose |
| --- | --- |
| \`SYRA_API_BASE_URL\` | API host (default \`https://api.syraa.fun\`) |
| \`SYRA_PAYER_KEYPAIR\` | Auto-pay for production x402 routes |
| \`SYRA_MCP_TOOL_PROFILE\` | \`curated\` (~42 tools) or \`full\` (~240 tools) |

The MCP server translates tool calls into HTTP GET/POST against Syra. With \`SYRA_PAYER_KEYPAIR\` set, paid routes settle automatically, the same rail as the SDK.

> [!IMPORTANT]
> MCP uses **stdio transport**, the client spawns the server as a subprocess. For remote HTTPS MCP gateways, deploy a proxy that forwards to \`api.syraa.fun\`.

## Discovery and OpenAPI

Agents should discover prices before spending:

\`\`\`bash
# x402 discovery document
curl -s https://api.syraa.fun/.well-known/x402

# Full OpenAPI catalog
curl -s https://api.syraa.fun/openapi.json

# LLM-oriented route index
curl -s https://api.syraa.fun/llms-full.txt
\`\`\`

Cache discovery metadata in your agent config. Prices and routes change as Syra ships new capabilities.

## Production checklist

Before mainnet spend:

- [ ] Fund payer wallet with USDC on the correct chain (Solana default)
- [ ] Set per-request and daily budget caps in agent config
- [ ] Implement exponential backoff on 402 retries (facilitators take 1–3s)
- [ ] Log settlement hashes for audit and reconciliation
- [ ] Use \`maxPaymentRetries\` conservatively (default: 1)
- [ ] Test routes in the [playground](https://syraa.fun/playground) first
- [ ] Handle \`{ success: false }\`, never assume \`data\` exists

\`\`\`typescript
const syra = await createSyraPaidClient({
  maxPaymentRetries: 1,
  headers: { "X-Agent-Id": "my-production-bot" },
});
\`\`\`

## Error handling patterns

\`\`\`typescript
async function safeSyraCall<T>(
  fn: () => Promise<{ success: boolean; data?: T; error?: string }>,
): Promise<T | null> {
  const res = await fn();
  if (!res.success) {
    console.error("[syra]", res.error);
    return null;
  }
  return res.data ?? null;
}

const sentiment = await safeSyraCall(() =>
  syra.get("/v1/alpha/sentiment", { ticker: "SOL" }),
);
\`\`\`

Responses containing **"Payment was NOT charged"** from x402 are safe to retry, the payer package handles this; still log for observability.

## What to build next

1. **Research agent**, call Spend pillar routes (sentiment, risk, smart-money flow) on a schedule
2. **Execution agent**, combine intelligence with your own swap logic; Syra does not assume direction
3. **Treasury agent**, wire Treasury pillar + policy caps for autonomous capital management
4. **MCP assistant**, ship internal tools to your team via Cursor without custom HTTP glue

## Resources

| Resource | URL |
| --- | --- |
| API Marketplace | [syraa.fun/marketplace](https://syraa.fun/marketplace) |
| Playground | [syraa.fun/playground](https://syraa.fun/playground) |
| Docs | [docs.syraa.fun](https://docs.syraa.fun) |
| npm SDK | \`npm install @syra-ai/sdk\` |
| MCP | \`npx -y @syra-ai/mcp-server\` |

The SDK is the thinnest path from "agent idea" to "agent that pays for intelligence on every call." Ship fast, cap spend, and let x402 handle settlement.
`,
  },
  {
    id: "future-agentic-era",
    slug: "future-agentic-era-syra-positioning",
    title: "The Agentic Era Is Here, How Syra Positions for Pay-Per-Call Agents",
    description:
      "Autonomous agents are scaling, but most cannot pay for tools without humans. How Syra positions as pay-per-call crypto intelligence for the agentic era.",
    excerpt:
      "The agentic era needs more than smarter models, it needs pay-per-call rails. Here is Syra's positioning: x402 + MCP + SDK on Solana.",
    coverImage: "/images/articles/cover-future-agentic-era.webp",
    publishedAt: "2026-07-05",
    readingTimeMinutes: 11,
    tags: ["Agents", "Strategy", "Solana", "Infrastructure", "x402"],
    category: "Strategy",
    author: SYRA_AUTHOR,
    content: `## The shift nobody is pricing in

AI agents passed the demo phase. They research markets, write code, operate browsers, and coordinate multi-step workflows. What they still cannot do reliably, at scale, is **own capital**, **pay for capabilities**, and **coordinate value** without a human approving every transaction.

That gap is not a UX problem. It is an **infrastructure** problem.

> [!NOTE]
> Syra's bet: the long-term winner in the agent market will not be the chatbot with the slickest interface. It will be the stack that lets agents discover, pay for, and reuse crypto tools on every call.

## Three waves of the agent economy

### Wave 1, Copilots (2023–2024)

Humans drive. AI suggests. Billing is SaaS subscriptions. APIs assume dashboard signup and monthly tiers.

### Wave 2, Autonomous workers (2024–2026)

Agents execute multi-step tasks. They call tools via MCP, HTTP, and browser automation. But payment still flows through human credit cards, API keys, and manual wallet approvals.

### Wave 3, Machine economies (2026+)

Agents become **economic actors**: they pay per capability, settle with other agents in real time, and compose paid tools without human billing ops. This wave requires native pay-per-call rails, not human SaaS patterns duct-taped onto bots.

Syra is built for Wave 3, starting with **Spend (x402)** crypto intelligence.

## What is missing today

| Capability | Status quo | What agents need |
| --- | --- | --- |
| API access | Human signup + API keys | Pay-per-call with cryptographic proof |
| Treasury | Spreadsheet + manual transfers | Policy-gated wallets with caps and allowlists |
| Intelligence | Free tiers or opaque pricing | Discoverable x402 prices, settle at request time |
| Execution | Human confirms in wallet UI | Confirm-gated automation with audit trails |
| Multi-agent | Ad-hoc orchestration | Composable settlement (MPP) across providers |

Most "AI agent" projects optimize for **intelligence** or **workflows**. Few build the **financial layer** agents need to operate autonomously for hours, days, or months.

## How Syra positions

Syra is **pay-per-call crypto intelligence for agents on Solana**, not a trading bot, not a chat wrapper, not a five-pillar wealth OS.

We occupy two live layers and one roadmap:

1. **Spend (x402)**, Pay-per-call intelligence and execution APIs. Agents discover routes, receive HTTP 402 payment instructions, settle USDC, and get structured JSON back. No subscription walls. **This is the public GTM wedge.**

2. **MCP + SDK**, Install once in Cursor/Claude or wire \`createSyraPaidClient\` in app code. Auto-pay on 402 without per-vendor API keys.

3. **Platform roadmap**, Earn, Treasury, Invest, Grow modules on the same rails (\`GET /pillars\`). Not the growth thesis until Spend has volume.

\`\`\`
Agent loop:
  Discover → Pay (x402) → Analyze → Decide → Call again
\`\`\`

> [!TIP]
> Syra separates **analysis from execution**. We surface probabilistic intelligence; your agent decides whether and how to act. We never assume market direction.

## Why x402 is the unlock

HTTP 402 "Payment Required" was dormant for decades. x402 revives it as a protocol primitive:

1. Agent calls endpoint
2. Server returns 402 + payment instructions (USDC amount, chain, facilitator)
3. Agent signs and retries with \`PAYMENT-SIGNATURE\`
4. Server verifies settlement and returns the resource

This model is **agent-native**: no dashboard, no OAuth dance, no monthly commitment. An agent with a funded wallet can start calling paid APIs in seconds.

Syra's **MPP (Multi-Party Payments)** extends this further, one payment can atomically split across multiple data providers in a single call. That matters when intelligence is compositional (sentiment + price + risk in one request).

## Why Solana

Solana is Syra's economic layer:

- **Low latency**, agents deciding in milliseconds cannot wait for slow settlement
- **Low fees**, micropayments per API call only work when per-tx cost is negligible
- **Deep DeFi stack**, Jupiter, Meteora, RISE, Giza, and native programs agents can compose with
- **Agent ecosystem momentum**, frameworks, wallets, and infra builders converging on SVM

We also support Base and Algorand settlement paths where partners require them, but Solana remains the primary rail.

## Competitive positioning

| Category | Typical player | Syra's angle |
| --- | --- | --- |
| AI chatbots | General assistants | We are infrastructure, not a chat UI |
| Data terminals | Human dashboards | We serve machines, structured JSON, x402 priced |
| Agent frameworks | Orchestration only | We add pay-per-call, x402 settle, MCP/SDK |
| Payment protocols | x402 facilitators | We are a full intelligence + execution gateway on top |
| Trading bots | Directional bets | Probabilistic context only, no certainty claims |

Syra does not compete on "smarter answers." We compete on **economic autonomy**: can your agent pay for the next capability without waking up a human?

## Distribution strategy

Agents discover tools through three channels Syra ships today:

1. **REST + OpenAPI**, \`api.syraa.fun/openapi.json\` and \`/.well-known/x402\`
2. **SDK**, \`@syra-ai/sdk\` with typed pillar modules and auto-pay
3. **MCP**, \`@syra-ai/mcp-server\` for Cursor, Claude, and agent frameworks

This meets builders where they already work. A quant team uses the SDK. An AI ops team uses MCP. A serverless function uses raw x402 fetch.

> [!IMPORTANT]
> North-star metric: **paid API calls and net revenue per agent**. The rail compounds as agents transact more, not as humans scroll more.

## Who wins the agentic era

Teams that ship agents with:

- **Funded wallets** and explicit spend policy
- **Composable intelligence** paid per call, not bundled in opaque subscriptions
- **Audit trails** for every settlement hash
- **Human override** only on high-risk execution, not on every micro-payment

Syra provides the rail. You provide the strategy, risk model, and end-user product.

## Roadmap themes (not a promise of dates)

We are expanding along predictable axes:

- **More x402 routes**, deeper smart-money, risk, social, and execution surfaces
- **Broader MPP splits**, more data partners settled atomically per call
- **Richer treasury policy**, finer-grained caps, multi-wallet orchestration
- **Agent discovery**, ERC-8004 and registry integrations so agents find Syra programmatically
- **SDK ergonomics**, Python helpers, confirm-gated execution presets, observability hooks

## The bigger picture

The agentic era does not need another demo that calls GPT once. It needs **millions of agents** acting as productive economic participants, earning, allocating, investing, spending, and growing capital onchain.

That requires pay-per-call infrastructure built for Solana's speed and composability.

Syra is positioning to be that layer: **real-time, request-priced, policy-gated, and built for machines that transact.**

---

*Follow [@syra_agent](https://x.com/syra_agent) for positioning updates and new route launches.*
`,
  },
  {
    id: "what-is-syra",
    slug: "what-is-syra",
    title: "What Is Syra? Pay-Per-Call Crypto APIs for Agents",
    description:
      "Syra is pay-per-call crypto intelligence for agents: settle USDC via x402, integrate with MCP or the SDK, no per-vendor API keys.",
    excerpt:
      "A complete answer to what Syra is: x402 pay-per-call APIs, MCP and SDK distribution, and who the product is built for.",
    coverImage: "/images/articles/cover-what-is-syra.webp",
    publishedAt: "2026-07-01",
    readingTimeMinutes: 8,
    tags: ["Product", "Overview", "Agents", "Solana", "x402"],
    category: "Product",
    author: SYRA_AUTHOR,
    content: `## The short answer

**Syra is pay-per-call crypto intelligence for agents.**

Settle USDC via **x402**, integrate with **MCP** or the **SDK**, and call news, sentiment, signals, and smart-money routes without per-vendor API keys.

> [!NOTE]
> Syra means agents that **pay for tools** on every call. It is not a chatbot toy or a five-pillar wealth OS pitch.

## The problem Syra solves

AI agents run research and automation workflows. Most still cannot:

- Pay for data at request time without human billing ops
- Discover and compose paid HTTP APIs without vendor API keys
- Settle micropayments in USDC from a single agent wallet
- Get structured JSON crypto intelligence mid-loop

The missing layer is **machine-native payments**: discover a route, settle on HTTP 402, call again.

Syra builds that layer on Solana.

## Mission and vision

**Mission:** Let autonomous agents pay for crypto intelligence and tools on every call via x402, MCP, and a typed SDK on Solana.

**Vision:** An economy where millions of AI agents pay for tools, settle in USDC, and coordinate value without human billing ops.

## What you get today (live GTM)

| Surface | What it does |
| --- | --- |
| **x402 APIs** | Pay-per-call crypto intelligence and execution routes in USDC |
| **MCP** | \`@syra-ai/mcp-server\` in Cursor / Claude with curated tools |
| **SDK** | \`@syra-ai/sdk\` with \`createSyraPaidClient\` auto-pay |
| **Marketplace** | Browse and test routes at [syraa.fun/marketplace](https://syraa.fun/marketplace) |

### Spend (x402)

The live growth wedge: hundreds of intelligence and execution routes priced per call in USDC. Agents discover prices via \`/.well-known/x402\`, pay, and receive structured JSON.

### MCP + SDK

Install once. The MCP server maps tools like \`syra_spend_news\` to HTTP. The SDK handles 402 → sign → retry so app code stays thin.

### Agent wallets (optional)

Funded execution environments with spend policy. Caps and allowlists prevent runaway spend. Non-custodial: you keep the keys.

> [!TIP]
> Explore live routes in the [API marketplace](https://syraa.fun/marketplace).

## Platform roadmap

Earn, Treasury, Invest, Spend, and Grow are API modules on the same rails (discover via \`GET /pillars\`). **Spend is live GTM.** The others ship as platform roadmap, not the public growth thesis.

| Module | Role |
| --- | --- |
| **Spend** | x402 pay-per-call APIs (**live**) |
| **Earn** | Monetize skills, KOL campaigns, creator attribution |
| **Treasury** | Wallets, billing caps, policy |
| **Invest** | Policy-gated DeFi deployment paths |
| **Grow** | Yield and portfolio recommendations (analysis-first) |

## Core capabilities

- **Intelligence + execution APIs**: sentiment, risk scoring, smart-money netflow, signals, charts, swaps
- **Agent wallets**: funded execution with spend policy
- **Policy engine**: caps, allowlists, confirm gates for high-risk moves
- **Non-custodial design**: you keep the keys; Syra settles paid routes
- **MCP + SDK distribution**: \`@syra-ai/mcp-server\` and \`@syra-ai/sdk\`

## How it works (simplified)

\`\`\`
1. Install MCP or npm i @syra-ai/sdk
2. Fund a payer wallet (USDC on Solana; Base/Algorand supported)
3. Agent discovers Syra routes (OpenAPI / x402 / MCP)
4. Agent calls endpoint → HTTP 402 → pays → receives data
5. Agent decides (your logic) → optional follow-up paid calls
\`\`\`

![Syra intelligence pipeline, from on-chain data to agent-ready signals](/images/articles/inline-what-is-syra-pipeline.webp)

Every insight is grounded in verifiable data. Syra does not hallucinate prices or invent wallet labels.

> [!WARNING]
> No intelligence system eliminates risk. Syra provides probabilistic context, not certainty. Always size positions independently.

## Who Syra is for

- **Agent developers** shipping research, trading, or ops bots that need crypto data mid-loop
- **Quant and algo teams** that need Solana-native intelligence without building data pipelines
- **AI startups** embedding pay-per-call crypto APIs into agent products
- **Builders** who want one wallet to pay many tools via MCP or SDK

## Who Syra is not for

- Casual traders looking for buy/sell signals with guaranteed returns
- Teams that want a fully custodial managed account
- Projects that need only a chat UI without paid API rails

## How Syra is different

Most AI-agent projects optimize for chat UIs or orchestration. Syra focuses on **pay-per-call rails**:

| Others | Syra |
| --- | --- |
| Subscription APIs | Pay-per-call x402 |
| Human dashboards | Machine-readable JSON |
| Per-vendor API keys | One wallet, many tools |
| Directional calls | Probabilistic context only |

We build **pay-per-call rails for tool calls**, not another chatbot.

## Technology stack

- **Chain:** Solana primary; Base and Algorand x402 settlement where required
- **Payments:** x402 + MPP multi-party splits
- **Client:** TypeScript SDK, MCP server, OpenAPI
- **Discovery:** \`/.well-known/x402\`, ERC-8004 agent registry integrations

## Getting started

1. **Install**, \`npx -y @syra-ai/mcp-server\` or \`npm install @syra-ai/sdk\`
2. **Fund**, payer wallet with USDC for paid routes
3. **Call**, news / sentiment / signals via MCP tool or SDK client
4. **Explore**, [marketplace](https://syraa.fun/marketplace) for the full catalog
5. **Ship**, wire intelligence into your agent decision loop

> [!IMPORTANT]
> Read the [docs](https://docs.syraa.fun) for the latest endpoint catalog, pricing, and MCP setup.

## Platforms and community

| Channel | Link |
| --- | --- |
| Web app | [syraa.fun](https://syraa.fun) |
| Marketplace | [syraa.fun/marketplace](https://syraa.fun/marketplace) |
| X | [@syra_agent](https://x.com/syra_agent) |
| Docs | [docs.syraa.fun](https://docs.syraa.fun) |
| Telegram bot | @syra_trading_bot |
| Support | support@syraa.fun |

## Summary

Syra is **pay-per-call crypto intelligence for agents**: settle USDC via x402, integrate with MCP or the SDK, no per-vendor API keys.

If your agent can think but cannot pay for tools, Syra is what you wire in next.
`,
  },
  {
    id: "syra-x402-mpp",
    slug: "syra-access-x402-mpp",
    title: "Syra Access: How x402 and MPP Actually Work (for Builders & Agents)",
    description:
      "Most APIs today are designed for humans. Syra approaches access differently, on-demand, request-level payments powered by x402 and MPP.",
    excerpt:
      "A deep dive into request-level payments, agent-native API access, and why x402 + MPP change how autonomous systems pay for intelligence.",
    coverImage: "/images/articles/cover-syra-access-x402-mpp.webp",
    publishedAt: "2026-03-12",
    readingTimeMinutes: 9,
    tags: ["x402", "MPP", "API", "Agents", "Infrastructure"],
    category: "Engineering",
    author: SYRA_AUTHOR,
    externalUrl: "https://x.com/syra_agent/status/2042587572438982832",
    content: `## The problem with human-first APIs

Most APIs today are designed for humans. You sign up, get an API key, choose a pricing tier, and manage everything through a dashboard. That model works, until the user is no longer a human, but an **AI agent**, a script, or an automated system that needs to make decisions in real time.

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

MPP (Multi-Party Payments) extends single-payer x402 into **split settlements**. When one API call touches multiple providers, data feeds, model inference, on-chain verification, MPP routes payment to each party atomically.

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

With MPP, a single x402 payment can settle all three providers in one transaction, no separate accounts, no reconciliation lag.

> [!WARNING]
> Always validate payment proofs server-side. Never trust client-reported settlement without on-chain or facilitator verification.

## Syra's access model

Syra exposes intelligence endpoints through this stack:

\`\`\`bash
# Discover payable endpoints
curl -s https://api.syraa.fun/.well-known/x402

# Hit an endpoint, 402 tells you the price
curl -i https://api.syraa.fun/v1/market/pulse
\`\`\`

![Syra API playground, request builder with x402 payment flow](/images/articles/inline-x402-playground.webp)

Our [API playground](/playground) lets you test endpoints interactively. When a route requires payment, you'll see the 402 response, settlement flow, and final payload, exactly what your agent will experience in production.

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

The shift from "sign up and subscribe" to "pay and proceed" isn't cosmetic, it's the infrastructure layer the agent economy needs. x402 and MPP are how Syra delivers intelligence **on demand**, at the speed autonomous systems require.

---

*Originally published on [X @syra_agent](https://x.com/syra_agent/status/2042587572438982832).*
`,
  },
  {
    id: "syra-x",
    slug: "syra-explained-smart-intelligence-agent",
    title: "Syra Explained: Pay-Per-Call Crypto APIs for Agents on Solana",
    description:
      "How Syra delivers pay-per-call crypto intelligence: x402 APIs, MCP, SDK, and agent-ready workflows on Solana.",
    excerpt:
      "From x402 settlement to MCP install, how Syra helps agents pay for crypto intelligence on every call.",
    coverImage: "/images/articles/cover-syra-explained.webp",
    publishedAt: "2026-02-18",
    readingTimeMinutes: 7,
    tags: ["Solana", "Trading", "Agents", "Intelligence"],
    category: "Product",
    author: SYRA_AUTHOR,
    externalUrl: "https://x.com/syra_agent/status/2021064952765874204",
    content: `## Pay-per-call crypto intelligence, not just data

Crypto markets move faster than any human can parse. Syra is **pay-per-call crypto intelligence for agents**, not a dashboard, not a chatbot toy. Agents settle USDC via x402, install MCP or the SDK, and get actionable market context on Solana.

> [!NOTE]
> Syra separates *analysis* from *execution*. We surface probabilistic intelligence; you (or your agent) decide whether and how to act.

## What Syra does

At its core, Syra orchestrates three layers:

1. **Ingest**, Real-time feeds from Solana programs, DEX liquidity, and social channels
2. **Analyze**, Sentiment scoring, wallet clustering, narrative detection, risk flags
3. **Deliver**, Structured API responses over x402 for MCP and SDK clients

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
| MCP / SDK | Install once, auto-pay on HTTP 402 |

> [!TIP]
> Pair Syra intelligence with your own execution logic. Syra never assumes market direction, it provides probabilistic context, not certainty.

## The Syra stack

![Syra intelligence pipeline, from on-chain data to agent-ready signals](/images/articles/inline-syra-explained-pipeline.webp)

Our architecture follows a simple principle: **ground every insight in verifiable data**. Raw API responses pass through validation layers before they reach your agent. We don't hallucinate prices or invent wallet labels.

> [!WARNING]
> No intelligence system eliminates risk. Always size positions independently and treat Syra outputs as one input among many.

## Who Syra is for

- **Quant and algo traders** building Solana-native strategies
- **Agent developers** shipping autonomous trading or research bots
- **Teams** that need shared intelligence infrastructure without building data pipelines from scratch

## Getting started

1. Explore the [API playground](/playground), no setup required for read-only routes
2. Fund an agent wallet for x402-paid endpoints
3. Wire Syra into your agent's decision loop via REST or MCP

> [!IMPORTANT]
> Syra is live on Solana mainnet intelligence routes. Check [docs.syraa.fun](https://docs.syraa.fun) for the latest endpoint catalog and pricing.

## The bigger picture

Solana's agent economy needs more than faster blocks, it needs **intelligence infrastructure** that agents can pay for, trust, and compose. Syra is that layer: real-time, request-priced, and built for machines that trade.

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
