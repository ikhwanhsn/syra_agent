/**
 * Fetches API error request details from GET /analytics/errors.
 * Requires VITE_API_BASE_URL and VITE_API_KEY (same as KPI).
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

const getApiKey = (): string => {
  const key = import.meta.env.VITE_API_KEY;
  if (!key || typeof key !== "string") {
    throw new Error("VITE_API_KEY is not set");
  }
  return key;
};

export async function fetchApiErrors(days: 7 | 30 = 30): Promise<ApiErrorsResponse> {
  const base = getBaseUrl();
  const apiKey = getApiKey();
  const res = await fetch(`${base}/analytics/errors?days=${days}`, {
    headers: {
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API errors request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<ApiErrorsResponse>;
}
