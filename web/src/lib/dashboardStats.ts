import { PublicKey } from "@solana/web3.js";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";
import { ensureAccessTokenForWallet, syraFetch } from "@/lib/agentAuthApi";
import { getApiBaseUrl } from "@/lib/env";

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

export type OperatorStatsErrorCode = "api_unconfigured" | "auth_required" | "not_admin" | "api_error";

export class OperatorStatsFetchError extends Error {
  readonly code: OperatorStatsErrorCode;

  constructor(code: OperatorStatsErrorCode, message: string) {
    super(message);
    this.name = "OperatorStatsFetchError";
    this.code = code;
  }
}

export async function fetchOperatorRegistryStats(args: {
  network: "mainnet" | "devnet";
  mint: string;
  /** Connected admin wallet — Syra session must match this address. */
  sessionWallet: string;
}): Promise<OperatorRegistryStats> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new OperatorStatsFetchError(
      "api_unconfigured",
      "Syra API URL is not configured. Set VITE_SYRA_API_URL or use local dev with the /api proxy.",
    );
  }

  const sessionWallet = args.sessionWallet.trim();
  const token = await ensureAccessTokenForWallet(sessionWallet);
  if (!token) {
    throw new OperatorStatsFetchError(
      "auth_required",
      "Sign in with your connected admin wallet to load stakers (approve the Syra signature prompt).",
    );
  }

  const root = base.replace(/\/$/, "");
  const qs = new URLSearchParams({
    network: args.network,
    mint: args.mint,
  });

  const res = await syraFetch(`${root}/staking/dashboard/operator-stats?${qs}`, {
    method: "GET",
    cache: "no-store",
  });

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: OperatorRegistryStats;
    error?: string;
    sessionWallet?: string;
    allowedAdmins?: string[];
  };

  if (res.status === 401 || body.error === "auth_required") {
    throw new OperatorStatsFetchError(
      "auth_required",
      "Sign in with your admin wallet to load stakers (approve the Syra wallet signature prompt).",
    );
  }

  if (res.status === 403 || body.error === "not_admin") {
    const allowed = body.allowedAdmins?.length
      ? body.allowedAdmins.join(", ")
      : null;
    const session = body.sessionWallet?.trim();
    let message = "Your Syra sign-in wallet is not authorized for the stakers dashboard.";
    if (session) {
      message += ` Signed-in wallet: ${session}.`;
    }
    if (sessionWallet && session && session !== sessionWallet) {
      message += ` Connected wallet: ${sessionWallet}. Use “Sign in with wallet” to refresh your session.`;
    } else if (allowed) {
      message += ` API allows: ${allowed}.`;
    } else {
      message +=
        " Connect the admin wallet and sign in again.";
    }
    throw new OperatorStatsFetchError("not_admin", message);
  }

  if (!res.ok || !body.success || !body.data) {
    throw new OperatorStatsFetchError(
      "api_error",
      body.error || `Could not load stakers (${res.status}).`,
    );
  }

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
  return STREAMFLOW_CONFIG.isDevnet ? "devnet" : "mainnet";
}

/** Streamflow lock mint — must match locks page and protocol summary. */
export function dashboardStreamflowMint(): string {
  return STREAMFLOW_CONFIG.tokenMint.toBase58();
}

export { STREAMFLOW_CONFIG };
