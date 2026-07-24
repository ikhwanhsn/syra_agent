import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for OpenRouter x402 APIs photo deck. 15 distinct topics. */
export const OPENROUTER_X402_APIS_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces that Syra now sells chat, image, and video generation the same way it sells crypto data.

The badge marks the three new categories: chat, image, and video. Every call is pay-per-call for agents, using a curated model list, dynamic pricing, and no OpenRouter account required from the caller.

syraa.fun/playground`,

  thesis: `This card names why OpenRouter sits on the same rails as Syra's other APIs: agents already pay per call for news, signals, and brain synthesis, so reasoning and generation belong in the same flow.

The same 402 checkout now covers LLM chat, image generation, and video generation. There is no separate OpenRouter account to set up and no extra API key to manage.

syraa.fun/playground`,

  quote: `The line on this card is the pitch in short form: crypto intelligence and generative AI, one Syra checkout.

Fifteen agentic chat models, plus top image and video models, priced from live upstream rates with a margin added. Pay on whichever chain your treasury already uses.

syraa.fun/playground`,

  flow: `This image walks a generative call through Syra's x402 flow in four steps.

1. Send a request: chat messages, an image prompt, or a video prompt
2. Get a 402 with a price built from live OpenRouter rates plus margin
3. Sign a USDC payment on Solana, Base, or any other enabled network
4. Receive the payload: JSON for chat, images for image requests, or a job id for video

syraa.fun/playground`,

  timeline: `This timeline covers the three APIs that shipped under one payment surface.

1. /chat/completions launched with 15 agentic models, tool calling, and structured output
2. /images/generations launched on the Unified Image API with synchronous delivery
3. /videos/generations launched as an async submit with a free status poll
4. GET /models added on each route, listing the allowlist and live rates

api.syraa.fun/chat/completions/models`,

  pillars: `This bento layout breaks down the models curated for each category.

Chat covers 15 models, including Claude, GPT-5, Gemini, Kimi, DeepSeek, and Qwen3. Image covers 10 models, including Flux, Seedream, GPT Image, Recraft, and Gemini. Video covers 6 models, including Veo 3.1, Seedance, Wan, and Sora 2 Pro. Pricing is dynamic, built from live rates plus margin, so each call stays profitable.

api.syraa.fun/chat/completions/models`,

  checklist: `This checklist is why the OpenRouter APIs fit Syra's model.

1. One x402 checkout now covers intelligence and generative AI together
2. Dynamic pricing keeps the unit economics sustainable
3. Agent callers never need an API key
4. Defaults are tuned for agents: tool calling, a temperature of 0.2, and seed support
5. All three routes are listed in the x402 bazaar and discovery catalog

syraa.fun/playground`,

  metrics: `The numbers on this card describe the full agent runtime.

3 generative APIs sit alongside 15 chat models, and 402 is the pay-per-call mechanism for all of them. An agent can research crypto, reason with an LLM, generate images, and produce video, all settled in USDC on Syra.

syraa.fun/playground`,

  featured: `This featured card is about what Syra has become: a runtime, not just a data feed.

402 stays the HTTP-native checkout for everything, from crypto data and brain synthesis to the new OpenRouter chat, image, and video routes. One treasury, one payment flow, across all of it.

syraa.fun/playground`,

  comparison: `This before-and-after card compares a fragmented setup with a single checkout.

Before, an agent needed OpenRouter keys, separate billing, and Syra's crypto APIs somewhere else entirely, stitching all of it together itself. Now one x402 surface on api.syraa.fun covers intelligence, chat, image, and video, priced dynamically.

api.syraa.fun/chat/completions/models`,

  launch: `This partnership card marks Syra and OpenRouter as live together.

Chat, image, and video generation are now pay-per-call, built specifically for agents rather than a raw OpenRouter passthrough.

syraa.fun/playground`,

  deepDive: `This deep-dive card lists the technical surface behind the OpenRouter integration.

getPriceUsd builds a dynamic quote for each request before payment. A dedicated OPENROUTER_API_KEY_x402 keeps upstream billing isolated. Image requests pass through to OpenRouter's /api/v1/images. Video requests submit asynchronously and poll GET /videos/generations/:id. All three routes are listed in x402ResourceCatalog for discovery.

docs.syraa.fun`,

  split: `This split card explains why the defaults are tuned specifically for agents, not general chat users.

Chat requests default to tool calling, tool_choice, and structured response formats. Image requests expose resolution, aspect ratio, count, and seed. Video requests expose duration, resolution, and frame images. GET /models is free on every route, so an agent can check pricing before spending anything.

api.syraa.fun/chat/completions/models`,

  terminal: `This terminal card shows a real chat completion call end to end.

Checking /chat/completions/models lists the 15 agentic models with live rates. Posting a chat request returns 402 with a dynamic price. Paying and retrying returns 200 with the completion and usage data.

api.syraa.fun/chat/completions/models`,

  cta: `This closing card is the summary: reason, generate, and pay per call.

Open the playground or call api.syraa.fun directly from any x402 agent.

syraa.fun/playground
api.syraa.fun/chat/completions/models
docs.syraa.fun`,
};
