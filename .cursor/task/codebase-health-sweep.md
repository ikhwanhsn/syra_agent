# Codebase health sweep

**Purpose:** Find dead code, duplication, or coupling that slows velocity; propose **one** safe cleanup you can finish without a rewrite.

**Cadence:** Weekly (alternate Thursday with payments audit) · **Time box:** ~45–60 minutes

**Personas:** `@.cursor/rules/dead-code.mdc` · `@.cursor/rules/code-review.mdc`

**Invoke:** `@.cursor/task/codebase-health-sweep.md run this task`

## Auto context (Agent does this — do not ask the user)

1. Today’s date.
2. Choose focus from calendar week or bottleneck in `last-standup.json` (money-path if settlement/buyback issues; else web-routes / experiments).
3. Scan with Grep/Glob — unused exports, dead routes, duplicate logic, orphaned models.
4. Default mode: **propose only** (WAIT). Apply patches only if the user message contains `IMPLEMENT`.

## The Prompt

```
@.cursor/rules/dead-code.mdc @.cursor/rules/code-review.mdc

You are a staff engineer doing a time-boxed health sweep for Syra. Goal: one safe cleanup that improves velocity or reduces footguns.

AUTO-CONTEXT (do not ask me to fill placeholders):
1. Date = today from system/user_info.
2. Pick focus area automatically:
   - If .cursor/task/state/last-standup.json bottleneck is settlement or token-loop → money-path (careful: prefer tests/docs over refactors)
   - Else if many unused experiment routes → experiments
   - Else web-routes or telegram secondary surfaces
3. Scan the focus area with tools. Prefer evidence: unused exports, duplicate logic, dead routes, orphaned models, admin pages not on GTM paths.
4. IMPLEMENT mode: only if my message includes the word IMPLEMENT. Otherwise WAIT (propose only).

Then:
1. Rank findings by (risk of change × value of cleanup).
2. Propose exactly ONE cleanup: what / files / risk / test plan / rollback.
3. List 3 follow-ups for later — do not implement them now.
4. Flag honesty debt (misleading unshipped utility copy) separately if found.
5. If IMPLEMENT: apply Cleanup #1 with minimal diff and summarize residual risk.

Output format (strict):
### Focus (auto-chosen)
### Findings (ranked)
### Cleanup #1 proposal
### Test plan
### Follow-ups (later)
### Honesty debt (if any)
### Mode
- WAIT or IMPLEMENT (what you did)
```

## Expected output

- Ranked findings with file paths
- One cleanup proposal with test/rollback
- Patch only if IMPLEMENT

## Guardrails

- No full rewrite.
- Do not break x402 settlement or claim transfers in a drive-by.
- Prefer deleting unused surface over adding abstractions.

## One next action

Reply **IMPLEMENT** in a follow-up if the proposal looks safe, then run the test plan before deploying.
