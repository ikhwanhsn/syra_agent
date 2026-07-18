import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Agent Memory Rerank photo deck. 15 distinct topics. */
export const AGENT_MEMORY_RERANK_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Syra memory just got a second stage.

Vector search finds neighbors.
Nemotron rerank picks the answers.

Two-stage RAG → syraa.fun`,

  thesis: `Cosine finds neighbors. Rerank finds answers.

Syra now retrieves ~20 memory candidates, then free NVIDIA llama-nemotron-rerank-vl-1b-v2 reorders by true relevance before injecting top-K.

Sharper context. Less noise.`,

  quote: `"Retrieve wide. Rerank tight. Inject clean."

Same Syra chat. Better memory precision underneath.

Free Nemotron rerank via OpenRouter.`,

  flow: `Two-stage memory loop:

1. Embed query (Nemotron embed)
2. Vector search → up to 20 candidates
3. Cross-encoder rerank vs the query
4. Inject top 4 into the system prompt

Soft-fail to vector order if rerank is down.`,

  timeline: `What shipped:

→ MEMORY_RERANK_ENABLED = true in code
→ nemotronRerankClient.js (OpenRouter /rerank)
→ Wide retrieve (20) then top-K (4)
→ 8s timeout + soft-fail to vector order
→ Past-context scores show rerank vs vector`,

  pillars: `4 layers. One precision stack:

→ EMBED: Nemotron VL vectors
→ WIDTH: 20 candidates
→ RERANK: Nemotron cross-encoder
→ INJECT: top 4 only`,

  checklist: `Two-stage RAG is live:

→ Free NVIDIA llama-nemotron-rerank-vl-1b-v2
→ 20 candidates → 4 injected
→ Soft-fail if rerank times out
→ Same OPENROUTER_API_KEY as chat
→ Past context still labelled, not live prices

Open → syraa.fun`,

  metrics: `Rerank by the numbers:

→ 20 candidates fetched
→ 4 memories injected
→ 0$ Nemotron rerank via OpenRouter

Same memory. Sharper picks.`,

  featured: `The model that ranks memory:

nvidia/llama-nemotron-rerank-vl-1b-v2

Free on OpenRouter. Cross-encoder precision
on top of Nemotron embeddings.`,

  comparison: `Before: top-K by cosine alone. Fast, sometimes noisy.

Now: wide retrieve → Nemotron rerank → top-K.
Only the truly relevant past turns hit the prompt.

Precision up. Token waste down.`,

  launch: `SHIP LOG · Two-stage Agent Memory on Syra.

Nemotron embed + Nemotron rerank.
Always on in code. Soft-fail. Free via OpenRouter.

→ syraa.fun
→ syraa.fun/llm`,

  deepDive: `Technical surface:

→ memoryConfig.js: MEMORY_RERANK_* constants
→ nemotronRerankClient.js: /rerank + timeout
→ memoryService.js: retrieve → rerank → top-K
→ Fallback: vector order if rerank fails
→ Logs: [memory] rerank aid=… candidates=N kept=K`,

  split: `Two stages. One smarter agent:

STAGE 1: embed + vector search (recall)
STAGE 2: Nemotron rerank (precision)

Retrieval only. Tools still own live prices.`,

  terminal: `Rerank from the stack:

$ POST /agent/chat/completion
> embed query · search top-20
> POST /rerank · Nemotron VL
> reorder by relevance_score
> inject top-4 past context
< soft-fail → vector order if needed`,

  cta: `Syra memory is two-stage now.

Build history. Ask a follow-up. Get the right recall.

Agent → syraa.fun
LLM lab → syraa.fun/llm
Model → openrouter.ai/nvidia/llama-nemotron-rerank-vl-1b-v2`,
};
