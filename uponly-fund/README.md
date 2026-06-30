<div align="center">

# **Up Only Fund**

### Onchain capital for high conviction bets — backed by Syra

[![Website](https://img.shields.io/badge/Website-uponlyfund.com-26a5e4)](https://uponlyfund.com)
[![Syra](https://img.shields.io/badge/Backed_by-Syra-0ea5e9)](https://syraa.fun)
[![X](https://img.shields.io/badge/X-@uponly_fund-1da1f2)](https://x.com/uponly_fund)

**[Website](https://uponlyfund.com)** · **[X](https://x.com/uponly_fund)** · **[Telegram](https://t.me/uponly_fund)** · **[Syra Agent](https://agent.syraa.fun)** · **[Docs](https://docs.syraa.fun)**

</div>

---

## What is Up Only Fund?

**Up Only Fund (UOF)** is an independent **Solana allocator** with a published **80/20 thesis**: 80% into high-conviction utility tokens with working products and durable onchain demand, 20% into asymmetric memecoin plays with clear structure and verified liquidity. UOF is a **Syra-backed** program — Syra provides agent infrastructure, APIs, and treasury rails; **Up Only Fund** is the public allocator brand with mandate-first transparency.

> Nothing here promises returns. Markets are uncertain; treat every sleeve as high risk. Not financial advice.

| Pillar | Description |
|--------|-------------|
| **Mandate** | Conviction-first allocation on Solana — utility + memecoin sleeves |
| **Transparency** | Published thesis, treasury address (when set), holdings disclosures |
| **Liquid tranche** | `$UPONLY` — RISE venue experiment with floor mechanics (see site for live fields) |
| **Infrastructure** | Syra API for RISE screener, terminal KPIs, market data, and agent tooling |

---

## Brand

| Element | Detail |
|---------|--------|
| **Wordmark + mark** | `BrandMark` — U↑ monogram + “Up Only Fund” |
| **Typography** | `Outfit` (display/headings), `Space Grotesk` (body) |
| **Accent** | `--uof` mint/utility token in `index.css` + Tailwind `uof` color |
| **Tone** | Institutional allocator — mandate-first, disclosure-heavy |

Up Only Fund is presented as its **own program brand**. Syra is referenced as the backing infrastructure (agent, APIs, playground) — not the primary mark on allocator disclosures.

---

## Routes

### Marketing & mandate

| Route | Description |
|-------|-------------|
| `/` | UOF home — mission, 80/20 thesis, principles, program surfaces, strategic anchor |
| `/#mandate` | Fund mandate and treasury section |
| `/#landing-token` | `$UPONLY` liquid tranche overview |

### Command dashboard (RISE tools)

| Route | Description |
|-------|-------------|
| `/terminal` | RISE command terminal — screener, spotlight, trending markets |
| `/overview` | Markets overview and trending |
| `/market` | Market screener, watchlist, compare, floor scanner |
| `/wallet` | Connected wallet view |
| `/simulator` | Quote, borrow, and DCA simulators |
| `/insights` | Activity, whales, signals, news |
| `/create-token` | RISE token creation flow |
| `/token/:address` | Token detail page |

### Investor brief studio

| Route | Description |
|-------|-------------|
| `/post` | Numbered fund update registry |
| `/post/video/:n` | Video brief deck for screen recording |
| `/post/photo/:n` | Photo card export for social |

### Legacy redirects

`/uponly/overview`, `/uponly/fund`, `/uponly/rise`, and `/dashboard/*` redirect to the routes above. Set `LINK_UPONLY_APP` in the main Syra **`landing`** app’s `config/global.ts` so legacy paths on syraa.fun redirect to this app’s public origin.

---

## Relationship to Syra

| Brand | Role |
|-------|------|
| **Syra** | Parent infrastructure — machine money for agents (Earn, Treasury, Invest, Spend, Grow) |
| **Up Only Fund** | Syra-backed allocator — published mandate, RISE tooling, fund command dashboard |
| **S3 Labs** | Syra-backed growth studio — developer programs and community ([s3labs.id](https://s3labs.id)) |

RISE market data, terminal KPIs, and agent-adjacent routes call the Syra API (`api.syraa.fun`). Support email routes through Syra ops: `support@syraa.fun`.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite, TypeScript |
| **UI** | React 18, React Router, shadcn-ui, Tailwind CSS, Framer Motion |
| **Themes** | `next-themes` (dark default) |
| **API** | Syra gateway — RISE routes, market data, trusted-origin auth |

---

## Run locally

```bash
cd uponly-fund
npm install
npm run dev
```

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (default port from Vite config) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

### Environment

| Variable | Purpose |
|----------|---------|
| `VITE_PUBLIC_SITE_ORIGIN` | Canonical origin for OG URLs and JSON-LD (default `https://uponlyfund.com`) |
| `VITE_USE_LOCAL_API` | When `true` in dev, proxy `/api` to `localhost:3000` |

API calls use the same `API_BASE` as the main Syra app (`/api` in dev via Vite proxy, or `https://api.syraa.fun` in production). **Do not embed API keys** in the client.

---

## Deploy

1. Build and deploy the `uponly-fund` package to your host (e.g. Vercel).
2. Set `VITE_PUBLIC_SITE_ORIGIN` to the live origin (e.g. `https://uponlyfund.com`).
3. Update `LINK_UPONLY_APP` in `landing/config/global.ts` so syraa.fun legacy routes redirect correctly.
4. Ensure `uponlyfund.com` (and www) are in the Syra API trusted-origin allowlist.

---

## Data & config

- **Fund mandate / stats:** `src/data/upOnlyFund.ts`, `src/data/fundStats.ts`
- **RISE / $UPONLY manual fields:** `src/data/riseUpOnly.ts` — update mint, trade IDs, and live stats when published
- **Site origin:** `src/config/site.ts`
- **LLM summary:** `public/llms.txt`

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
