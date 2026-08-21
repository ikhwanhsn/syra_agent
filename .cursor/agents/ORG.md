# Syra Growth Agent Org

Three-tier Cursor-native org. **Goal:** move a north-star metric every day, even a little.

```
Helix — Orchestrator (always on: every Cursor prompt)
  ├── Spark      Activation          time-to-first-paid-call
  ├── Beacon     Distribution        new unique payers / reach
  ├── Chronicle  Content & Proof     proof posts / articles / video / `/ideas` / `/hype` / `/incumbent`
  ├── Mint       Token & Marketcap   buyback / holders / treasury SYRA
  ├── Ledger     Revenue & Pricing   USDC settled / ARPU
  ├── Compass    Product             ship items that move north star
  ├── Wager      Profit Experiments  experiment ROI / learnings
  ├── Sentinel   Payments & Security settle fail rate / incidents
  ├── Keel       Platform Health     reliability / tech debt
  ├── Bench      Hire                no-fit → add a new named agent
  └── Hone       Prompt improve      /improve → ask, then rewrite + run
        └── each division spawns a 3–4 named specialist micro-team
```

Always-on rule: `.cursor/rules/helix.mdc` (`alwaysApply: true`). If no lead owns the ask, Helix routes to **Bench**. `/improve` routes to **Hone** (ask if ambiguous; rewrite + Helix executes when the brief is complete). `/ideas` routes to **Chronicle** Ideas mode. `/hype` routes to **Chronicle** Hype mode (image + short text hype). `/incumbent` routes to **Chronicle** Incumbent mode (incumbent hype text).

## Named roster

### Tier 1 — Orchestrator

| Name | Role | File | Invoke |
| --- | --- | --- | --- |
| **Helix** | Orchestrator | [orchestrator.md](orchestrator.md) | every prompt + `/growth` |

### Tier 2 — Division leads (10)

| Name | Role | File |
| --- | --- | --- |
| **Spark** | Activation | [activation.md](activation.md) |
| **Beacon** | Distribution | [distribution.md](distribution.md) |
| **Chronicle** | Content & Proof | [content-proof.md](content-proof.md) |
| **Mint** | Token & Marketcap | [token-marketcap.md](token-marketcap.md) |
| **Ledger** | Revenue & Pricing | [revenue-pricing.md](revenue-pricing.md) |
| **Compass** | Product | [product.md](product.md) |
| **Wager** | Profit Experiments | [profit-experiments.md](profit-experiments.md) |
| **Sentinel** | Payments & Security | [payments-security.md](payments-security.md) |
| **Keel** | Platform Health | [platform-health.md](platform-health.md) |
| **Bench** | Hire | [hire.md](hire.md) |

### Workflow leads (not weekday `/growth`)

| Name | Role | File | Invoke |
| --- | --- | --- | --- |
| **Hone** | Prompt improve | [prompt-improve.md](prompt-improve.md) | `/improve` |

### Tier 3 — Micro-teams (41)

**Spark (Activation):** Stride (quickstart) · Plug (MCP+SDK) · Echo (error-DX) · Bridge (free→paid)

**Beacon (Distribution):** Atlas (registry/listing) · Scout (hackathon/partnership) · Catalog (npm) · Agora (social/community)

**Chronicle (Content & Proof):** Log (ship-log) · Quill (X/article copy) · Frame (video/asset) · Swipe (style-swipe)

**Mint (Token & Marketcap):** Receipt (buyback-proof) · Claim (rewards-loop) · Lock (staking) · Desk (listing/KOL)

**Ledger (Revenue & Pricing):** Tier (pricing ladder) · Cost (margin) · Bundle (endpoint packaging)

**Compass (Product):** Rice (RICE scoring) · Lens (UX critique) · Map (roadmap)

**Wager (Profit Experiments):** Hypothesis (experiment design) · Pool (LP/treasury) · Score (results analysis)

**Sentinel (Payments & Security):** Pulse (settlement-health) · Rail (x402/facilitator) · Cipher (secrets) · Custody (wallet/treasury)

**Keel (Platform Health):** Prune (dead-code) · Spec (tests) · Speed (perf) · Ops (devops)

