# post

Create or **update** a Syra **ship-log** bundle (video + photo + share copy) from what you already built. Does **not** auto-post to X.

Locked template: 8 video slides + 15 photo cards. Studio: `/post/video/<n>` and `/post/photo/<n>`.

1. Follow `.cursor/agents/content-swipe/POST_SHIP_LOG.md` in full (Chronicle **Post** mode).
2. **Discover the ship** from this conversation, `git log -10 --oneline`, `git status`, and `git diff` (staged + unstaged). Prefer repo truth over memory.
3. Read `web/src/content/posts/registry.ts` and `getNextUpdateNumber()` logic. **If a bundle already matches this ship** (same feature, docs path, or `*Update.ts` slug), **update that bundle** instead of appending a duplicate.
4. Fetch `GET https://api.syraa.fun/api/metrics` when the angle is proof-shaped. Quote settled fields only for public copy.
5. **IMPLEMENT** in this turn (unless the user said outline-only):
   - `web/src/content/posts/<slug>Update.ts` (`defineVideoUpdate`, 8 kinds)
   - `web/src/content/posts/photo/<slug>Photo.ts` (`definePhotoUpdate`, 15 roles)
   - `web/src/content/posts/photo/shareCopies/<slug>ShareCopies.ts` (all 15 roles)
   - Append or refresh entry in `web/src/content/posts/registry.ts`
6. Run `cd web && npx vitest run src/content/posts/photo/validatePhotoPostContent.test.ts src/components/post/postSlideTiming.test.ts`.
7. Write `.cursor/agents/state/last-post.json`. Honors `TEXT_POST_QUALITY_BAR.md`, `ship-log-share-copy.mdc`, `text-post-creation.mdc`, `no-em-dash.mdc`.

Do not run `/ideas`, `/hype`, or `/incumbent`. Do not push unless the user explicitly asks.
