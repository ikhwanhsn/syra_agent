# Staking deployment — step by step

Follow these steps in order. Run all commands from the **staking** folder: `d:\business\syra-monorepo\staking`.

---

## Prerequisites

- **Node.js** (v18+) and **npm**
- **Solana CLI**: [Install](https://docs.solana.com/cli/install-solana-cli-tools)
- **Anchor CLI** (0.31.x): [Install](https://www.anchor-lang.com/docs/installation) — ensure `anchor` is on your PATH (e.g. open a new terminal after installing)
- A **Solana wallet** with some SOL on devnet (for deploy + init + funding)
- **Two SPL tokens** on devnet: one for staking, one for rewards (create with `spl-token create-token` if needed)

**Windows:** Use PowerShell or Git Bash for terminal commands. For `deploy-devnet.sh` use Git Bash, or run the individual commands shown in Step 4.

---

## Step 1 — Solana CLI and wallet

1. Open a terminal and set cluster to devnet:
   ```bash
   solana config set --url devnet
   ```
2. Use your keypair (default: `~/.config/solana/id.json` on Mac/Linux, `%APPDATA%\Solana\id.json` on Windows):
   ```bash
   solana address
   solana balance
   ```
3. If balance is 0, get devnet SOL:
   ```bash
   solana airdrop 2
   ```

---

## Step 2 — Create staking and reward tokens (if you don’t have them)

If you already have two token mints, skip to Step 3.

```bash
# Create staking token (e.g. SYRA)
spl-token create-token --decimals 6
# Note the Token mint address (e.g. xxxxx)

# Create reward token
spl-token create-token --decimals 6
# Note the Token mint address (e.g. yyyyy)

# Create ATAs for your wallet so you can hold both
spl-token create-account <STAKING_MINT>
spl-token create-account <REWARD_MINT>

# Mint some supply to yourself (optional)
spl-token mint <STAKING_MINT> 1000000
spl-token mint <REWARD_MINT> 100000
```

Save the two mint addresses; you’ll need them in Step 5.

---

## Step 3 — Build the program

From the **staking** folder:

```bash
cd d:\business\syra-monorepo\staking
npm run anchor:build
```

This runs `anchor build` and syncs the IDL into `lib/idl/staking.json`. If this fails, fix the Rust/Anchor errors before continuing.

---

## Step 4 — Deploy to devnet

**On Windows** use Git Bash or PowerShell. For the shell script:

```bash
cd d:\business\syra-monorepo\staking
# Use Git Bash, or run the commands manually:
solana config set --url devnet
solana balance
anchor build
anchor deploy --provider.cluster devnet
```

After a successful deploy, the script prints the **Program ID**. Example:

```text
Program ID: w446ABrZadQZonJhfM6JxdBNrK2azPT328trf7EQnAc
```

Copy this Program ID; you’ll add it to `.env.local` in the next step.

---

## Step 5 — Configure environment

1. Copy the example env file:
   ```bash
   copy .env.example .env.local
   ```
   (Use `cp` on Mac/Linux.)

2. Edit **`.env.local`** and set at least:

   | Variable | Example | Description |
   |----------|--------|-------------|
   | `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` | Use `mainnet-beta` for mainnet |
   | `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://api.devnet.solana.com` | RPC endpoint |
   | `NEXT_PUBLIC_STAKING_PROGRAM_ID` | *(from Step 4)* | Deployed program ID |
   | `NEXT_PUBLIC_STAKING_MINT` | *(from Step 2)* | Staking token mint |
   | `NEXT_PUBLIC_REWARD_MINT` | *(from Step 2)* | Reward token mint |
   | `NEXT_PUBLIC_REWARD_PER_SECOND` | `1000000` | Reward emission (smallest units per second) |

   Optional: `NEXT_PUBLIC_STAKING_TOKEN_SYMBOL=SYRA`, decimals, and USD prices for APR.

3. Save the file.

---

## Step 6 — Initialize the pool

From the **staking** folder, with `.env.local` filled (especially program ID and both mints):

```bash
npm run init-pool
```

This uses your Solana CLI wallet as the pool authority and creates the global pool and vaults. On success you’ll see:

```text
✅ Pool initialized successfully!
   Transaction: <signature>
```

If you see “Set STAKING_MINT / REWARD_MINT in .env.local”, go back to Step 5 and set both mint addresses.

---

## Step 7 — Fund the reward vault

Users can only claim if the reward vault has balance. From the **staking** folder:

```bash
# Default: send 10000 reward tokens (human units)
npm run fund-reward-vault

# Or specify amount:
npm run fund-reward-vault -- 5000
# Or: set AMOUNT=5000 and run fund-reward-vault
```

Your wallet must hold the **reward token** (the one set as `NEXT_PUBLIC_REWARD_MINT`). If you get “no reward token ATA”, create the ATA and mint or receive reward tokens first.

To only **print the reward vault address** (for manual sending):

```bash
npm run get-reward-vault-address
```

---

## Step 8 — Run the frontend

From the **staking** folder:

```bash
npm install
npm run dev
```

Open **http://localhost:3001**. Connect your wallet (devnet), and you should see the dashboard, stake/unstake by period, and claim rewards.

---

## Quick checklist

- [ ] Solana CLI on devnet, wallet has SOL
- [ ] Two SPL mints created (staking + reward); wallet has some of each
- [ ] `npm run anchor:build` succeeds
- [ ] `anchor deploy --provider.cluster devnet` succeeds; Program ID copied
- [ ] `.env.local` created and filled (program ID, both mints, RPC, reward per second)
- [ ] `npm run init-pool` succeeds
- [ ] `npm run fund-reward-vault` run (or reward vault funded manually)
- [ ] `npm run dev` and test stake/unstake/claim at http://localhost:3001

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Pool not loaded” in UI | Confirm `NEXT_PUBLIC_STAKING_PROGRAM_ID` and RPC in `.env.local`. Ensure init-pool (Step 6) ran successfully. |
| “Insufficient reward vault balance” on claim | Run `npm run fund-reward-vault` (Step 7) or send reward tokens to the vault address from `npm run get-reward-vault-address`. |
| Init-pool: “Cannot reach Solana RPC” | Check network/firewall; try another RPC (e.g. Helius/QuickNode devnet) in `.env.local`. |
| Deploy fails (insufficient funds) | Run `solana airdrop 2` on devnet or use a wallet with more SOL. |
| Script can’t find wallet | Set `WALLET_PATH` to your keypair JSON path, or use the default path (see init-pool.ts comments). |

For **mainnet**: change `NEXT_PUBLIC_SOLANA_NETWORK` and RPC to mainnet, deploy with `--provider.cluster mainnet`, and use real SOL and token mints.
