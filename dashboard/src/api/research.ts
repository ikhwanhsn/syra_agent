/**
 * Internal research, browse, and X search APIs for the dashboard.
 * Uses /internal/* endpoints (API key auth, no x402).
 */

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url || typeof url !== "string") throw new Error("VITE_API_BASE_URL is not set");
  return url.replace(/\/$/, "");
};

const getApiKey = (): string => {
  const key = import.meta.env.VITE_API_KEY;
  if (!key || typeof key !== "string") throw new Error("VITE_API_KEY is not set");
  return key;
};

function headers(): Record<string, string> {
  return {
    "X-API-Key": getApiKey(),
    Accept: "application/json",
  };
}

export interface ResearchResponse {
  status: string;
  content: string;
  sources?: unknown[];
}

export interface BrowseResponse {
  query: string;
  result: string;
}

export interface XSearchResponse {
  query: string;
  result: string;
  citations?: unknown[];
  toolCalls?: unknown[];
}

export async function fetchResearch(
  query: string,
  type: "quick" | "deep" = "deep"
): Promise<ResearchResponse> {
  const base = getBaseUrl();
  const res = await fetch(
    `${base}/internal/research?${new URLSearchParams({ query, type })}`,
    { headers: headers() }
  );
  if (!res.ok) {
    const text = await res.text();
    let err: string;
    try {
      const j = JSON.parse(text);
      err = j.message || j.error || text;
    } catch {
      err = text;
    }
    throw new Error(err || `Research failed: ${res.status}`);
  }
  return res.json() as Promise<ResearchResponse>;
}

export async function fetchBrowse(query: string): Promise<BrowseResponse> {
  const base = getBaseUrl();
  const res = await fetch(
    `${base}/internal/browse?${new URLSearchParams({ query })}`,
    { headers: headers() }
  );
  if (!res.ok) {
    const text = await res.text();
    let err: string;
    try {
      const j = JSON.parse(text);
      err = j.message || j.error || text;
    } catch {
      err = text;
    }
    throw new Error(err || `Browse failed: ${res.status}`);
  }
  return res.json() as Promise<BrowseResponse>;
}

export async function fetchXSearch(query: string): Promise<XSearchResponse> {
  const base = getBaseUrl();
  const res = await fetch(
    `${base}/internal/x-search?${new URLSearchParams({ query })}`,
    { headers: headers() }
  );
  if (!res.ok) {
    const text = await res.text();
    let err: string;
    try {
      const j = JSON.parse(text);
      err = j.message || j.error || text;
    } catch {
      err = text;
    }
    throw new Error(err || `X search failed: ${res.status}`);
  }
  return res.json() as Promise<XSearchResponse>;
}

/** Payload for research-resume: latest research content from dashboard. */
export interface ResearchResumePayload {
  panels?: Record<string, { data: { result: string }; lastQuery: string }>;
  customXSearch?: { data: { result: string }; lastQuery: string };
  deepResearch?: { data: { content: string }; lastQuery: string };
  browse?: { data: { result: string }; lastQuery: string };
}

/** Stored research payload (panels, customXSearch, deepResearch, browse, resume, savedAt). */
export interface StoredResearchPayload {
  panels?: Record<string, { data: { result: string; query?: string; citations?: unknown[] }; lastQuery: string }>;
  customXSearch?: { data: { result: string; query?: string; citations?: unknown[] }; lastQuery: string };
  deepResearch?: { data: { content: string; sources?: unknown[] }; lastQuery: string };
  browse?: { data: { query: string; result: string }; lastQuery: string };
  resume?: { resume: string; fetchedAt?: string };
  savedAt?: string;
}

export interface ResearchStoreResponse {
  payload: StoredResearchPayload | null;
  savedAt?: string;
}

export interface ResearchResumeResponse {
  resume: string;
  truncated?: boolean;
}

export async function fetchResearchResume(payload: ResearchResumePayload): Promise<ResearchResumeResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/internal/research-resume`, {
    method: "POST",
    headers: {
      ...headers(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    let err: string;
    try {
      const j = JSON.parse(text);
      err = j.message || j.error || text;
    } catch {
      err = text;
    }
    throw new Error(err || `Resume failed: ${res.status}`);
  }
  return res.json() as Promise<ResearchResumeResponse>;
}

/** Fetch latest research from database (for page load / refresh). */
export async function fetchResearchStore(): Promise<ResearchStoreResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/internal/research-store`, { headers: headers() });
  if (!res.ok) {
    const text = await res.text();
    let err: string;
    try {
      const j = JSON.parse(text);
      err = j.message || j.error || text;
    } catch {
      err = text;
    }
    throw new Error(err || `Research store fetch failed: ${res.status}`);
  }
  return res.json() as Promise<ResearchStoreResponse>;
}

/** Save research to database (replaces previous; call after any research update). */
export async function saveResearchStore(payload: StoredResearchPayload): Promise<{ ok: boolean; savedAt: string }> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/internal/research-store`, {
    method: "PUT",
    headers: {
      ...headers(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) {
    const text = await res.text();
    let err: string;
    try {
      const j = JSON.parse(text);
      err = j.message || j.error || text;
    } catch {
      err = text;
    }
    throw new Error(err || `Research store save failed: ${res.status}`);
  }
  return res.json() as Promise<{ ok: boolean; savedAt: string }>;
}
