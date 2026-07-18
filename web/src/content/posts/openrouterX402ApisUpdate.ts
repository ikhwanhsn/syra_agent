import { Bot, Coins, Image, MessageSquare, Terminal, Zap } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: OpenRouter x402 APIs: chat, image, and video generation with dynamic pricing.
 */
export const OPENROUTER_X402_APIS_POST: PostUpdate = {
  meta: {
    updateNumber: 20,
    id: "openrouter-x402-apis",
    title: "OpenRouter x402 APIs",
    published: "June 2026",
    tagline: "Pay-per-call chat, image, and video for agents. Curated models, dynamic pricing, zero API keys",
    shareCopyVideo: `SHIP LOG · Syra just shipped OpenRouter x402 APIs.

Agents pay per call for LLM reasoning, image generation, and video generation. No OpenRouter account. No API key management. Just x402 USDC on the chain you already use.

? POST /chat/completions: 15 top agentic text models
? POST /images/generations: Unified Image API, sync delivery
? POST /videos/generations: async video jobs + free status poll
? Dynamic pricing: live OpenRouter rates ?- margin, profitable per call
? Agent defaults: tools, response_format, low temperature, seed

Crypto intelligence + generative AI. One Syra checkout.

Full breakdown in the video ?`,
    shareCopyPhoto: `SHIP LOG · OpenRouter x402 APIs are live on Syra.

Pay-per-call chat, image, and video for autonomous agents. Curated agentic models. Dynamic pricing so every call is sustainable.

? POST /chat/completions: reasoning + tool calling
? POST /images/generations: text-to-image, sync
? POST /videos/generations: submit job, poll status

No API keys for callers. x402 only.

Try it ? syraa.fun/playground`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-split",
      label: "Cover",
      eyebrow: "Ship log",
      title: "OpenRouter ?- x402",
      subtitle: "Chat, image, and video generation. Pay per call on Syra. Built for agents, priced to scale.",
      badge: "3 APIs · dynamic pricing",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-centered",
      label: "Context",
      kicker: "Why Syra",
      headline: "Agents need generative AI on the same rails as crypto intelligence.",
      body: "Syra already sells news, signals, on-chain reads, and brain synthesis via x402. Now agents pay for LLM reasoning, images, and video in the same HTTP 402 flow. No separate OpenRouter billing, no key sprawl, no subscription lock-in.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-checklist",
      label: "Shipped",
      kicker: "What we built",
      headline: "Three OpenRouter APIs behind x402",
      body: "Curated allowlists of the best agentic models on OpenRouter. Dynamic per-request pricing from live upstream rates with margin. Dedicated billing isolation for sustainable unit economics.",
      highlights: [
        "POST /chat/completions: 15 agentic text models, OpenAI-compatible",
        "POST /images/generations: Unified Image API, synchronous delivery",
        "POST /videos/generations: async submit + free GET status poll",
        "GET /models on each route: allowlist + live rates, no payment",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "402 quote ? pay ? generate.",
      steps: [
        {
          step: "01",
          title: "Agent sends request",
          description: "Chat messages, image prompt, or video prompt with optional model and params.",
        },
        {
          step: "02",
          title: "Dynamic 402 price",
          description: "Syra computes cost from live OpenRouter rates ?- margin. Same body on retry = same price.",
        },
        {
          step: "03",
          title: "Pay with USDC",
          description: "Wallet or agent signs on Solana, Base, or any enabled x402 network.",
        },
        {
          step: "04",
          title: "Payload delivered",
          description: "OpenAI JSON for chat, images array for image, generation_id for video.",
        },
      ],
    },
    {
      id: "apis",
      kind: "cards",
      layout: "cards-row",
      label: "APIs",
      kicker: "Generative stack",
      headline: "Chat · Image · Video",
      cards: [
        {
          title: "Chat",
          subtitle: "/chat/completions",
          detail: "Claude, GPT-5, Gemini, Kimi, DeepSeek, Qwen3 Coder. Tools, response_format, seed.",
          accent: "gold",
        },
        {
          title: "Image",
          subtitle: "/images/generations",
          detail: "Flux, Seedream, GPT Image, Recraft, Gemini Flash Image. resolution, aspect_ratio, n.",
          accent: "gold",
        },
        {
          title: "Video",
          subtitle: "/videos/generations",
          detail: "Veo 3.1, Seedance, Wan, Sora 2 Pro. Job submit + poll until video_url is ready.",
          accent: "gold",
        },
        {
          title: "Discovery",
          subtitle: "GET /models",
          detail: "Free allowlist + per-token or per-second rates so agents pick models before paying.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Why Syra",
      kicker: "Best for agents",
      headline: "Why this is a Syra moat",
      items: [
        {
          icon: Zap,
          title: "One checkout",
          description: "Same x402 v2 flow as /brain, /news, /signal. Agents never leave the Syra payment surface.",
        },
        {
          icon: Coins,
          title: "Sustainable pricing",
          description: "Dynamic rates ?- margin on every call. Charge for output budget upfront. Profitable by design.",
        },
        {
          icon: Bot,
          title: "Agent-tuned defaults",
          description: "temperature 0.2, tool calling, structured output, require_parameters for reliable providers.",
        },
        {
          icon: MessageSquare,
          title: "No API keys",
          description: "Callers pay USDC. Syra holds OpenRouter upstream. Agents skip account sprawl entirely.",
        },
        {
          icon: Image,
          title: "Curated models",
          description: "Top agentic models pre-vetted. No browsing 400+ OpenRouter slugs mid-task.",
        },
        {
          icon: Terminal,
          title: "x402 discovery",
          description: "Listed in Syra bazaar and /.well-known/x402. Agents find generative APIs alongside crypto data.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Coverage",
      headline: "Generative AI meets machine payments",
      stats: [
        { value: "3", label: "x402 gen APIs" },
        { value: "15", label: "Agentic chat models" },
        { value: "402", label: "Pay per call" },
      ],
      narrative:
        "Syra is no longer just crypto intelligence. It is a full agent runtime: research, reason, generate images, produce video. All settled in USDC on the chain your treasury already uses.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Try it",
      headline: "Reason. Generate. Pay per call.",
      subline: "Hit /chat/completions, /images/generations, or /videos/generations from the playground or any x402 agent.",
      links: [
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "Chat API", value: "/chat/completions", href: "https://api.syraa.fun/chat/completions/models" },
        { label: "Docs", value: "x402 reference", href: "https://docs.syraa.fun/docs/api-reference" },
      ],
    },
  ],
};
