import { useQuery } from "@tanstack/react-query";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  USDC_MAINNET,
  collateralDecimalsForMint,
  humanToRawFloor,
} from "@/lib/riseAmounts";
import { getSolanaConnection } from "@/lib/solanaTx";

export type WalletCollateralBalance = {
  human: number;
  raw: number;
  decimals: number;
};

/**
 * Spendable SOL or USDC in the wallet (on-chain), for buy-side % shortcuts.
 */
export function useWalletCollateralBalance(
  wallet: string | null | undefined,
  mintMain: string | null | undefined,
) {
  const w = wallet?.trim() ?? "";
  const enabled = w.length >= 32 && Boolean(mintMain?.trim());

  return useQuery<WalletCollateralBalance, Error>({
    queryKey: ["wallet-collateral-balance", w, mintMain ?? ""],
    enabled,
    staleTime: 30_000,
    retry: 1,
    queryFn: async () => {
      const connection = getSolanaConnection();
      const owner = new PublicKey(w);
      const decimals = collateralDecimalsForMint(mintMain);

      if (mintMain === USDC_MAINNET) {
        const resp = await connection.getParsedTokenAccountsByOwner(owner, {
          mint: new PublicKey(USDC_MAINNET),
        });
        const human = resp.value.reduce((sum, acc) => {
          const parsed = acc.account.data.parsed;
          if (parsed?.type !== "account") return sum;
          const ui = parsed.info.tokenAmount.uiAmount;
          return sum + (typeof ui === "number" && Number.isFinite(ui) ? ui : 0);
        }, 0);
        return { human, raw: humanToRawFloor(human, decimals), decimals };
      }

      const lamports = await connection.getBalance(owner, "confirmed");
      const human = lamports / LAMPORTS_PER_SOL;
      return { human, raw: lamports, decimals };
    },
  });
}
