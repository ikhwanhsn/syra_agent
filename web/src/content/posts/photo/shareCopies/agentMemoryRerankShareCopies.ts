import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Agent Memory Rerank photo deck. 15 distinct topics. */
export const AGENT_MEMORY_RERANK_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces a second stage added to Syra's memory system.

Vector search still finds the neighbors, but a Nemotron rerank step now decides which of them actually answer the question before they reach the model.

syraa.fun`,

  thesis: `This card names what changed.

Cosine similarity finds neighbors, but it does not always find the right answer. Syra now retrieves around 20 memory candidates by vector search, then runs the free nvidia/llama-nemotron-rerank-vl-1b-v2 model to reorder them by true relevance before injecting the top picks.

syraa.fun`,

  quote: `The line on this card is the new loop in plain words: retrieve wide, rerank tight, inject clean.

It runs on the same Syra chat, with a free Nemotron rerank call from OpenRouter underneath.

syraa.fun`,

  flow: `This image walks the two-stage memory loop in four steps.

1. The query gets embedded with the Nemotron embedder
2. A vector search returns up to 20 candidate past turns
3. A cross-encoder rerank scores each candidate against the query
4. The top four get injected into the system prompt

If the rerank call fails, Syra falls back to plain vector order.

syraa.fun`,

  timeline: `This timeline shows what shipped for the second stage.

1. MEMORY_RERANK_ENABLED was turned on in code
2. A nemotronRerankClient.js was added for OpenRouter's rerank endpoint
3. Retrieval now goes wide, pulling 20 candidates before narrowing to the top 4
4. An 8-second timeout falls back to vector order so chat never stalls

syraa.fun`,

  pillars: `This bento layout breaks the two-stage stack into four pieces.

Embed is the Nemotron VL model producing the vectors. Width is 20, the number of candidates pulled on the first pass. Rerank is the Nemotron cross-encoder scoring those 20 for real relevance. Inject is 4, the tight number of past turns that actually reach the prompt.

syraa.fun`,

  checklist: `This checklist is what is live now.

1. Reranking runs on the free NVIDIA llama-nemotron-rerank-vl-1b-v2 model
2. 20 candidates get narrowed down to 4 injected memories
3. An 8-second timeout falls back to vector order if rerank is slow
4. The same OPENROUTER_API_KEY used for chat covers rerank too
5. Injected context stays labelled as past context, not live prices

syraa.fun`,

  metrics: `The numbers on this card describe the rerank setup.

Twenty candidates get fetched on the first pass, four get injected after reranking, and the Nemotron rerank call itself costs nothing through OpenRouter's free tier.

syraa.fun`,

  featured: `This featured card is about the model doing the reranking.

nvidia/llama-nemotron-rerank-vl-1b-v2, free on OpenRouter. It is a cross-encoder that scores relevance directly, layered on top of the existing Nemotron embeddings.

openrouter.ai/nvidia/llama-nemotron-rerank-vl-1b-v2`,

  comparison: `This before-and-after card compares cosine-only ranking to the two-stage version.

Before, the top candidates were picked by vector score alone, which is fast but sometimes lets noisy near-misses through. Now, a wide retrieve feeds a Nemotron rerank pass before the top picks get chosen, putting precision first.

syraa.fun`,

  launch: `This launch card marks two-stage Agent Memory going live on Syra.

Nemotron handles both the embed and the rerank step, always on in code, with a soft-fail path if OpenRouter is unavailable.

syraa.fun
syraa.fun/llm`,

  deepDive: `This deep-dive card lists the technical surface behind the rerank stage.

memoryConfig.js holds the MEMORY_RERANK settings, nemotronRerankClient.js calls the /rerank endpoint with a timeout, and memoryService.js chains retrieve, rerank, and the final top-K selection, falling back to vector order if the rerank call fails.

syraa.fun`,

  split: `This split card lays out the two stages memory now runs through.

Stage one embeds the query and searches for candidates, optimizing for recall. Stage two reranks those candidates with Nemotron, optimizing for precision. It stays retrieval only; tools still own live prices.

syraa.fun`,

  terminal: `This terminal card shows the rerank stage in a real request path.

A call to /agent/chat/completion embeds the query and searches the top 20 candidates, then posts them to /rerank for scoring by relevance. The results get reordered and the top 4 get injected, falling back to plain vector order if the rerank step times out.

syraa.fun`,

  cta: `This closing card is the ship summary: Syra memory is two-stage now.

Build some chat history, ask a follow-up, and see the more relevant recall come back.

syraa.fun
syraa.fun/llm
openrouter.ai/nvidia/llama-nemotron-rerank-vl-1b-v2`,
};
