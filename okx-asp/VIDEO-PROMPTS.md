# OKX.AI Genesis — LLM Video Prompts

**Page:** https://syraa.fun/llm → Video tab (16:9 + generate audio on)  
**CLI (same OpenRouter backend as Labs):** `node okx-asp/generate-demo-clips.mjs`  
**Stitch:** `node okx-asp/stitch-demo-video.mjs`  
**Constraint:** Google Veo on OpenRouter only allows **4 / 6 / 8s** per clip — we use seven **8s** beats (~56s final).

Style: dark charcoal + gold, readable type, no purple neon, no emoji.

---

## Clip files

| File | Duration | Beat |
|------|----------|------|
| `01-hook.mp4` | 8s | Brand intro |
| `02-problem.mp4` | 8s | Raw data vs Finance Copilot |
| `03a-ask.mp4` | 8s | Brain question typed |
| `03b-pay.mp4` | 8s | HTTP 402 → paid |
| `03c-report.mp4` | 8s | Markdown brief + toolUsages |
| `04a-catalog.mp4` | 8s | Finance routes flash |
| `04b-close.mp4` | 8s | End card + #OKXAI |

Prompts live in [`generate-demo-clips.mjs`](./generate-demo-clips.mjs) (source of truth for generation).

Paste-ready copies for the UI:

### 01-hook (8s)

```
Cinematic 16:9 product intro for Syra Finance Copilot. Dark charcoal background with subtle gold light. Large clean typography: "Syra" as hero brand, then "Finance Copilot for Agents", badge row "x402 · OKX.AI · #OKXAI". Soft camera push-in. Professional fintech motion graphics, high contrast readable text. Implied VO: "Syra is a Finance Copilot for agents on OKX.AI." No people. Avoid blurry text, purple neon, anime, emoji, watermark.
```

### 02-problem (8s)

```
Cinematic 16:9 split-screen. Left "Raw data": cluttered gray charts and tickers. Right "Syra Finance Copilot": clean gold cards labeled Signal, Risk, Brain on dark charcoal. Wipe left to right. Subtitle: "Agents need decisions — not another price feed." Implied VO about decisions over raw feeds. Avoid purple neon, emoji, blurry text.
```

### 03a-ask (8s)

```
Cinematic 16:9 dark desktop UI mock. Header "Syra Brain". Chat bubble types the question: "Give me a quick BTC market brief: signal, sentiment, and key risks in the last 24h." Cursor typing animation, readable text, gold accents. Product demo style. Avoid purple, emoji, unreadable text.
```

### 03b-pay (8s)

```
Cinematic 16:9 dark UI. Large red badge "HTTP 402 Payment Required" then transitions to green "Paid · x402 · X Layer USDC" confirmation. Syra header. Clean fintech motion. Implied VO: "Pay per call with x402." Avoid purple neon, emoji, blurry text.
```

### 03c-report (8s)

```
Cinematic 16:9 dark UI showing a markdown BTC finance brief with sections Signal, Sentiment, Risks, and a toolUsages list: news, signal, sentiment. Syra Brain header. Scroll subtly. Implied VO: "Brain picks the tools. Grounded finance brief — not vibes." Readable text, gold accents. Avoid purple, emoji, watermark.
```

### 04a-catalog (8s)

```
Cinematic 16:9 dark background. Elegant flash of API route chips: /signal /indicator /sentiment /arbitrage /bitcoin /brain. Caption "48+ live finance APIs + Syra Brain A2A". Gold on charcoal motion graphics. Avoid purple, emoji, blurry text.
```

### 04b-close (8s)

```
Cinematic 16:9 end card. Large text "Syra · Finance Copilot for Agents". Then burn in "#OKXAI" clearly and hold. Small URLs: syraa.fun · api.syraa.fun · docs.syraa.fun. Dark charcoal, gold accents. Implied VO: "Syra. Finance Copilot for agents. #OKXAI." Avoid purple, emoji, blurry text.
```
