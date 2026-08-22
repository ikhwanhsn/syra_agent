# Post mode — ship-log studio bundle (`/post`)

**Lead:** Chronicle (Post mode)  
**Command:** `.cursor/commands/post.md`  
**State:** `.cursor/agents/state/last-post.json`  
**Studio UI:** `https://www.syraa.fun/post` (local: `/post`)

Turn **what already shipped** in the repo (or this chat) into a full ship-log update: video deck, photo deck, per-card X share copy, registry entry.

## When to use

- User types `/post` after building a feature, integration, or docs ship
- User says "ship log for this", "add post update", "update the post for Cloudflare", etc.
- **Not** for `/ideas`, `/hype`, `/incumbent`, or announce X-Layer stills (`/post/announce`)

## Create vs update (critical)

| Situation | Action |
|-----------|--------|
| No registry bundle matches the ship | **Create** with `getNextUpdateNumber()` from `registry.ts` (currently max + 1, min 1; skip locked #0) |
| Bundle exists for same ship (slug, title, or docs path in git diff) | **Update** existing `*Update.ts`, `*Photo.ts`, `*ShareCopies.ts`. Keep `updateNumber` and `id` |
| User names update # or slug | Edit that bundle only |

**Match signals:** filename in diff (`cloudflareAgentsX402Update.ts`), docs path (`docs/CLOUDFLARE_*`), feature keyword in recent commits, or user message.

Never append a second bundle for the same ship.

## Auto context (do not ask the founder to paste a brief)

1. Date from system/user_info.
2. `git log -10 --oneline`, `git status`, `git diff` and `git diff --cached`.
3. Read `web/src/content/posts/registry.ts` (last bundles, `getNextUpdateNumber`).
4. Read `web/src/content/posts/templateUpdate.ts` (locked format reference).
5. Read **one gold ship-log pair** closest to this ship (e.g. `crossmintOnrampUpdate.ts` + `photo/crossmintOnrampPhoto.ts`, or latest integration post).
6. `GET https://api.syraa.fun/api/metrics` when copy cites traction; use **settled** fields only (`outcome=paid`).
7. If `settlement.last24h.settleFailRate > 0.05`, avoid token-hype; prefer builder activation or settlement-trust angles.

## File scaffold (every new bundle)

| File | Purpose |
|------|---------|
| `web/src/content/posts/<camelSlug>Update.ts` | `defineVideoUpdate(meta, slides)` — exactly 8 slides |
| `web/src/content/posts/photo/<camelSlug>Photo.ts` | `definePhotoUpdate(meta, cards)` — exactly 15 cards |
| `web/src/content/posts/photo/shareCopies/<camelSlug>ShareCopies.ts` | `Record<PostPhotoCardRole, string>` — all 15 roles |
| `web/src/content/posts/registry.ts` | import + `{ video, photo }` in `POST_UPDATE_BUNDLES` |

**Naming:** `id` kebab-case (`cloudflare-agents-x402`). Files camelCase (`cloudflareAgentsX402Update.ts`).

### Video slide kinds (fixed order)

`cover` → `statement` → `hero` → `flow` → `cards` → `surfaces` → `impact` → `closing`

See `web/src/content/posts/videoSlideSlots.ts`. Layouts may vary; kinds may not.

### Photo card roles (fixed order)

`cover` → `thesis` → `quote` → `flow` → `timeline` → `pillars` → `checklist` → `metrics` → `featured` → `comparison` → `launch` → `deepDive` → `split` → `terminal` → `cta`

See `web/src/content/posts/photo/photoCardSlots.ts`.

### Meta fields

```ts
{
  updateNumber: number,      // stable when updating
  id: string,
  title: string,
  published: string,         // e.g. "August 2026"
  tagline: string,
  shareCopyVideo: string,    // SHIP LOG · …
  shareCopyPhoto: string,
}
```

## Copy rules

- **Video/photo deck on-image copy:** founder-plain, concrete, repo-true. No em dashes (`no-em-dash.mdc`).
- **shareCopyVideo / shareCopyPhoto:** `TEXT_POST_QUALITY_BAR.md` ship-log shape; lead with what shipped.
- **Per-card share copies:** `ship-log-share-copy.mdc` — explain the image, no meta card talk, real URLs.
- **CTAs:** `https://docs.syraa.fun/...`, `syraa.fun/marketplace`, product paths. Never lead with buy $SYRA.
- **One angle per post:** activation OR partner OR settlement OR tool ship. Do not list five pillars.

## Implementation checklist

1. Decide create vs update.
2. Write or patch all four file groups.
3. `cd web && npx vitest run src/content/posts/photo/validatePhotoPostContent.test.ts src/components/post/postSlideTiming.test.ts`
4. Fix any layout/kind validation errors from `defineVideoUpdate` / `definePhotoUpdate` at import.
5. Write `last-post.json`:

```json
{
  "date": "YYYY-MM-DD",
  "updatedAt": "ISO",
  "mode": "post",
  "action": "create|update",
  "updateNumber": 50,
  "id": "cloudflare-agents-x402",
  "title": "Cloudflare Agents × Syra",
  "proofUsed": ["field or git fact"],
  "studioPaths": {
    "hub": "/post",
    "video": "/post/video/50",
    "photo": "/post/photo/50"
  },
  "files": [
    "web/src/content/posts/cloudflareAgentsX402Update.ts",
    "web/src/content/posts/photo/cloudflareAgentsX402Photo.ts",
    "web/src/content/posts/photo/shareCopies/cloudflareAgentsX402ShareCopies.ts"
  ],
  "oneAction": "Open /post/video/N, record or export; paste share copy from photo cards"
}
```

## Output format (strict)

### Proof used
### What shipped (git + conversation)
### Action (create | update #N)
### Files touched
### Studio links
### X copy (video / photo shareCopy fields)
### Post checklist
- [ ] 8 video kinds / 15 photo roles
- [ ] registry wired
- [ ] vitest green
- [ ] no em dashes in web copy
- [ ] claims repo-true
### State
- confirmed last-post.json updated

## Do not

- Duplicate an existing bundle for the same ship
- Change locked template #0
- Auto-push or post to X
- Run Ideas/Hype/Incumbent pipelines in the same turn unless asked
- Invent metrics, endpoints, or partner status
