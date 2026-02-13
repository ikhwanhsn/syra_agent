# Staking Program (Anchor)

Production-ready Solana staking program built with Anchor framework.

## Features

- ✅ **Emission-per-second rewards** model
- ✅ **Proportional reward distribution** to all stakers
- ✅ **Auto-compounding** reward calculations
- ✅ **PDA-based vaults** for security
- ✅ **Overflow protection** on all math operations
- ✅ **Full Anchor integration** with TypeScript client

## Program Architecture

### Accounts

**GlobalPool** (PDA: `["pool"]`)
- `authority`: Pool admin
- `staking_mint`: Token users stake
- `reward_mint`: Token for rewards
- `total_staked`: Total tokens staked
- `reward_per_second`: Emission rate
- `accumulated_reward_per_share`: Scaled by 1e12
- `last_reward_time`: Last update timestamp
- `bump`: PDA bump seed
- `is_initialized`: Init flag

**UserStakeInfo** (PDA: `["pool", user_pubkey]`)
- `owner`: User wallet
- `amount`: Tokens staked
- `reward_debt`: For pending reward calculation

### Instructions

1. **initialize** - Create pool and vaults
2. **stake** - Deposit tokens, earn rewards
3. **unstake** - Withdraw staked tokens
4. **claim** - Claim pending rewards

### Reward Formula

```
pending_reward = (user_amount × accumulated_reward_per_share) / 1e12 - reward_debt
```

Pool automatically updates `accumulated_reward_per_share` based on time elapsed since `last_reward_time`.

## Build & Deploy

### Prerequisites

- Rust 1.75+
- Solana CLI 1.18+
- Anchor 0.30.1+

### Build

```bash
anchor build
```

### Deploy to Devnet

```bash
chmod +x scripts/deploy-devnet.sh
./scripts/deploy-devnet.sh
```

Copy the outputted Program ID to your `.env.local`.

### Deploy to Mainnet

```bash
chmod +x scripts/deploy-mainnet.sh
./scripts/deploy-mainnet.sh
```

## Initialize Pool

After deploying, initialize the pool:

```bash
export PROGRAM_ID=<your_program_id>
export STAKING_MINT=<your_staking_token_mint>
export REWARD_MINT=<your_reward_token_mint>
export REWARD_PER_SECOND=1000000
export SOLANA_RPC_URL=https://api.devnet.solana.com

ts-node scripts/init-pool.ts
```

## Fund Reward Vault

After initialization, send reward tokens to the reward vault:

```bash
REWARD_VAULT=$(solana-keygen pubkey --ask-keyword "pool" | \
  spl-token create-account <REWARD_MINT> --owner <POOL_PDA>)

spl-token transfer <REWARD_MINT> <AMOUNT> <REWARD_VAULT>
```

Or use the helper in `DEVNET_SETUP.md`.

## Program Addresses

All PDAs use these seeds:

- **Global Pool**: `["pool"]`
- **User Stake**: `["pool", user_pubkey]`
- **Staking Vault**: ATA of pool PDA for staking mint
- **Reward Vault**: ATA of pool PDA for reward mint

## Security

- ✅ Constraint checks on all accounts
- ✅ Overflow protection with `checked_*` operations
- ✅ PDA authority for vaults (no rugpull)
- ✅ Reward vault balance check before transfer
- ✅ Amount validation (> 0)

## Testing

```bash
anchor test
```

(Add test files to `tests/` directory)

## Program ID

Default (replace after deployment):
```
Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

Update in:
- `Anchor.toml`
- `programs/staking/src/lib.rs` (declare_id!)
- Frontend `.env.local`
