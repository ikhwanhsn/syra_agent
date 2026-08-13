import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for LLM Exchange ship log. */
export const LLM_EXCHANGE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `LLM Exchange is live on Syra Earn.

List Claude, Gemini, DeepSeek, or any OpenAI-compatible endpoint, set your price, and earn USDC when agents call POST /llm/route. Syra smart-routes by cheapest or most callable.

syraa.fun/earn?track=llm`,

  thesis: `Agents want one LLM checkout. Sellers want passive USDC.

Syra already sells crypto intelligence on x402. Now anyone can list a live model and join a smart router with failover and a clear fee split.

syraa.fun/earn?track=llm`,

  quote: `One route. Many models. Settled in USDC.

That is the LLM Exchange wedge: callers never pick a vendor, sellers never run payment infra, and platform fees still buy $SYRA.

syraa.fun/earn?track=llm`,

  flow: `How LLM Exchange money moves.

1. Seller lists Claude, Gemini, DeepSeek, or a custom endpoint
2. Agent pays POST /llm/route with a routing policy
3. Syra splits the charge: fee to buyback, rest to seller
4. Seller claims payout from Earn → LLM

syraa.fun/earn?track=llm`,

  timeline: `How we shipped the exchange.

1. Earn LLM tab for list, price, activate, claim
2. Smart router with cheapest, reliable, fastest, quality
3. Health probes and callability scores
4. Public volume on GET /api/metrics

docs.syraa.fun/docs/api/llm-route`,

  pillars: `Four reasons the stack holds.

Sellers earn USDC without building x402. Callers get one OpenAI-shaped route. Holders who stake get lower seller fees. Treasury fees still feed $SYRA buybacks.

syraa.fun/token`,

  checklist: `What you can do today.

1. List a model on Earn → LLM
2. Call GET /llm/models for price and callability
3. POST /llm/route with X-Syra-Route: cheapest
4. Claim seller earnings from the same Earn tab
5. Verify volume on /api/metrics

syraa.fun/earn?track=llm`,

  metrics: `Proof on LLM Exchange.

1 route for agents. 4 routing policies. 20% platform fee into the same buyback queue as the rest of Syra x402.

GET /api/metrics
syraa.fun/earn?track=llm`,

  featured: `POST /llm/route is the single agent entry.

Send OpenAI-compatible messages. Syra picks the provider, fails over on errors, and returns chat.completion plus syra_route metadata.

docs.syraa.fun/docs/api/llm-route`,

  comparison: `Pick a vendor yourself vs let Syra route.

Weak play: hardcode one LLM and eat downtime. Syra play: one x402 call, policy-based routing, and a marketplace that gets cheaper as supply grows.

syraa.fun/earn?track=llm`,

  launch: `LLM Exchange is open for sellers and agents.

Dashboard Earn → LLM for listings. POST /llm/route for callers. Syra OpenRouter stays as fallback so the router is never empty.

syraa.fun/earn?track=llm`,

  deepDive: `Where to go next.

1. Earn LLM tab to list or claim
2. API docs for /llm/route and /llm/models
3. /.well-known/x402 discovery for agents
4. /token and /api/metrics for buyback proof
5. Stake $SYRA for lower seller fees

docs.syraa.fun/docs/api/llm-route`,

  split: `Sellers own models. Syra owns settlement.

You bring the LLM endpoint (any protocol) and price. Syra brings x402, SSRF guards, encrypted keys, routing, and the buyback loop.

syraa.fun/earn?track=llm`,

  terminal: `From list to routed call.

$ list endpoint + price on Earn
$ GET /llm/models
$ POST /llm/route with X-Syra-Route: cheapest
$ settle 402, get completion + syra_route

docs.syraa.fun/docs/api/llm-route`,

  cta: `List a model. Route a call.

Open Earn → LLM to sell access, or point your agent at POST /llm/route today.

syraa.fun/earn?track=llm
docs.syraa.fun/docs/api/llm-route`,
};
