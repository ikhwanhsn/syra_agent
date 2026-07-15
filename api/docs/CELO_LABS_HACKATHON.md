# Celo Labs x402 (Agentic Payments & DeFAI Hackathon)

## Tracks
- Track 1: Most Revenue Generated
- Track 2: Most x402 Payments

Leaderboard: https://dune.com/celo/agentic-payments-defai-hackathon  
Hackathon: https://celobuilders.xyz (slug: `agentic-payments-defai`)

## Register (get attribution tag)
1. `npx skills add https://celobuilders.xyz`
2. Connect Google via the skill auth flow
3. Save draft with `projectName=Syra`, `githubUrl=https://github.com/ikhwanhsn/syra_agent/`, `customFields.telegram=@ikhwanhsn`, `trackIds=["most-revenue-generated","most-x402-payments"]`
4. Copy returned `attributionTag` (`celo_...`) into `api/.env` as `CELO_ATTRIBUTION_TAG` (or `CELO_BUILDER_CODE`)

## How the Dune board credits activity (important)

Per hackathon FAQ ([agentic-payments-defai](https://celobuilders.xyz/hackathons/agentic-payments-defai/faqs)):

| Metric | What counts |
| --- | --- |
| `tagged_volume_usd` / `volume_usd` (Track 1) | Any direct txs your wallets send with your ERC-8021 tag (refunds, distribute, DeFi, …) |
| `x402_settlements` / `x402_volume_usd` (Track 2) | **Only** settlements submitted by `api.x402.celo.org` — attributed to the **payTo / agentWalletAddress** in your submission. The facilitator tx **does not** carry your tag. |

Self-settled `transferWithAuthorization` from `CELO_SETTLER_PRIVATE_KEY` will **never** fill `x402_*` columns. Do **not** send mirror/tagged transfers to fake x402 volume — they are ignored for Track 2.

## Env (`api/.env`)
```
# App builder code (`a`) — hackathon attributionTag; Track 1 tagged volume
CELO_ATTRIBUTION_TAG=celo_xxxxxxxxxxxx
# Optional alias (takes precedence over CELO_ATTRIBUTION_TAG when set)
# CELO_BUILDER_CODE=celo_xxxxxxxxxxxx

# REQUIRED for Track 2 (x402_*): API key + prepaid credits from https://x402.celo.org
CELO_FACILITATOR_API_KEY=x402_live_...
CELO_FACILITATOR_URL=https://api.x402.celo.org
# Default true — settle via facilitator. Set false only to force self-settle (no x402_* credit).
# CELO_SETTLE_VIA_FACILITATOR=true
# Opt-in self-settle fallback when facilitator fails (defaults to true only if no API key)
# CELO_ALLOW_SELF_SETTLE=false

CELO_RPC_URL=https://forno.celo.org
CELO_USDC=0xcebA9300f2b948710d2653dD7B07f33A8B32118C
CELO_SETTLER_PRIVATE_KEY=0x...   # only for self-settle fallback / 8004 mint gas
CELO_PAYTO=0x...                 # optional; Labs uses active Celo payTo wallet
```

Register the **same** Labs Celo payTo address as `customFields.agentWalletAddress` on the hackathon submission so facilitator settlements are attributed to Syra.

## Attribution (ERC-8021 Schema 2) — Track 1
Labs Celo refunds / deposit distribution append an **ERC-8021 Schema 2** builder-code suffix (`a` = your tag) for revenue volume. Default settlement path is the **Celo facilitator** (Track 2).

## Run volume
1. Get an API key + credits at https://x402.celo.org → set `CELO_FACILITATOR_API_KEY`
2. Open Labs → **Celo** tab (admin wallet)
3. Create **payTo** + **payer** wallets; put payTo in submission `agentWalletAddress`
4. Fund payers/payTo with **CELO** (gas) + **USDC** on Celo mainnet
5. Manual **Run** or enable auto-call + refund loop
6. Confirm settlement tx `from` is the Celo facilitator `0x0d74D5Cefd2e7F24E623330ebE3d8D4cB45fFB48`

## Verify config
```bash
node scripts/check-celo-labs-config.js
```
Expect facilitator API key present + `Schema 2 ok: true` (for Track 1 tagging).

After a Labs Run, celoscan settlement should be from the facilitator address above (Track 2). Tagged refund txs still carry Schema 2 `a` for Track 1.

## Why https://8004scan.io/agents?chain=42220&search=syra is empty

Syra **is** registered on ERC-8004 on other chains (Solana, Base, X Layer), but **not yet on Celo mainnet (42220)**. That search filters to Celo only, so "No agents found" is correct until we mint on Celo's Identity Registry (`0x8004A169…a432`).

Existing Syra identities (for reference, **not** valid for this hackathon's Celo field):
- Base: https://8004scan.io/agents/8453/38440
- X Layer: token 2311 on chain 196

Hackathon `erc8004Url` must be a **Celo** link:
- `https://8004scan.io/agents/celo/<AGENT_ID>` or
- `https://celoscan.io/nft/0x8004a169fb4a3325136eb29fa0ceb6d2e539a432/<AGENT_ID>`

## Register Syra on Celo ERC-8004

1. Set `CELO_SETTLER_PRIVATE_KEY` in `api/.env` (EOA with a little CELO for gas — this wallet will **own** the agent NFT)
2. Ensure `PINATA_JWT` is set (already used for Solana 8004)
3. Run:
```bash
cd api
node scripts/register-8004-celo-agent.js
```
4. Copy the printed `8004scan` URL into the hackathon submission `customFields.erc8004Url`
5. Re-check: https://8004scan.io/agents?chain=42220&search=syra (indexing can take a few minutes)