# Up Only Fund — documentation index (plain Markdown)

This file is a **lightweight index** for the Up Only Fund web app. For RISE protocol details, use the official RISE documentation.

**RISE docs:** [https://docs.rise.rich](https://docs.rise.rich)

**This program (high level)**

- Mandate and sleeve: see the in-app **/landing** experience (Up Only Fund + $UPONLY).
- Live markets: in-app **/** and **/terminal** (read-only until you trade on rise.rich).
- On-chain details for the tranche: `src/data/riseUpOnly.ts` and on-page “On-chain + fees” sections when enabled in the app.

**Investor brief posts**

- Hub: `/post` — lists all available fund updates (video + photo).
- Video deck: `/post/video/:updateNumber` — e.g. `/post/video/1` for the mandate brief.
- Photo export: `/post/photo/:updateNumber` — matching photo templates per update.
- Registry: `src/content/posts/registry.ts` — append new bundles; max 10 kept (oldest dropped on overflow).
- Share URLs in X copy use the numbered path automatically via `src/lib/postShare.ts`.
- X publish status: click **On X** / **Not on X** in the post studio to flag whether an update is already posted. Status is saved in browser local storage (`src/lib/postXStatus.ts`). Optional default: `postedOnX: true` in each update's `meta`.

**Environment**

- `VITE_PUBLIC_SITE_ORIGIN` — optional; defaults to `https://uponly.fund` for canonical URLs and JSON-LD (`src/config/site.ts`).
