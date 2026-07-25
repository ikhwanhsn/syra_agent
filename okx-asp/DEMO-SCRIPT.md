# OKX.AI Genesis — 90s Demo Script

**Goal:** Show Syra as a Finance Copilot for agents in under 90 seconds.  
**Required:** Clear use case + walkthrough. Upload in the #OKXAI X post (no separate upload needed).

## Preferred: ship-log Remotion export (post page)

1. Open **[/post/video/40](https://syraa.fun/post/video/40)** (or local `web` → `/post/video/40`)
2. Click **Download / Export → MP4**
3. Save as `okx-asp/out/syra-okxai-genesis-finance-copilot.mp4`

CLI (same composition as the post page):

```powershell
node okx-asp/export-post-demo-video.mjs
```

Slides follow this script (hook → problem → Brain demo → 402 flow → catalog → #OKXAI close).

---

## Shot list (mapped to video #40 slides)

### Hook (cover)
**VO:** "Syra is a Finance Copilot for agents on OKX.AI."  
Badge: Finance Copilot · x402 · #OKXAI

### Problem (statement)
**VO:** "Agents don't need another raw price feed. They need decisions — signals, risk, and research they can pay for per call."

### Live demo (hero)
BTC brief prompt → Brain + toolUsages.  
**VO:** "Pay per call with x402. Brain picks the tools. You get a grounded finance brief — not vibes."

### Flow (numbered)
Ask → 402 → pay → decide

### Catalog (cards + surfaces)
`/signal` · `/indicator` · `/sentiment` · `/arbitrage` · `/bitcoin` · `/brain`  
**VO:** "Forty-eight live finance APIs, plus Syra Brain as an A2A research agent on OKX.AI."

### Close
**On-screen:** Syra · Finance Copilot for Agents · **#OKXAI**  
URLs: syraa.fun · api.syraa.fun · docs.syraa.fun  
**VO:** "Syra. Finance Copilot for agents. #OKXAI"

---

## Tips

- Cap at **90 seconds** (hard rule) — Remotion deck is ~45–50s
- Landscape 16:9 for X
- `#OKXAI` on the closing slide
- Filename: `syra-okxai-genesis-finance-copilot.mp4`

## LLM path (fallback only)

If Remotion export fails, generative clips via `/llm` Video: [VIDEO-PROMPTS.md](./VIDEO-PROMPTS.md)

```powershell
node okx-asp/generate-demo-clips.mjs --skip-existing
node okx-asp/stitch-demo-video.mjs
```

---

## After export

1. Attach video to the X participation post ([X-POST.md](./X-POST.md))
2. Paste X URL into [FORM-SUBMISSION.md](./FORM-SUBMISSION.md)
