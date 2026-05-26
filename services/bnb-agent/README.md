# Syra BNB Chain Agent (ERC-8004 + ERC-8183)

Python sidecar using [bnbagent-sdk](https://github.com/bnb-chain/bnbagent-sdk). Syra intelligence stays in the Node `api/` service; this process handles BNB on-chain identity and paid jobs.

## Architecture

```
Client (8183) → bnb-agent (Python) → POST /agent/bnb8183/execute → Syra API (OpenRouter)
                     ↓ on-chain submit
                 BSC contracts
```

Solana and Base continue to use the existing `api/` stack (x402, Solana 8004, etc.).

## Setup

1. **API** (`api/.env`):

```bash
ERC8183_INTERNAL_SECRET=<same-secret-as-sidecar>
BNB_AGENT_ENABLED=true
BNB_AGENT_PUBLIC_URL=https://your-bnb-agent-host/erc8183
```

2. **Sidecar** (`services/bnb-agent/.env` from `.env.example`):

```bash
pip install -r requirements.txt
cp .env.example .env
# Set PRIVATE_KEY, WALLET_PASSWORD, ERC8183_AGENT_URL, SYRA_API_BASE_URL, ERC8183_INTERNAL_SECRET
```

3. **Register ERC-8004** (one-time):

```bash
python register_8004.py
```

4. **Run provider server**:

```bash
uvicorn app:app --host 0.0.0.0 --port 8003
```

5. **Settle** (cron): `python settle_jobs.py` with `ERC8183_SETTLE_JOB_IDS`.

## Verify

- `GET https://api.syraa.fun/agent/chains` — should show `bsc` as active when configured.
- `GET {ERC8183_AGENT_URL}/erc8183/status` — provider status from bnbagent.

## Testnet

- `NETWORK=bsc-testnet`
- Faucets: BSC testnet tBNB + U token (see bnbagent-sdk README)
