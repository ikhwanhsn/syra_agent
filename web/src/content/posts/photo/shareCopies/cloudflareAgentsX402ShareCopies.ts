import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Cloudflare Agents x402 photo deck. */
export const CLOUDFLARE_AGENTS_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Cloudflare Agents can pay Syra over x402.

Syra stays the merchant. Your Worker Agent wraps fetch, funds Base USDC, and calls paid crypto intel routes without API keys.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  thesis: `Agent builders on Cloudflare needed a payer recipe, not another billing stack.

The Agents SDK already handles HTTP 402. Syra already sells pay-per-call crypto intel. Fund Base USDC, wrap fetch, call api.syraa.fun.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  quote: `Agent pays. Syra settles. No API keys.

Wrap fetch in your Cloudflare Agent. Syra returns intel after USDC settles on Base.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  flow: `From Worker secret to first paid intel call.

1. Fund a Base wallet and store the EVM key in Worker secrets
2. Register Exact EVM with x402Client in onStart
3. Call GET /news or another Spend route on api.syraa.fun
4. Read JSON after HTTP 200 and X-PAYMENT-RESPONSE

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  timeline: `What shipped for Cloudflare builders.

1. Repo quickstart with SyraPayAgent sample code
2. Docs page at /docs/build/cloudflare-agents-x402
3. Base USDC payer path via @x402/fetch
4. Monetization Gateway explicitly deferred to avoid double-charge

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  pillars: `Four roles in the Cloudflare path.

The Cloudflare Agent signs Base USDC. Syra API returns 402 and intel. Facilitators settle USDC. Builders copy the quickstart without a custody rewrite.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  checklist: `Try the integration in five steps.

1. Create a Cloudflare Agents Worker
2. Add SYRA_EVM_PAYER_PRIVATE_KEY as a secret
3. Fund the wallet with Base USDC
4. Paste the SyraPayAgent fetch wrapper from the docs
5. Call /news?ticker=BTC and confirm settle

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  metrics: `Built for agent distribution on Cloudflare.

Base is the default payer chain. One HTTP call proves the path. Zero API keys on the Syra side.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  featured: `The quickstart lives on docs.syraa.fun.

SyraPayAgent uses wrapFetchWithPayment against api.syraa.fun. Copy, fund, call.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  comparison: `Before vs now for Cloudflare agent builders.

Before: no documented merchant to pay from a Worker Agent. Now: Syra Spend APIs with a copy-paste Base x402 payer and settled receipts.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  launch: `Syra and Cloudflare Agents x402 docs are live.

Worker Agents pay Syra per call on Base. Syra stays the merchant. Facilitators stay on the Syra stack.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  deepDive: `Clear boundaries for this integration.

Syra is the x402 merchant, not a second charge behind Cloudflare paidTool. Facilitators are Dexter, GoPlausible, and PayAI, not replaced. MCP on Solana stays @syra-ai/mcp-server outside Workers.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  split: `Workers pay. Syra delivers intel.

Humans fund Base USDC once. The Agent micropays Syra on every Spend call. No subscription and no per-vendor API keys.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  terminal: `Happy path for a Cloudflare Agent.

$ wrangler secret put SYRA_EVM_PAYER_PRIVATE_KEY
> fund Base USDC
$ agent.call fetchSyraNews
< HTTP/402 Payment Required
< HTTP/200 · BTC news JSON

docs.syraa.fun/docs/build/cloudflare-agents-x402`,

  cta: `Fund Base. Wrap fetch. Call Syra.

Quickstart and sample Agent code are on the docs site. Marketplace lists every Spend route after your wallet is funded.

docs.syraa.fun/docs/build/cloudflare-agents-x402`,
};
