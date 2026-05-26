# Syra multi-chain agent (Solana · Base · BNB)

Syra runs across three networks:

| Chain | Role | Stack |
|-------|------|--------|
| **Solana** | Primary chat, x402, agent wallet, ERC-8004 (Solana registry) | `api/` Node |
| **Base** | x402 USDC, Zerion portfolio | `api/` Node |
| **BNB Chain** | ERC-8004 identity, ERC-8183 paid jobs, GMGN `bsc` tools | `services/bnb-agent/` Python + `api/` job runner |

## Quick start (BNB)

1. Generate a shared secret and add to **both** `api/.env` and `services/bnb-agent/.env`:

```bash
ERC8183_INTERNAL_SECRET=<openssl rand -hex 32>
BNB_AGENT_ENABLED=true
BNB_AGENT_PUBLIC_URL=https://your-host/erc8183
```

2. Install and run the sidecar — see [services/bnb-agent/README.md](../services/bnb-agent/README.md).

3. Confirm: `GET /agent/chains` returns `bsc` with `"status": "active"`.

## User wallets on BNB

Sign-in with `chain: "bsc"` and an EVM wallet (SIWE). Requires Privy custody (`SYRA_CUSTODY_MODE=privy`). Base custodial wallets remain disabled for new users.
