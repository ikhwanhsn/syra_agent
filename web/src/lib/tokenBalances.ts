import { PublicKey } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import { WSOL_MINT, USDC_MINT } from "@/lib/swapPresets";

export async function fetchMintBalance(
  connection: Connection,
  owner: string,
  mint: string,
): Promise<number> {
  try {
    const ownerPk = new PublicKey(owner);
    if (mint === WSOL_MINT) {
      const lamports = await connection.getBalance(ownerPk, "confirmed");
      return lamports / 1e9;
    }
    const accounts = await connection.getParsedTokenAccountsByOwner(ownerPk, {
      mint: new PublicKey(mint),
    });
    return accounts.value.reduce((sum, acc) => {
      const tokenAmount = acc.account.data.parsed?.info?.tokenAmount;
      if (!tokenAmount) return sum;
      const ui =
        tokenAmount.uiAmount != null && Number.isFinite(tokenAmount.uiAmount)
          ? tokenAmount.uiAmount
          : Number.parseFloat(tokenAmount.uiAmountString ?? "0");
      return sum + (Number.isFinite(ui) ? ui : 0);
    }, 0);
  } catch {
    return 0;
  }
}

export async function fetchWalletTokenBalances(
  connection: Connection,
  owner: string,
  mints: string[],
): Promise<Record<string, number>> {
  const unique = [...new Set(mints.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (mint) => [mint, await fetchMintBalance(connection, owner, mint)] as const),
  );
  return Object.fromEntries(entries);
}

export { WSOL_MINT, USDC_MINT };
