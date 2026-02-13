# Devnet Setup Guide — Staking dApp

This guide covers how to set up the staking vault, mint reward tokens, fund the reward vault, test staking, and deploy to mainnet.

---

## Prerequisites

- Node.js 18+
- Solana CLI (`solana-keygen`, `spl-token`) installed
- Anchor CLI (if you deploy your own program)
- Wallet with devnet SOL and your SPL tokens

---

## 1. Deploy / Use Your Staking Program

The frontend expects an Anchor program with:

- **Accounts:** `GlobalPool`, `UserStakeInfo`
- **PDAs:** `["pool"]` for global pool, `["pool", user_pubkey]` for user stake
- **Vaults:** ATAs for staking mint and reward mint, owned by the **pool PDA** (authority)

If you haven’t deployed a program yet:

1. Build and deploy your Anchor staking program to devnet.
2. Set `NEXT_PUBLIC_STAKING_PROGRAM_ID` in `.env.local` to your program ID.

---

## 2. Create Staking Vault Token Account

The staking vault is the **ATA (Associated Token Account)** of the **pool PDA** for the **staking mint**.

- **Mint:** your SPL token (staking mint)
- **Owner:** pool PDA (so the program can receive and send staked tokens)

### Get pool PDA

With Anchor, the pool PDA is usually:

```ts
const [poolPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("pool")],
  programId
);
```

Or with Solana CLI you can derive it (e.g. in a script) and then create the ATA.

### Create the ATA

Using `spl-token`:

```bash
# Set your program ID and staking mint
PROGRAM_ID=<your_program_id>
STAKING_MINT=<your_staking_token_mint>
POOL_PDA=<pool_pda_address>   # from your program / script

# Create ATA for pool PDA (staking vault)
spl-token create-account $STAKING_MINT --owner $POOL_PDA
```

Or in TypeScript (e.g. in a script or your program’s `initialize`):

```ts
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from "@solana/spl-token";

const stakingVault = getAssociatedTokenAddressSync(
  stakingMint,
  poolPda,
  true  // allowOwnerOffCurve for PDA
);
// Then send createAssociatedTokenAccountInstruction(...)
```

Your program’s **initialize** instruction should create this ATA if it doesn’t exist (or you create it once manually and pass it to initialize).

---

## 3. Mint Reward Tokens

You need a **reward mint** and tokens to pay rewards.

### Create reward mint (if needed)

```bash
spl-token create-token --decimals 6
# Note the mint address → NEXT_PUBLIC_REWARD_MINT
```

### Mint reward tokens to your wallet (or to the reward vault later)

```bash
REWARD_MINT=<reward_mint_address>
spl-token mint $REWARD_MINT 1000000
```

Adjust amount and decimals as needed.

---

## 4. Create and Fund Reward Vault

The reward vault is the **ATA of the pool PDA** for the **reward mint**. Rewards are sent from this account to users when they claim.

### Create reward vault ATA

Same idea as staking vault, but for reward mint:

```bash
REWARD_MINT=<reward_mint_address>
POOL_PDA=<pool_pda_address>

spl-token create-account $REWARD_MINT --owner $POOL_PDA
```

Or create it in your program’s `initialize` and pass the address.

### Fund the reward vault

Transfer reward tokens from your wallet to the reward vault:

```bash
REWARD_VAULT=<reward_vault_ata_address>
spl-token transfer $REWARD_MINT <amount> $REWARD_VAULT
```

Ensure the vault holds enough rewards for the emission rate × time you want to run (e.g. `rewardPerSecond * 86400 * 30` for ~30 days).

---

## 5. Initialize the Pool (if your program has `initialize`)

If your program has an `initialize` instruction:

1. Pass: global pool PDA, authority (your wallet), staking mint, reward mint, staking vault, reward vault, `reward_per_second`.
2. The program should set `lastRewardTime` to current timestamp and create/configure the pool.

Set the same `reward_per_second` in your program and in the frontend config (`NEXT_PUBLIC_REWARD_PER_SECOND`) so APR and displayed emission match.

---

## 5. Frontend Config (`.env.local`)

Create `staking/.env.local`:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_STAKING_PROGRAM_ID=<your_program_id>
NEXT_PUBLIC_STAKING_MINT=<staking_token_mint>
NEXT_PUBLIC_REWARD_MINT=<reward_token_mint>
NEXT_PUBLIC_REWARD_PER_SECOND=1000000
NEXT_PUBLIC_STAKING_DECIMALS=6
NEXT_PUBLIC_REWARD_DECIMALS=6
```

Run the app:

```bash
cd staking && npm install && npm run dev
```

---

## 6. How to Test Staking

1. **Connect wallet** (Phantom/Solflare) and switch to **Devnet**.
2. **Get devnet SOL:** `solana airdrop 2` (if using Solana CLI with devnet).
3. **Get staking tokens:** use your faucet or mint to your wallet.
4. **Stake:** enter amount → Stake. Confirm in wallet.
5. **Wait / refresh:** pending rewards update every 10 seconds; you can also refetch.
6. **Claim:** click “Claim Rewards” when pending > 0.
7. **Unstake:** enter amount → Unstake.

---

## 7. Deploy to Mainnet

1. **Deploy program** to mainnet-beta (Anchor deploy with mainnet cluster).
2. **Create pool and vaults** the same way as devnet (pool PDA, staking vault ATA, reward vault ATA).
3. **Fund reward vault** with mainnet reward tokens.
4. **Update env:**

```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet.solana.com
NEXT_PUBLIC_STAKING_PROGRAM_ID=<mainnet_program_id>
NEXT_PUBLIC_STAKING_MINT=<mainnet_staking_mint>
NEXT_PUBLIC_REWARD_MINT=<mainnet_reward_mint>
NEXT_PUBLIC_REWARD_PER_SECOND=...
```

5. Rebuild and deploy the Next.js app (e.g. `npm run build && npm start` or your hosting).

---

## Summary Checklist

- [ ] Staking program deployed (devnet/mainnet).
- [ ] Pool PDA derived; staking vault ATA and reward vault ATA created (owner = pool PDA).
- [ ] Reward mint created; reward tokens minted.
- [ ] Reward vault funded.
- [ ] Pool initialized with correct `reward_per_second`.
- [ ] `.env.local` set (program ID, mints, RPC, network).
- [ ] Wallet on correct network; staking tokens in wallet for testing.
