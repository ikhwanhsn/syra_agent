# ideas

Run today’s Chronicle content idea board (no placeholders).

Style-informed daily ideas from 15 tracked crypto X accounts, each grounded in a real Syra proof fact. Does **not** auto-post.

1. Follow `.cursor/agents/content-proof.md` **Ideas mode** in full (Chronicle).
2. Run `node api/scripts/contentSwipeFetch.mjs` from the repo root (or `npm run content-swipe` from `api/`). Reuses `xApiClient` + `xProjectScoring`. If `X_BEARER_TOKEN` is missing, continue with `.cursor/agents/content-swipe/STYLE_PLAYBOOK.md` + Syra facts. Do not ask the founder for the token.
3. Read `.cursor/agents/state/content-swipe-latest.json` if present, `.cursor/agents/content-swipe/STYLE_PLAYBOOK.md`, and `.cursor/agents/content-swipe/watchlist.json`.
4. Gather Syra proof: `git log -5 --oneline`, `git status`, `GET https://api.syraa.fun/api/metrics`, `web/src/content/posts/registry.ts` last `updateNumber`.
5. Spawn Log, Swipe, Quill, Frame in parallel. Merge into **8–12** idea cards. Honors `TEXT_POST_QUALITY_BAR.md`, legal-compliance, no invented metrics, no em dashes.
6. Append a short dated “Learned deltas” block to the playbook (3–5 bullets, keep at most 14 dated blocks). Write `.cursor/agents/state/last-ideas.json`.
7. Propose only unless the user message includes `IMPLEMENT`. End with **one** idea to write today.
