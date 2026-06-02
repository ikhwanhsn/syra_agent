import { PublicKey, type Connection } from "@solana/web3.js";
import { getApiBaseUrl } from "@/lib/env";
import { withRpcFallback } from "@/lib/solanaRpc";

const LAMPORTS_PER_SOL = 1e9;
const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface UserWalletBalances {
  solBalance: number;
  usdcBalance: number;
}

function readTokenUiAmount(tokenAmount: {
  uiAmount: number | null;
  uiAmountString?: string;
}): number {
  if (tokenAmount.uiAmount != null && Number.isFinite(tokenAmount.uiAmount)) {
    return tokenAmount.uiAmount;
  }
  const parsed = Number.parseFloat(tokenAmount.uiAmountString ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Human-readable USDC amount for payment UI (supports micropayment balances). */
export function formatUsdcAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value > 0 && value < 0.01) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function fetchUserWalletBalances(
  connection: Connection,
  publicKey: PublicKey,
): Promise<UserWalletBalances> {
  const [solLamports, tokenAccounts] = await Promise.all([
    connection.getBalance(publicKey, "confirmed"),
    connection.getParsedTokenAccountsByOwner(publicKey, { mint: new PublicKey(USDC_MINT_MAINNET) }),
  ]);

  const usdc =
    tokenAccounts.value.length > 0
      ? tokenAccounts.value.reduce((sum, acc) => {
          const tokenAmount = acc.account.data.parsed?.info?.tokenAmount;
          if (!tokenAmount) return sum;
          return sum + readTokenUiAmount(tokenAmount);
        }, 0)
      : 0;

  return {
    solBalance: solLamports / LAMPORTS_PER_SOL,
    usdcBalance: usdc,
  };
}

interface WalletBalanceApiResponse {
  success?: boolean;
  solBalance?: number;
  usdcBalance?: number;
  error?: string;
}

/** Server-side RPC via Syra API — reliable when browser-direct RPC is blocked. */
export async function fetchUserWalletBalancesViaApi(address: string): Promise<UserWalletBalances> {
  const url = `${getApiBaseUrl()}/wallet/solana/balance?address=${encodeURIComponent(address)}`;
  const res = await fetch(url, { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as WalletBalanceApiResponse;
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Balance fetch failed (${res.status})`);
  }
  if (
    typeof data.solBalance !== "number" ||
    !Number.isFinite(data.solBalance) ||
    typeof data.usdcBalance !== "number" ||
    !Number.isFinite(data.usdcBalance)
  ) {
    throw new Error("Invalid balance response from API");
  }
  return { solBalance: data.solBalance, usdcBalance: data.usdcBalance };
}

/** API first (server RPC), then browser RPC fallbacks. */
export async function fetchUserWalletBalancesResilient(address: string): Promise<UserWalletBalances> {
  try {
    return await fetchUserWalletBalancesViaApi(address);
  } catch {
    const publicKey = new PublicKey(address);
    return withRpcFallback((readConnection) => fetchUserWalletBalances(readConnection, publicKey));
  }
}
