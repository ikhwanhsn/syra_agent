import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Agent Memory RAG photo deck. 15 distinct topics. */
export const AGENT_MEMORY_RAG_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Syra agents just got long-term memory.

NVIDIA Nemotron embeddings + RAG on agent chat.
Past turns become searchable context for the next reply.

Try it → syraa.fun`,

  thesis: `Context windows forget. Memory does not.

Syra embeds each chat turn, stores vectors per user, and pulls the most relevant past context into new completions.

Follow-ups stay grounded without stuffing the whole transcript.`,

  quote: `"Embed the past. Retrieve what matters. Answer smarter."

Same Syra chat model. Better memory layer underneath.

Free Nemotron VL embed via OpenRouter.`,

  flow: `Agent Memory loop:

1. User asks on /agent/chat/completion
2. Embed query, search top-K past turns
3. Inject labelled past context into system prompt
4. After reply, embed user + assistant as passages

Write memory. Read memory. Repeat.`,

  timeline: `What shipped:

→ Nemotron embedding client (query vs passage)
→ Mongo agent_memories + optional Qdrant
→ retrieveRelevant on every completion
→ ingestTurn fire-and-forget after reply
→ Always on in code. Soft-fail if key missing.`,

  pillars: `4 layers. One memory stack:

→ MODEL: Nemotron VL 1B (free)
→ DIMS: 1024 lean vectors
→ STORE: Qdrant or Mongo cosine
→ SCOPE: anonymousId isolation`,

  checklist: `Agent Memory RAG is live:

→ Free NVIDIA llama-nemotron-embed-vl-1b-v2
→ Semantic recall across chat sessions
→ Per-user isolation (no cross leakage)
→ Never blocks chat on embed failure
→ Past context labelled, not live prices

Open → syraa.fun`,

  metrics: `Memory by the numbers:

→ 1024 embedding dimensions
→ 4 top-K recalls per turn
→ 0$ Nemotron embed cost via OpenRouter

Same brain. Better memory.`,

  featured: `The model that powers memory:

nvidia/llama-nemotron-embed-vl-1b-v2

Free on OpenRouter. Multimodal-ready.
Syra uses text-first today; charts and images next.`,

  comparison: `Before: trimmed history, lost preferences, broken follow-ups.

Now: embed, store, retrieve, inject.
Ask again weeks later. Syra pulls the relevant thread.

Friction gone. Continuity on.`,

  launch: `SHIP LOG · Agent Memory RAG on Syra.

NVIDIA Nemotron embeddings. User-scoped vectors. Soft-fail RAG.

Chat that remembers, without a bigger context bill.

→ syraa.fun
→ syraa.fun/llm`,

  deepDive: `Technical surface:

→ memoryConfig.js: MEMORY_ENABLED = true
→ nemotronEmbeddingClient.js: OpenRouter /embeddings
→ memoryStore.js: Qdrant + Mongo cosine
→ memoryService.js: ingestTurn + retrieveRelevant
→ chat.js: inject + fire-and-forget ingest`,

  split: `Two paths. One smarter agent:

WRITE: passage embed after each turn
READ: query embed before the LLM call

Retrieval only. Tools still own live prices.`,

  terminal: `Memory from the stack:

$ POST /agent/chat/completion
> embed query · input_type=query
> search top-K · anonymousId filter
> systemParts.push(past context)
$ reply → ingestTurn · input_type=passage
< stored · Qdrant or Mongo`,

  cta: `Syra remembers now.

Set a preference. Start a new chat. Ask again.

Agent → syraa.fun
LLM lab → syraa.fun/llm
Model → openrouter.ai/nvidia/llama-nemotron-embed-vl-1b-v2`,
};
