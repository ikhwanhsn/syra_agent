import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for OpenRouter x402 APIs photo deck. 15 distinct topics. */
export const OPENROUTER_X402_APIS_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `OpenRouter on Syra is now pay-per-call chat, image, and video for agents.

Curated models. Dynamic pricing from live upstream rates. No API keys for callers. x402 means you pay only when you call.

syraa.fun/playground`,

  thesis: `Generative AI now sits on the same rails as crypto intel.

Agents already pay Syra for news, signals, and brain synthesis via x402. Now they pay for LLM reasoning, images, and video in the same HTTP 402 flow. No OpenRouter accounts. No key sprawl.

syraa.fun/playground`,

  quote: `Crypto intelligence and generative AI share one Syra checkout.

15 agentic chat models. Top image and video models. Live upstream rates with margin. Pay on the chain (the network that holds the money) your treasury already uses.

syraa.fun/playground`,

  flow: `402, pay, generate.

1. Send chat messages, an image prompt, or a video prompt
2. Dynamic 402 prices from live OpenRouter rates plus margin
3. Sign USDC (digital dollars) on Solana, Base, or any enabled x402 network
4. Get JSON, images, or a video job id

syraa.fun/playground`,

  timeline: `Three APIs share one payment surface.

1. /chat/completions: 15 agentic models, tools, structured output
2. /images/generations: Unified Image API, sync delivery
3. /videos/generations: async submit, free status poll
4. GET /models: allowlist plus live rates on each route

api.syraa.fun/chat/completions/models`,

  pillars: `Curated for agents.

Chat is 15 models: Claude, GPT-5, Gemini, Kimi, DeepSeek, Qwen3. Image is 10 models: Flux, Seedream, GPT Image, Recraft, Gemini. Video is 6 models: Veo 3.1, Seedance, Wan, Sora 2 Pro. Pricing is dynamic from live rates plus margin, profitable per call.

api.syraa.fun/chat/completions/models`,

  checklist: `Why this is best for Syra.

1. One x402 checkout for intel plus generative AI
2. Dynamic pricing for sustainable unit economics
3. No API keys for agent callers
4. Agent-tuned defaults: tools, temp 0.2, seed
5. Listed in x402 bazaar and discovery

syraa.fun/playground`,

  metrics: `Full agent runtime.

3 gen APIs. 15 chat models. 402 pay per call.

An agent can research crypto, reason with LLMs, generate images, and produce video, all settled in USDC on Syra.

syraa.fun/playground`,

  featured: `Machine payments meet generative AI.

HTTP-native 402 checkout. Syra is the agent runtime: crypto data, brain synthesis, and now OpenRouter chat, image, and video. One treasury, one flow.

syraa.fun/playground`,

  comparison: `Fragmented stack vs Syra x402.

Before, OpenRouter keys, separate billing, crypto APIs elsewhere, agents stitching it together. Now one x402 surface on api.syraa.fun covers intel, chat, image, and video, with dynamic pricing.

api.syraa.fun/chat/completions/models`,

  launch: `Syra x OpenRouter is live.

Chat, image, and video generation are pay-per-call and built for agents.

syraa.fun/playground`,

  deepDive: `x402-native generative stack.

getPriceUsd(req) builds a dynamic quote before payment. Dedicated OPENROUTER_API_KEY_x402 handles upstream billing. Image is POST /api/v1/images passthrough. Video is async submit plus GET /videos/generations/:id. Discovery lives in x402ResourceCatalog.

docs.syraa.fun`,

  split: `Tuned for autonomous agents.

Low temperature, tool calling, structured output, and provider require_parameters so agents get reliable completions, not random provider drift. Chat exposes tools, tool_choice, response_format. Image exposes resolution, aspect_ratio, n, seed. Video exposes duration, resolution, frame_images. GET /models is free before spending.

api.syraa.fun/chat/completions/models`,

  terminal: `Chat completions in the wild.

curl api.syraa.fun/chat/completions/models lists 15 agentic models plus live rates. POST /chat/completions returns HTTP 402 with a dynamic price such as $0.004. Pay and retry for HTTP 200 with chat.completion plus usage.

api.syraa.fun/chat/completions/models`,

  cta: `Reason, generate, and pay per call.

Open the playground or call api.syraa.fun from any x402 agent.

syraa.fun/playground
api.syraa.fun/chat/completions/models
docs.syraa.fun`,
};
