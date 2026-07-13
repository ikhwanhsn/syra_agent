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
4. Copy returned `attributionTag` (`celo_...`) into `api/.env` as `CELO_ATTRIBUTION_TAG`

## Env (`api/.env`)
```
CELO_ATTRIBUTION_TAG=celo_xxxxxxxxxxxx
CELO_RPC_URL=https://forno.celo.org
CELO_USDC=0xcebA9300f2b948710d2653dD7B07f33A8B32118C
CELO_FACILITATOR_URL=https://api.x402.celo.org
CELO_SETTLER_PRIVATE_KEY=0x...   # EOA funded with CELO for gas
CELO_PAYTO=0x...                 # optional; Labs uses active Celo payTo wallet
```

## Run volume
1. Open Labs → **Celo** tab (admin wallet)
2. Create **payTo** + **payer** wallets
3. Fund payers/payTo with **CELO** (gas) + **USDC** on Celo mainnet
4. Fund `CELO_SETTLER_PRIVATE_KEY` with CELO (settles `transferWithAuthorization` + ERC-8021 tag)
5. Manual **Run** or enable auto-call + refund loop

## Verify tagging
```bash
node scripts/check-celo-labs-config.js
```
After a payment, open the tx on https://celoscan.io and confirm calldata ends with `8021` marker / decode with `@celo/attribution-tags` `verifyTx`.

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