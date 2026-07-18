import { AGENT_MEMORY_RERANK_POST } from "../agentMemoryRerankUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { AGENT_MEMORY_RERANK_PHOTO_SHARE_COPIES } from "./shareCopies/agentMemoryRerankShareCopies";

const copies = AGENT_MEMORY_RERANK_PHOTO_SHARE_COPIES;

/** Photo-format content for Agent Memory Rerank ship log. 15 cards, 15 X posts. */
export const AGENT_MEMORY_RERANK_PHOTO = definePhotoUpdate(AGENT_MEMORY_RERANK_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "RAG · Rerank · Nemotron",
      title: "Rerank × Syra",
      subtitle:
        "Two-stage agent memory: Nemotron embed finds candidates, rerank keeps what matters.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The rule",
      headline: "Cosine finds neighbors. Rerank finds answers.",
      body: "A cross-encoder scores the query against every candidate so Syra injects fewer, better memories.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Retrieve wide. Rerank tight. Inject clean.",
      narrative:
        "Same Syra chat. Free Nemotron rerank via OpenRouter underneath.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Precision loop",
      headline: "Embed. Search. Rerank. Inject.",
      steps: [
        { step: "01", title: "Embed", description: "Query vector via Nemotron." },
        { step: "02", title: "Wide hit", description: "Up to 20 vector candidates." },
        { step: "03", title: "Rerank", description: "Cross-encoder relevance scores." },
        { step: "04", title: "Inject", description: "Top 4 into system prompt." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "From single-stage to two-stage.",
      steps: [
        { step: "01", title: "Config", description: "MEMORY_RERANK_ENABLED = true." },
        { step: "02", title: "Client", description: "OpenRouter /rerank + timeout." },
        { step: "03", title: "Wire", description: "Wide retrieve then reorder." },
        { step: "04", title: "Fallback", description: "Vector order if rerank fails." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One precision stack.",
      cards: [
        { title: "Embed", subtitle: "VL 1B", detail: "Fast vector recall.", accent: "gold" },
        { title: "Width", subtitle: "20", detail: "Wide candidate net.", accent: "gold" },
        { title: "Rerank", subtitle: "VL 1B", detail: "Cross-encoder precision." },
        { title: "Inject", subtitle: "4", detail: "Tight prompt budget." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Rerank checklist. Live now.",
      highlights: [
        "Free NVIDIA Nemotron rerank via OpenRouter",
        "20 candidates → 4 injected",
        "8s timeout; soft-fail to vector order",
        "Same OPENROUTER_API_KEY as chat",
        "Past context labelled, not live prices",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Same memory. Sharper picks.",
      stats: [
        { value: "20", label: "Candidates" },
        { value: "4", label: "Injected" },
        { value: "0$", label: "Rerank cost*" },
      ],
      narrative: "*Free Nemotron via OpenRouter. Soft-fail keeps chat online.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "The reranker behind memory.",
      stats: [{ value: "1B", label: "Nemotron RR" }],
      narrative:
        "nvidia/llama-nemotron-rerank-vl-1b-v2. Free cross-encoder on OpenRouter.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Cosine-only vs two-stage RAG.",
      compareLeft: {
        title: "Before",
        body: "Top-K by vector score alone. Fast, sometimes noisy near-misses.",
      },
      compareRight: {
        title: "Now",
        body: "Wide retrieve → Nemotron rerank → top-K. Precision first.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Two-stage RAG",
      partnerName: "NVIDIA",
      partnerLogo: "/images/partners/nvidia.png",
      partnerLogoSolidBg: false,
      headline: "Syra × Nemotron",
      subtitle:
        "Embed + rerank stacked on agent memory. Always on in code, soft-fail safe.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Wired into Syra memory service.",
      items: [
        "memoryConfig.js: MEMORY_RERANK_*",
        "nemotronRerankClient.js: /rerank",
        "memoryService.js: two-stage retrieve",
        "Fallback: vector order on failure",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Two stages",
      headline: "Recall, then precision.",
      body: "Stage 1 embeds and searches. Stage 2 reranks. Only top-K past turns reach the LLM.",
      highlights: [
        "input_type=query on embed",
        "Candidates up to 20",
        "Rerank top_n = topK",
        "Soft-fail path intact",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Rerank in the stack.",
      terminalLines: [
        "$ POST /agent/chat/completion",
        "> embed query · search top-20",
        "> POST /rerank · Nemotron VL",
        "> reorder by relevance_score",
        "> inject top-4 past context",
        "< soft-fail → vector order",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Ask again. Get the right memory.",
      subtitle: "Open agent chat. Build history. Watch follow-ups stay sharp.",
      links: [
        { label: "Agent", value: "syraa.fun", href: "https://www.syraa.fun" },
        { label: "LLM lab", value: "syraa.fun/llm", href: "https://www.syraa.fun/llm" },
        {
          label: "Model",
          value: "Nemotron RR",
          href: "https://openrouter.ai/nvidia/llama-nemotron-rerank-vl-1b-v2",
        },
      ],
    }),
  },
]);
