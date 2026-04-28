# Up Only Fund (web)

Vite + React 18 + React Router + Tailwind + shadcn. **Up Only Fund** is presented as its own program brand; Syra is referenced as infrastructure (agent / APIs) rather than the primary mark.

## Brand

- **Wordmark + mark:** `BrandMark` (U↑ monogram + “Up Only Fund”).
- **Type:** `Outfit` for display / headings, `Space Grotesk` for body.
- **Accent:** `--uof` mint/utility token in `index.css` + Tailwind `uof` color.

## Routes

- `/` — UOF home (mission, principles, program surfaces, infrastructure note)
- `/uponly/overview` — $UPONLY tranche
- `/uponly/fund` — fund mandate and treasury
- `/uponly/rise` — RISE screener and tools

## Dev

```bash
npm install
npm run dev
```

API calls use the same `API_BASE` as the main Syra app (`/api` in dev via Vite proxy if configured, or `https://api.syraa.fun` in production).

## Deploy

Set `LINK_UPONLY_APP` in the main Syra `landing` app’s `config/global.ts` to this app’s public origin so legacy routes (`/uponly`, `/rise`, etc.) redirect correctly.
