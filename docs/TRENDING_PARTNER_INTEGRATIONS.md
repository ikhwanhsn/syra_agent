# Trending partner integrations (Aug 2026)

**Owner:** Helix → Compass  
**Decision date:** 2026-08-20  
**Chase order (confirmed):** 1 Cloudflare Agents / Monetization Gateway → **2 OpenClaw (active)** → 3 Nevermined

Skip as net-new: Bankr, Virtuals, Ampersend, PayAI/Dexter, Crossmint (already integrated or in outreach).

**Proof line (settled only, `GET https://api.syraa.fun/api/metrics` as of 2026-08-20):**  
7d: **47,127** paid calls · **$6,645.65** settled · **111** unique paying wallets. Lifetime: **$15,776.12** settled · **129** wallets. Settlement 24h fail rate **1.29%** (launch guardrail &lt;5%). Live metrics: https://syraa.fun

---

## 1. Cloudflare (chase first)

### Fit
Syra is already an x402 merchant + MCP server. Cloudflare is the institutional **agent payer + edge monetization** surface (Agents SDK `withX402Client` / Monetization Gateway waitlist since 2026-07-01). ICP = agent builders in [AGENT_BUILDER_GTM.md](./AGENT_BUILDER_GTM.md).

### Outreach (paste-ready)

**Subject / opener:** Cloudflare Agent → first paid Syra crypto intel call

```
Hey — Syra is live pay-per-call crypto intel for agents (x402 + MCP).

Ask: early access to Monetization Gateway and/or a co-shipped Agents SDK recipe where a Cloudflare Agent uses withX402Client against @syra-ai/mcp-server, funds USDC, and settles one syra_spend_news call from a non-founder wallet (~5 min). Docs: https://docs.syraa.fun · skill: set up https://api.syraa.fun/skill.md

Proof (settled only): last 7d 47,127 paid calls, $6,645.65 settled, 111 unique wallets; 24h settle fail 1.29%. https://syraa.fun

Happy to pair on the first receipt. No token pitch.
```

**Contact path:** Monetization Gateway waitlist (Cloudflare blog) + Agents / Agent Payments PM outreach (Will Papper / Cloudflare Agents Discord-docs channel). Flip `replyStatus` in GTM table when sent.

### Smallest tech spike (1–2 days)

**Goal:** One Cloudflare Agent pays Syra once on Base USDC.

| Step | Work | Status |
|------|------|--------|
| A | Monetization Gateway waitlist / edge merchant | Deferred (not required for payer path) |
| B–D | Agent `@x402/fetch` + Exact EVM → `GET /news` | **Shipped as docs recipe** |
| E | `docs/CLOUDFLARE_AGENTS_X402_QUICKSTART.md` + docs site | **Done** — [CLOUDFLARE_AGENTS_X402_QUICKSTART.md](./CLOUDFLARE_AGENTS_X402_QUICKSTART.md) · https://docs.syraa.fun/docs/build/cloudflare-agents-x402 |

**Do not:** re-implement Syra settle behind Cloudflare `paidTool` (that would double-charge). Prefer Syra as the existing x402 merchant; Cloudflare Agent as the **payer**. Monetization Gateway is deferred.

**Next:** Founder sends outreach (above); flip GTM row #4 `replyStatus` to `sent`.

---

## 2. OpenClaw (active)

### Fit
Viral self-hosted agent runtime; MCP via `openclaw mcp set` / Control UI. **Install path shipped:** [OPENCLAW_MCP_QUICKSTART.md](./OPENCLAW_MCP_QUICKSTART.md) · https://docs.syraa.fun/docs/build/openclaw

### Outreach (paste-ready)

```
Hey — building on OpenClaw? Syra is machine money for agents: pay-per-call crypto news/sentiment over x402 + MCP.

Ask: install @syra-ai/mcp-server into OpenClaw (openclaw mcp set), fund Solana USDC, run one syra_spend_news from your agent wallet. Path: set up https://api.syraa.fun/skill.md · https://docs.syraa.fun/docs/build/openclaw

Proof (settled only): 7d 47,127 paid calls, $6,645.65, 111 wallets. https://syraa.fun

Want 3–5 design partners with real settle receipts — happy to unblock config. No token pitch.
```

**Contact path:** OpenClaw Discord / X / ClawHub maintainers.

### Smallest tech spike (0.5–1 day) — shipped

| Step | Work | Done when |
|------|------|-----------|
| A | Document `openclaw mcp set syra '{...}'` with `npx -y @syra-ai/mcp-server@latest` + `SYRA_API_BASE_URL` + `SYRA_PAYER_KEYPAIR` | Snippet in docs + skill.md |
| B | `openclaw skills install ./.agents/skills/syra --as syra` | Documented |
| C | Founder: `openclaw mcp doctor syra --probe` → one paid news call from non-treasury wallet | Settled receipt |
| D | Publish `docs/OPENCLAW_MCP_QUICKSTART.md` + `/docs/build/openclaw` | Shipped 2026-08-20 |

---

## 3. Nevermined (**piloting**)

### Fit
x402 facilitator + Visa Intelligent Commerce (card mandates → agent spend). Complements Dexter → GoPlausible → PayAI; softens USDC funding gate without replacing Crossmint product path.

**Decision (2026-08-20):** Nevermined is **not** Exact-compatible like PayAI. Ship a parallel SDK pilot — not Exact failover.

### Shipped

- Route: `GET /partners/nevermined/news` via `@nevermined-io/payments` Express middleware
- Flag: `NEVERMINED_X402_ENABLED` + `NVM_API_KEY` + `NVM_PLAN_ID`
- Quickstart: [NEVERMINED_X402_QUICKSTART.md](./NEVERMINED_X402_QUICKSTART.md)
- Exact `/news` unchanged

### Outreach (paste-ready)

```
Hey — Syra settles USDC on HTTP 402 for crypto intel (MCP + SDK). Facilitator stack today: Dexter → GoPlausible → PayAI.

We also shipped a Nevermined pilot: GET /partners/nevermined/news (credits / card via your facilitator). Docs: docs/NEVERMINED_X402_QUICKSTART.md

Ask: one paid call on the pilot path from a non-founder plan so we can log a settle receipt. Happy to pair on sandbox keys.

Proof (settled only, Exact rails): 7d $6,645.65 · 47,127 paid calls · 111 wallets. https://api.syraa.fun/api/metrics

No token pitch.
```

**Contact path:** nevermined.ai / facilitator docs + partnerships.

### Spike status

| Step | Work | Status |
|------|------|--------|
| A–B | Exact verify/settle compatibility | Skipped — SDK/credits path chosen instead |
| C | Feature-flagged Nevermined merchant path | **Shipped** (sandbox env required for live traffic) |
| D | Founder sandbox paid call | Pending ops |

**Do not:** replace Solana primary rail or Crossmint onramp in v1; do not insert Nevermined into Exact failover.

---

## Tracking

| Rank | Partner | Status | Next action |
|------|---------|--------|-------------|
| 1 | Cloudflare Agents / Monetization Gateway | docs shipped | Founder sends outreach |
| 2 | OpenClaw | **active** | Send outreach; founder non-treasury probe |
| 3 | Nevermined | **piloting** | Set sandbox env; one paid `/partners/nevermined/news` call |

GTM design-partner rows: [AGENT_BUILDER_GTM.md](./AGENT_BUILDER_GTM.md).
