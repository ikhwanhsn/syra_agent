# Syra Brief — Nosana × ElizaOS hackathon entry

Personal **crypto briefing** agent: ElizaOS (`@elizaos/*` **1.7.x**) + **plugin-sql** + hosted LLM (OpenAI-compatible `.env`) + **custom web UI** on **`/syra-brief`** (same port as the Eliza client, usually **3000**).

- **Challenge:** [Superteam — Nosana Builders ElizaOS](https://superteam.fun/earn/listing/nosana-builders-elizaos-challenge)  
- **Nosana blog:** [Builders Challenge ElizaOS](https://nosana.com/blog/builders-challenge-elizaos/)  
- **Credits:** [nosana.com/builders-credits](https://nosana.com/builders-credits)  
- **Deploy UI:** [deploy.nosana.com](https://deploy.nosana.com/)  
- **Docs:** [learn.nosana.com](https://learn.nosana.com/)

---

## Step-by-step: do everything for submission

Do these **in order**. Check each box before moving on.

### Step 0 — Confirm deadline and rules (2 minutes)

1. Open the [Superteam listing](https://superteam.fun/earn/listing/nosana-builders-elizaos-challenge) and note the **submission deadline** and any last-minute requirement changes.  
2. Scroll to the **checklist** (GitHub fork, Nosana URL, video, stars, social, etc.) and keep that tab open.

### Step 1 — Protect secrets (5 minutes)

1. **Never commit** `.env`. It is in `.gitignore`; keep it that way.  
2. If `.env` was ever pushed to GitHub, **rotate** every key inside it.  
3. For **Nosana-hosted Qwen** endpoints, sponsors usually expect `OPENAI_API_KEY=nosana` (or the value from Discord/docs)—not a personal OpenAI key—unless you intentionally use OpenAI for local dev only.

### Step 2 — Local smoke test (10 minutes)

```powershell
cd hackathon\nosana\first
copy .env.example .env
# Edit .env with your working LLM + embedding settings
pnpm install
pnpm run build
pnpm run start
```

1. Browser: **`http://localhost:3000/`** — chat with SyraBrief (default UI).  
2. Browser: **`http://localhost:3000/syra-brief`** — custom panel (SOL snapshot + fast chat).  
3. If either fails, fix `.env` / port before Docker.

Optional: `powershell -File .\scripts\check-submission.ps1` from this folder (build + quick checks).

### Step 3 — Docker Hub account (5 minutes)

1. Create a [Docker Hub](https://hub.docker.com/) account if you do not have one.  
2. Create a **public** repository, e.g. `yourusername/syra-nosana-eliza-agent`.  
3. Remember the exact image name: `yourusername/syra-nosana-eliza-agent:latest`.

### Step 4 — Build and push the image (15–30 minutes)

**Requires Docker Desktop running** (Windows: start Docker Desktop; WSL2 backend is fine).

```powershell
cd hackathon\nosana\first
docker login
docker build -t YOUR_DOCKERHUB_USER/syra-nosana-eliza-agent:latest .
docker push YOUR_DOCKERHUB_USER/syra-nosana-eliza-agent:latest
```

1. Replace `YOUR_DOCKERHUB_USER` with your Docker Hub username.  
2. Wait for push to finish; confirm the repo is **public** on Docker Hub.

### Step 5 — Nosana builders credits (10 minutes + wait)

1. Go to [nosana.com/builders-credits](https://nosana.com/builders-credits) and sign in / connect wallet per their flow.  
2. Credits can arrive on a schedule—if balance is zero, check Discord / try again later.

### Step 6 — Job definition JSON (5 minutes)

1. Open `nos_job_def/nosana_eliza_job_definition.json`.  
2. Set `"image"` to the **same** string you pushed: `YOUR_DOCKERHUB_USER/syra-nosana-eliza-agent:latest`.  
3. Align `env` with your working `.env` (LLM URL, `MODEL_NAME`, embedding URL/model/dimensions, `PGLITE_DATA_DIR=/app/data/.elizadb`).  
4. Confirm URLs with [Nosana Discord](https://nosana.com/discord) if anything changed since the blog post.

### Step 7 — Deploy on Nosana (15–30 minutes)

1. Open [deploy.nosana.com](https://deploy.nosana.com/) and connect the wallet you used for credits.  
2. Create / paste a job from **`nos_job_def/nosana_eliza_job_definition.json`** (dashboard UX may differ—follow current Nosana UI labels).  
3. Expose **port 3000** to match the container.  
4. When the job is **running**, copy the **public HTTPS URL** Nosana gives you. Save it as `MY_NOSANA_URL`.

### Step 8 — Verify production (10 minutes)

In an **incognito** window (or your phone off Wi‑Fi):

1. Open `MY_NOSANA_URL/` — main chat loads.  
2. Open `MY_NOSANA_URL/syra-brief` — snapshot + Brief chat load.  
3. Send one short message in each UI; note approximate latency for your demo script.

### Step 9 — GitHub (20 minutes)

Pick **one** approach:

- **A (recommended):** Fork [nosana-ci/agent-challenge](https://github.com/nosana-ci/agent-challenge), then copy the contents of `hackathon/nosana/first/` from this monorepo **into the fork root** (or a clear subfolder + README pointer), commit, push.  
- **B:** Create a **new public repo** (e.g. `syra-brief-nosana`), copy this folder’s contents to the repo root, commit, push.

Requirements: repo is **public**, README explains how to run and deploy, **no secrets** in git.

### Step 10 — Star required repositories (2 minutes)

From the live Superteam listing, star every repo they require (commonly includes):

- [nosana-ci/agent-challenge](https://github.com/nosana-ci/agent-challenge)  
- [nosana-ci/nosana-programs](https://github.com/nosana-ci/nosana-programs)  
- [nosana-ci/nosana-kit](https://github.com/nosana-ci/nosana-kit)  
- [nosana-ci/nosana-cli](https://github.com/nosana-ci/nosana-cli)  
- [elizaos/eliza](https://github.com/elizaos/eliza) (if listed)

### Step 11 — Record the demo video (&lt; 1 minute)

Script (practice twice, then record):

1. **5 s:** “SyraBrief — personal crypto briefing on Nosana + ElizaOS.”  
2. **20 s:** Open `MY_NOSANA_URL` in a clean window; show main chat—one greeting.  
3. **25 s:** Open `MY_NOSANA_URL/syra-brief`—show SOL snapshot + one short question + answer.  
4. **10 s:** “Stack: ElizaOS, Docker on Nosana, Qwen via sponsor endpoint; repo link in description.”

Export **1080p or 720p**, **&lt; 60 seconds**, MP4 is fine.

### Step 12 — Write the description (≤ 300 words)

Use this skeleton (fill brackets; stay under 300 words):

> **SyraBrief** is a personal crypto briefing agent for builders who want [one sentence: your “why”]. It runs on **Nosana** decentralized compute with **ElizaOS** orchestration and a hosted **Qwen**-compatible LLM.  
> **What it does:** [2–3 bullets: main chat + /syra-brief panel + FETCH_SOL_PRICE / disclaimers].  
> **How it works:** Dockerized Node 23 app; `plugin-sql` for memory; OpenAI-compatible env for chat/embeddings; custom routes serve **`/syra-brief`**.  
> **Try it:** [paste `MY_NOSANA_URL`]  
> **Repo:** [paste GitHub URL]

### Step 13 — Social post (2 minutes)

Post on X (or platform the listing allows). Include:

- One sentence what you built  
- `MY_NOSANA_URL`  
- Hashtag **`#NosanaAgentChallenge`**  
- Mention **`@nosana_ai`** (and `@elizaos` if you want)

### Step 14 — Submit on Superteam (10 minutes)

1. Open the [listing submit flow](https://superteam.fun/earn/listing/nosana-builders-elizaos-challenge).  
2. Paste: **GitHub URL**, **Nosana deployment URL**, **description**, **video link**, link to **social post**.  
3. Double-check every **required** field from the listing; incomplete submissions are rejected.

### Step 15 — After submit (optional)

- Post the same demo in [Nosana Discord](https://nosana.com/discord) builder channel if allowed.  
- Keep the Nosana job funded / running until winners are announced.

---

## What ships in this folder

| Piece | Purpose |
|--------|---------|
| `src/index.ts` | Eliza **Project** (`default export`) — wires `character` + `syra-brief` plugin |
| `src/character.ts` | **SyraBrief** persona |
| `src/plugin.ts` | **FETCH_SOL_PRICE** + routes **`/syra-brief`** (snapshot + fast `useModel` chat) |
| `Dockerfile` | Node **23** + **pnpm** → `pnpm run build` → `pnpm run start` |
| `nos_job_def/nosana_eliza_job_definition.json` | Job template for Nosana |
| `scripts/check-submission.ps1` | Optional Windows preflight |
| `.env.example` | Env template |

## Custom UI

- **Default client:** `/`  
- **Syra Brief (custom):** `/syra-brief` — SOL snapshot + direct LLM chat (fast path)

## Local development (short)

```powershell
cd hackathon\nosana\first
copy .env.example .env
pnpm install
pnpm run build
pnpm run start
```

**Windows note:** `tsc` uses relative type imports under `node_modules/@elizaos/core/dist/types/` so the project builds reliably; runtime still uses normal `@elizaos/*` packages.

## Judging alignment (quick)

| Criterion | How this entry maps |
|-----------|---------------------|
| Technical | Eliza Project, plugin actions/routes, timeouts, typed build |
| Nosana | Docker + job JSON + credits + public URL |
| Usefulness & UX | Main chat + `/syra-brief` + errors + snapshot |
| Creativity | Personal “briefing desk” for crypto builders |
| Documentation | This README + `.env.example` |

## Optional upgrades (time permitting)

- `@elizaos/plugin-web-search` behind an env flag  
- Rate limit or auth on `/syra-brief/api/chat`  
- Extra Eliza actions (e.g. saved briefs in SQL)
