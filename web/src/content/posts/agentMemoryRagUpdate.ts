import { Brain, Database, MessageSquare, Search, Shield, Sparkles } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Syra Agent Memory (RAG) powered by free NVIDIA Nemotron embeddings via OpenRouter.
 */
export const AGENT_MEMORY_RAG_POST = defineVideoUpdate(
  {
    updateNumber: 25,
    id: "agent-memory-rag-nemotron",
    title: "Agent Memory RAG",
    published: "July 2026",
    tagline:
      "Long-term semantic memory for Syra chat. Free NVIDIA Nemotron embeddings recall what mattered across turns.",
    shareCopyVideo: `SHIP LOG · Syra agents just got long-term memory.

Not a bigger context window. Real RAG.

→ Free NVIDIA llama-nemotron-embed-vl-1b-v2 via OpenRouter
→ Embed past turns, retrieve by meaning, inject into the next reply
→ Scoped per user. Soft-fail. Always on in code.

Chat remembers the thesis you set three sessions ago.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Agent Memory RAG is live on Syra.

NVIDIA Nemotron embeddings turn past chats into searchable memory.
Ask a follow-up weeks later. Syra pulls the relevant context into the system prompt.

Private per anonymousId. Never blocks chat if embedding fails.
Try it → syraa.fun`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Memory × Syra",
      subtitle:
        "Long-term agent memory with free NVIDIA Nemotron embeddings. Recall past chats by meaning, not just the last window.",
      badge: "RAG · Nemotron · OpenRouter",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Context windows forget. Memory does not.",
      body: "Agents lose the thread when history is trimmed. Syra now embeds each turn, stores vectors per user, and pulls the most relevant past context into new completions. Follow-ups stay grounded without stuffing the whole transcript.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "Embed. Store. Retrieve. Inject.",
      body: "A full memory loop on agent chat: Nemotron passage embeds on write, query embeds on read, Qdrant or Mongo cosine search, then a labelled past-context block in the system prompt.",
      highlights: [
        "nvidia/llama-nemotron-embed-vl-1b-v2 (free via OpenRouter)",
        "input_type query vs passage for retrieval accuracy",
        "Scoped by anonymousId. No cross-user leakage.",
        "Always on in code; soft-fails if OpenRouter is down",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "Write memory. Read memory. Answer smarter.",
      steps: [
        {
          step: "01",
          title: "User asks",
          description: "POST /agent/chat/completion with lastUserMessage.",
        },
        {
          step: "02",
          title: "Retrieve",
          description: "Embed as query. Search top-K past turns by score.",
        },
        {
          step: "03",
          title: "Inject",
          description: "Push labelled past context into the system prompt.",
        },
        {
          step: "04",
          title: "Ingest",
          description: "After the reply, embed user + assistant as passages.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-row",
      label: "Stack",
      kicker: "Memory surface",
      headline: "Production RAG stack",
      cards: [
        {
          title: "Model",
          subtitle: "Nemotron VL 1B",
          detail: "Free multimodal embedder. Text-first now; images later.",
          accent: "gold",
        },
        {
          title: "Dims",
          subtitle: "1024",
          detail: "Lean vectors vs full 2048. Less storage, still sharp.",
          accent: "gold",
        },
        {
          title: "Store",
          subtitle: "Qdrant / Mongo",
          detail: "Qdrant when configured; Mongo cosine fallback.",
        },
        {
          title: "Scope",
          subtitle: "Per user",
          detail: "Every read/write filtered by anonymousId.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live inside Syra chat",
      items: [
        {
          icon: MessageSquare,
          title: "Agent chat",
          description: "Memory injects on every completion when history exists.",
          href: "https://www.syraa.fun",
        },
        {
          icon: Brain,
          title: "Nemotron embed",
          description: "Same free model you can probe on the LLM playground.",
          href: "https://www.syraa.fun/llm",
        },
        {
          icon: Search,
          title: "Semantic recall",
          description: "Top-K past turns by cosine score, not recency alone.",
        },
        {
          icon: Database,
          title: "Vector store",
          description: "Qdrant collection syra_agent_memory or Mongo fallback.",
        },
        {
          icon: Shield,
          title: "Isolation",
          description: "User-scoped vectors. Failures never break chat.",
        },
        {
          icon: Sparkles,
          title: "Smarter replies",
          description: "Chat model stays the same. Context gets better.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "What changes",
      headline: "Same brain. Better memory.",
      stats: [
        { value: "1024", label: "Embedding dims" },
        { value: "4", label: "Top-K recalls" },
        { value: "0$", label: "Embed cost*" },
      ],
      narrative:
        "*Free Nemotron via OpenRouter. Memory is retrieval-only and labelled as past context, never treated as live prices. Chat models still call tools for real-time data.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Try it",
      headline: "Talk once. Come back weeks later. Syra remembers.",
      subline: "Open agent chat. Set a preference. Ask again in a new thread.",
      links: [
        { label: "Agent", value: "syraa.fun", href: "https://www.syraa.fun" },
        { label: "LLM lab", value: "syraa.fun/llm", href: "https://www.syraa.fun/llm" },
        {
          label: "Model",
          value: "Nemotron VL embed",
          href: "https://openrouter.ai/nvidia/llama-nemotron-embed-vl-1b-v2",
        },
      ],
    },
  ],
);
