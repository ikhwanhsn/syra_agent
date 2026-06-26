import { API_BASE } from "../../config/global";

export type EventStatus = "new" | "interested" | "registered" | "attended" | "skipped";

export type EventCategory = "tech" | "crypto" | "web3";

export type EventSource = "exa" | "x" | "luma" | "manual";

export interface EventRecord {
  _id: string;
  source: EventSource;
  title: string;
  organizer: string;
  description: string;
  category: EventCategory;
  lumaUrl: string;
  url: string | null;
  location: string;
  locationType: string;
  isIndonesia: boolean;
  isOnline: boolean;
  startAt: string | null;
  endAt: string | null;
  dateText: string;
  themes: string[];
  thumbnailUrl: string | null;
  relevanceScore: number;
  relevanceReason: string;
  status: EventStatus;
  notes: string;
  discoveredAt: string;
  statusUpdatedAt: string;
  lastSeenAt: string;
}

export interface EventScoutRunMeta {
  ranAt: string;
  exa?: {
    exaConfigured: boolean;
    queriesRun: number;
    hitsSampled: number;
    extracted: number;
    newSaved: number;
    updated: number;
    skipped: number;
  };
  x?: {
    xConfigured: boolean;
    queriesRun: number;
    tweetsSampled: number;
    hitsSampled: number;
    extracted: number;
    newSaved: number;
    updated: number;
    skipped: number;
  };
  luma?: {
    urlsRequested: number;
    parsed: number;
    failed: number;
    newSaved: number;
    updated: number;
    skipped: number;
  };
  totalNew?: number;
  totalUpdated?: number;
  errors?: string[];
}

async function adminFetch<T>(
  wallet: string | null | undefined,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (wallet) {
    headers["X-Admin-Wallet"] = wallet;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (typeof body.message === "string" && body.message) ||
      (typeof body.error === "string" && body.error) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export type FetchEventsParams = {
  status?: string;
  region?: "all" | "indonesia" | "global";
  source?: string;
  category?: string;
  search?: string;
  limit?: number;
  skip?: number;
};

export function fetchEvents(wallet: string | null | undefined, params: FetchEventsParams = {}) {
  const qs = new URLSearchParams();
  qs.set("status", params.status ?? "all");
  qs.set("region", params.region ?? "all");
  qs.set("source", params.source ?? "all");
  qs.set("category", params.category ?? "all");
  if (params.search) qs.set("search", params.search);
  qs.set("limit", String(params.limit ?? 50));
  qs.set("skip", String(params.skip ?? 0));

  return adminFetch<{
    success: boolean;
    items: EventRecord[];
    total: number;
    counts: Record<string, number>;
  }>(wallet, `/internal/events?${qs.toString()}`);
}

export function fetchEventLatestRun(wallet: string | null | undefined) {
  return adminFetch<{
    success: boolean;
    data: EventScoutRunMeta | null;
    savedAt?: string;
  }>(wallet, "/internal/events/latest-run");
}

export function patchEvent(
  wallet: string,
  id: string,
  patch: { status?: EventStatus; notes?: string },
) {
  return adminFetch<{
    success: boolean;
    data: EventRecord;
    counts: Record<string, number>;
  }>(wallet, `/internal/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
