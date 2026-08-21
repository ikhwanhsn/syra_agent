# Syra style playbook (X)

Living artifact for `/ideas`. Steal **structure** from tracked accounts. Never steal their product claims, metrics, or CTAs.

Watchlist: [`watchlist.json`](watchlist.json). Quality bar: [`web/src/content/posts/TEXT_POST_QUALITY_BAR.md`](../../../web/src/content/posts/TEXT_POST_QUALITY_BAR.md).

## Hard Syra constraints

- Line 1 names the ship (`X is live.` / `New on Syra: X.`). No “excited to announce.”
- Every public claim needs a repo change, live `GET /api/metrics` field, or Solscan tx.
- Founder-plain. Short paragraphs. Commas, periods, colons. No em dashes.
- CTA: builders to marketplace or docs; holders to `/token` or `/rewards`. Never lead with “buy $SYRA.”
- No price targets, APY guarantees, or live governance claims.
- Adapt the pattern onto a **Syra** fact. Do not post as if Syra were Solana, Uniswap, or an agent launcher.

## Hook archetypes (Syra-adapted)

1. **Ship-first.** Name what is live, then who it is for.
2. **Problem cut.** Two lines of the old pain, then “That ends today.” (LLM Exchange gold.)
3. **Number-led proof.** Open with a live metric, then the mechanism that produced it.
4. **Mechanism one-liner.** One endpoint, one surface, one rail. Then a depth beat.
5. **Contrast.** “Agents used to X. Now they Y.” Must be repo-true.
6. **How-to reply.** Steps and headers under the main post. Not a second pitch.
7. **Receipt.** Solscan or paid-call count as the proof object, not a vibe.
8. **Cadence mix.** Alternate ship, proof, and how-to. Ideal band ~0.5–3 posts/day.

## Formats that travel

| Format | When to use | Syra shape |
| --- | --- | --- |
| Single | One fact, one CTA | 5–8 short lines, blank line between beats |
| Thread | Mechanism needs 3+ beats | 1 claim, 2 how, 3 proof, 4 CTA. Number the posts. |
| Reply | Docs / how-to | Earn → LLM → … or `POST /path`. No re-pitch. |
| Photo + caption | Visual module already exists | Caption matches the card. Satori overlay, not baked text. |
| **Image + short text hype** | Mood still + short invite. `/hype`. | Spec: [`IMAGE_SHORT_TEXT_HYPE.md`](IMAGE_SHORT_TEXT_HYPE.md). Auto-pick between working copy (left thesis) and original door. New photograph every run. |
| **Incumbent hype text** | Disruptive four-beat. `/incumbent`. | Spec: [`INCUMBENT_HYPE_TEXT.md`](INCUMBENT_HYPE_TEXT.md). Industry → contrast → `syra is` → replaceable → URL. Text only. |
| Video + caption | Motion hero exists | Caption matches what the film shows. Both BGM and no-BGM already shipped. |

## What to steal vs never steal

**Steal:** hook order, thread length, reply-as-how-to, proof-object-in-the-open, posting cadence, whitespace, one-job-per-post.

**Never steal:** their follower counts, their revenue, their roadmap, their token promises, their screenshots, their CTAs, “we are like X.”

## CTA pair

- Builders: `https://syraa.fun/marketplace` or a real docs URL (`https://docs.syraa.fun/...`).
- Holders: `https://syraa.fun/token` or `https://syraa.fun/rewards`.
- Product surfaces: full `https://syraa.fun/...` paths that exist in the repo.

## Learned deltas

Newest first. Keep at most 14 dated blocks. Each `/ideas` run appends 3–5 bullets of patterns seen today (structure only, not competitor claims).

### 2026-08-17
- Live swipe fetch skipped (`X_BEARER_TOKEN_MISSING`). Reused playbook archetypes only.
- Unannounced ship still wins the day vs a metrics dump when the registry lags HEAD.
- Keep number-led proof as its own card. One depth beat on the ship post, not a second pillar.
- How-to stays in the reply (install, wrap, paths, status check), not a second pitch.
- Hold claim-rewards and zero-usage pitches: LLM Exchange as a ship-only card, treasury as inventory not a claim CTA.
