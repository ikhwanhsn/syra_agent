import type { PublicKey } from "@solana/web3.js";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";

export interface StreamflowLockRegistryItem {
  streamId: string;
  txId: string;
  wallet: string;
  sender?: string | null;
  recipient?: string | null;
  mint: string;
  tokenSymbol: string;
  decimals: number;
  amountRaw: string;
  amountFormatted: string;
  unlockedRaw?: string;
  unlockedFormatted?: string;
  withdrawnRaw?: string;
  withdrawnFormatted?: string;
  unlockAtUnix: number;
  unlockAtIso: string;
  network: "mainnet" | "devnet";
  source: "app" | "onchain_sync";
  closed?: boolean;
  metadata?: Record<string, unknown> | null;
}

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SYRA_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000"
  );
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchLocksFromRegistry(
  wallet: PublicKey,
  mint: PublicKey
): Promise<StreamflowLockRegistryItem[]> {
  const baseUrl = getApiBaseUrl();
  const walletStr = wallet.toBase58();
  const mintStr = mint.toBase58();
  const network: "mainnet" | "devnet" = STREAMFLOW_CONFIG.isDevnet ? "devnet" : "mainnet";
  const qs = new URLSearchParams({
    wallet: walletStr,
    mint: mintStr,
    network,
    includeClosed: "false",
    limit: "500",
  });

  const res = await fetch(`${baseUrl}/streamflow-locks?${qs.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Registry fetch failed (${res.status})`);
  const body = (await parseJsonSafe(res)) as { success?: boolean; data?: unknown } | null;
  if (!body?.success || !Array.isArray(body.data)) return [];
  return body.data as StreamflowLockRegistryItem[];
}

export async function upsertLockToRegistry(item: StreamflowLockRegistryItem): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/streamflow-locks/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    throw new Error(`Registry upsert failed (${res.status})`);
  }
}

export async function bulkUpsertLocksToRegistry(
  items: StreamflowLockRegistryItem[]
): Promise<void> {
  if (items.length === 0) return;
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/streamflow-locks/bulk-upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw new Error(`Registry bulk-upsert failed (${res.status})`);
  }
}