**Bench (Hire):** Gap (gap-finder) · Draft (role-writer) · Crew (micro-team designer) · Patch (org-patcher)

**Hone (Prompt improve):** Probe (ambiguity) · Query (questions) · Craft (rewrite) · Fit (Helix route)

These prompts compound what already ships: public buyback proof (`/token`, `GET /api/metrics`), usage rewards (`/rewards`), holder/staker x402 discounts, MCP/SDK activation. They do **not** restart the product from zero.

## North star (live)

Fetch: `GET https://api.syraa.fun/api/metrics`

| Metric | Field | Owner |
| --- | --- | --- |
| Paid calls (7d) | `northStar.paidCallsLast7d` | Spark, Compass |
| Unique paying wallets (7d) | `northStar.uniquePayingWalletsLast7d` | Beacon, Spark |
| USDC settled (7d / lifetime) | `last7d.usdSettled` / `lifetime.totalUsdSettled` | Ledger |
| Buyback USD / SYRA acquired | `buyback.totalBuybackUsdSpent` / `buyback.totalSyraAcquired` | Mint |
| Treasury SYRA | `buyback.treasurySyraBalance` | Mint, Wager |
| Reward earners | `rewards.uniqueEarners` | Mint |
| Settlement fail rate | `settlement.last24h.settleFailRate` | Sentinel |
| Holders / mcap | `holders.current` | Mint |

If unique paying wallets are flat for 2 weeks: fix activation before more token posts.

## How to invoke

**Default:** every Cursor prompt in this repo is Helix (`.cursor/rules/helix.mdc`). You do not need `/growth` for ordinary work.

**Daily growth standup (metrics + one action):**

```
/growth
```

or `@.cursor/agents/orchestrator.md run this` (Helix)

**Weekly board review:**

```
/growth week
```

**Sharpen a prompt (ask if ambiguous; rewrite + run when complete):**

```
/improve <raw prompt>
```

or `@.cursor/agents/prompt-improve.md`

**Daily X-informed content idea board:**

```
/ideas
```

or `@.cursor/agents/content-proof.md` Ideas mode

**Image + short text hype (mood still + short caption, new photograph every run):**

```
/hype
```

or “image + short text hype.” Spec: `.cursor/agents/content-swipe/IMAGE_SHORT_TEXT_HYPE.md`

**Incumbent hype text (four-beat replaceable spine):**

```
/incumbent
```

or “incumbent hype” / “text like the replaceable post.” Spec: `.cursor/agents/content-swipe/INCUMBENT_HYPE_TEXT.md`

**Direct a division (skip routing):**

```
@.cursor/agents/activation.md run this
```

Say the callsign if you want (Spark, Beacon, Chronicle, Mint, Ledger, Compass, Wager, Sentinel, Keel, Bench, Hone). Slug still wins.

Optional: add one sentence of human context after the @ mention (e.g. "blocked on wallet funding"). Never required. Add `IMPLEMENT` to apply patches; default is propose-only.

The Agent must:

1. Set **today’s date** from the system clock (or user_info).
2. **Fetch** `GET https://api.syraa.fun/api/metrics` with tools.
3. **Read/write** `.cursor/agents/state/` for baselines.
4. **Discover** context from the repo — never ask you to paste numbers first.
5. End with **one** highest-leverage action.

## Weekday cadence (orchestrator default)

| Day | Primary | Time box |
| --- | --- | --- |
| **Mon** | Spark (Activation) | ~45–60m |
| **Tue** | Mint (Token & Marketcap) | ~45–60m |
| **Wed** | Compass (Product) | ~45–60m |
| **Thu** | Sentinel even ISO week; Keel odd | ~45–90m |
| **Fri** | Helix board review (`/growth week`) | ~60–90m |
| **Sat/Sun** | Chronicle if git shows a ship; else Helix-only | ~20–40m |

**Overrides (always win over weekday):**

