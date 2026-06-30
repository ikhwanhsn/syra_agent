import { OPENROUTER_X402_APIS_POST } from "../openrouterX402ApisUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { OPENROUTER_X402_APIS_PHOTO_SHARE_COPIES } from "./shareCopies/openrouterX402ApisShareCopies";

const copies = OPENROUTER_X402_APIS_PHOTO_SHARE_COPIES;

/** Photo-format content for OpenRouter x402 APIs ship log — 15 cards. */
export const OPENROUTER_X402_APIS_PHOTO = definePhotoUpdate(OPENROUTER_X402_APIS_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Chat · Image · Video",
      title: "OpenRouter × x402",
      subtitle: "Pay-per-call chat, image, and video for agents. Curated models. Dynamic pricing. No API keys for callers.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "Why Syra",
      headline: "Generative AI on the same rails as crypto intel.",
      body: "Agents already pay Syra for news, signals, and brain synthesis via x402. Now they pay for LLM reasoning, images, and video in the same HTTP 402 flow — no OpenRouter accounts, no key sprawl.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Crypto intelligence + generative AI. One Syra checkout.",
      narrative: "15 agentic chat models. Top image and video models. Live upstream rates with margin. Pay on the chain your treasury already uses.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "402 → pay → generate.",
      steps: [
        { step: "01", title: "Send request", description: "Chat messages, image prompt, or video prompt." },
        { step: "02", title: "Dynamic 402", description: "Price from live OpenRouter rates × margin." },
        { step: "03", title: "Sign USDC", description: "Solana, Base, or any enabled x402 network." },
        { step: "04", title: "Get payload", description: "JSON, images, or video job id." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "Three APIs. One payment surface.",
      steps: [
        { step: "01", title: "/chat/completions", description: "15 agentic models. Tools. Structured output." },
        { step: "02", title: "/images/generations", description: "Unified Image API. Sync delivery." },
        { step: "03", title: "/videos/generations", description: "Async submit. Free status poll." },
        { step: "04", title: "GET /models", description: "Allowlist + live rates on each route." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Curated for agents.",
      cards: [
        { title: "Chat", subtitle: "15 models", detail: "Claude, GPT-5, Gemini, Kimi, DeepSeek, Qwen3.", accent: "gold" },
        { title: "Image", subtitle: "10 models", detail: "Flux, Seedream, GPT Image, Recraft, Gemini.", accent: "gold" },
        { title: "Video", subtitle: "6 models", detail: "Veo 3.1, Seedance, Wan, Sora 2 Pro.", accent: "gold" },
        { title: "Pricing", subtitle: "Dynamic", detail: "Live rates × margin. Profitable per call." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Why this is best for Syra.",
      highlights: [
        "One x402 checkout for intel + generative AI",
        "Dynamic pricing — sustainable unit economics",
        "No API keys for agent callers",
        "Agent-tuned defaults: tools, temp 0.2, seed",
        "Listed in x402 bazaar and discovery",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Full agent runtime.",
      stats: [
        { value: "3", label: "Gen APIs" },
        { value: "15", label: "Chat models" },
        { value: "402", label: "Pay per call" },
      ],
      narrative: "Research crypto. Reason with LLMs. Generate images. Produce video. All settled in USDC on Syra.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Machine payments meet generative AI.",
      stats: [{ value: "402", label: "HTTP-native checkout" }],
      narrative: "Syra is the agent runtime: crypto data, brain synthesis, and now OpenRouter chat, image, and video — one treasury, one flow.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Fragmented stack vs. Syra x402.",
      compareLeft: {
        title: "Before",
        body: "OpenRouter keys. Separate billing. Crypto APIs elsewhere. Agents stitch it together.",
      },
      compareRight: {
        title: "Now",
        body: "One x402 surface. Dynamic pricing. Intel + chat + image + video on api.syraa.fun.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · OpenRouter · x402",
      partnerName: "OpenRouter",
      partnerLogo: "/images/partners/placeholder.svg",
      headline: "Syra × OpenRouter",
      subtitle: "Chat, image, video — pay per call. Built for agents.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "x402-native generative stack.",
      items: [
        "getPriceUsd(req) — dynamic quote before payment",
        "Dedicated OPENROUTER_API_KEY_x402 upstream billing",
        "Image: POST /api/v1/images passthrough",
        "Video: async submit + GET /videos/generations/:id",
        "Discovery in x402ResourceCatalog",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Agent defaults",
      headline: "Tuned for autonomous agents.",
      body: "Low temperature, tool calling, structured output, and provider require_parameters so agents get reliable completions — not random provider drift.",
      highlights: [
        "Chat: tools, tool_choice, response_format",
        "Image: resolution, aspect_ratio, n, seed",
        "Video: duration, resolution, frame_images",
        "Free GET /models before spending",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Chat completions in the wild.",
      terminalLines: [
        "$ curl api.syraa.fun/chat/completions/models",
        "< 15 agentic models + live rates",
        "$ curl -X POST .../chat/completions -d '{...}'",
        "< HTTP/402 · dynamic price $0.004",
        "$ syra-x402 pay && retry",
        "< HTTP/200 · chat.completion + usage",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Reason. Generate. Pay per call.",
      subtitle: "Open the playground or call api.syraa.fun from any x402 agent.",
      links: [
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "Chat", value: "/chat/completions", href: "https://api.syraa.fun/chat/completions/models" },
        { label: "Docs", value: "x402 API reference", href: "https://docs.syraa.fun/docs/api-reference" },
      ],
    }),
  },
]);
