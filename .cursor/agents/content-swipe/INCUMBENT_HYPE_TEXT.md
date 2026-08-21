# Incumbent hype text (Syra)

Named Syra format. **Lead:** Chronicle (Quill). **Command:** `/incumbent`.

Disruptive four-beat X copy: industry still runs on the old process → old cost/time vs Syra → one-line definition → “replaceable” closer → real URL.

This is **not** a launch post (`X is live.`) and **not** image + short text hype (`/hype`). Text only unless the user also asks for a still.

## When to run

User says `/incumbent`, **incumbent hype**, “text like the replaceable post,” “zauth-style for Syra,” or pastes a competitor post with industry → contrast → definition → punch and asks for Syra.

Execute in this turn. Default: **1** paste-ready post. If they ask for “more N” / “5 about Syra,” deliver **N** variants on **different** shipped surfaces.

## Spine (non-negotiable)

Four short beats + URL. Blank line between beats. Prefer lowercase for punch (including `syra`).

1. **Industry / old process.** What still runs on seats, keys, humans, or sales cycles. No invented TAM ($X billion) unless cited from a real public source in-repo or the user supplies it.
2. **Contrast.** Old path (contract, monthly seat, weeks) vs Syra (real price band, real time-to-first-call, real path). Use repo-true numbers only.
3. **Definition.** `syra is …` One line. Prefer brand-true nouns (`machine money for agents`, `pay-per-call crypto intelligence`, surface-specific like `the checkout for models`).
4. **Closer.** `the … are replaceable.` Name the class of incumbent, not a person’s brand you cannot defend.
5. **CTA.** Full `https://` to marketplace, docs, or the surface named in the post.

Optional under the post: how-to reply (steps only). Optional quoted tweet: real Syra proof or [syraa.fun](https://syraa.fun) metrics, never a fake price-rally chart.

## Gold reference (Aug 2026)

```
crypto intelligence is still a seat industry that sells monthly keys to humans.

a data terminal takes a contract and a sales cycle. ours starts at $0.001 a call and the first paid call is about 5 minutes.

syra is machine money for agents.

the incumbents are replaceable.

https://syraa.fun/marketplace
```

## Angle bank (rotate; do not invent)

Pick **one** shipped surface per post. Skip angles in `last-incumbent.json` `doNotRepeat` when present.

| Angle | Old process | Syra fact (must stay true) | CTA |
| --- | --- | --- | --- |
| Spend / seats | Monthly keys, human dashboards | `$0.001`–`$0.02` tiers; first paid call ~5 min; x402 USDC | `https://syraa.fun/marketplace` |
| Agents cannot pay | Forms, credit cards, vendor keys | Wallet-native 402 → pay → retry | `https://syraa.fun/marketplace` |
| LLM Exchange | Hardcode one vendor; idle spare capacity | `POST /llm/route`; list on Earn → LLM; ~80% seller | `https://syraa.fun/earn?track=llm` |
| MCP / skill | Integration decks, week-long kickoffs | `set up https://api.syraa.fun/skill.md` → `syra_consult` | `https://syraa.fun/marketplace` |
| Refund | Paid then 5xx, money gone | Money-back on same rail; `GET /refund/status` | `https://docs.syraa.fun/docs/build/refund` |
| Outcomes | Humans billing hours for money work | Mandate → proven done → pay (pilot; do not overclaim maturity) | `https://docs.syraa.fun/docs/build/outcomes` |
| Bridge | Manual multi-chain hops | Earn → Bridge / `syraa.fun/bridge` when that surface is the topic | `https://syraa.fun/bridge` |

Refresh facts from README, `api/config/x402Pricing.js`, video promo copy, or docs before shipping. Never invent endpoints or “live” status.

## Voice

- Aggressive, short, founder-plain. Disruptive energy without fake numbers.
- Commas, periods, colons. **No em dashes.**
- No “excited to announce,” “game-changer,” moon, APY guarantees.
- Never lead with buy $SYRA.
- Steal **structure** from watchlist / competitor posts. Never steal their claims, metrics, screenshots, or CTAs.

## Deliverable

1. Paste-ready main (spine above).
2. If useful: tighter cut (3–4 lines + URL).
3. Optional how-to reply.
4. When series: label angles (`**1. Spend**`) so the founder can pick.

Write `.cursor/agents/state/last-incumbent.json` after a run:

```json
{
  "date": "YYYY-MM-DD",
  "mode": "incumbent",
  "angles": ["spend-seats"],
  "hooks": ["crypto intelligence is still a seat industry…"],
  "doNotRepeat": ["spend-seats", "…"],
  "oneAction": "next unused angle from the bank"
}
```

## Do not

- Force LLM Exchange launch spine (`X is live.`)
- Invent industry size, competitor prices, or holder moon angles
- Clone a competitor’s product claims
- Mix five pillars in one post
- Auto-post to X
