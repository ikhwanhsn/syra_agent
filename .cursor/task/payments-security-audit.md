# Payments & security audit

**Purpose:** Spot-check x402 settlement/replay, treasury buyback + rewards claim paths, and secrets hygiene — fix or flag before growth scales damage.

**Cadence:** Weekly (alternate Thursday with health sweep) · **Time box:** ~60–90 minutes

**Personas:** `@.cursor/rules/security-engineering.mdc` · `@.cursor/rules/hacker-security.mdc`

**Invoke:** `@.cursor/task/payments-security-audit.md run this task`

## Auto context (Agent does this — do not ask the user)

1. Today’s date; fetch `/api/metrics` → `settlement`.
2. Read money-path files listed in the prompt (do not print secrets from `api/.env`).
3. Scope = all critical paths unless user message narrows it.
4. Default WAIT; apply ≤2 patches only if message contains `IMPLEMENT`.

## The Prompt

```
@.cursor/rules/security-engineering.mdc @.cursor/rules/hacker-security.mdc

You are doing an authorized defensive audit of Syra payment and treasury paths. Find attack paths and propose patches. Do NOT write exploit PoCs or attack live systems.

AUTO-CONTEXT (do not ask me to fill placeholders):
1. Date = today. Fetch GET https://api.syraa.fun/api/metrics → settlement (settleFailRate).
2. Read and cite: api/utils/x402PaymentV2.js, api/utils/buybackSYRA.js, api/libs/buybackScheduler.js, api/libs/syraUsageRewards.js, api/routes/syraRewards.js, api/routes/internalBuyback.js.
3. Check auth on /internal/buyback and /internal/rewards/fund (cron secret patterns) without printing secret values.
4. Secrets hygiene: search for accidental logging of keys; never echo contents of api/.env.
5. IMPLEMENT mode only if my message includes IMPLEMENT; otherwise WAIT (report + patch plan only). Scope default = all (x402 + buyback + rewards-claim + secrets).

Then:
1. Threat-model: verify/settle/replay, buyback skips, Jupiter flush + AGENT_PRIVATE_KEY custody, rewards claim spoofing/over-claim/ATA, internal cron auth.
2. Findings table: severity P0–P3, evidence file:line, fix, safe-this-week?
3. At most TWO patches for now; rest backlog.
4. If IMPLEMENT: apply those ≤2 patches minimally; state residual risk.

Output format (strict):
### Settlement health (live)
### Threat model (bullets)
### Findings table
### Patch plan (≤2)
### Backlog
### Explicit: what you will NOT do (no exploit PoC, no mainnet attack)
### Mode
- WAIT or IMPLEMENT
```

## Expected output

- Findings table with severity and file evidence
- ≤2 patches planned (or applied if IMPLEMENT)

## Guardrails

- Never write exploit PoCs or attack any system.
- Never commit or paste live private keys.
- Prefer caps, auth checks, and idempotency.

## One next action

If P0 exists: reply **IMPLEMENT** and redeploy before any growth push.
