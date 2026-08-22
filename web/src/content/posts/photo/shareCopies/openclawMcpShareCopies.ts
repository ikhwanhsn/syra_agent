import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for OpenClaw MCP photo deck. */
export const OPENCLAW_MCP_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `OpenClaw agents can pay Syra per tool call over x402.

Register @syra-ai/mcp-server with openclaw mcp set, fund Solana USDC, and run crypto intel tools without vendor API keys.

docs.syraa.fun/docs/build/openclaw`,

  thesis: `Self-hosted OpenClaw agents needed a machine-money intel path.

OpenClaw manages MCP servers on your hardware. Syra sells pay-per-call crypto news and signals on HTTP 402. One mcp set command wires them together.

docs.syraa.fun/docs/build/openclaw`,

  quote: `Consult first. Pay per call. No API keys.

syra_consult routes intent for free. syra_spend_news settles USDC on Solana when you ask for BTC news.

docs.syraa.fun/docs/build/openclaw`,

  flow: `From openclaw mcp set to first paid intel call.

1. openclaw mcp set syra with @syra-ai/mcp-server and SYRA_PAYER_KEYPAIR
2. Fund ≥ $1 Solana USDC on the payer wallet
3. openclaw skills install the Syra skill for consult-first workflow
4. Ask Get BTC news and confirm syra_spend_news settles

docs.syraa.fun/docs/build/openclaw`,

  timeline: `What shipped for OpenClaw builders.

1. docs/OPENCLAW_MCP_QUICKSTART.md in the repo
2. Docs page at /docs/build/openclaw
3. OpenClaw section in api.syraa.fun/skill.md
4. GTM partner row and outreach copy in AGENT_BUILDER_GTM

docs.syraa.fun/docs/build/openclaw`,

  pillars: `Four roles in the OpenClaw path.

OpenClaw hosts the MCP process. @syra-ai/mcp-server bridges tools to Syra APIs. Syra settles USDC on 402. Your agent wallet signs each paid call.

docs.syraa.fun/docs/build/openclaw`,

  checklist: `Try the integration in five steps.

1. Install OpenClaw with Node.js 18+
2. openclaw mcp set syra with npx @syra-ai/mcp-server
3. Fund Solana USDC on SYRA_PAYER_KEYPAIR
4. openclaw mcp doctor syra --probe
5. Ask Get BTC news and confirm settle

docs.syraa.fun/docs/build/openclaw`,

  metrics: `Built for self-hosted agent distribution.

47 curated MCP tools by default. One paid call proves the path. Zero vendor API keys on the Syra side.

docs.syraa.fun/docs/build/openclaw`,

  featured: `The quickstart lives on docs.syraa.fun.

openclaw mcp set registers stdio MCP. Control UI /settings/mcp edits the same server entry.

docs.syraa.fun/docs/build/openclaw`,

  comparison: `Before vs now for OpenClaw agent builders.

Before: no documented Syra install for OpenClaw MCP. Now: copy-paste mcp set, skill install, and settled pay-per-call crypto intel.

docs.syraa.fun/docs/build/openclaw`,

  launch: `Syra and OpenClaw MCP docs are live.

Self-hosted agents run @syra-ai/mcp-server with Solana USDC auto-pay. Syra stays the x402 merchant.

docs.syraa.fun/docs/build/openclaw`,

  deepDive: `Clear boundaries for this integration.

OpenClaw is the host, not a second merchant. Facilitators stay Dexter, GoPlausible, and PayAI on Syra APIs. Never commit payer secrets into shared OpenClaw config.

docs.syraa.fun/docs/build/openclaw`,

  split: `OpenClaw hosts. Syra settles.

Fund Solana USDC once. The agent micropays every paid MCP tool. Humans stay out of the 402 retry loop.

docs.syraa.fun/docs/build/openclaw`,

  terminal: `Happy path in OpenClaw.

$ openclaw mcp set syra '{"command":"npx",...}'
$ openclaw mcp doctor syra --probe
> syra_consult · Get BTC news
> syra_spend_news · HTTP 200 · news JSON

docs.syraa.fun/docs/build/openclaw`,

  cta: `mcp set. Fund USDC. Get BTC news.

Quickstart and skill install are on the docs site. Export this ship log from syraa.fun/post.

docs.syraa.fun/docs/build/openclaw`,
};
