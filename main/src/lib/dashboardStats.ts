import { PublicKey } from "@solana/web3.js";
import { CONFIG } from "@/constants/config";

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SYRA_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  );
}

export interface StakerRow {
  wallet: string;
  openLockCount: number;
  totalAmountRaw: string;
}

export interface OperatorRegistryStats {
  network: string;
  mint: string;
  openLockCount: number;
  closedLockCount: number;
  uniqueWallets: number;
  totalAmountRawOpen: string;
  /** Wallets with at least one open Streamflow lock for this mint. */
  stakers: StakerRow[];
  recentActivity: Array<{
    streamId: string;
    wallet: string;
    amountFormatted?: string;
    unlockAtIso?: string;
    closed?: boolean;
    source?: string;
  }>;
}

export async function fetchOperatorRegistryStats(args: {
  network: "mainnet" | "devnet";
  mint: string;
  adminWallet: string;
}): Promise<OperatorRegistryStats | null> {
  const base = getApiBaseUrl();
  if (!base) return null;
  const root = base.replace(/\/$/, "");
  const qs = new URLSearchParams({
    network: args.network,
    mint: args.mint,
  });
  const res = await fetch(`${root}/staking/dashboard/operator-stats?${qs}`, {
    method: "GET",
    headers: { "x-admin-wallet": args.adminWallet },
    cache: "no-store",
  });
  const body = (await res.json()) as {
    success?: boolean;
    data?: OperatorRegistryStats;
    error?: string;
  };
  if (!res.ok || !body.success || !body.data) return null;
  const data = body.data;
  if (!Array.isArray(data.stakers)) {
    return { ...data, stakers: [] };
  }
  return data;
}

export function walletExplorerUrl(wallet: string, isDevnet: boolean): string {
  return isDevnet
    ? `https://explorer.solana.com/address/${wallet}?cluster=devnet`
    : `https://explorer.solana.com/address/${wallet}`;
}

export function mintExplorerUrl(mint: PublicKey, isDevnet: boolean): string {
  const m = mint.toBase58();
  return isDevnet
    ? `https://explorer.solana.com/address/${m}?cluster=devnet`
    : `https://explorer.solana.com/address/${m}`;
}

export function dashboardNetworkLabel(): "mainnet" | "devnet" {
  return CONFIG.IS_DEVNET ? "devnet" : "mainnet";
}

export { CONFIG };
