# Staking dApp — Complete Solution

Full-stack Solana staking dApp with **Anchor program** + **Next.js 14 frontend**.

## Stack

**Program (Rust/Anchor)**
- Anchor 0.30.1
- SPL Token
- Emission-per-second reward model
- PDA-based vaults

**Frontend (Next.js 14)**
- TypeScript, Tailwind CSS
- @solana/web3.js, @coral-xyz/anchor
- Wallet Adapter (Phantom, Solflare)
- Devnet-first; mainnet-ready

## Quick Start

### 1. Build & Deploy Program

```bash
# Install Anchor if needed
# https://www.anchor-lang.com/docs/installation

# Build
anchor build

# Deploy to devnet
./scripts/deploy-devnet.sh

# Note the Program ID
```

### 2. Initialize Pool

```bash
export PROGRAM_ID=<from_deploy>
export STAKING_MINT=<your_token_mint>
export REWARD_MINT=<reward_token_mint>
export REWARD_PER_SECOND=1000000

ts-node scripts/init-pool.ts
```

### 3. Run Frontend

```bash
npm install
cp .env.example .env.local
# Edit .env.local with PROGRAM_ID, mints, etc.
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Config

See `constants/config.ts` and `.env.example`. Key variables:

- `NEXT_PUBLIC_SOLANA_NETWORK` — `devnet` or `mainnet-beta`
- `NEXT_PUBLIC_SOLANA_RPC_URL` — RPC endpoint
- `NEXT_PUBLIC_STAKING_PROGRAM_ID` — Your Anchor staking program ID
- `NEXT_PUBLIC_STAKING_MINT` / `NEXT_PUBLIC_REWARD_MINT` — Token mints
- `NEXT_PUBLIC_REWARD_PER_SECOND` — Emission (smallest units per second)

## Project Structure

```
staking/
├── programs/staking/src/     # Anchor program (Rust)
│   ├── lib.rs
│   ├── state.rs
│   ├── error.rs
│   └── instructions/
│       ├── initialize.rs
│       ├── stake.rs
│       ├── unstake.rs
│       └── claim.rs
├── app/                      # Next.js frontend
├── components/
├── lib/
├── constants/
├── scripts/                  # Build & deploy scripts
└── DEVNET_SETUP.md          # Full setup guide
```

## Documentation

- **[PROGRAM_README.md](./PROGRAM_README.md)** - Anchor program details
- **[DEVNET_SETUP.md](./DEVNET_SETUP.md)** - Deployment & testing guide

## Features

✅ Emission-per-second reward model  
✅ Proportional distribution  
✅ Auto-updating rewards (10s refresh)  
✅ Stake, unstake, claim  
✅ Dynamic APR calculation  
✅ Dark glassmorphic UI  
✅ Production-ready code
