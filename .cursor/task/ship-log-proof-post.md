# Ship-log proof post

**Purpose:** Turn a real repo change or live metrics into an X-ready ship log that cites a **real number or Solscan tx**.

**Cadence:** Any day something ships · **Time box:** ~30–45 minutes

**Personas / rules:** `@.cursor/rules/article-authoring.mdc` · `@.cursor/rules/growth-marketing.mdc`

**Invoke:** `@.cursor/task/ship-log-proof-post.md run this task`

## Auto context (Agent does this — do not ask the user)

1. Today’s date from system/user_info.
2. Discover what shipped: `git log -5 --oneline`, `git status`, recent files under `web/src/content/posts/registry.ts` (last updateNumber).
3. Fetch `GET https://api.syraa.fun/api/metrics` for proof numbers; prefer `buyback.recentBuybacks[].solscanUrl` when present.
4. Read an existing post (e.g. `buybackRewardsProofUpdate.ts`) for format/layout patterns.

## The Prompt

```
@.cursor/rules/article-authoring.mdc @.cursor/rules/growth-marketing.mdc @.cursor/rules/legal-compliance.mdc

You are Syra's ship-log producer. Proof > hype. Every public claim must be backed by a file change, live metric, or Solscan link.

AUTO-CONTEXT (do not ask me to fill placeholders):
1. Date = today from system/user_info.
2. Run git log -5 --oneline and git status (or read terminal/git). Summarize what actually changed recently in 1–3 sentences. If working tree is clean and last commits are unrelated, base the post on LIVE metrics proof (buyback/rewards/activation) instead of inventing a feature ship.
3. Fetch GET https://api.syraa.fun/api/metrics. Quote the exact fields you will use. Prefer a Solscan URL from buyback.recentBuybacks when available.
4. Read web/src/content/posts/registry.ts for the latest updateNumber; propose next id/number.
5. Mirror structure of an existing defineVideoUpdate + definePhotoUpdate pair.

Then:
1. Decide ONE angle: activation OR revenue→$SYRA proof OR partner/tool ship OR settlement trust. Do not mix five pillars.
2. Produce shareCopyVideo + shareCopyPhoto (X-ready; article-authoring rules; one CTA).
3. Outline video deck (8 kinds) and photo deck (15 roles) with real layout names from existing posts.
4. Propose registry updateNumber + id. Do NOT write full TypeScript files unless my message includes IMPLEMENT.
5. CTA pair: builders → /marketplace or docs; holders → /token or /rewards — never "buy for moon".

Output format (strict):
### Proof used
### What shipped (auto-discovered)
### Angle
### X copy (video / photo)
### Video slide outline (8)
### Photo card outline (15)
### Registry proposal (updateNumber / id)
### Post checklist
- [ ] numbers verified
- [ ] no unshipped utility claims
- [ ] CTA links correct
```

## Expected output

- Verified proof list
- Ready-to-post X copies
- Studio outlines (full files only if IMPLEMENT)

## Guardrails

- Must include at least one real metric or Solscan tx in the public copy.
- No price targets, APY guarantees, or live governance claims.

## One next action

Publish the X copy, or reply **IMPLEMENT** to generate/register the post files.
