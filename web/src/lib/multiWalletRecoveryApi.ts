import { syraFetch } from "@/lib/agentAuthApi";
import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl()}/multiwallet-recover`;

export interface MultiWalletRecoveryPreviewWallet {
  publicKey: string;
  walletIndex: number;
  solBalance: number;
  ansemBalance: number;
}

export interface MultiWalletRecoveryPreview {
  ownerWallet: string;
  walletCount: number;
  totalSol: number;
  totalAnsem: number;
  ansemMint: string;
  wallets: MultiWalletRecoveryPreviewWallet[];
}

export interface MultiWalletRecoveryResultRow {
  publicKey: string;
  success: boolean;
  skipped?: boolean;
  sellSignature?: string | null;
  sellSource?: string | null;
  ansemSoldRaw?: string;
  sweepSignature?: string | null;
  solSweptLamports?: string;
  error?: string;
}

export interface MultiWalletRecoveryResponse {
  total: number;
  succeeded: number;
  skipped: number;
  failed: number;
  ansemMint: string;
  totalSolSwept: number;
  results: MultiWalletRecoveryResultRow[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function parseApi<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body.data as T;
}

export async function fetchMultiWalletRecoveryPreview(): Promise<MultiWalletRecoveryPreview> {
  const res = await syraFetch(`${base()}/preview`);
  return parseApi<MultiWalletRecoveryPreview>(res);
}

export async function recoverMultiWalletFunds(): Promise<MultiWalletRecoveryResponse> {
  const res = await syraFetch(`${base()}/recover`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return parseApi<MultiWalletRecoveryResponse>(res);
}
