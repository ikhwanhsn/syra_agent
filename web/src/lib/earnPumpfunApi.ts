import { syraFetch } from "@/lib/agentAuthApi";
import { getApiBaseUrl } from "@/lib/env";

const base = () => getApiBaseUrl().replace(/\/$/, "");

export type EarnPumpfunLaunch = {
  id: string;
  earnAnonymousId?: string;
  mint: string;
  name: string;
  symbol: string;
  metadataUri: string;
  imageUri?: string | null;
  description?: string | null;
  createdAt: string;
  /** Live market (DexScreener / pump.fun) — best-effort, may be null. */
  priceUsd?: number | null;
  marketCapUsd?: number | null;
  liquidityUsd?: number | null;
  volume24hUsd?: number | null;
  priceChange24hPercent?: number | null;
};

export type EarnPumpfunWalletInfo = {
  earnAnonymousId: string;
  earnAgentAddress: string;
  launches: EarnPumpfunLaunch[];
};

export type LaunchTokenResult = {
  mint: string | null;
  signature: string | null;
  imageUri?: string | null;
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
  const contentType = res.headers.get("content-type") ?? "";
  const raw = await res.text().catch(() => "");
  let data = {} as T & { success?: boolean; error?: string };
  if (raw) {
    try {
      data = JSON.parse(raw) as T & { success?: boolean; error?: string };
    } catch {
      if (!res.ok) {
        throw new Error(res.statusText || "Request failed");
      }
      throw new Error(
        contentType.includes("json")
          ? "Invalid JSON response from server"
          : "Server returned a non-JSON response",
      );
    }
  }
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

/** Public marketplace catalog — launches from all creators. */
export async function fetchEarnPumpfunMarketplace(params?: {
  limit?: number;
  skip?: number;
}): Promise<{ launches: EarnPumpfunLaunch[] }> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.skip != null) search.set("skip", String(params.skip));
  const qs = search.toString();
  const res = await fetch(`${base()}/earn/token/marketplace${qs ? `?${qs}` : ""}`, {
    headers: { Accept: "application/json" },
  });
  const json = await parseJson<{ data: { launches: EarnPumpfunLaunch[] } }>(res);
  return { launches: json.data?.launches ?? [] };
}

export async function uploadEarnTokenMetadata(input: {
  file: File;
  name: string;
  symbol: string;
  description?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}): Promise<{ metadataUri: string; imageUri: string | null; description: string | null }> {
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
    // Let the browser set multipart/form-data + boundary (syraFetch skips JSON Content-Type for FormData).
    body: form,
  });
  const json = await parseJson<{
    data: { metadataUri: string; imageUri?: string | null; description?: string | null };
  }>(res);
  if (!json.data?.metadataUri) {
    throw new Error("Metadata upload did not return a URI");
  }
  return {
    metadataUri: json.data.metadataUri,
    imageUri: json.data.imageUri?.trim() || null,
    description: json.data.description?.trim() || null,
  };
}

/** Public token detail by mint. */
export async function fetchEarnPumpfunTokenDetail(mint: string): Promise<EarnPumpfunLaunch> {
  const res = await fetch(`${base()}/earn/token/${encodeURIComponent(mint.trim())}`, {
    headers: { Accept: "application/json" },
  });
  const json = await parseJson<{ data: { launch: EarnPumpfunLaunch } }>(res);
  if (!json.data?.launch) throw new Error(json.error || "Token not found");
  return json.data.launch;
}

export async function launchEarnPumpfunToken(input: {
  name: string;
  symbol: string;
  uri: string;
  solLamports: string;
  imageUri?: string | null;
  description?: string | null;
}): Promise<LaunchTokenResult> {
  const res = await syraFetch(`${base()}/earn/token/launch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: input.name.trim(),
      symbol: input.symbol.trim().toUpperCase(),
      uri: input.uri.trim(),
      solLamports: input.solLamports,
      ...(input.imageUri?.trim() ? { imageUri: input.imageUri.trim() } : {}),
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
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
      const need = typeof json.requiredUsdc === "number" ? json.requiredUsdc : null;
      const have = typeof json.usdcBalance === "number" ? json.usdcBalance : 0;
      // Legacy USDC fee path (should not fire for earn launches with skipUsdcCharge).
      if (need != null && need > 0) {
        throw new Error(
          `Earn wallet needs $${need.toFixed(2)} USDC (current: $${have.toFixed(2)}). Fund via Earn wallet.`,
        );
      }
      throw new Error(json.error || "Earn wallet not ready. Fund SOL via Earn wallet and try again.");
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

/** Appended to every earn-pillar pump.fun token display name. */
export const SYRA_TOKEN_NAME_SUFFIX = " by Syra";

/** Ensure token name ends with " by Syra" (idempotent, case-insensitive). */
export function withSyraTokenNameSuffix(rawName: string): string {
  const base = rawName.trim();
  if (!base) return "";
  if (/\s+by\s+syra$/i.test(base)) {
    return base.replace(/\s+by\s+syra$/i, SYRA_TOKEN_NAME_SUFFIX);
  }
  return `${base}${SYRA_TOKEN_NAME_SUFFIX}`;
}
