import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for OpenRouter x402 APIs photo deck — 15 distinct topics. */
export const OPENROUTER_X402_APIS_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra just shipped OpenRouter x402 APIs.

Pay-per-call chat, image, and video for agents. No OpenRouter account. No API keys. Just x402 USDC.

3 generative endpoints. Curated agentic models. Dynamic pricing.

→ syraa.fun/playground`,

  thesis: `Agents should not juggle OpenRouter keys, Stripe, and crypto APIs separately.

Syra now sells LLM reasoning, image generation, and video generation on the same x402 rails as /brain, /news, and /signal.

One treasury. One checkout. Full agent runtime.`,

  quote: `"Pay per token, per image, per second — on the chain you already use."

15 agentic chat models. Top image and video models. Live OpenRouter rates × margin.

Crypto intelligence + generative AI. One Syra brain.`,

  flow: `OpenRouter x402 on Syra — 4 steps:

1. Agent sends chat, image, or video request
2. Syra returns 402 with dynamic price from live rates
3. Wallet signs USDC on Solana, Base, or EVM
4. Payload delivered — JSON, images, or video job id

Same flow as every Syra paid API.`,

  timeline: `What shipped:

→ POST /chat/completions — 15 agentic models, OpenAI-compatible
→ POST /images/generations — Unified Image API, sync
→ POST /videos/generations — async submit + free status poll
→ GET /models on each — allowlist + live rates

Dedicated upstream billing. Profitable per call.`,

  pillars: `Three generative APIs:

→ Chat — Claude, GPT-5, Gemini, Kimi, DeepSeek, Qwen3
→ Image — Flux, Seedream, GPT Image, Recraft, Gemini
→ Video — Veo 3.1, Seedance, Wan, Sora 2 Pro

Curated for agents. Not a raw OpenRouter dump.`,

  checklist: `Live today:

→ Dynamic pricing: upstream rates × 40% margin
→ Agent defaults: tools, response_format, temp 0.2
→ Free /models discovery on each endpoint
→ x402 bazaar + /.well-known/x402 listing
→ Separate upstream key for unit economics

Test → syraa.fun/playground`,

  metrics: `3 generative APIs. 15 chat models. 1 checkout.

Syra agents can reason, generate images, and submit video jobs without leaving the x402 payment surface.

Machine payments meet generative AI.`,

  featured: `402 — pay per call for chat, image, and video.

No subscriptions. No API key management for callers. Syra handles OpenRouter upstream.

The agent runtime Syra was built to be.`,

  comparison: `Before: agents needed OpenRouter keys + Syra keys + separate billing.

Now: one x402 flow for crypto data and generative AI. Dynamic pricing keeps Syra sustainable.

Same brain. Fuller stack. Better economics.`,

  launch: `SHIP LOG · OpenRouter x402 APIs are live.

Chat completions. Image generation. Video generation.

Pay per call on Syra. Curated agentic models. Dynamic pricing.

Try now → syraa.fun/playground`,

  deepDive: `Technical surface:

→ /chat/completions — OpenAI-compatible, getPriceUsd per request
→ /images/generations — POST /api/v1/images passthrough
→ /videos/generations — job submit + GET /:id poll
→ OPENROUTER_API_KEY_x402 — isolated upstream billing
→ Listed in x402ResourceCatalog + discovery`,

  split: `One stack. Generative + intelligence.

CHAT
15 agentic models. Tools. Structured output.

IMAGE
Sync delivery. resolution, aspect_ratio, n.

VIDEO
Async jobs. Poll until ready.

→ api.syraa.fun/chat/completions/models`,

  terminal: `OpenRouter x402 from the terminal:

$ curl -X POST api.syraa.fun/chat/completions \\
  -d '{"messages":[{"role":"user","content":"Summarize BTC"}]}'
< HTTP/402 Payment Required · $0.004
$ syra-x402 pay && retry
< HTTP/200 OK · chat.completion + usage`,

  cta: `Reason. Generate. Pay per call.

→ Playground: syraa.fun/playground
→ Chat models: api.syraa.fun/chat/completions/models
→ Docs: docs.syraa.fun

Syra — crypto intelligence + generative AI on x402.`,
};
