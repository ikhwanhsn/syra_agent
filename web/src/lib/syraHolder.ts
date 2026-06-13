import { PublicKey } from "@solana/web3.js";
import { connection } from "@/contexts/WalletContext";
import { SYRA_MINT } from "@/lib/swapPresets";

/** Matches `api/libs/syraToken.js` — wallet balance (not staked) for free agent tools. */
export const SYRA_HOLDER_THRESHOLD = 1_000_000;

export async function fetchSyraWalletBalance(walletAddress: string): Promise<number | null> {
  const trimmed = walletAddress.trim();
  if (!trimmed) return null;
  try {
    const owner = new PublicKey(trimmed);
    const mint = new PublicKey(SYRA_MINT);
    const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint });
    return accounts.value.reduce((sum, acc) => {
      const amt = acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      return sum + (Number(amt) || 0);
    }, 0);
  } catch {
    return null;
  }
}

export function syraHolderProgressPct(balance: number | null): number {
  if (balance == null || balance <= 0) return 0;
  return Math.min(100, (balance / SYRA_HOLDER_THRESHOLD) * 100);
}

export function isSyraHolderEligible(balance: number | null): boolean {
  return balance != null && balance >= SYRA_HOLDER_THRESHOLD;
}
