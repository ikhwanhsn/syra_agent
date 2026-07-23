# Activation doctor

**Purpose:** Find and remove friction so a stranger completes a **first paid x402 call** in under 10 minutes (MCP / SDK / marketplace).

**Cadence:** Weekly (Monday after standup) · **Time box:** ~45–60 minutes

**Personas:** `@.cursor/rules/developer-relations.mdc` · `@.cursor/rules/product-manager.mdc`

**Invoke:** `@.cursor/task/activation-doctor.md run this task`

## Auto context (Agent does this — do not ask the user)

1. Today’s date from system/user_info.
2. Fetch `GET https://api.syraa.fun/api/metrics` → `funnel`, `settlement`.
3. Read `docs/AGENT_BUILDER_GTM.md`, `docs/MACHINE_MONEY_STRATEGY.md`, `docs/TELEGRAM_MAINTENANCE_POLICY.md`.
4. Walk repo paths: README, `mcp-server/`, `syra-sdk/`, `web/src/pages/GrowthHomePage.tsx`, marketplace / PlaygroundQuickstart.
5. Optional: read `.cursor/task/state/last-standup.json` for current bottleneck.

## The Prompt

```
@.cursor/rules/developer-relations.mdc @.cursor/rules/product-manager.mdc

You are Activation Doctor for Syra. ICP = agent builders (MCP/SDK), not retail chat.

AUTO-CONTEXT (do not ask me to fill placeholders):
1. Date = today from system/user_info.
2. Fetch GET https://api.syraa.fun/api/metrics — quote funnel (402→paid, D7) and settlement fail rate. If settleFailRate is high, that is P0 over docs polish.
3. Read docs/AGENT_BUILDER_GTM.md, docs/MACHINE_MONEY_STRATEGY.md, docs/TELEGRAM_MAINTENANCE_POLICY.md.
4. Audit real files: root README, mcp-server README, syra-sdk README, GrowthHomePage CTAs, PlaygroundQuickstart / marketplace integrate tab.
5. If .cursor/task/state/last-standup.json exists, note its bottleneck/oneAction.

Then:
1. Walk the three paths as a stranger would (MCP / SDK / Marketplace). Cite file paths.
2. List the top 5 friction points ranked by drop-off likelihood.
3. Propose the smallest fix that removes the #1 friction — prefer copy/docs/flag/config over a large feature. If code is required, scope ≤ half day. Propose only; do not edit until I say IMPLEMENT (unless this message already includes IMPLEMENT).
4. Propose 3 concrete design-partner outreach targets (communities/people types + one-sentence DM) grounded in GTM docs — invent names only as examples labeled "example".

Output format (strict):
### Funnel & settlement (live)
### Path audit (MCP / SDK / Marketplace)
### Top frictions (ranked)
### Fix #1 (ship this week)
- problem / change / files / acceptance test / rollback
### Design partner outreach (3)
### Explicit non-goals
```

## Expected output

- Ranked friction list grounded in repo + live funnel
- One shippable fix with acceptance test
- Three outreach targets

## Guardrails

- Telegram is secondary — do not make it the hero CTA.
- Do not invent “starter credits” as shipped unless code exists.
- Success = paid call, not signup vanity.

## One next action

Ship **Fix #1** the same day (reply IMPLEMENT in a follow-up if you want the Agent to apply the patch).
