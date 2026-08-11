import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Agent Memory RAG photo deck. 15 distinct topics. */
export const AGENT_MEMORY_RAG_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra agents can remember past chats now.

Chat turns get embedded with NVIDIA's free Nemotron model and stored per user. The next reply can search that history by meaning instead of losing it when the context window fills up.

syraa.fun`,

  thesis: `Context windows forget, but memory does not.

Syra embeds each chat turn, stores the vectors per user, and pulls the most relevant past context into new completions. A follow-up weeks later can still land correctly.

syraa.fun`,

  quote: `Embed the past, retrieve what matters, and answer smarter.

It runs on the same Syra chat model, with a free Nemotron VL embedding call from OpenRouter underneath. Memory here means the agent remembering past chats, not live prices.

syraa.fun`,

  flow: `Remembering a chat is four steps.

1. A user asks something on /agent/chat/completion
2. The question gets embedded and searched against past turns
3. The most relevant past context gets injected into the system prompt
4. After the reply, both sides of the exchange get embedded and stored

syraa.fun`,

  timeline: `What shipped, from config to chat.

1. MEMORY_ENABLED was turned on in code
2. A Nemotron embedding client was added, with separate query and passage modes
3. Vectors get stored in Qdrant, with a Mongo cosine fallback
4. Chat now retrieves before replying and stores after, without blocking the response

syraa.fun`,

  pillars: `Four pieces make the memory stack.

The model is Nemotron VL, a free 1B-parameter embedder. Vectors are 1024 dimensions, kept lean for fast recall. Storage is Qdrant, or Mongo cosine search when Qdrant is not configured. Scope is per anonymousId, so no memory crosses between users.

syraa.fun`,

  checklist: `What is live for agent memory.

1. Embeddings run on the free NVIDIA Nemotron model via OpenRouter
2. Semantic recall works across separate chat sessions
3. Each user's memory is isolated, with no cross-leakage
4. A failed embed never blocks the chat reply
5. Retrieved context is labelled as past context, not live prices

syraa.fun`,

  metrics: `1024 embedding dimensions. Top 4 recalls per turn. Zero dollar embed cost on OpenRouter's free Nemotron tier.

Retrieval only feeds remembered chat context. Live prices still come from tools.

syraa.fun`,

  featured: `The embedder behind memory is a 1B Nemotron VL model.

nvidia/llama-nemotron-embed-vl-1b-v2, free on OpenRouter. It handles text today, with multimodal embedding support planned next.

openrouter.ai/nvidia/llama-nemotron-embed-vl-1b-v2`,

  comparison: `Trimmed chat history dropped the thread. Semantic memory keeps continuity.

Before, trimming the context window dropped old preferences and broke long follow-ups. Now each turn gets embedded, stored, retrieved, and injected, so continuity holds across sessions.

syraa.fun`,

  launch: `Agent memory is live on Syra chat.

NVIDIA Nemotron embeddings power it. Memory is always on in code. A failed embed call soft-fails instead of breaking chat.

syraa.fun
syraa.fun/llm`,

  deepDive: `Memory is wired into the Syra API and chat.

memoryConfig.js sets MEMORY_ENABLED to true. nemotronEmbeddingClient.js calls OpenRouter. memoryStore.js handles Qdrant with a Mongo cosine fallback. chat.js retrieves before the reply and runs ingestTurn after it.

syraa.fun`,

  split: `Memory writes after the turn. It reads before the model answers.

Writing stores a passage embed of both sides of the exchange. Reading uses a query embed to search prior turns. It is retrieval only. Tools still own live prices.

syraa.fun`,

  terminal: `A chat completion now searches remembered turns first.

A call to /agent/chat/completion embeds the query, searches the top candidates filtered by anonymousId, and pushes matched past context into the system prompt. After the reply goes out, ingestTurn stores both messages as passages in Qdrant or Mongo.

syraa.fun`,

  cta: `Talk once, come back, and Syra remembers.

Set a preference, start a new chat later, and ask again to see it recalled. Open agent chat or the LLM lab to try it.

syraa.fun
syraa.fun/llm
openrouter.ai/nvidia/llama-nemotron-embed-vl-1b-v2`,
};
