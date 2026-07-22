# Okara-Inspired Growth Playbook for Syra

**Brand:** Machine Money for Agents  
**Live wedge:** Pay-per-call crypto APIs over x402 (Spend)  
**Primary channel (this plan):** SEO programmatic pages  
**Secondary:** X content engine · Tertiary: view-priced creator launches  
**Companion doc:** [MACHINE_MONEY_STRATEGY.md](./MACHINE_MONEY_STRATEGY.md) (positioning, unit economics, pillar ladder, fundraise checklist)

This document adapts Okara’s public growth case study ([0 → 300k monthly visitors](https://okara.ai/blog/how-we-grew-okara-to-300k-visitors), [1.8M-view launch under $2K](https://okara.ai/blog/how-we-got-1-8m-views-launch-under-2k)) to Syra’s agent/dev ICP. It does **not** replace the machine-money strategy — it is the **distribution layer** on top of it.

---

## 1. Okara teardown (what actually worked)

| Lever | What Okara did | Why it worked |
|-------|----------------|---------------|
| Focus | 3 channels only (X, SEO, influencers) after a hard pivot | Buyers already live there; depth beats spray |
| SEO | Dedicated page **per agent** + competitor roundups + educational how-tos + own-category keyword cluster | Compounding assets; their Reddit-agent page hit page one |
| X | 4 formats × 4–5 posts/day; cross-post LinkedIn | Habit + volume in the crypto/builder feed |
| Influencers | Creators priced on **views not followers** (~$5 CPM); 100+ lined up 3–4 days early; coordinated first hour | Agency quotes $50–100K; they spent <$2K for 1.8M views |
| Review loop | 30–60 day cut of underperforming tactics | Prevents zombie channels |

### What maps to Syra

- **Programmatic SEO as the compounding engine** — Syra has 47 curated MCP tools and dozens of x402 routes. That is the equivalent of Okara’s “page per agent.”
- **Own-category cluster** — “machine money,” “x402 API,” “pay per call API,” “agent payments.”
- **X ship-log factory** — `/post` Remotion + photo decks already exist; map Okara’s 4 formats onto them.
- **Honest, cheap creator launches** — possible for demos/ship announcements; price on views.

### What does *not* map (do not copy blindly)

| Okara pattern | Why Syra should adapt |
|---------------|------------------------|
| ICP = founders/marketers buying an AI CMO | Syra ICP = agent builders + crypto/dev operators. SEO keywords and creator briefs must be technical. |
| Viral “Claude killed agencies” TikTok formats | Avoid earnings/return hype; respect the honest pillar ladder (Spend Live only). |
| Flat $99/mo SaaS narrative | Syra monetizes per call (x402 USDC). Pricing pages must explain micropayments, not seats. |
| Traffic as the north star | Syra north star remains **weekly paid API calls + unique paying wallets**. Traffic is an input. |

**Falsifier:** SEO traffic rises but first-402 → first-paid stays flat → stop pouring into pages and fix activation (see MACHINE_MONEY_STRATEGY 30-day loop).

---

## 2. Positioning reminder (do not dilute)

> For agent builders who need crypto intelligence and capital actions without per-vendor API keys, Syra is **machine money for agents**. Live today: USDC settlement on HTTP 402 via MCP and a typed SDK.

Public honesty rule: lead with Spend Live. Never imply Earn / Treasury / Invest / Grow are equally shipped.

---

## 3. SEO programmatic architecture (primary build)

Okara’s highest-leverage durable asset was **one page per product unit**. For Syra that unit is a **tool**, an **API route**, or a **comparison**.

### 3.1 Page types

| Cluster | URL pattern | Source of truth | Intent |
|---------|-------------|-----------------|--------|
| MCP tools | `/tools/<toolId>/` | `mcp-server/docs/generated/curated-tools.md` | “Nansen MCP”, “crypto news agent tool”, “pump.fun scout MCP” |
| APIs | `/apis/<slug>/` | root `openapi.json` (paid ops with `x-payment-info`) | “x402 news API”, “pay per call sentiment API” |
| Comparisons | `/vs/<slug>/` | `web/scripts/seo/competitors.json` | “Syra vs Nansen”, “alternative to CoinGecko API keys” |
| Hubs | `/tools/`, `/apis/`, `/vs/` | generator | Crawl depth + internal links |
| Pricing | `/pricing/` | docs Build Pricing copy | High-intent “x402 pricing”, “pay per call API cost” |

Generator: `web/scripts/seo/generate.mjs` → static HTML under `web/public/` (CSP-safe, no external scripts). Vercel serves real files before the SPA rewrite in `web/vercel.json`.

### 3.2 Keyword clusters

**High-intent (capture):**

- x402 API · pay per call API · agent payments · USDC micropayments  
- crypto API for AI agents · MCP crypto tools · HTTP 402 payment  
- Solana agent API · auto-pay API for agents

**Own-category (own):**

- machine money · machine money for agents · Syra x402 · Syra MCP

**Per-page (long-tail):**

- tool role phrases from curated tools (“smart money netflow MCP”, “DefiLlama TVL agent tool”)
- competitor “vs / alternative” queries

### 3.3 On-page requirements (every generated page)

1. Unique `<title>` + meta description + canonical (`https://www.syraa.fun/...`)
2. OG / Twitter tags
3. JSON-LD (`SoftwareApplication` or `TechArticle` + `BreadcrumbList`)
4. Real body: what it does, price band / x402 note, copy-paste MCP or SDK snippet
5. Internal links: hub → siblings → `/marketplace`, docs, `/agent`
6. Primary CTA → first paid call path (MCP install or marketplace Integrate)

### 3.4 Educational content (thin today — grow after infra)

Existing: 5 articles in `web/src/data/marketing/articles.ts`. After programmatic pages ship, add **1 how-to or comparison article / week** targeting the clusters above. Do not expand articles before sitemap + tool pages are live.

### 3.5 Technical SEO checklist

- [x] Build-time static HTML for tool/api/vs/pricing (this plan)
- [x] `sitemap.xml` + `robots.txt` Sitemap line
- [ ] Submit sitemap in Google Search Console / Bing
- [ ] Fix SPA crawl gaps for marketing React routes over time (prerender or migrate critical routes) — **deferred**, not blocking programmatic pages
- [ ] Monitor Search Console impressions/clicks by cluster every 30 days

---

## 4. X content engine (secondary)

Okara formats → Syra mapping:

| Okara format | Syra equivalent | Asset |
|--------------|-----------------|-------|
| Product launches | Ship-log launches (new route, chain, partner) | `/post` video + photo decks |
| Educational | “How x402 works”, “first paid call in 5 min” | Threads + article cards |
| Opinionated takes | Machine-money / agent economy thesis (no pillar vapor) | Founder posts |
| Demos | Live MCP call / marketplace pay → JSON | Short clips from agent UI |

**Cadence (bootstrap):** 3–5 posts/day on `@syra_agent` for 90 days, then cut formats that do not drive docs/marketplace visits or paid calls. Cross-post LinkedIn when the post is educational (not pure crypto meme).

**Do not build** auto-posting infra in this task — use the existing post studio manually.

---

## 5. Creator launch playbook (tertiary)

Use Okara’s **view-priced** model, adapted for a technical audience.

### Rules

1. Price creators on **average views**, not follower count. Start ~$5 CPM; negotiate up only when justified.
2. Line up 50–100 creators **3–4 days** before a launch (ship milestone: new MCP release, Algorand/Base rail, design-partner case study).
3. Brief: **demo the paid call**, not token price or “AI wealth.” Show install → 402 → JSON.
4. Coordinated first hour: one launch tweet + creator quote-tweets/replies.
5. Budget ceiling for first experiment: **≤ $2K**. Kill if no lift in marketplace visits or first paid calls within 14 days.

### Anti-patterns

- Agency retainers before organic X + SEO compound  
- Guaranteed-returns or “agents make money for you” claims  
- Launching before time-to-first-paid-call is documented &lt;10 min

---

## 6. 30 / 60-day review loop

Aligns with MACHINE_MONEY_STRATEGY horizons; adds SEO-specific gates.

### Day 0–30

| Outcome | Metric | Owner |
|---------|--------|-------|
| Programmatic pages live + indexed | sitemap submitted; GSC coverage for `/tools/`, `/apis/`, `/vs/` | Eng / Growth |
| Activation still primary | First paid call &lt;10 min documented | Product / DevRel |
| X cadence started | ≥3 posts/day using ship-log assets | Founder |

### Day 30–60

| Outcome | Decision rule |
|---------|---------------|
| SEO cluster with zero impressions after 45 days | Rewrite titles/body or kill page type |
| Cluster with impressions but no CTR | Fix titles/meta; A/B one H1 pattern |
| Traffic up, paid callers flat | **Stop SEO expansion**; fix activation funnel |
| One X format drives ≥50% of referral paid calls | Double that format; cut the other three |

### Kill / defer (growth-specific)

| Kill / defer | Why |
|--------------|-----|
| Broad paid social before SEO+X compound | Wrong CAC for bootstrap |
| Blog spam / AI keyword stuffing | Burns trust; contradicts honest brand |
| Token-led CTAs on SEO pages | Wrong ICP; dilutes Spend wedge |
| Prerendering entire SPA before programmatic pages | Premature; static generator covers Okara-style assets |
| Influencer spend without a working demo video | Okara’s launch video carried the weight |

---

## 7. Metrics

| Stage | Metric | Source |
|-------|--------|--------|
| Awareness | Impressions / clicks by page cluster | Search Console |
| Interest | `/tools/*`, `/apis/*`, `/vs/*`, docs visits | Vercel Analytics + logs |
| Activation | First 402 → first paid per payer | API KPI / public metrics |
| Revenue | Weekly paid calls, USDC settled | `GET /api/metrics`, `/analytics/kpi` |
| Retention | D7 repeat paying wallets | Existing north star |
| X | Referral clicks → marketplace / docs | UTM on launch tweets |

North star remains **weekly paid API calls + unique paying wallets**. SEO success without activation is vanity.

---

## 8. 30-day cofounder checklist (SEO-first)

1. Ship generator + hubs + pricing + sitemap (this repo change).
2. Submit sitemap; verify sample `/tools/<id>/` returns 200 HTML (not SPA shell only).
3. Record one screen capture: MCP install → first paid call.
4. Publish one comparison article (`/articles`) that links into `/vs/` pages.
5. Start X cadence with 4 formats; tag posts with UTMs.
6. Optional: shortlist 20 crypto/dev creators for a future <$2K launch (do not spend until activation clip exists).

---

## 9. Open risks

- **SPA SEO debt** on React marketing routes remains; programmatic pages mitigate but do not fix `/articles` crawl depth.
- **Thin unique copy** if generator templates are too similar → Google may soft-filter; expand unique paragraphs per tool over time.
- **Upstream brand conflict** on `/vs/nansen` etc. — keep copy factual and non-defamatory; emphasize “one wallet, many tools” not “they are bad.”
- **Activation gate** still the business risk; growth without &lt;10 min first paid call wastes the Okara lesson.

---

## 10. References

- Okara: [How we grew to 300K visitors](https://okara.ai/blog/how-we-grew-okara-to-300k-visitors) · [1.8M views under $2K](https://okara.ai/blog/how-we-got-1-8m-views-launch-under-2k)
- Syra strategy: [MACHINE_MONEY_STRATEGY.md](./MACHINE_MONEY_STRATEGY.md)
- Generator: `web/scripts/seo/`
- Brand modules: `web/src/lib/syraBranding.ts`, `documentation/src/content/syraBrand.ts`
