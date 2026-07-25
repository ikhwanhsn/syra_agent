# OKX ASP Registration — Copy-Paste Payloads (Steps 2–4)

Use these in **Cursor** (or your Onchain OS agent) after `npx skills add okx/onchainos-skills --yes -g` and Agentic Wallet login.

**Hackathon:** OKX.AI Genesis — position as **Finance Copilot**. See [GENESIS-HACKATHON.md](./GENESIS-HACKATHON.md).

**Avatar required:** Before Step 2, attach `web/public/images/logo.jpg` (or any square PNG/JPG ≤1 MB) when the agent asks for ASP avatar.

---

## Step 2 + 3 combined — Register ASP (A2MCP + A2A in one identity)

Send this single prompt to your agent:

```
Help me register an ASP on OKX.AI using Onchain OS. I want one ASP identity with two services: (1) A2MCP Syra Finance Copilot API, (2) A2A Syra Brain Finance Copilot. Category Finance. Use the field values below exactly.
```

When prompted, paste each block.

### ASP identity (Step 1 fields)

| Field | Paste this |
|-------|------------|
| **Name** | Syra |
| **Description** | Finance Copilot for agents — pay-per-call crypto intelligence that turns market data into decisions. Signals, indicators, sentiment, arbitrage, Bitcoin hub, tokenized equity, Jupiter quotes, plus Syra Brain for natural-language token due diligence and market briefs. |
| **Category** | Finance |

**Avatar:** attach `d:\business\syra-monorepo\web\public\images\logo.jpg`

---

### Service 1 — A2MCP (Finance Copilot API)

| Field | Paste this |
|-------|------------|
| **Service name** | Syra Finance Copilot API |
| **Description** | Finance Copilot for agents: pay-per-call crypto intelligence that turns market data into decisions. Signals, indicators, sentiment, arbitrage, Bitcoin hub, tokenized equity spreads, Jupiter quotes, and RISE scout. Discovery: https://api.syraa.fun/.well-known/x402 OpenAPI: https://api.syraa.fun/openapi.json<br><br>1. HTTP method and path for the finance route (e.g. GET /signal?token=bitcoin)<br>2. x402 PAYMENT-SIGNATURE header after HTTP 402 challenge |
| **Type** | A2MCP |
| **Fee** | 0.01 |
| **Endpoint** | https://api.syraa.fun |

When asked **Add another service / Done** → reply **1** (add another).

---

### Service 2 — A2A (Syra Brain Finance Copilot)

| Field | Paste this |
|-------|------------|
| **Service name** | Syra Brain Finance Copilot |
| **Description** | A2A Finance Copilot: expert crypto research agent that answers natural-language finance questions by running Syra tools and returns grounded markdown reports with tool-usage transparency. Token due diligence, market briefs, memecoin risk scoring, macro BTC/ETH. Analysis only, not trade execution.<br><br>1. Research question in natural language<br>2. Optional tickers, mints, or time horizon |
| **Type** | A2A |
| **Fee** | 0.50 |

When asked **Add another service / Done** → reply **2** (done).

---

## Step 4 — List ASP on OKX.AI

```
Help me list my ASP on OKX.AI using Onchain OS. Activate my Syra ASP identity #<YOUR_ID> for marketplace listing.
```

Or:

```powershell
node okx-asp/register-syra-asp.mjs --activate-only <YOUR_ID>
```

- OKX submits your ASP for marketplace review (`submitApproval`).
- Review can take up to **2 business days**.
- For Genesis, escalate if review is slow — deadline Jul 27 23:59 UTC.

---

## One-shot CLI (preferred)

```powershell
$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"
onchainos wallet login ikhwanulhusna111@gmail.com
node okx-asp/register-syra-asp.mjs
```

Services JSON source of truth: [services.json](./services.json)

---

## Alternate prompts

### Step 2 only (A2MCP)

```
Help me register an A2MCP ASP on OKX.AI using Onchain OS
```

### Step 3 only (A2A — add to existing ASP)

If you already have an ASP identity:

```
Add an A2A service to my ASP #<YOUR_ID>: Syra Brain Finance Copilot
```

Or register a second ASP (if your wallet allows multiple ASP identities):

```
Help me register an A2A ASP on OKX.AI using Onchain OS
```

### Step 4 only

```
Help me list my ASP on OKX.AI using Onchain OS
```

---

## After listing

- Integrate / verify OKX Payment SDK path if required for A2MCP go-live (see asp-dossier Section 5). X Layer accepts already appear on production `/health` 402s.
- A2A intake: https://www.okx.ai/tasks
- Genesis form + #OKXAI post: [GENESIS-HACKATHON.md](./GENESIS-HACKATHON.md)
