import { getApiBaseUrl } from "@/lib/chatApi";
import { isValidBase58Mint } from "@/lib/swapPresets";

export type PumpfunCoinMetadata = {
  mint: string;
  symbol: string;
  name: string;
  imageUri?: string;
  /** True when the bonding curve completed (token graduated to Raydium). */
  complete?: boolean;
};

type AgentPumpfunCoinResponse =
  | {
      success: true;
      mint: string;
      symbol: string;
      name: string;
      imageUri?: string;
      complete?: boolean;
    }
  | { success: false; error?: string };

/**
 * Pump.fun coin metadata for agent UI — proxied by Syra API (`GET /agent/pumpfun/coin/:mint`).
 */
export async function fetchPumpfunCoinMetadata(
  mint: string,
  signal?: AbortSignal
): Promise<PumpfunCoinMetadata | null> {
  const trimmed = mint.trim();
  if (!isValidBase58Mint(trimmed)) return null;

  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}/agent/pumpfun/coin/${encodeURIComponent(trimmed)}`;

  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    const raw: unknown = await res.json().catch(() => null);
    if (!raw || typeof raw !== "object") return null;
    const body = raw as AgentPumpfunCoinResponse;
    if (!body.success) return null;
    return {
      mint: body.mint,
      symbol: body.symbol,
      name: body.name,
      ...(body.imageUri ? { imageUri: body.imageUri } : {}),
      ...(typeof body.complete === "boolean" ? { complete: body.complete } : {}),
    };
  } catch {
    return null;
  }
}
