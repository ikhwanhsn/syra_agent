# Image + short text hype

Named Syra format. **Lead:** Chronicle (Swipe + Quill + Frame). **Command:** `/hype`.

Steal the **shape** of a mood still plus a short invite caption. Ground it in a Syra fact that maps to **what the 15 watchlist projects are posting this week**. Never clone their claims, CTAs, screenshots, or last Syra still.

Gold still (working copy, left thesis, default): [`web/public/images/threads/syra-xlayer-hype.png`](../../../web/public/images/threads/syra-xlayer-hype.png)

Original door (foot sticker): [`web/public/images/threads/syra-xlayer-portal.png`](../../../web/public/images/threads/syra-xlayer-portal.png)

Layout catalog (auto-pick): [`web/src/content/announce/hypeReferences.ts`](../../../web/src/content/announce/hypeReferences.ts) `findBestHypeReference()`.

Gold caption (this format, not the LLM Exchange launch bar):

```
The catalog is on the other side.

Paste set up https://api.syraa.fun/skill.md into your agent.
syra_consult first. Then the tool it names.

https://syraa.fun/marketplace

What are you calling first?
```

Structure source (steal order only): short invite, real URL, one engagement question, one atmospheric 1:1 still. Do not copy OKX copy, purple neon, or “agentic workforce.”

## When to run

User says `/hype`, **image + short text hype**, “content like the portal post,” or “mood still plus short caption.” Execute in this turn. Do not stop at an idea board (`/ideas` is the board; this is the ship).

## Pipeline (mandatory)

1. Read this file. Read `.cursor/agents/state/last-hype.json` if present (`doNotRepeat`, last metaphor, last hook).
2. Run `node api/scripts/contentSwipeFetch.mjs` from the repo root. Read `.cursor/agents/state/content-swipe-latest.json`. If fetch skipped (`X_BEARER_TOKEN_MISSING`) or failed, continue with `STYLE_PLAYBOOK.md` + `watchlist.json` `watchFor` lines. Do not ask for the token.
3. Distill **what is hyping now** across the 15 accounts: 3-5 topic/structure bullets. Cite handles. Structure and subject matter only. Never copy their metrics, product claims, or CTAs.
4. Gather Syra proof: `git log -5 --oneline`, `git status`, `GET https://api.syraa.fun/api/metrics`. Pick **one** Syra fact that can ride today’s hype without pretending Syra is that other product.
5. Skip any hook, metaphor, or “X is live” line listed in `last-hype.json` `doNotRepeat`.
6. Write caption first (main + tighter + how-to reply). Then invent a **new** visual metaphor from *this* caption. Do not clone the last still's subject.
7. Produce the image (below). Deliver paste-ready copy + PNG path.
8. Write `.cursor/agents/state/last-hype.json`.

## Caption shape (this format)

This is **not** a launch post. Do not force line 1 to `X is live.` when that ship was already posted.

- 2-4 short beats, blank lines between them
- Invite, first step, or question. One mechanism line if it is new for this beat
- One real `https://` CTA (marketplace, skill.md, or docs)
- One engagement question
- Founder-plain. No em dashes. No “excited to announce.” Never lead with buy $SYRA
- Claims must be repo-true or metrics-true
- Deliver **main + tighter + optional how-to reply**

## Image (always new photograph, picked layout)

Reuse a **catalog layout**. Never reuse the last photograph.

| Keep | Change every run |
| --- | --- |
| 1:1 / 1080×1080 | Subject / metaphor derived from *this* caption |
| Matched `portalVariant` from `findBestHypeReference()` | New bg plate (no text, no logos) |
| Syra mark + wordmark, top-right mono label | New headline that matches the new beat |
| Mono disclaimer footer | New grain/light. Do not clone the matched reference's `subject` |
| Black / white / gray | |

1. After the caption exists, run `findBestHypeReference(caption + syra fact + metaphor)` from `web/src/content/announce/hypeReferences.ts`.
2. **Read the matched `referencePng` with the Read tool** (layout density). Default if no score: working copy (left thesis).
3. Generate a **new** atmospheric plate under `web/public/images/threads/bg/bg-hype.png`. Do not overwrite `bg-portal.png`.
4. Point the working card `xlayer-hype` at that plate. Set `portalVariant` to the match. Do not edit `xlayer-portal`.
5. Export with `npm run generate:xlayer` from `web/`. Deliverable: `web/public/images/threads/syra-xlayer-hype.png`.
6. Leave `syra-xlayer-portal.png` untouched.

If the new metaphor needs a studio module (metrics, flow), do not force a hype layout onto a number grid. Then invent from `REFERENCE_LIBRARY.md` instead.

## Catalog

| ID | Layout | Gold still | Pick when |
| --- | --- | --- | --- |
| `hype-working` | Left thesis (default) | `syra-xlayer-hype.png` | One-liner, manifesto, invite |
| `hype-door` | Foot sticker | `syra-xlayer-portal.png` | Centered caption on the still |

## Do not

- Reuse the wooden door from a gold still as the next still's subject
- Ship OKX purple/magenta neon or gold chrome
- Bake body text into the AI plate (Satori overlay only)
- Steal a watchlist product’s screenshot, metric, or CTA
- Announce a ship the feed already used this week (check `doNotRepeat` + recent registry copy)
- Run the full `/ideas` 8–12 board instead of making the post

## State (`last-hype.json`)

```json
{
  "date": "2026-08-17",
  "updatedAt": "ISO-8601",
  "mode": "hype",
  "hypeNoticed": ["@handle: structure or topic"],
  "syraFact": "repo-true or metrics-true one-liner",
  "metaphor": "what the still actually shows",
  "hook": "caption line 1",
  "layout": "thesis",
  "pickedReference": "hype-working",
  "image": "web/public/images/threads/syra-xlayer-hype.png",
  "doNotRepeat": ["hooks and metaphors to skip next time"],
  "fetch": { "ok": false, "reason": "optional" },
  "oneAction": "paste the post with the new still"
}
```

Append last run’s hook + metaphor onto `doNotRepeat` (keep at most 12 strings).
