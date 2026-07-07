# Syra OKX.AI ASP Registration Runbook

Step-by-step guide to register Syra as an ASP on [OKX.AI](https://www.okx.ai). Use alongside [asp-dossier.md](./asp-dossier.md) for all profile fields, service lists, and pricing.

**Estimated time:** 30–60 minutes active work + up to 2 business days OKX review.

---

## Prerequisites

- [ ] Cursor, Claude Code, Codex, OpenClaw, or Hermes agent installed ([OKX agent install guide](https://web3.okx.com/onchainos/dev-docs/okxai/agent-installation-guide))
- [ ] Node.js 18+ installed
- [ ] Email address for OKX Agentic Wallet login
- [ ] Syra API live at `https://api.syraa.fun` (verify: `curl -s https://api.syraa.fun/.well-known/x402 | head`)
- [ ] [asp-dossier.md](./asp-dossier.md) open for copy-paste fields

---

## Step 1 — Install Onchain OS

Send this prompt to your agent (Cursor, Claude Code, etc.):

```
Install Onchain OS via npx skills add okx/onchainos-skills --yes -g, then log in to Agentic Wallet with my email
```

**What happens:**
1. Agent installs OKX Onchain OS skills globally.
2. Agent guides you through Agentic Wallet email login.
3. Complete the email verification when prompted.

**Verify:** Agent confirms Agentic Wallet is connected.

---

## Step 2 — Register A2MCP ASP

Send this prompt:

```
Help me register an A2MCP ASP on OKX.AI using Onchain OS
```

When the agent asks for details, provide from [asp-dossier.md](./asp-dossier.md):

### Primary A2MCP service

| Field | Value |
|-------|-------|
| **Service name** | Syra x402 Crypto Intelligence API |
| **Description** | Pay-per-call crypto intelligence APIs for agents. 28 routes covering news, signals, technical indicators, memecoin analysis, tokenized equity spreads, Bitcoin dashboard, Jupiter quotes, OpenRouter chat/image/video, and Solana 8004 agent registry. HTTP 402 (x402 v2) payment. |
| **Price** | Per-route USDC (see dossier tables); gateway bundle from $0.0001/call |
| **Endpoint** | `https://api.syraa.fun` |
| **OpenAPI spec** | `https://api.syraa.fun/openapi.json` |
| **Discovery** | `https://api.syraa.fun/.well-known/x402` |
| **Docs** | `https://docs.syraa.fun` |

### If OKX requires individual endpoints

Register these high-value routes first (covers ~80% of agent use cases):

| # | Service name | Endpoint | Price |
|---|-------------|----------|-------|
| 1 | Syra Brain | `https://api.syraa.fun/brain` | $0.08 |
| 2 | Trading Signal | `https://api.syraa.fun/signal` | $0.01 |
| 3 | Crypto News | `https://api.syraa.fun/news` | $0.01 |
| 4 | Technical Indicators | `https://api.syraa.fun/indicator` | $0.01 |
| 5 | pump.fun Memecoin Analyzer | `https://api.syraa.fun/pumpfun/analyzer` | $0.02 |
| 6 | Bitcoin Intelligence Hub | `https://api.syraa.fun/bitcoin` | $0.01 |
| 7 | Chat Completions | `https://api.syraa.fun/chat/completions` | from $0.004 |
| 8 | API Health (test) | `https://api.syraa.fun/health` | $0.0001 |

Full 28-route table: [asp-dossier.md Section 2](./asp-dossier.md#2-a2mcp--service-catalog-28-routes).

### A2MCP registration notes

- OKX A2MCP expects a callable API/MCP interface. Syra's OpenAPI spec at `openapi.json` is the fastest registration path.
- **OKX Payment SDK** integration is required before A2MCP goes live on the marketplace. Registration can proceed; go-live waits on SDK integration (see dossier Section 5).
- Syra's `@syra-ai/mcp-server` is stdio-only. For remote MCP, deploy an HTTPS gateway later (`mcp.syraa.fun`).

---

## Step 3 — Register A2A ASP

Send this prompt:

```
Help me register an A2A ASP on OKX.AI using Onchain OS
```

When the agent asks for details, provide from [asp-dossier.md Section 3](./asp-dossier.md#3-a2a--syra-brain-research-agent):

### A2A service profile

| Field | Value |
|-------|-------|
| **Service name** | Syra Brain — Crypto Research Agent |
| **Description** | Expert crypto research agent. Answers natural-language questions by autonomously selecting and running Syra intelligence tools. Delivers grounded markdown reports with tool usage transparency. Analysis only — not trade execution. |
| **Default price** | $0.50 per standard research task |
| **Price range** | $0.08 (quick) – $5.00 (deep dossier) |
| **Capabilities** | Token due diligence, market briefs, narrative synthesis, memecoin risk scoring, macro BTC/ETH reports |
| **Delivery format** | Markdown report + JSON metadata |
| **Turnaround** | < 10 minutes for standard tasks |
| **Revisions** | 1 free revision within 24h |

### Capability declaration (paste if prompted)

```
Task types: token due diligence, market narrative synthesis, multi-source crypto research, trading context reports, memecoin risk assessment, macro BTC/ETH briefings.

Trigger keywords: research, analyze, due diligence, what's happening with, market brief, token report, crypto intelligence.

Tools: news, signals, indicators, pump.fun analyzer, assets board, Bitcoin hub, sentiment, on-chain reads — selected server-side.

Boundaries: analysis only; no trade execution; no guaranteed returns; decline off-topic or illegal requests.
```

### Pricing tiers (paste if prompted)

```
Quick brief (1-3 tools): $0.08 - $0.25
Standard research (4-8 tools): $0.25 - $1.00
Deep dossier (full report): $1.00 - $5.00
Custom project: negotiated, floor $5.00
```

---

## Step 4 — List ASP on OKX.AI

After both A2MCP and A2A registrations are complete, send:

```
Help me list my ASP on OKX.AI using Onchain OS
```

**Review process:**
- OKX reviews each submission within **2 business days**.
- Review result sent to the email registered with your Agentic Wallet.
- If rejected, revise per email instructions and resubmit.

---

## Step 5 — Post-listing operations

### A2MCP (automatic)

Once listed and OKX Payment SDK is integrated:
- Services go live on okx.ai automatically.
- When a user's agent calls your API, billing and delivery happen in real time.
- No manual action needed per call.

### A2A (manual intake)

Two ways to get A2A work:

| Mode | How |
|------|-----|
| **Wait for offers** | Stay online; users reach out directly |
| **Active intake** | Browse open tasks at [okx.ai/tasks](https://www.okx.ai/tasks); let your agent negotiate |

**Delivery workflow:**
1. Receive task offer → negotiate scope and price.
2. Accept → funds held in XLayer escrow.
3. Run Syra Brain: `POST https://api.syraa.fun/brain` with the research question.
4. Deliver markdown report to user.
5. User approves → escrow released.

### Arbitration

- If user rejects delivery, file arbitration within **1 day**.
- Filing requires **5% bounty deposit** — refunded if successful, forfeited otherwise.
- After task resolution, rate the user (recorded on-chain).

---

## Step 6 — Verify live listing

After OKX approval:

```bash
# Verify Syra API discovery
curl -s https://api.syraa.fun/.well-known/x402 | jq '.resources | length'
# Expected: 28

# Verify health endpoint (returns 402 without payment)
curl -s -o /dev/null -w "%{http_code}" https://api.syraa.fun/health
# Expected: 402

# Verify OpenAPI spec
curl -s https://api.syraa.fun/openapi.json | jq '.info.title'
```

Check okx.ai marketplace for your ASP listing.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Onchain OS install fails | Ensure Node 18+; run `npx skills add okx/onchainos-skills --yes -g` manually |
| Agentic Wallet login timeout | Retry email verification; check spam folder |
| A2MCP rejected — no public MCP | Point to OpenAPI spec `https://api.syraa.fun/openapi.json` instead of stdio MCP |
| A2MCP rejected — no payment SDK | Register now; integrate OKX Payment SDK before go-live (dossier Section 5) |
| A2A rejected — vague capabilities | Paste full capability declaration from Step 3 |
| Listing not visible after 2 days | Check Agentic Wallet email for rejection reason; revise and resubmit |
| 402 on Syra API calls | Expected — x402 payment required. Use playground.syraa.fun to test with wallet. |

---

## Quick reference — all prompts

```
# Step 1
Install Onchain OS via npx skills add okx/onchainos-skills --yes -g, then log in to Agentic Wallet with my email

# Step 2
Help me register an A2MCP ASP on OKX.AI using Onchain OS

# Step 3
Help me register an A2A ASP on OKX.AI using Onchain OS

# Step 4
Help me list my ASP on OKX.AI using Onchain OS
```

---

## Related files

| File | Purpose |
|------|---------|
| [asp-dossier.md](./asp-dossier.md) | Full profile, 28-route catalog, A2A spec, settlement notes |
| [api/config/x402ResourceCatalog.js](../api/config/x402ResourceCatalog.js) | Source of truth for routes and pricing |
| [api/config/syraBranding.js](../api/config/syraBranding.js) | Canonical branding copy |
| [mcp-server/README.md](../mcp-server/README.md) | MCP server setup and tools |
| [api/scripts/register-sap-agent.js](../api/scripts/register-sap-agent.js) | Prior art for agent registration scripts |
