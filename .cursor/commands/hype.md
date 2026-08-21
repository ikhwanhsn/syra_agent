# hype

Create one **image + short text hype** post (no placeholders). Does **not** auto-post.

Mood still + short invite caption, mapped onto whatever the 15 watchlist accounts are posting this week. New photograph every run.

1. Follow `.cursor/agents/content-swipe/IMAGE_SHORT_TEXT_HYPE.md` in full (Chronicle Hype mode).
2. Run `node api/scripts/contentSwipeFetch.mjs` from the repo root. Read `.cursor/agents/state/content-swipe-latest.json` if present. If `X_BEARER_TOKEN` is missing, continue with the playbook + watchlist `watchFor` lines. Do not ask the founder for the token.
3. Read `.cursor/agents/state/last-hype.json` if present. Skip `doNotRepeat` hooks and metaphors.
4. Gather Syra proof: `git log -5 --oneline`, `git status`, `GET https://api.syraa.fun/api/metrics`.
5. Distill 3-5 “what is hyping now” bullets from the 15 accounts (structure + topic, cite handles). Pick **one** Syra fact that can ride it.
6. Write main + tighter + how-to reply. Run `findBestHypeReference()` on that caption. Read the matched gold PNG. Generate a **new** 1:1 still in that layout (never clone the gold's subject). Export `web/public/images/threads/syra-xlayer-hype.png`.
7. Write `.cursor/agents/state/last-hype.json`. Honors `TEXT_POST_QUALITY_BAR.md` named format “image + short text hype”, legal-compliance, no invented metrics, no em dashes.

Do not run the `/ideas` board. Do not run the ship-log prompt.
