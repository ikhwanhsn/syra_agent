# After deploy: what’s next

You’ve deployed the staking program to devnet. Do these in order.

---

## 1. Initialize the pool (one-time)

The program is deployed but the **global pool** must be initialized (authority, mints, reward rate).

From the **staking** folder, using the **same keypair** that is the Solana CLI default (and that you used to deploy):

```bash
cd staking
npx ts-node scripts/init-pool.ts
```

The script reads from **`.env.local`** (e.g. `NEXT_PUBLIC_STAKING_MINT`, `NEXT_PUBLIC_REWARD_MINT`, `NEXT_PUBLIC_REWARD_PER_SECOND`, `NEXT_PUBLIC_STAKING_PROGRAM_ID`).  
If your CLI wallet is not the default path, set:

- **Windows:** `set WALLET_PATH=%APPDATA%\Solana\id.json`
- **Linux/Mac:** `export WALLET_PATH=~/.config/solana/id.json`

You should see: `Pool initialized successfully!`

---

## 2. Fund the reward vault

Users can only **claim** if the pool’s reward vault has reward tokens.

1. Get the **reward vault** address (printed by the init script, or derive it: ATA of `reward_mint` with owner = pool PDA).
2. Transfer enough **reward token** (mint: `NEXT_PUBLIC_REWARD_MINT`) to that vault so claims don’t fail with “Insufficient reward vault balance”.

---

## 3. Use the dApp

1. In **staking**, ensure `.env.local` has the same program ID and mints (you already have `NEXT_PUBLIC_STAKING_PROGRAM_ID=CTLfYYz7FcDm9PSGNJbbvvkwE7fmm2eAey6rRSZnaERb`).
2. Run the app: `npm run dev` (e.g. http://localhost:3001).
3. Connect a **devnet** wallet that holds the **staking token** (`NEXT_PUBLIC_STAKING_MINT`).
4. Stake, unstake, and claim; success toasts will link to the transaction on Solana Explorer (devnet).

---

**Summary**

| Step | Action |
|------|--------|
| 1 | Run `npx ts-node scripts/init-pool.ts` from `staking` (after deploy). |
| 2 | Send reward tokens to the pool’s reward vault. |
| 3 | Use the staking UI on devnet with a wallet that has staking tokens. |
