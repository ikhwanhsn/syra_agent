# Staking program upgrade (manual claim only)

Unstake **no longer auto-claims** rewards. Rewards are only sent when the user clicks **Claim Rewards**.

If you still see rewards being sent on unstake, the **deployed program** is still the old one. Do this once:

1. **Clean build** (recommended):
   ```bash
   cd staking
   anchor clean
   anchor build
   node scripts/sync-idl.js
   ```

   Or use the npm script that syncs IDL after build:
   ```bash
   yarn anchor:build
   ```

2. **Upgrade the program** on devnet (use your program id; this one matches `Anchor.toml`):
   ```bash
   anchor upgrade target/deploy/staking.so --program-id w446ABrZadQZonJhfM6JxdBNrK2azPT328trf7EQnAc
   ```

   Or:
   ```bash
   yarn anchor:upgrade
   ```

3. Restart the app and unstake again. Rewards will **not** be transferred until the user clicks **Claim Rewards**.
