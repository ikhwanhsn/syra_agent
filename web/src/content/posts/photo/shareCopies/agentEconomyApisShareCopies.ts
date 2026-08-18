import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Agent Economy APIs. Facts match the photo deck. */
export const AGENT_ECONOMY_APIS_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Agent Economy APIs are live.

x402, ERC-8004, and MCP supply as agent-readable routes. Headlines are free. Full dumps are $0.001. External market context, not Syra traction.

syraa.fun/playground`,

  thesis: `Scraping JSON is not a market API.

agenteconomy.to publishes two open feeds. Agents used to fetch them by hand. Syra now wraps the headlines for free and the full dumps behind x402.

syraa.fun/playground`,

  quote: `External market context, wrapped for agents. Not Syra traction.

Syra caches both feeds for five minutes and returns attribution on every response. Use GET /api/metrics for Syra paid-call proof.

syraa.fun/playground`,

  flow: `How an Agent Economy call works.

1. Hit GET /agent-economy/summary. No payment.
2. Need the full dump: settle /on-chain or /off-chain at $0.001
3. Syra caches 5 min and adds attribution
4. Agent reads headlines and cites agenteconomy.to

syraa.fun/playground`,

  timeline: `How we shipped the wrap.

1. Four routes: summary, freshness, on-chain, off-chain
2. Five-minute cache plus attribution wrapper
3. Paid dumps listed on /.well-known/x402
4. Public summary live at api.syraa.fun/agent-economy/summary

syraa.fun/playground`,

  pillars: `Four routes, two prices.

Summary and freshness are free. On-chain and off-chain dumps cost $0.001 and return the full agenteconomy.to JSON, attributed.

syraa.fun/playground`,

  checklist: `What you can call today.

1. GET /agent-economy/summary (free)
2. GET /agent-economy/freshness (free)
3. Pay /on-chain or /off-chain at $0.001
4. Open Playground Spend to try the same paths

syraa.fun/playground`,

  metrics: `Market size, not Syra volume.

163M x402 txs, $41M x402 volume, 461k ERC-8004 agents. Rounded from GET /agent-economy/summary on 18 Aug 2026. Source: agenteconomy.to.

syraa.fun/playground`,

  featured: `163M x402 txs, external.

That figure is agenteconomy.to market context served through Syra. It is not Syra paid-call traction. For Syra proof, use GET /api/metrics.

syraa.fun/playground`,

  comparison: `DIY scrape vs Syra x402.

Weak play: fetch two JSON files, no cache, no 402, no catalog. Syra play: free headlines, $0.001 dumps, five-minute cache, attribution included.

syraa.fun/playground`,

  launch: `Agent Economy APIs are live.

Free summary and freshness. Paid on-chain and off-chain dumps at $0.001. Source: agenteconomy.to.

syraa.fun/playground`,

  deepDive: `Where to go next.

1. GET /agent-economy/summary for headlines
2. GET /agent-economy/freshness for feed ages
3. Pay /on-chain for full data.json
4. Pay /off-chain for web-sources.json
5. Discover paid dumps on /.well-known/x402
6. Playground Spend. Syra proof stays on /api/metrics

syraa.fun/playground`,

  split: `Syra owns the wrap. agenteconomy.to owns the data.

Five-minute cache, attribution on every JSON, free headlines plus $0.001 dumps. Do not quote these stats as Syra volume.

syraa.fun/playground`,

  terminal: `From headline to paid dump.

$ GET /agent-economy/summary
$ GET /agent-economy/freshness
$ GET /agent-economy/on-chain
$ GET /agent-economy/off-chain
settle 402 at $0.001, cite agenteconomy.to

syraa.fun/playground`,

  cta: `Call the summary. Pay only for the dump.

Open Playground Spend, or hit GET /agent-economy/summary now.

syraa.fun/playground
api.syraa.fun/agent-economy/summary`,
};
