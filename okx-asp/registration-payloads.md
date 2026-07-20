# OKX ASP Registration — Copy-Paste Payloads (Steps 2–4)

Use these in **Cursor** (or your Onchain OS agent) after `npx skills add okx/onchainos-skills --yes -g` and Agentic Wallet login.

**Avatar required:** Before Step 2, attach `web/public/images/logo.jpg` (or any square PNG/JPG ≤1 MB) when the agent asks for ASP avatar.

---

## Step 2 + 3 combined — Register ASP (A2MCP + A2A in one identity)

Send this single prompt to your agent:

```
Help me register an ASP on OKX.AI using Onchain OS. I want one ASP identity with two services: (1) A2MCP gateway for Syra x402 API, (2) A2A Syra Brain research agent. Use the field values below exactly.
```

When prompted, paste each block.

### ASP identity (Step 1 fields)

| Field | Paste this |
|-------|------------|
| **Name** | Syra |
| **Description** | Pay-per-call crypto intelligence for agents on Solana — x402 APIs, MCP tools, and typed SDK. |

**Avatar:** attach `d:\business\syra-monorepo\web\public\images\logo.jpg`

---

### Service 1 — A2MCP (primary gateway)

| Field | Paste this |
|-------|------------|
| **Service name** | Syra x402 Crypto API |
| **Description** | Pay-per-call crypto intelligence APIs for agents — news, signals, technical indicators, memecoin analysis, tokenized equity spreads, Bitcoin dashboard, Jupiter quotes, OpenRouter chat/image/video, and Solana 8004 agent registry.<br><br>1. HTTP method and path (e.g. GET /signal?token=bitcoin or POST /brain with JSON body)<br>2. x402 PAYMENT-SIGNATURE header after HTTP 402 challenge (OpenAPI: https://api.syraa.fun/openapi.json) |
| **Type** | A2MCP |
| **Fee** | 0.01 |
| **Endpoint** | https://api.syraa.fun |

When asked **Add another service / Done** → reply **1** (add another).

---

### Service 2 — A2A (Syra Brain)

| Field | Paste this |
|-------|------------|
| **Service name** | Syra Brain Research |
| **Description** | Expert crypto research agent — answers natural-language questions by autonomously selecting and running Syra intelligence tools, then delivers grounded markdown reports with tool usage transparency. Analysis only, not trade execution.<br><br>1. Research question or brief in natural language<br>2. Optional: tickers, Solana mints, time horizon, preferred output format |
| **Type** | A2A |
| **Fee** | 0.50 |
| **Endpoint** | *(leave empty — A2A has no endpoint)* |

When asked **Add another service / Done** → reply **2** (done).

---

### Optional — Service 3–8 (high-value A2MCP routes)

Only add these if OKX asks for per-endpoint services or you want richer marketplace coverage. After each, choose **1** to add another; after the last, choose **2**.

| Service name | Fee | Endpoint |
|--------------|-----|----------|
| Syra Brain API | 0.08 | https://api.syraa.fun/brain |
| Trading Signal API | 0.01 | https://api.syraa.fun/signal |
| Crypto News API | 0.01 | https://api.syraa.fun/news |
| Technical Indicators API | 0.01 | https://api.syraa.fun/indicator |
| pump.fun Memecoin Analyzer | 0.02 | https://api.syraa.fun/pumpfun/analyzer |
| Bitcoin Intelligence Hub | 0.01 | https://api.syraa.fun/bitcoin |

For each optional service, use this description template (fill the bracket):

```
[One-line capability]. For AI agents needing [use case].
1. Query parameters or JSON body per OpenAPI path
2. x402 PAYMENT-SIGNATURE after HTTP 402
```

---

### Confirmation

When the agent shows the confirmation card → reply **1** to confirm and run.

Expected success line:

> ASP identity #`<id>` registered — not yet visible to others. Say "activate #`<id>`" to publish now…

**Save your ASP agent ID** (e.g. `#42`) — you need it for Step 4.

---

## Step 4 — List ASP on OKX.AI

After registration succeeds, send:

```
Help me list my ASP on OKX.AI using Onchain OS. Activate my Syra ASP identity #<YOUR_ID> for marketplace listing.
```

Replace `<YOUR_ID>` with the number from Step 2 (e.g. `#42`).

**What happens:**
- OKX submits your ASP for marketplace review (`submitApproval`).
- Review within **2 business days** → email to your Agentic Wallet address.
- If rejected, revise per email and resubmit with `activate #<id>` again.

---

## Alternate: separate Step 2 and Step 3 prompts

If you prefer the official tutorial prompts one at a time:

### Step 2 only (A2MCP)

```
Help me register an A2MCP ASP on OKX.AI using Onchain OS
```

Paste **Service 1** fields above. Choose **2** (done) if registering gateway only.

### Step 3 only (A2A — add to existing ASP)

If you already have an ASP identity:

```
Add an A2A service to my ASP #<YOUR_ID>: Syra Brain Crypto Research Agent
```

Or register a second ASP (if your wallet allows multiple ASP identities):

```
Help me register an A2A ASP on OKX.AI using Onchain OS
```

Paste **Service 2** fields above.

### Step 4

```
Help me list my ASP on OKX.AI using Onchain OS
```

---

## QA / rejection fixes

| Rejection reason | Fix |
|------------------|-----|
| Endpoint not reachable | Syra API is live; `/health` returns 402 (payment required) — that is correct. Point reviewer to `https://api.syraa.fun/openapi.json` |
| No avatar | Attach `web/public/images/logo.jpg` |
| Service name too short | Use full names from tables above (≥5 chars) |
| Fee format wrong | Digits only: `0.01` not `0.01 USDT` |
| Description format | Must have 2 parts: capability summary + numbered "what user provides" |
| A2MCP needs Payment SDK | Registration can proceed; go-live waits on OKX Payment SDK integration |

---

## After approval

- **A2MCP:** calls route through OKX marketplace; integrate OKX Payment SDK for instant XLayer settlement (see [asp-dossier.md](./asp-dossier.md) Section 5).
- **A2A:** browse tasks at https://www.okx.ai/tasks; deliver via `POST https://api.syraa.fun/brain`.
