import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for SAID Protocol photo deck: 15 distinct topics. */
export const SAID_PROTOCOL_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces that Syra registered a verified on-chain identity through SAID Protocol.

The badge marks it as identity, verified, and Solana. Registering once gives Syra a permanent on-chain badge and a public profile that any platform can check, on top of the wallet it already used for payments.

saidprotocol.com/agents/53Jhu…`,

  thesis: `This card names the gap SAID closes: a wallet address alone is not identity.

Syra agents already pay per call over x402 and are registered on 8004. Platforms still had to guess whether an agent was real. SAID adds a persistent on-chain identity with a permanent verification badge, so that question has an on-chain answer.

syraa.fun`,

  quote: `The line on this card sums up the split between the two systems: x402 handles commerce, and SAID handles trust.

Same machine money stack, same agent wallets, but now there is a verifiable identity surface too: registered, verified, and queryable straight from Syra's own API routes.

api.syraa.fun/said/status`,

  flow: `This image walks the SAID identity flow in four steps.

1. Register on-chain, with an AgentCard pinned to IPFS and a SAID program identity account created
2. Pay the one-time 0.01 SOL verification fee for a permanent verified badge
3. Sync to the SAID directory, where the profile shows up with a trust tier
4. Query the identity at runtime through /said/status, /said/verify, or /said/trust

api.syraa.fun/said/status`,

  timeline: `This timeline covers the full SAID integration, shipped in one pass.

1. said-sdk adapter added for on-chain register and verify in saidClient.js
2. register-said script added, run once with npm run register-said
3. Runtime routes mounted at /said on the Syra API gateway
4. Syra's profile went live and verified on SAID Protocol mainnet

saidprotocol.com/agents/53Jhu…`,

  pillars: `This bento layout breaks the identity stack into four layers.

On-chain, the SAID program holds a persistent identity account on Solana mainnet. The AgentCard metadata, including name, skills, and MCP endpoint, is pinned to IPFS through Pinata. Runtime routes on Syra's API expose status, verify, trust, and agent lookups. Discovery happens through the SAID directory, which shows the trust tier and reputation on saidprotocol.com.

syraa.fun`,

  checklist: `This checklist is what SAID brought to Syra.

1. Syra's own agent is registered and verified on-chain
2. The saidClient adapter handles register, verify, and lookup
3. GET /said/status reports Syra's own identity
4. GET /said/verify/:wallet returns full reputation for any wallet
5. npm run register-said re-runs safely without duplicating the registration

api.syraa.fun/said/status`,

  metrics: `The numbers on this card describe what verification actually costs and returns.

Syra paid a one-time 0.01 SOL fee for a permanent on-chain verified badge. Four runtime endpoints expose that identity to callers, and reputation keeps accruing over time without any renewal.

api.syraa.fun/said/status`,

  featured: `This featured card makes the point that verification is a one-time cost.

Syra paid 0.01 SOL once for the SAID verification badge. It sits on-chain permanently, with no subscription and no recurring fee to keep it active.

saidprotocol.com/agents/53Jhu…`,

  comparison: `This before-and-after card compares having a wallet with having a verified identity.

Before, Syra had a wallet address and nothing else. Platforms had to guess whether to trust it. Now Syra has an on-chain identity, a verified badge, and a /said/trust endpoint other systems can gate on, all backed by the same agent brain.

syraa.fun`,

  launch: `This partnership card marks Syra and SAID Protocol as live.

Syra's agent identity is registered and verified on-chain. Anyone can look up the profile, check the trust tier, or query the reputation that builds over time.

saidprotocol.com/agents/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t`,

  deepDive: `This deep-dive card lists where SAID lives inside Syra's codebase.

api/libs/saidClient.js wraps the said-sdk and its HTTP fallback. scripts/register-said-agent.js runs the one-time setup. routes/said/index.js exposes status, verify, trust, and agent endpoints. A flexible parser reads the 342-byte on-chain account layout, and SAID_AGENT_WALLET is the env variable behind /said/status.

saidprotocol.com/docs`,

  split: `This split card places SAID inside Syra's broader identity and commerce stack.

8004 gives Syra a discoverable agent registry entry. AgentScore gates compliance through Passport checks. SAID adds verified on-chain identity and reputation. x402 remains the pay-per-call commerce rail underneath all of it.

api.syraa.fun/said/status`,

  terminal: `This terminal card shows two real calls against Syra's SAID identity.

Checking /said/status returns verified true with Syra's wallet. Checking /said/trust for the same wallet returns a medium trust tier along with the verified badge.

syraa.fun`,

  cta: `This closing card is the summary: Syra is SAID-verified.

Check the profile, query the trust tier, or gate an integration on verified agent identity.

saidprotocol.com/agents/53Jhu…
api.syraa.fun/said/status
docs.syraa.fun`,
};
