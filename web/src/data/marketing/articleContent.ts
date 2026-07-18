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
  bio: "Machine money for agents on Solana, x402 pay-per-call APIs, agent wallets, and treasury policy.",
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

Agents do not browse dashboards. They call HTTP endpoints, receive structured JSON, and decide in milliseconds. Syra's API gateway exposes **machine money**, pay-per-call intelligence, execution surfaces, and treasury workflows, over standard REST with **x402** micropayments.

The **@syra-ai/sdk** package wraps that gateway in a typed TypeScript client so your agent can:

1. Discover live routes at runtime
2. Auto-settle USDC payments on 402 responses
3. Call pillar modules (Earn, Treasury, Invest, Spend, Grow) with consistent response shapes
4. Ship in Node.js, serverless, or agent frameworks without hand-rolling payment retry logic

> [!NOTE]
> Syra also publishes **@syra-ai/x402-payer** (low-level x402 helpers) and **@syra-ai/mcp-server** (MCP distribution for Cursor and Claude). The SDK is the recommended integration path for TypeScript agents.

## Package landscape

| Package | Purpose |
| --- | --- |
| \`@syra-ai/sdk\` | Typed Syra client + x402 auto-pay + pillar modules |
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

## Pillar modules

Syra organizes capabilities into five pillars. Discover them at runtime:

\`\`\`typescript
const pillars = await syra.get("/pillars");
// Earn · Treasury · Invest · Spend · Grow
\`\`\`

Typed helpers attach to the client:

\`\`\`typescript
// High-value routes with known paths
import { SYRA_HIGH_VALUE_ROUTES } from "@syra-ai/sdk";

const route = SYRA_HIGH_VALUE_ROUTES.sentiment;
await syra.get(route.path, route.params);

// Pillar-scoped modules
await syra.pillars.spend.signal({ token: "solana" });
await syra.pillars.invest.rise.scout({ query: "SOL yield" });
\`\`\`

| Pillar | SDK surface | Example use |
| --- | --- | --- |
| Earn | \`syra.pillars.earn\` | KOL campaigns, attribution, revenue paths |
| Treasury | \`syra.pillars.treasury\` | Balances, allocations, policy caps |
| Invest | \`syra.pillars.invest\` | Marinade, Jito, Kamino, marginfi, Meteora |
| Spend | \`syra.pillars.spend\` | x402 intelligence, sentiment, risk, signals |
| Grow | \`syra.pillars.grow\` | Portfolio recommendations, confirm-gated execution |

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

The SDK is the thinnest path from "agent idea" to "agent that pays for intelligence on every call." Ship fast, cap spend, and let x402 handle the machine money layer.
`,
  },
  {
    id: "future-agentic-era",
    slug: "future-agentic-era-syra-positioning",
    title: "The Agentic Era Is Here, How Syra Positions for Machine Economies",
    description:
      "Autonomous agents are scaling, but most cannot own capital or pay for tools without humans. How Syra positions as the machine money rail for the agentic era.",
    excerpt:
      "The agentic era needs more than smarter models, it needs financial infrastructure. Here is Syra's positioning as the machine money rail on Solana.",
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
> Syra's bet: the long-term winner in the agent market will not be the chatbot with the slickest interface. It will be the stack that lets agents generate, manage, and deploy capital efficiently.

## Three waves of the agent economy

### Wave 1, Copilots (2023–2024)

Humans drive. AI suggests. Billing is SaaS subscriptions. APIs assume dashboard signup and monthly tiers.

### Wave 2, Autonomous workers (2024–2026)

Agents execute multi-step tasks. They call tools via MCP, HTTP, and browser automation. But payment still flows through human credit cards, API keys, and manual wallet approvals.

### Wave 3, Machine economies (2026+)

Agents become **economic actors**: they earn revenue, hold treasuries, pay per capability, invest surplus, and settle with other agents in real time. This wave requires native machine money, not human billing patterns duct-taped onto bots.

Syra is built for Wave 3.

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

Syra is **machine money for agents on Solana**, not a trading bot, not a chat wrapper, not another data dashboard.

We occupy three layers:

1. **Spend (x402)**, Pay-per-call intelligence and execution APIs. Agents discover routes, receive HTTP 402 payment instructions, settle USDC, and get structured JSON back. No subscription walls.

2. **Agent money layer**, Wallets, treasury, and a deterministic policy engine. Caps, allowlists, and explicit confirm gates for high-risk moves. You keep the keys; Syra coordinates flows.

3. **Five-pillar rail**, Earn, Treasury, Invest, Spend, Grow. Revenue capture, capital allocation, DeFi participation, micropayments, and yield optimization, composable modules, not a monolith.

\`\`\`
Agent loop:
  Discover → Pay (x402) → Analyze → Decide → Execute (policy-gated) → Earn → Repeat
\`\`\`

> [!TIP]
> Syra separates **analysis from execution**. We surface probabilistic intelligence; your agent (or policy engine) decides whether and how to act. We never assume market direction.

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
| Agent frameworks | Orchestration only | We add machine money, pay, treasury, policy |
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

That requires machine money infrastructure built for Solana's speed and composability.

Syra is positioning to be that layer: **real-time, request-priced, policy-gated, and built for machines that transact.**

---

*Follow [@syra_agent](https://x.com/syra_agent) for positioning updates and new route launches.*
`,
  },
  {
    id: "what-is-syra",
    slug: "what-is-syra",
    title: "What Is Syra? Machine Money for Agents on Solana",
    description:
      "Syra is machine money for autonomous agents, Earn, Treasury, Invest, Spend (x402), and Grow. Complete product overview, pillars, and who Syra is built for.",
    excerpt:
      "A complete answer to what Syra is: machine money on Solana, five pillars, x402 APIs, agent wallets, and who the product is built for.",
    coverImage: "/images/articles/cover-what-is-syra.webp",
    publishedAt: "2026-07-01",
    readingTimeMinutes: 10,
    tags: ["Product", "Overview", "Agents", "Solana", "x402"],
    category: "Product",
    author: SYRA_AUTHOR,
    content: `## The short answer

**Syra is machine money for agents on Solana.**

It gives autonomous agents the financial infrastructure they need to **earn**, **manage treasury**, **invest**, **spend** (via x402 pay-per-call APIs), and **grow** yield, without a human in the loop for every payment or allocation decision.

> [!NOTE]
> Syra is not a chatbot toy or a human trading dashboard. It is infrastructure: APIs, wallets, policy, and settlement rails built for machines that transact.

## The problem Syra solves

AI agents are becoming capable of research, automation, and complex workflows. Most still cannot:

- Hold and manage capital autonomously
- Pay for data and execution at request time
- Earn revenue from work they perform
- Participate in DeFi with policy guardrails
- Coordinate value with other agents at scale

The missing layer is **native financial infrastructure**, ownership of capital, treasury management, and machine-to-machine economic coordination.

Syra builds that layer on Solana.

## Mission and vision

**Mission:** Enable autonomous agents to earn, allocate treasury, invest, spend via x402, and grow yield on Solana, wealth as the narrative, payments as one feature.

**Vision:** An economy where millions of AI agents become productive economic actors, reasoning, earning, managing capital, and coordinating value in real time.

## The five pillars

Syra organizes capabilities into five composable pillars:

| Pillar | What it does |
| --- | --- |
| **Earn** | Agents monetize skills, KOL campaigns, creator attribution, revenue paths from paid calls |
| **Treasury** | Allocate and manage capital across chat, LP, and connected wallets with policy caps |
| **Invest** | Deploy capital via Marinade, Jito, Kamino, marginfi, and Meteora |
| **Spend** | x402 native payments, sentiment, risk, signals, smart-money flow, execution APIs |
| **Grow** | Yield and portfolio optimization with deterministic recommendations and confirm-gated execution |

Spend (x402) is one module, not the whole story. The full rail covers the agent economic lifecycle.

### Earn

Agents capture value from work: paid API calls, campaign attribution, and onchain revenue paths designed for machines, not affiliate links for humans.

### Treasury

Balances, allocations, and auditable movement of agent-held assets. Policy caps prevent runaway spend. Multi-wallet orchestration for teams running fleets of agents.

### Invest

Autonomous deployment into vetted DeFi surfaces, with Syra providing context and execution paths, not directional advice.

### Spend

The x402 gateway: hundreds of intelligence and execution routes priced per call in USDC. Agents discover prices via \`/.well-known/x402\`, pay, and receive structured JSON.

### Grow

Portfolio-level recommendations and yield optimization. High-risk moves require explicit confirm, automation with guardrails.

> [!TIP]
> Explore live routes in the [API marketplace](https://syraa.fun/marketplace) or [playground](https://syraa.fun/playground).

## Core capabilities

Beyond the five pillars, Syra ships:

- **Intelligence + execution APIs**, sentiment, risk scoring, smart-money netflow, signals, charts, swaps
- **Agent wallets**, funded execution environments with spend policy
- **Policy engine**, caps, allowlists, confirm gates for high-risk moves
- **Non-custodial design**, you keep the keys; Syra coordinates intelligence and flows
- **MCP + SDK distribution**, \`@syra-ai/mcp-server\` and \`@syra-ai/sdk\` for agent frameworks

## How it works (simplified)

\`\`\`
1. Fund an agent wallet (USDC on Solana)
2. Agent discovers Syra routes (OpenAPI / x402 / MCP)
3. Agent calls endpoint → HTTP 402 → pays → receives data
4. Agent decides (your logic) → optional execution via Invest/Spend routes
5. Treasury tracks balances; policy engine enforces caps
6. Earn and Grow compound returns over time
\`\`\`

![Syra intelligence pipeline, from on-chain data to agent-ready signals](/images/articles/inline-what-is-syra-pipeline.webp)

Every insight is grounded in verifiable data. Syra does not hallucinate prices or invent wallet labels.

> [!WARNING]
> No intelligence system eliminates risk. Syra provides probabilistic context, not certainty. Always size positions independently.

## Who Syra is for

- **Agent developers** shipping autonomous trading, research, or ops bots
- **Quant and algo teams** that need Solana-native intelligence without building data pipelines
- **AI startups** embedding machine money into their agent products
- **DeFi teams** that want agents to participate with policy guardrails
- **Internal ops** running agent fleets with treasury oversight

## Who Syra is not for

- Casual traders looking for "buy/sell signals" with guaranteed returns
- Teams that want a fully custodial managed account
- Projects that need only a chat UI without onchain economic infrastructure

## How Syra is different

Most AI-agent projects optimize for intelligence, workflows, or user interfaces. Syra focuses on **economic autonomy**:

| Others | Syra |
| --- | --- |
| Subscription APIs | Pay-per-call x402 |
| Human dashboards | Machine-readable JSON |
| Demo wallets | Production policy engine |
| Directional calls | Probabilistic context only |

We build the **financial layer**, not another chatbot.

## Technology stack

- **Chain:** Solana primary; Base and Algorand x402 settlement where required
- **Payments:** x402 + MPP multi-party splits
- **Client:** TypeScript SDK, MCP server, OpenAPI
- **Discovery:** \`/.well-known/x402\`, ERC-8004 agent registry integrations

## Getting started

1. **Explore**, [syraa.fun](https://syraa.fun) web agent and [marketplace](https://syraa.fun/marketplace)
2. **Test**, [playground](https://syraa.fun/playground) for read-only and x402 routes
3. **Integrate**, \`npm install @syra-ai/sdk\` or \`npx -y @syra-ai/mcp-server\`
4. **Fund**, agent wallet with USDC for paid routes
5. **Ship**, wire intelligence into your agent decision loop

> [!IMPORTANT]
> Read the [docs](https://docs.syraa.fun) for the latest endpoint catalog, pricing, and policy configuration.

## Platforms and community

| Channel | Link |
| --- | --- |
| Web app | [syraa.fun](https://syraa.fun) |
| X | [@syra_agent](https://x.com/syra_agent) |
| Docs | [docs.syraa.fun](https://docs.syraa.fun) |
| Telegram bot | @syra_trading_bot |
| Support | support@syraa.fun |

## Summary

Syra is **machine money for agents on Solana**, the rail that lets autonomous systems earn, manage treasury, invest, pay per capability via x402, and grow yield with policy guardrails.

If your agent can think but cannot transact, Syra is what you wire in next.
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
    title: "Syra Explained: Machine Money for Agents on Solana",
    description:
      "How Syra delivers machine money infrastructure,x402 APIs, agent wallets, treasury policy, and execution-ready workflows for the agent economy on Solana.",
    excerpt:
      "From machine money infrastructure to execution-ready signals, how Syra combines x402 APIs, agent wallets, and agent workflows on Solana.",
    coverImage: "/images/articles/cover-syra-explained.webp",
    publishedAt: "2026-02-18",
    readingTimeMinutes: 7,
    tags: ["Solana", "Trading", "Agents", "Intelligence"],
    category: "Product",
    author: SYRA_AUTHOR,
    externalUrl: "https://x.com/syra_agent/status/2021064952765874204",
    content: `## Machine money, not just data

Crypto markets move faster than any human can parse. Syra is **machine money for agents**, not a dashboard, not a chatbot toy, built to give agents x402 pay-per-call APIs, wallets, treasury policy, and actionable market context on Solana.

> [!NOTE]
> Syra separates *analysis* from *execution*. We surface probabilistic intelligence; you (or your agent) decide whether and how to act.

## What Syra does

At its core, Syra orchestrates three layers:

1. **Ingest**, Real-time feeds from Solana programs, DEX liquidity, and social channels
2. **Analyze**, Sentiment scoring, wallet clustering, narrative detection, risk flags
3. **Deliver**, Structured API responses and agent-ready workflows

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
