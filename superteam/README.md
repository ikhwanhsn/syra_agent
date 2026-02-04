# Superteam Grant — Milestones & Completion Guide

This folder contains everything you need to finish your **$7,500 grant** milestones. Use it as a single source of truth and checklist.

---

## Grant overview

| Item | Value |
|------|--------|
| **Grant amount** | $7,500 |
| **Duration** | 6 weeks |
| **Primary KPI** | Paid API calls (target: **500** by end of grant) |
| **Secondary KPI** | Agent chat sessions with paid tool use (target: **200**) |
| **KPI dashboard** | [Landing /analytics](https://syraa.fun/analytics) or `GET https://api.syraa.fun/analytics/kpi` |

---

## Repository structure (relevant to grant)

| Path | Purpose |
|------|---------|
| `api/` | Backend (Express). All paid routes, analytics, agent tools. |
| `api/models/PaidApiCall.js` | Stores each paid API call for KPI. |
| `api/routes/analytics.js` | `GET /analytics/kpi` — dashboard data. |
| `api/config/agentTools.js` | List of agent tools (v2 paths, prices). |
| `ai-agent/` | AI research agent UI (chat, prompts, tools). |
| `api-playground/` | Live API demo (request builder, payment, history). |
| `landing/` | Marketing site + **Analytics** page + Leaderboard. |
| `docs/` | Docusaurus — API docs, getting started, x402 agent. |

**Live URLs (production)**

- API: `https://api.syraa.fun`
- Landing: `https://syraa.fun` (Analytics: `https://syraa.fun/analytics`)
- Agent: `https://agent.syraa.fun`
- API Playground: `https://playground.syraa.fun`
- Docs: `https://docs.syraa.fun`

---

## Milestone 1 — Core Analytics API & Agent (Weeks 1–2)

**Goal:** Formalize and document the public Solana analytics API and AI research agent as the main grant deliverables.

### 1.1 Public Solana analytics API

**What it means:** One clear “analytics” surface: price/volume, liquidity, correlation.

**What already exists (API):**

- **Price/volume:** DexScreener (`/v2/dexscreener`), Binance OHLC (if mounted).
- **Correlation:** `api/routes/partner/binance/correlation.js` → `/v2/binance/correlation`.
- **Liquidity / DEX data:** DexScreener, Jupiter trending, RugCheck token stats.

**What you need to do:**

- [ ] **Document** all analytics-related endpoints in one place.
  - Suggested file: `docs/docs/api documentation/analytics.md` (or new “Analytics API” section).
  - List: `/v2/dexscreener`, `/v2/binance/correlation`, `/v2/token-report`, `/v2/token-statistic`, `/v2/trending-jupiter`, etc., with short description and example.
- [ ] **(Optional)** Add one **summary endpoint** e.g. `GET /v2/analytics/summary` that returns a single JSON with links or counts to price, volume, correlation, token risk — so reviewers see “one analytics API” in one call. If you skip this, the doc alone is enough.

**Deliverable:** One consolidated **Analytics API** doc (and optionally one summary endpoint).

---

### 1.2 AI research agent MVP with prompt interface

**What already exists:**

- **Agent app:** `ai-agent/` — chat UI, agent selector, system prompts, wallet, shareable chats.
- **Backend:** `api/routes/agent/chat.js`, `api/routes/agent/tools.js`, `api/config/agentTools.js` — tools call v2 paid APIs (news, signal, research, sentiment, DexScreener, RugCheck, correlation, etc.).

**What you need to do:**

- [ ] **Agent catalog doc:** Document which tools exist and how to use them.
  - Use or extend: `docs/docs/x402 agent/agent-catalog.md` (or equivalent).
  - List each tool (id, name, description, price, example prompt).
- [ ] **2–3 default system prompts:** e.g. “Market overview”, “Token risk check”.
  - Either document them in the agent catalog or add them as presets in `ai-agent/` (e.g. in `ai-agent/src/lib/systemPrompt.ts` or a config file).
- [ ] Ensure the **prompt interface** is obvious in the UI (e.g. system prompt selector or preset buttons).

**Deliverable:** Agent catalog doc + 2–3 default prompts documented or shipped in the app.

---

### 1.3 Open-source repository with documentation

**What already exists:**

- Repo is open source.
- Docs in `docs/` (Docusaurus): API docs, general docs, x402 agent getting started.

**What you need to do:**

- [ ] Add a **“Grant deliverables”** section to the **root README** (`README.md` at repo root).
  - Short list: Public Solana analytics API (link to analytics doc), AI research agent (link to agent docs), Live demo (link to api-playground), Analytics dashboard (link to landing /analytics).
- [ ] Ensure **API docs** list all analytics endpoints (either in one analytics page or in existing browse/signal/research/etc. pages with an “Analytics” category or sidebar entry).

**Deliverable:** README grant section + docs covering analytics and agent.

---

### 1.4 Live demo dashboard

**What already exists:**

- **api-playground** is the live demo: request builder, payment flow, history.

**What you need to do:**

- [ ] Add **2–3 example flows** so reviewers can try the system quickly.
  - Option A: Short “Example flows” section in api-playground UI (e.g. buttons: “Get correlation matrix”, “Get token risk (RugCheck)”, “Get news”).
  - Option B: Doc page in `docs/` with copy-paste curl or step-by-step for: (1) Get correlation, (2) Get token report, (3) Call one agent tool or chat.
- [ ] Ensure the **playground URL** is clearly linked from README and grant docs.

**Deliverable:** api-playground + 2–3 documented/clickable example flows.

---

## Milestone 2 — Developer & Token Risk Tooling (Weeks 3–4)

**Goal:** One clear integration win (MCP or SDK) and token risk tooling; keep scope achievable.

### 2.1 Syra MCP server for AI agents

**What it means:** Other AI agents (e.g. Claude, Cursor) can call Syra via the MCP protocol.

**What already exists:**

- You *consume* ATXP MCP (browse, x-live-search, research). You do **not** yet *expose* Syra as an MCP server.

**What you need to do (choose one):**

**Option A — Syra as MCP server (recommended):**

- [ ] Implement a small **MCP server** that exposes 3–5 key tools (e.g. news, signal, token report, correlation).
  - Each tool = one MCP tool that calls your existing API (with payment handled by the server or by the client’s payment header).
  - Can live in a new package under repo root, e.g. `mcp-server/` or inside `api/` as a separate process.
- [ ] Document how to add this MCP server in Claude Desktop / Cursor / other MCP clients (one page in `docs/` or README in the MCP package).

**Option B — Lighter:**

- [ ] Document **“How to use Syra API from an MCP client”** (e.g. how to call your API from a custom MCP tool).
- [ ] Provide **one example** (e.g. a minimal MCP tool that calls `GET /v2/news` or `/v2/binance/correlation`).

**Deliverable:** Either Syra MCP server + doc, or doc + one MCP usage example.

---

### 2.2 Token risk & anomaly detection

**What already exists:**

- RugCheck: `api/routes/partner/rugcheck/token-report.js`, `token-statistic.js` → `/v2/token-report`, `/v2/token-statistic`.

**What you need to do:**

- [ ] **Document** these as the **“Token risk API”** in API docs (e.g. new page or section `token-risk.md` describing `/v2/token-report`, `/v2/token-statistic`, query params, response shape).
- [ ] **One anomaly/alert endpoint** (optional but valuable): e.g. `GET /v2/token-risk/alerts?rugScoreMin=80` or “tokens with unusual volume” using existing data. Implement one such endpoint and document it.

**Deliverable:** Token risk API doc + (optional) one anomaly/alert endpoint.

---

### 2.3 API documentation & SDK examples

**What already exists:**

- Docusaurus API docs in `docs/docs/api documentation/`.
- Some endpoints already documented (browse, news, research, etc.).

**What you need to do:**

- [ ] **Expand API docs** with: analytics endpoints (see 1.1), token risk (see 2.2), and any new MCP or anomaly endpoint.
- [ ] Add **3–5 runnable examples**: curl + one of (Node/JS or TS).
  - Suggested: `docs/examples/` or repo root `examples/` with:
    - `get-correlation.sh` (curl),
    - `get-token-report.sh`,
    - `get-news.js` (Node fetch with payment or api-key if applicable),
    - optional: agent tool call example.
  - Link these from the API docs and README.

**Deliverable:** Updated API docs + 3–5 runnable examples (curl + JS/TS).

---

## Milestone 3 — Community & Education (Weeks 5–6)

**Goal:** Show impact through research, prompts, one workshop, and transparent updates.

### 3.1 Public research reports

- [ ] Publish **3 public research reports** on Solana markets (use your research API and agent to generate content).
- [ ] Publish as PDF and/or blog posts (e.g. on Medium, or a `/blog` section in docs, or GitHub Discussions).
- [ ] Link from README or landing “Research” section.

**Deliverable:** 3 research reports, publicly linked.

---

### 3.2 Reusable AI prompts

- [ ] Document **5 reusable AI trading/research prompts** (e.g. “Correlation check”, “Token risk summary”, “Smart money flow”, “Memecoin screen”, “News + sentiment”).
- [ ] Put them in repo (e.g. `docs/prompts.md` or `prompts/` folder) or in agent catalog; include example inputs and expected use.

**Deliverable:** 5 prompts documented and linked.

---

### 3.3 Indonesian community workshop

- [ ] Run **1 Indonesian community workshop or online session** (e.g. Zoom/Google Meet, or in-person if applicable).
- [ ] Topics: Syra API, agent usage, Solana analytics, or grant outcomes.
- [ ] Announce and recap (e.g. Twitter/X, Telegram, or a short post in docs).

**Deliverable:** One workshop/session + announcement or recap.

---

### 3.4 Public roadmap and weekly updates

- [ ] **Public roadmap:** Keep or add a roadmap page (e.g. `docs/docs/token/roadmap.md` or landing Roadmap section) with high-level milestones and dates.
- [ ] **Weekly progress updates:** Post once per week (e.g. GitHub Discussions, Twitter/X, or blog) with: what was done, what’s next, and KPI numbers (e.g. paid API calls, agent sessions from `/analytics/kpi`).

**Deliverable:** Public roadmap + at least 4–6 weekly updates during the grant.

---

## KPI tracking (already implemented)

You can track success using the following.

### Dashboard

- **Landing:** [https://syraa.fun/analytics](https://syraa.fun/analytics) (or run landing locally and open `/analytics`).
- **API:** `GET https://api.syraa.fun/analytics/kpi` (no auth).

### Response shape (relevant fields)

```json
{
  "totalPaidApiCalls": 0,
  "paidApiCallsLast7Days": 0,
  "paidApiCallsLast30Days": 0,
  "completedPaidToolCalls": 0,
  "chatsWithPaidToolUse": 0,
  "byPath": [],
  "dailyPaidCalls": [],
  "kpiTargets": {
    "paidApiCalls": 500,
    "agentSessions": 200
  },
  "updatedAt": "2025-02-03T..."
}
```

### Success criteria

- **Primary:** `totalPaidApiCalls` ≥ **500** by end of 6 weeks.
- **Secondary:** `chatsWithPaidToolUse` ≥ **200** (chats that used at least one paid tool).

### Where tracking is implemented

- **Paid calls:** Every successful x402 settlement (v1 and v2) is recorded in `api/models/PaidApiCall.js` (see `api/utils/recordPaidApiCall.js` and usage in `api/v2/utils/x402Payment.js` and v1 routes).
- **Agent usage:** Derived from `api/models/agent/Chat.js` (messages with `toolUsage.status === 'complete'`).

---

## Quick checklist (all milestones)

Copy this into your task tracker or keep it here and tick as you go.

**Milestone 1 (Weeks 1–2)**  
- [ ] Analytics API doc (and optional summary endpoint)  
- [ ] Agent catalog doc + 2–3 default prompts  
- [ ] README “Grant deliverables” section + docs updated  
- [ ] api-playground + 2–3 example flows  

**Milestone 2 (Weeks 3–4)**  
- [ ] Syra MCP server (or MCP usage doc + one example)  
- [ ] Token risk API doc + (optional) one anomaly endpoint  
- [ ] Expanded API docs + 3–5 runnable examples  

**Milestone 3 (Weeks 5–6)**  
- [ ] 3 public research reports  
- [ ] 5 reusable AI prompts documented  
- [ ] 1 Indonesian community workshop/session  
- [ ] Public roadmap + weekly progress updates  

**KPI**  
- [ ] Reach 500 paid API calls  
- [ ] (Optional) Reach 200 chats with paid tool use  

---

## Links to key files (for implementation)

| Task | File or path |
|------|-------------------------------|
| Analytics API doc | `docs/docs/api documentation/` (add or edit) |
| Agent tools list | `api/config/agentTools.js` |
| Agent catalog doc | `docs/docs/x402 agent/agent-catalog.md` or similar |
| System prompts | `ai-agent/src/lib/systemPrompt.ts` or agent config |
| Root README | `README.md` (repo root) |
| Playground | `api-playground/` |
| Token risk routes | `api/routes/partner/rugcheck/token-report.js`, `token-statistic.js` |
| KPI constants | `api/routes/analytics.js` (`KPI_TARGET_*`) |
| Landing Analytics page | `landing/src/pages/Analytics.tsx` |

---

## Notes

- Keep scope realistic: prefer “document + one small endpoint” over large new systems.
- If you need to drop something, prefer dropping “full DAO module” and keeping MCP or token risk + docs.
- All deliverables should be **publicly accessible** (docs, repo, or linked URLs) so the grant reviewer can verify them.

Good luck with the grant.
