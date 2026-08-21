# Syra text post quality bar (canonical)

**Gold reference launch post:** LLM Exchange (video launch, Aug 2026)  
**Always-on rule:** [`.cursor/rules/text-post-creation.mdc`](../../../.cursor/rules/text-post-creation.mdc)  
**Lead:** Chronicle (Quill) · co-route Beacon (Agora) for reach

Every X / Threads / LinkedIn / reply caption for a Syra ship or launch must meet or beat this bar. Do not ship soft announce fluff.

## Gold reference (paste shape)

```
LLM Exchange is live.

You can list Claude, Gemini, DeepSeek, or your own endpoint.
Agents pay once in USDC. Syra routes the call.

One endpoint for callers: POST /llm/route
One surface for sellers: Earn → LLM

Pick cheapest, reliable, fastest, or quality.
~80% goes to the seller. Platform fee feeds $SYRA buyback.

List a model: https://syraa.fun/earn?track=llm
Route a call: https://docs.syraa.fun/docs/api/llm-route
```

**Tighter cut (when the feed is crowded):**

```
New on Syra: LLM Exchange.

Sellers list any model. Agents pay once. We route.

No hardcoded vendor. No custom payment stack per provider.
Just x402 in, smart route out, USDC split on settlement.

https://syraa.fun/earn?track=llm
```

**Hook-first (cold audience):**

```
Spare LLM capacity used to sit idle.
Agents used to hardcode one vendor and pray.

That ends today.

LLM Exchange: list a model, get paid in USDC. Agents hit one route and Syra picks the path.

https://syraa.fun/earn?track=llm
```

**Reply under the post (how-to, not a second pitch):**

```
Sellers: Earn → LLM → protocol → key → price → activate.
Callers: POST /llm/route with X-Syra-Route: cheapest
Docs: https://docs.syraa.fun/docs/api/llm-route
```

## Hard structure (product launch / ship post)

Deliver **main + tighter + optional reply** unless the user asks for one length only.

1. **Line 1 = the ship.** Name the product or change. Prefer `X is live.` / `New on Syra: X.` Never open with “Excited to announce,” “We’re thrilled,” or “Big update.”
2. **Who + outcome (2 short lines).** Sellers and callers (or the real ICP) each get a concrete verb + payoff.
3. **Mechanism block.** One endpoint, one UI surface, or one payment rail. Use real paths (`POST /llm/route`, `Earn → LLM`).
4. **One depth beat.** Policies, fee split, chains, failover, or a live metric. Not five pillars.
5. **CTAs with URLs.** Full `https://` when possible. Pair builder action + docs when both exist. Never lead with “buy $SYRA.”
6. **Reply = how-to.** Steps and headers. Do not re-pitch.

## Voice

- Founder-plain, launch-caliber, specific product nouns.
- Short paragraphs (1–3 sentences). Blank lines between beats for X paste.
- Prefer commas, periods, colons. No em dashes (`—`).
- Active voice. Concrete numbers and names over adjectives.
- Hype only when tied to a shipped fact.

## Proof rules

| Post type | Proof bar |
|-----------|-----------|
| Feature launch | Real surface + real API/path from the repo or docs |
| Metrics / buyback proof | Cite live `/api/metrics` field or Solscan URL |
| Partner / integration | Name the partner + what changed for the user |
| Video attach | Caption must match what the video actually shows |

Never invent endpoints, fee splits, or “live” claims that are not shipped.

## Forbidden

- Em dashes (`—`)
- “Excited to announce,” “game-changer,” “revolutionary,” “moon,” price targets, APY guarantees
- Leading with “buy $SYRA” or holder-only hype on a builder ship
- Soft openers that bury the product name below the fold
- Staccato empty slogan stacks with no mechanism (`One market. Infinite agents.`)
- Meta talk about the video/card (“In this video,” “As you can see”)
- Arrow CTA chrome (`Try →`) in share captions when ship-log photo rules apply; prefer plain URLs
- Mixing five pillars in one post

## Named format: image + short text hype

When the user asks for `/hype`, **image + short text hype**, or a mood still plus short invite caption, follow [`.cursor/agents/content-swipe/IMAGE_SHORT_TEXT_HYPE.md`](../../../.cursor/agents/content-swipe/IMAGE_SHORT_TEXT_HYPE.md). This is **not** a launch post.

Gold caption for this format (portal post, Aug 2026):

```
The catalog is on the other side.

Paste set up https://api.syraa.fun/skill.md into your agent.
syra_consult first. Then the tool it names.

https://syraa.fun/marketplace

What are you calling first?
```

Do not force line 1 to `X is live.` when that ship was already posted. Shape: 2-4 short beats, real URL, one question. Still: new metaphor every run. Skip hooks in `.cursor/agents/state/last-hype.json` `doNotRepeat`.

Launch posts still use the LLM Exchange gold.

## Named format: incumbent hype text

When the user asks for `/incumbent`, **incumbent hype**, “text like the replaceable post,” or “zauth-style for Syra,” follow [`.cursor/agents/content-swipe/INCUMBENT_HYPE_TEXT.md`](../../../.cursor/agents/content-swipe/INCUMBENT_HYPE_TEXT.md). This is **not** a launch post and **not** `/hype` (no still unless asked).

Gold caption for this format (Aug 2026):

```
crypto intelligence is still a seat industry that sells monthly keys to humans.

a data terminal takes a contract and a sales cycle. ours starts at $0.001 a call and the first paid call is about 5 minutes.

syra is machine money for agents.

the incumbents are replaceable.

https://syraa.fun/marketplace
```

Spine: industry old process → old vs Syra → `syra is …` → `the … are replaceable.` → real URL. No invented TAM. Skip angles in `.cursor/agents/state/last-incumbent.json` `doNotRepeat`. Default 1 post; “more N” → N different shipped surfaces.

Launch posts still use the LLM Exchange gold.

## Definition of done

1. Main post reads as a product launch, not a changelog dump.
2. A cold reader can say what shipped, who it is for, and what to click in under 5 seconds.
3. Every claim is repo-true or metrics-true.
4. Tighter alt provided when useful; reply is how-to only.
5. Density and clarity ≥ the LLM Exchange gold reference above.
