# Syra agents

Every prompt in this repo is handled by **Helix** (see `.cursor/rules/helix.mdc` and `.cursor/agents/orchestrator.md`).

Helix routes to the best lead. If none fit, Helix sends **Bench** to hire a new agent.

Full roster: `.cursor/agents/ORG.md`

- Daily growth: `/growth`
- Board review: `/growth week`
- Daily content ideas: `/ideas` → Chronicle (style-swipe watchlist + proof-grounded idea board)
- Ship-log studio: `/post` → Chronicle (git ship → create or update locked 8+15 bundle). Spec: `.cursor/agents/content-swipe/POST_SHIP_LOG.md`
- Image + short text hype: `/hype` → Chronicle (swipe 15 watchlist accounts, map today's hype onto one Syra fact, new still + short caption). Spec: `.cursor/agents/content-swipe/IMAGE_SHORT_TEXT_HYPE.md`
- Incumbent hype text: `/incumbent` → Chronicle (four-beat industry → contrast → `syra is` → replaceable → URL). Spec: `.cursor/agents/content-swipe/INCUMBENT_HYPE_TEXT.md`
- Hire on gap: `.cursor/agents/hire.md` (Bench)
- Prompt improve: `/improve` → **Hone** (`.cursor/agents/prompt-improve.md`) — ask if ambiguous; once the brief is complete (or the user answered Hone’s questions), rewrite and Helix executes in the same turn. Do not wait for “run it.”
- Video / promo: always-on rule `.cursor/rules/video-creation.mdc` → skills `video-shotcraft` / `video-use`; craft floor + creative mandate in `web/src/video/QUALITY_BAR.md` + toolkit `web/src/video/engine/promoKit.tsx` (past promos are references, not clones)
- Post / announce images: always-on rule `.cursor/rules/post-image-creation.mdc` → studio reference library `web/src/content/announce/REFERENCE_LIBRARY.md` + `referenceLibrary.ts`; gold still `web/public/images/threads/syra-xlayer-showcase.png`
- Text posts / captions / launch copy: always-on rule `.cursor/rules/text-post-creation.mdc` → quality floor `web/src/content/posts/TEXT_POST_QUALITY_BAR.md` (LLM Exchange gold)
- Push / deploy (**only when the user explicitly asks**): `.cursor/rules/push-deploy-watch.mdc` → push, wait Vercel (`syra-v2`) + Render (`syra-agent`), fix and repush until green (`node scripts/watch-deploys.mjs`). Never auto-push after normal work; “ship” alone is not a push ask.