- `settleFailRate24h > 0.05` → co-route **Sentinel** (P0).
- Rewards unfunded while treasury SYRA > 0 → co-route **Mint**.
- Unique paying wallets 7d flat ≥14 days → co-route **Spark**, not token posts.
- User message names a division or callsign → that division only.
- `/improve` → **Hone** first (no metrics during sharpen). Ask if ambiguous. When the brief is complete, Helix executes the rewritten prompt in the same turn. Do not wait for “run it.”
- `/ideas` → **Chronicle** Ideas mode (run `contentSwipeFetch.mjs`; do not run the ship-log prompt).
- `/hype` or **image + short text hype** → **Chronicle** Hype mode (`.cursor/agents/content-swipe/IMAGE_SHORT_TEXT_HYPE.md`). Swipe 15 accounts, create caption + new still. Do not run the idea board.
- `/incumbent` or **incumbent hype** → **Chronicle** Incumbent mode (`.cursor/agents/content-swipe/INCUMBENT_HYPE_TEXT.md`). Four-beat industry → contrast → `syra is` → replaceable → URL. Do not force launch spine.
- No existing lead owns the problem → **Bench** (hire). Do not silently invent a permanent new role.

Route at most **two** divisions per turn. Synthesize one action (except Bench, whose action is the hire spec, and Hone, whose action is ask-or-run).

## Shared guardrails (every agent)

- **Repo truth only.** Cite files, routes, or live metrics. No invented traction.
- **No fake utility.** Governance voting, “10% revenue share,” guaranteed APY = roadmap or forbidden (see `.cursor/rules/legal-compliance.mdc`).
- **Product GTM stays paid-calls-first.** Token narrative rides verifiable buybacks/rewards — do not lead homepage GTM with “buy $SYRA.”
- **One action.** Every run ends with a single next move finishable today.
- **Self-contained + auto-context.** Prompts work in a fresh chat and in a Cursor Automation cron.
- **Propose before destructive edits** unless the user message already says `IMPLEMENT`.
- **Telegram is secondary** (`docs/TELEGRAM_MAINTENANCE_POLICY.md`). Do not make it the hero CTA.
- **Never write exploit PoCs** or attack live systems. Never print contents of `api/.env`.

## Micro-teams (Tier 3)

Each division Prompt names 3–4 specialists. The division agent **must spawn them in parallel** as `Task` subagents (`explore` for repo/file hunts, `generalPurpose` for synthesis/copy/ops plans) with the exact specialist brief in the Prompt. Then merge findings into **one** action. Do not skip the micro-team on a full run.

## State

See [state/README.md](state/README.md). Orchestrator writes `last-run.json`. Friday writes `last-ceo-week.json`. Divisions write `last-<slug>.json` when run.

## Automation (later)

`orchestrator.md` is fully self-contained. A Cursor Automation with a daily cron can invoke it headless. Do not add backend infra here.

## File index

| Name | File | Role |
| --- | --- | --- |
| Helix | [orchestrator.md](orchestrator.md) | Always-on routing + `/growth` + Friday board |
| Spark | [activation.md](activation.md) | Time-to-first-paid-call |
| Beacon | [distribution.md](distribution.md) | New payers / reach |
| Chronicle | [content-proof.md](content-proof.md) | Proof posts / articles / video / `/ideas` / `/hype` / `/incumbent` |
| Mint | [token-marketcap.md](token-marketcap.md) | Buyback / rewards / holders |
| Ledger | [revenue-pricing.md](revenue-pricing.md) | Unit economics / price ladder |
| Compass | [product.md](product.md) | RICE / kill / ship |
| Wager | [profit-experiments.md](profit-experiments.md) | Small bets / LP / ROI |
| Sentinel | [payments-security.md](payments-security.md) | x402 / treasury / secrets |
| Keel | [platform-health.md](platform-health.md) | Dead code / tests / perf / devops |
| Bench | [hire.md](hire.md) | No-fit → hire a new named agent |
| Hone | [prompt-improve.md](prompt-improve.md) | `/improve` → ask, then rewrite + run |

## Related anchors

- Strategy: `docs/MACHINE_MONEY_STRATEGY.md`, `docs/AGENT_BUILDER_GTM.md`
- Token checklist: `docs/SYRA_TOKEN_LIQUIDITY_LISTING_KOL_CHECKLIST.md`
- Live proof UI: `syraa.fun/`, `/token`, `/rewards`, `/marketplace`
- Personas: `.cursor/rules/*.mdc`
- Always-on Helix: `.cursor/rules/helix.mdc`
- Routing helper: `.cursor/skills/request-breakdown/`
