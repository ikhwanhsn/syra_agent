import { API_BASE } from "../../config/global";

export type HackathonStatus =
  | "new"
  | "interested"
  | "joined"
  | "in_progress"
  | "submitted"
  | "skipped"
  | "archived";

export interface HackathonRecord {
  _id: string;
  source: "devpost" | "exa" | "manual";
  title: string;
  organizer: string;
  description: string;
  url: string | null;
  applicationUrl: string | null;
  location: string;
  locationType: string;
  isIndonesia: boolean;
  themes: string[];
  prizePool: string | null;
  prizeAmountUsd: number | null;
  submissionDates: string | null;
  deadline: string | null;
  openState: string;
  registrationsCount: number | null;
  thumbnailUrl: string | null;
  relevanceScore: number;
  relevanceReason: string;
  status: HackathonStatus;
  notes: string;
  discoveredAt: string;
  statusUpdatedAt: string;
  lastSeenAt: string;
}

export interface HackathonScoutRunMeta {
  ranAt: string;
  devpost?: { globalFetched: number; indonesiaFetched: number; newSaved: number; updated: number };
  exa?: { exaConfigured: boolean; queriesRun: number; extracted: number; newSaved: number };
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

export type FetchHackathonsParams = {
  status?: string;
  region?: "all" | "indonesia" | "global";
  source?: string;
  openState?: string;
  search?: string;
  limit?: number;
  skip?: number;
};

export function fetchHackathons(wallet: string | null | undefined, params: FetchHackathonsParams = {}) {
  const qs = new URLSearchParams();
  qs.set("status", params.status ?? "all");
  qs.set("region", params.region ?? "all");
  qs.set("source", params.source ?? "all");
  qs.set("openState", params.openState ?? "all");
  if (params.search) qs.set("search", params.search);
  qs.set("limit", String(params.limit ?? 50));
  qs.set("skip", String(params.skip ?? 0));

  return adminFetch<{
    success: boolean;
    items: HackathonRecord[];
    total: number;
    counts: Record<string, number>;
  }>(wallet, `/internal/hackathons?${qs.toString()}`);
}

export function fetchHackathonLatestRun(wallet: string | null | undefined) {
  return adminFetch<{
    success: boolean;
    data: HackathonScoutRunMeta | null;
    savedAt?: string;
  }>(wallet, "/internal/hackathons/latest-run");
}

export function patchHackathon(
  wallet: string,
  id: string,
  patch: { status?: HackathonStatus; notes?: string },
) {
  return adminFetch<{
    success: boolean;
    data: HackathonRecord;
    counts: Record<string, number>;
  }>(wallet, `/internal/hackathons/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
