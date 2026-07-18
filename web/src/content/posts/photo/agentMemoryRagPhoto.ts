import { AGENT_MEMORY_RAG_POST } from "../agentMemoryRagUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { AGENT_MEMORY_RAG_PHOTO_SHARE_COPIES } from "./shareCopies/agentMemoryRagShareCopies";

const copies = AGENT_MEMORY_RAG_PHOTO_SHARE_COPIES;

/** Photo-format content for Agent Memory RAG ship log. 15 cards, 15 X posts. */
export const AGENT_MEMORY_RAG_PHOTO = definePhotoUpdate(AGENT_MEMORY_RAG_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "RAG · Nemotron · OpenRouter",
      title: "Memory × Syra",
      subtitle:
        "Long-term agent memory with free NVIDIA Nemotron embeddings. Recall past chats by meaning.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The rule",
      headline: "Context windows forget. Memory does not.",
      body: "Syra embeds each turn, stores vectors per user, and injects the most relevant past context into new completions.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Embed the past. Retrieve what matters. Answer smarter.",
      narrative:
        "Same Syra chat model. Free Nemotron VL embed via OpenRouter underneath.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Memory loop",
      headline: "Ask. Recall. Reply. Store.",
      steps: [
        { step: "01", title: "User asks", description: "Completion with lastUserMessage." },
        { step: "02", title: "Retrieve", description: "Query embed + top-K search." },
        { step: "03", title: "Inject", description: "Past context into system prompt." },
        { step: "04", title: "Ingest", description: "Passage embed after the reply." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "From embed client to chat wire.",
      steps: [
        { step: "01", title: "Config", description: "MEMORY_ENABLED = true in code." },
        { step: "02", title: "Client", description: "Nemotron query vs passage embeds." },
        { step: "03", title: "Store", description: "Qdrant or Mongo cosine fallback." },
        { step: "04", title: "Chat", description: "Retrieve + fire-and-forget ingest." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One memory stack.",
      cards: [
        { title: "Model", subtitle: "Nemotron", detail: "Free VL 1B embedder.", accent: "gold" },
        { title: "Dims", subtitle: "1024", detail: "Lean vectors, sharp recall.", accent: "gold" },
        { title: "Store", subtitle: "Qdrant", detail: "Or Mongo cosine fallback." },
        { title: "Scope", subtitle: "User", detail: "anonymousId isolation." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Memory checklist. Live now.",
      highlights: [
        "Free NVIDIA Nemotron embed via OpenRouter",
        "Semantic recall across chat sessions",
        "Per-user isolation. No cross leakage.",
        "Soft-fail: never blocks chat",
        "Past context labelled, not live prices",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Same brain. Better memory.",
      stats: [
        { value: "1024", label: "Embedding dims" },
        { value: "4", label: "Top-K recalls" },
        { value: "0$", label: "Embed cost*" },
      ],
      narrative: "*Free Nemotron via OpenRouter. Retrieval only. Tools still own live prices.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "The embedder behind memory.",
      stats: [{ value: "1B", label: "Nemotron VL" }],
      narrative:
        "nvidia/llama-nemotron-embed-vl-1b-v2. Free on OpenRouter. Text-first today; multimodal next.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Trimmed history vs semantic memory.",
      compareLeft: {
        title: "Before",
        body: "Context trim drops old prefs. Follow-ups lose the thread.",
      },
      compareRight: {
        title: "Now",
        body: "Embed, store, retrieve, inject. Continuity across sessions.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Agent Memory RAG",
      partnerName: "NVIDIA",
      partnerLogo: "/images/partners/placeholder.svg",
      partnerLogoSolidBg: false,
      headline: "Syra × Nemotron",
      subtitle:
        "Free VL embeddings power long-term agent memory on Syra chat. Always on in code.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Wired into Syra API + chat.",
      items: [
        "memoryConfig.js: MEMORY_ENABLED = true",
        "nemotronEmbeddingClient.js: OpenRouter",
        "memoryStore.js: Qdrant + Mongo cosine",
        "chat.js: retrieve + ingestTurn",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Two paths",
      headline: "Write memory. Read memory.",
      body: "Passage embeds after each turn. Query embeds before the LLM. Retrieval only. Tools still own live prices.",
      highlights: [
        "input_type=passage on ingest",
        "input_type=query on retrieve",
        "Top-K + minScore filter",
        "Fire-and-forget write path",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Memory in the stack.",
      terminalLines: [
        "$ POST /agent/chat/completion",
        "> embed query · input_type=query",
        "> search top-K · anonymousId filter",
        "> systemParts.push(past context)",
        "$ reply → ingestTurn · passage",
        "< stored · Qdrant or Mongo",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Talk once. Come back. Syra remembers.",
      subtitle: "Open agent chat. Set a preference. Ask again in a new thread.",
      links: [
        { label: "Agent", value: "syraa.fun", href: "https://www.syraa.fun" },
        { label: "LLM lab", value: "syraa.fun/llm", href: "https://www.syraa.fun/llm" },
        {
          label: "Model",
          value: "Nemotron VL",
          href: "https://openrouter.ai/nvidia/llama-nemotron-embed-vl-1b-v2",
        },
      ],
    }),
  },
]);
