import { ArrowUpDown, Brain, Layers, Search, Shield, Sparkles } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Two-stage Agent Memory RAG. Nemotron embed + Nemotron rerank.
 */
export const AGENT_MEMORY_RERANK_POST = defineVideoUpdate(
  {
    updateNumber: 26,
    id: "agent-memory-rerank-nemotron",
    title: "Memory Rerank",
    published: "July 2026",
    tagline:
      "Two-stage agent memory. Nemotron embed retrieves. Nemotron rerank picks the winners.",
    shareCopyVideo: `SHIP LOG · Syra memory just got a second stage.

Not more context. Better context.

→ Vector search pulls ~20 candidates
→ Free NVIDIA llama-nemotron-rerank-vl-1b-v2 reorders by relevance
→ Only the top 4 reach the prompt

Smarter recall. Fewer wasted tokens.
Soft-fails to vector order if rerank is down.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Two-stage RAG is live on Syra memory.

Embed, retrieve wide, Nemotron rerank, inject top-K.

Same free OpenRouter stack. Precision up. Noise down.
Try it → syraa.fun`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Rerank × Syra",
      subtitle:
        "Two-stage agent memory: Nemotron embed finds candidates, Nemotron rerank keeps only what matters.",
      badge: "RAG · Rerank · Nemotron",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Cosine finds neighbors. Rerank finds answers.",
      body: "Vector search is fast but blunt. A cross-encoder reads the query against every candidate and scores true relevance, so Syra injects fewer, better memories instead of near-miss noise.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "Retrieve wide. Rerank tight. Inject clean.",
      body: "Memory RAG now fetches up to 20 vector hits, then free NVIDIA llama-nemotron-rerank-vl-1b-v2 reorders them before the top-K past-context block hits the system prompt.",
      highlights: [
        "nvidia/llama-nemotron-rerank-vl-1b-v2 via OpenRouter",
        "20 candidates → top 4 after rerank",
        "8s timeout; soft-fail to vector order",
        "Always on in code. MEMORY_RERANK_ENABLED",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "Embed. Search. Rerank. Answer.",
      steps: [
        {
          step: "01",
          title: "Embed query",
          description: "Nemotron embed with input_type=query.",
        },
        {
          step: "02",
          title: "Wide retrieve",
          description: "Vector search returns up to 20 candidates.",
        },
        {
          step: "03",
          title: "Rerank",
          description: "Cross-encoder scores query vs each passage.",
        },
        {
          step: "04",
          title: "Inject top-K",
          description: "Best 4 memories enter the system prompt.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-row",
      label: "Stack",
      kicker: "Memory surface",
      headline: "Two free Nemotron stages",
      cards: [
        {
          title: "Embed",
          subtitle: "VL 1B",
          detail: "Passage + query vectors for fast recall.",
          accent: "gold",
        },
        {
          title: "Rerank",
          subtitle: "VL 1B",
          detail: "Cross-encoder precision on candidates.",
          accent: "gold",
        },
        {
          title: "Width",
          subtitle: "20 → 4",
          detail: "Wide net, tight injection budget.",
        },
        {
          title: "Fail",
          subtitle: "Soft",
          detail: "Rerank down? Vector order still works.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live inside Syra chat memory",
      items: [
        {
          icon: Search,
          title: "Wide retrieve",
          description: "More candidates before the precision pass.",
        },
        {
          icon: ArrowUpDown,
          title: "Nemotron rerank",
          description: "Free cross-encoder via OpenRouter /rerank.",
          href: "https://www.syraa.fun/llm",
        },
        {
          icon: Brain,
          title: "Cleaner context",
          description: "Only top-K past turns reach the LLM.",
        },
        {
          icon: Layers,
          title: "Two-stage RAG",
          description: "Embed + rerank stacked on agent chat.",
          href: "https://www.syraa.fun",
        },
        {
          icon: Shield,
          title: "Soft-fail",
          description: "Timeout or error → vector order. Chat never dies.",
        },
        {
          icon: Sparkles,
          title: "Efficiency",
          description: "Fewer tokens. Higher relevance per token.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "What changes",
      headline: "Same memory. Sharper picks.",
      stats: [
        { value: "20", label: "Candidates" },
        { value: "4", label: "Injected" },
        { value: "0$", label: "Rerank cost*" },
      ],
      narrative:
        "*Free Nemotron rerank via OpenRouter. Past context stays labelled. Tools still own live prices. Soft-fail keeps chat online if the rerank call fails.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Try it",
      headline: "Ask again. Get the right memory, not the nearest one.",
      subline: "Open agent chat. Build history. Watch follow-ups stay on thesis.",
      links: [
        { label: "Agent", value: "syraa.fun", href: "https://www.syraa.fun" },
        { label: "LLM lab", value: "syraa.fun/llm", href: "https://www.syraa.fun/llm" },
        {
          label: "Model",
          value: "Nemotron rerank",
          href: "https://openrouter.ai/nvidia/llama-nemotron-rerank-vl-1b-v2",
        },
      ],
    },
  ],
);
