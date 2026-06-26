import { syraFetch } from "@/lib/agentAuthApi";
import { getApiBaseUrl } from "@/lib/env";

const base = () => getApiBaseUrl().replace(/\/$/, "");

export type EarnPumpfunLaunch = {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  metadataUri: string;
  launchSignature: string | null;
  initialBuyLamports: string | null;
  lastFeeCollectSignature: string | null;
  lastFeeCollectedAt: string | null;
  createdAt: string;
};

export type EarnPumpfunWalletInfo = {
  earnAnonymousId: string;
  earnAgentAddress: string;
  launches: EarnPumpfunLaunch[];
};

export type LaunchTokenResult = {
  mint: string | null;
  signature: string | null;
  submittedOnChain?: boolean;
  submitError?: string;
  confirmationRequired?: boolean;
  intentId?: string;
  earnAgentAddress: string;
};

export type CollectFeesResult = {
  mint: string;
  signature: string | null;
  submittedOnChain?: boolean;
  submitError?: string;
  confirmationRequired?: boolean;
  intentId?: string;
};

async function parseJson<T>(res: Response): Promise<T & { success?: boolean; error?: string }> {
  const data = (await res.json().catch(() => ({}))) as T & { success?: boolean; error?: string };
  if (!res.ok) {
    throw new Error(data.error || res.statusText || "Request failed");
  }
  return data;
}

export async function fetchEarnPumpfunLaunches(
  walletOrAnonymousId: string,
): Promise<EarnPumpfunWalletInfo> {
  const res = await syraFetch(
    `${base()}/earn/token/launches?wallet=${encodeURIComponent(walletOrAnonymousId)}`,
    { headers: { Accept: "application/json" } },
  );
  const json = await parseJson<{ data: EarnPumpfunWalletInfo }>(res);
  return json.data;
}

export async function uploadEarnTokenMetadata(input: {
  file: File;
  name: string;
  symbol: string;
  description?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}): Promise<{ metadataUri: string }> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("name", input.name.trim());
  form.append("symbol", input.symbol.trim().toUpperCase());
  if (input.description?.trim()) form.append("description", input.description.trim());
  if (input.twitter?.trim()) form.append("twitter", input.twitter.trim());
  if (input.telegram?.trim()) form.append("telegram", input.telegram.trim());
  if (input.website?.trim()) form.append("website", input.website.trim());

  const res = await syraFetch(`${base()}/earn/token/metadata`, {
    method: "POST",
    body: form,
  });
  const json = await parseJson<{ data: { metadataUri: string } }>(res);
  return { metadataUri: json.data.metadataUri };
}

export async function launchEarnPumpfunToken(input: {
  name: string;
  symbol: string;
  uri: string;
  solLamports: string;
}): Promise<LaunchTokenResult> {
  const res = await syraFetch(`${base()}/earn/token/launch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: input.name.trim(),
      symbol: input.symbol.trim().toUpperCase(),
      uri: input.uri.trim(),
      solLamports: input.solLamports,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    insufficientBalance?: boolean;
    usdcBalance?: number;
    requiredUsdc?: number;
    data?: LaunchTokenResult;
  };
  if (!res.ok) {
    if (json.insufficientBalance) {
      const need = json.requiredUsdc != null ? `$${json.requiredUsdc.toFixed(2)}` : "more USDC";
      const have = json.usdcBalance != null ? `$${json.usdcBalance.toFixed(2)}` : "low balance";
      throw new Error(`Earn wallet needs ${need} for the platform fee (current: ${have}). Fund via Earn wallet.`);
    }
    throw new Error(json.error || res.statusText || "Launch failed");
  }
  if (!json.data) throw new Error(json.error || "Launch failed");
  return json.data;
}

export async function collectEarnPumpfunFees(mint: string): Promise<CollectFeesResult> {
  const res = await syraFetch(`${base()}/earn/token/collect-fees`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ mint: mint.trim() }),
  });
  const json = await parseJson<{ data: CollectFeesResult }>(res);
  return json.data;
}

export function solToLamportsString(solRaw: string): string | null {
  const sol = solRaw.trim().replace(/,/g, "");
  const n = Number(sol);
  if (!Number.isFinite(n) || n <= 0) return null;
  const lamports = Math.round(n * 1e9);
  if (!Number.isFinite(lamports) || lamports <= 0) return null;
  return String(lamports);
}

export function shortenMint(mint: string): string {
  const t = mint.trim();
  if (t.length <= 12) return t;
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}
