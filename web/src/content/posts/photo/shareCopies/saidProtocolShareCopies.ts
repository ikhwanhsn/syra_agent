import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for SAID Protocol photo deck — 15 distinct topics. */
export const SAID_PROTOCOL_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Agents need identity, not just wallets.

Syra × SAID Protocol: verified on-chain agent identity on Solana. Register once. Build reputation. Prove who you are across platforms.

Profile → saidprotocol.com/agents/53Jhu…`,

  thesis: `Every agent had a wallet. Few had verifiable identity.

Syra just registered on SAID Protocol — persistent on-chain identity with a verified badge. Same treasury wallet. Permanent reputation layer alongside 8004 and AgentScore.`,

  quote: `"Pay with x402. Prove identity with SAID."

Syra sells intelligence per call. SAID gives the agent a verifiable face — registered, verified, and discoverable across the agent economy.`,

  flow: `How Syra × SAID works:

1. On-chain register + verify (0.01 SOL badge)
2. AgentCard metadata pinned to IPFS
3. SAID directory sync + reputation surface
4. Runtime checks via GET /said/status and /said/verify/:wallet

Identity that persists across wallet rotations.`,

  timeline: `Shipped in one integration pass:

→ said-sdk adapter + npm run register-said
→ On-chain identity + verification badge live
→ GET /said/status · /said/verify · /said/trust · /said/agent
→ Syra profile on saidprotocol.com

Verify once. Show the badge everywhere.`,

  pillars: `Four layers. One identity stack:

→ On-chain: SAID program on Solana mainnet
→ Metadata: AgentCard on IPFS via Pinata
→ Runtime: /said/* API routes on Syra
→ Discovery: SAID directory + trust tier reads`,

  checklist: `SAID is live on Syra today:

✓ Syra agent registered + verified on-chain
✓ saidClient adapter (register, verify, lookup)
✓ GET /said/status for Syra's own identity
✓ GET /said/verify/:wallet for full reputation
✓ npm run register-said for idempotent setup`,

  metrics: `SAID by the numbers:

→ 1 verified Syra agent identity
→ 0.01 SOL verification badge (permanent)
→ 4 runtime read endpoints on Syra API
→ ∞ reputation accrues over time

402 for commerce. SAID for trust.`,

  featured: `Verified badge. Permanent.

Syra paid 0.01 SOL once for the SAID verification badge. On-chain forever. No subscription. No API key for identity reads on /said/*.`,

  comparison: `Before SAID:
Wallet address only. No verifiable agent identity.

With SAID on Syra:
On-chain identity + verified badge + runtime trust checks.

Same agent brain. New trust layer for builders and platforms.`,

  launch: `LIVE — Syra × SAID Protocol

Verified on-chain agent identity is live.

Register · verify · query trust tier · build reputation.

Profile → saidprotocol.com/agents/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t`,

  deepDive: `SAID integration — technical surface:

→ api/libs/saidClient.js adapter (said-sdk + HTTP)
→ scripts/register-said-agent.js one-time setup
→ routes/said/index.js mounted at /said
→ Flexible on-chain account parser (342-byte layout)
→ SAID_AGENT_WALLET env for /said/status`,

  split: `Identity stack on Syra:

→ 8004: discoverable agent NFT registry
→ AgentScore: compliance + Passport gates
→ SAID: verified on-chain identity + reputation
→ x402: pay-per-call commerce rail

Commerce + compliance + identity. One API gateway.`,

  terminal: `Check Syra's SAID identity:

$ curl api.syraa.fun/said/status \\
  -H "X-API-Key: …"
{ "verified": true, "wallet": "53Jhu…" }

$ curl api.syraa.fun/said/verify/53Jhu… \\
  -H "X-API-Key: …"
{ "registered": true, "verified": true }`,

  cta: `Syra is SAID-verified.

Query trust. Gate integrations. Build reputation over time.

→ saidprotocol.com/agents/53Jhu…
→ api.syraa.fun/said/status
→ docs.syraa.fun`,
};
