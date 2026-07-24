import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Agent Memory RAG photo deck. 15 distinct topics. */
export const AGENT_MEMORY_RAG_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces long-term memory shipping for Syra agents.

Chat turns get embedded with NVIDIA's free Nemotron model and stored per user, so past conversations become searchable context for the next reply instead of disappearing when the context window fills up.

syraa.fun`,

  thesis: `This card names the problem memory solves.

A context window forgets once it fills up, but memory does not have to. Syra embeds each chat turn, stores the vectors per user, and pulls the most relevant past context into new completions, so a follow-up weeks later still lands correctly.

syraa.fun`,

  quote: `The line on this card is the loop in plain words: embed the past, retrieve what matters, answer smarter.

It runs on the same Syra chat model, with a free Nemotron VL embedding call from OpenRouter underneath.

syraa.fun`,

  flow: `This image walks the memory loop in four steps.

1. A user asks something on /agent/chat/completion
2. The question gets embedded and searched against past turns
3. The most relevant past context gets injected into the system prompt
4. After the reply, both sides of the exchange get embedded and stored

syraa.fun`,

  timeline: `This timeline shows what shipped, from client to chat wire.

1. MEMORY_ENABLED was turned on in code
2. A Nemotron embedding client was added, with separate query and passage modes
3. Vectors get stored in Qdrant, with a Mongo cosine fallback
4. Chat now retrieves before replying and ingests after, without blocking the response

syraa.fun`,

  pillars: `This bento layout breaks the memory stack into four pieces.

Model is Nemotron VL, a free 1B-parameter embedder. Dims is 1024, kept lean for fast recall. Store is Qdrant, or Mongo cosine search when Qdrant is not configured. Scope is per anonymousId, so no memory crosses between users.

syraa.fun`,

  checklist: `This checklist is what is live now.

1. Embeddings run on the free NVIDIA Nemotron model via OpenRouter
2. Semantic recall works across separate chat sessions
3. Each user's memory is isolated, with no cross-leakage
4. A failed embed never blocks the chat reply
5. Retrieved context is labelled as past context, not live prices

syraa.fun`,

  metrics: `The numbers on this card describe the memory setup.

Vectors run at 1024 dimensions, with the top 4 most relevant recalled per turn, and the Nemotron embed itself costs nothing through OpenRouter's free tier. Retrieval only feeds context; live prices still come from tools.

syraa.fun`,

  featured: `This featured card is about the model doing the embedding work.

nvidia/llama-nemotron-embed-vl-1b-v2, free on OpenRouter. It handles text today, with multimodal embedding support planned next.

openrouter.ai/nvidia/llama-nemotron-embed-vl-1b-v2`,

  comparison: `This before-and-after card compares trimmed history to semantic memory.

Before, trimming the context window dropped old preferences and broke the thread on long follow-ups. Now, each turn gets embedded, stored, retrieved, and injected, so continuity holds across sessions.

syraa.fun`,

  launch: `This launch card marks Agent Memory RAG going live on Syra.

NVIDIA Nemotron embeddings power it, memory is always on in code, and a failed embed call soft-fails instead of breaking chat.

syraa.fun
syraa.fun/llm`,

  deepDive: `This deep-dive card lists the technical surface behind memory.

memoryConfig.js sets MEMORY_ENABLED to true, nemotronEmbeddingClient.js calls OpenRouter, memoryStore.js handles Qdrant with a Mongo cosine fallback, and chat.js wires in the retrieve step before the reply and the ingestTurn call after it.

syraa.fun`,

  split: `This split card lays out the two directions memory moves in.

Writing happens after each turn, with a passage embed of both sides of the exchange. Reading happens before the LLM call, with a query embed used to search prior turns. It is retrieval only; tools still own live prices.

syraa.fun`,

  terminal: `This terminal card shows memory in a real request path.

A call to /agent/chat/completion embeds the query, searches the top candidates filtered by anonymousId, and pushes the matched past context into the system prompt. After the reply goes out, ingestTurn stores both messages as passages in Qdrant or Mongo.

syraa.fun`,

  cta: `This closing card is the ship summary: Syra remembers now.

Set a preference, start a new chat later, and ask again to see it recalled.

syraa.fun
syraa.fun/llm
openrouter.ai/nvidia/llama-nemotron-embed-vl-1b-v2`,
};
