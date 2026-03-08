/**
 * Fetches API error request details from GET /analytics/errors.
 * Requires VITE_API_BASE_URL. API key is injected by the server for trusted origins.
 */

export interface ApiErrorEntry {
  path: string;
  method: string;
  statusCode: number;
  durationMs: number;
  createdAt: string;
  source?: string;
  /** True if the request was to an x402 (paid) API endpoint. */
  paid?: boolean;
}

export interface ApiErrorsResponse {
  errors: ApiErrorEntry[];
  since: string;
  days: number;
}

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url || typeof url !== "string") {
    throw new Error("VITE_API_BASE_URL is not set");
  }
  return url.replace(/\/$/, "");
};

export async function fetchApiErrors(days: 7 | 30 = 30): Promise<ApiErrorsResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/analytics/errors?days=${days}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API errors request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<ApiErrorsResponse>;
}
