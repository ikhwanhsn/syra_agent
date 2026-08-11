import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Agent Memory Rerank photo deck. 15 distinct topics. */
export const AGENT_MEMORY_RERANK_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra memory now has a second stage: rerank.

Vector search still finds nearby past chats. A Nemotron rerank step then decides which of those actually answer the question before they reach the model.

syraa.fun`,

  thesis: `Cosine finds neighbors, but rerank finds answers.

Syra retrieves around 20 memory candidates by vector search, then runs the free nvidia/llama-nemotron-rerank-vl-1b-v2 model to reorder them by true relevance before injecting the top picks. Fewer, better remembered chats reach the prompt.

syraa.fun`,

  quote: `Retrieve wide, rerank tight, and inject clean.

It runs on the same Syra chat, with a free Nemotron rerank call from OpenRouter underneath. Memory still means the agent remembering past chats, not live prices.

syraa.fun`,

  flow: `Two-stage memory is four steps.

1. The query gets embedded with the Nemotron embedder
2. A vector search returns up to 20 candidate past turns
3. A cross-encoder rerank scores each candidate against the query
4. The top four get injected into the system prompt

If the rerank call fails, Syra falls back to plain vector order.

syraa.fun`,

  timeline: `What shipped for the second stage.

1. MEMORY_RERANK_ENABLED was turned on in code
2. A nemotronRerankClient.js was added for OpenRouter's rerank endpoint
3. Retrieval now goes wide, pulling 20 candidates before narrowing to the top 4
4. An 8-second timeout falls back to vector order so chat never stalls

syraa.fun`,

  pillars: `Four layers make the precision stack.

Embed is the Nemotron VL model producing the vectors. Width is 20, the candidates pulled on the first pass. Rerank is the Nemotron cross-encoder scoring those 20 for real relevance. Inject is 4, the tight number of past turns that actually reach the prompt.

syraa.fun`,

  checklist: `What is live for rerank.

1. Reranking runs on the free NVIDIA llama-nemotron-rerank-vl-1b-v2 model
2. 20 candidates get narrowed down to 4 injected memories
3. An 8-second timeout falls back to vector order if rerank is slow
4. The same OPENROUTER_API_KEY used for chat covers rerank too
5. Injected context stays labelled as past context, not live prices

syraa.fun`,

  metrics: `Twenty candidates on the first pass. Four injected after rerank. Zero dollar rerank cost on OpenRouter's free Nemotron tier.

Same memory, sharper picks. Soft-fail keeps chat online if the rerank call drops.

syraa.fun`,

  featured: `The reranker behind memory is a 1B Nemotron model.

nvidia/llama-nemotron-rerank-vl-1b-v2, free on OpenRouter. It is a cross-encoder that scores relevance directly, layered on top of the existing Nemotron embeddings.

openrouter.ai/nvidia/llama-nemotron-rerank-vl-1b-v2`,

  comparison: `Cosine-only ranking was fast and sometimes noisy. Two-stage RAG puts precision first.

Before, the top candidates were picked by vector score alone, which let near-misses through. Now a wide retrieve feeds a Nemotron rerank pass before the top picks get chosen.

syraa.fun`,

  launch: `Two-stage agent memory is live on Syra.

Nemotron handles both the embed and the rerank step, always on in code, with a soft-fail path if OpenRouter is unavailable.

syraa.fun
syraa.fun/llm`,

  deepDive: `Rerank is wired into the Syra memory service.

memoryConfig.js holds the MEMORY_RERANK settings. nemotronRerankClient.js calls the /rerank endpoint with a timeout. memoryService.js chains retrieve, rerank, and the final top-K selection, falling back to vector order if the rerank call fails.

syraa.fun`,

  split: `Recall first, then precision.

Stage one embeds the query and searches for candidates. Stage two reranks those candidates with Nemotron. Only the top past turns reach the model. It stays retrieval only. Tools still own live prices.

syraa.fun`,

  terminal: `A chat completion now reranks remembered turns before injecting them.

A call to /agent/chat/completion embeds the query and searches the top 20 candidates, then posts them to /rerank for scoring. Results get reordered and the top 4 get injected, falling back to plain vector order if the rerank step times out.

syraa.fun`,

  cta: `Ask again and get the right remembered chat, not just the nearest one.

Build some history, ask a follow-up, and watch the more relevant recall come back.

syraa.fun
syraa.fun/llm
openrouter.ai/nvidia/llama-nemotron-rerank-vl-1b-v2`,
};
