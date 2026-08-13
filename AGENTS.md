# Syra agents

Every prompt in this repo is handled by **Helix** (see `.cursor/rules/helix.mdc` and `.cursor/agents/orchestrator.md`).

Helix routes to the best lead. If none fit, Helix sends **Bench** to hire a new agent.

Full roster: `.cursor/agents/ORG.md`

- Daily growth: `/growth`
- Board review: `/growth week`
- Hire on gap: `.cursor/agents/hire.md` (Bench)
- Video / promo: always-on rule `.cursor/rules/video-creation.mdc` → skills `video-shotcraft` / `video-use`; craft floor + creative mandate in `web/src/video/QUALITY_BAR.md` + toolkit `web/src/video/engine/promoKit.tsx` (past promos are references, not clones)
- Post / announce images: always-on rule `.cursor/rules/post-image-creation.mdc` → studio reference library `web/src/content/announce/REFERENCE_LIBRARY.md` + `referenceLibrary.ts`; gold still `web/public/images/threads/syra-xlayer-showcase.png`
- Text posts / captions / launch copy: always-on rule `.cursor/rules/text-post-creation.mdc` → quality floor `web/src/content/posts/TEXT_POST_QUALITY_BAR.md` (LLM Exchange gold)
- Push / deploy (**only when the user explicitly asks**): `.cursor/rules/push-deploy-watch.mdc` → push, wait Vercel (`syra-v2`) + Render (`syra-agent`), fix and repush until green (`node scripts/watch-deploys.mjs`). Never auto-push after normal work; “ship” alone is not a push ask.
