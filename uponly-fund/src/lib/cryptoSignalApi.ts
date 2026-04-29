import { API_BASE, getApiHeaders } from "../../config/global";

export type SignalToken = "bitcoin" | "solana" | "ethereum";

export type SignalResponse = {
  success: boolean;
  data?: {
    signal?: Record<string, unknown>;
  };
  error?: string;
};

export async function getSignal(token: SignalToken, signal?: AbortSignal): Promise<SignalResponse> {
  const url = `${API_BASE}/signal?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { method: "GET", headers: getApiHeaders(), signal });
  const json = (await res.json().catch(() => null)) as SignalResponse | null;
  if (!res.ok || !json || json.success === false) {
    throw new Error(json?.error || `Signal request failed (${res.status})`);
  }
  return json;
}
