import { getApiBaseUrl } from "@/lib/chatApi";
import { syraFetch } from "@/lib/agentAuthApi";

export const HACKATHON_STATUSES = [
  "new",
  "interested",
  "joined",
  "in_progress",
  "submitted",
  "skipped",
  "archived",
] as const;

export type HackathonStatus = (typeof HACKATHON_STATUSES)[number];

export type HackathonSource = "devpost" | "exa" | "manual";

export interface Hackathon {
  _id: string;
  source: HackathonSource;
  sourceId: string;
  dedupeKey: string;
  status: HackathonStatus;
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
  notes: string;
  discoveredAt: string;
  statusUpdatedAt: string;
  lastSeenAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HackathonListResponse {
  success: boolean;
  items: Hackathon[];
  total: number;
  counts: Record<string, number>;
}

export interface HackathonLatestRunResponse {
  success: boolean;
  data: HackathonRunMeta | null;
  savedAt?: string;
}

export interface HackathonRunMeta {
  ranAt: string;
  devpost: {
    globalFetched: number;
    indonesiaFetched: number;
    newSaved: number;
    updated: number;
    skipped: number;
  };
  exa: {
    exaConfigured: boolean;
    queriesRun: number;
    hitsSampled: number;
    extracted: number;
    newSaved: number;
    updated: number;
    skipped: number;
  };
  totalNew: number;
  totalUpdated: number;
  errors: string[];
}

export interface HackathonListParams {
  status?: string;
  region?: "all" | "indonesia" | "global";
  source?: string;
  openState?: string;
  search?: string;
  limit?: number;
  skip?: number;
}

async function fetchHackathonJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await syraFetch(url, { ...init, credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (typeof body.error === "string" && body.error) ||
      (typeof body.message === "string" && body.message) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export async function fetchHackathons(params?: HackathonListParams): Promise<HackathonListResponse> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.region && params.region !== "all") search.set("region", params.region);
  if (params?.source && params.source !== "all") search.set("source", params.source);
  if (params?.openState && params.openState !== "all") search.set("openState", params.openState);
  if (params?.search) search.set("search", params.search);
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.skip != null) search.set("skip", String(params.skip));
  const qs = search.toString();
  return fetchHackathonJson<HackathonListResponse>(`/internal/hackathons${qs ? `?${qs}` : ""}`);
}

export async function fetchHackathonLatestRun(): Promise<HackathonLatestRunResponse> {
  return fetchHackathonJson<HackathonLatestRunResponse>("/internal/hackathons/latest-run");
}

export async function updateHackathon(
  id: string,
  patch: { status?: HackathonStatus; notes?: string },
): Promise<{ success: boolean; data: Hackathon; counts: Record<string, number> }> {
  return fetchHackathonJson(`/internal/hackathons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function runHackathonScout(): Promise<{
  success: boolean;
  data: HackathonRunMeta;
  counts: Record<string, number>;
}> {
  return fetchHackathonJson("/internal/hackathons/run", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: "{}",
  });
}

export const HACKATHON_STATUS_LABELS: Record<HackathonStatus, string> = {
  new: "New",
  interested: "Interested",
  joined: "Joined",
  in_progress: "In progress",
  submitted: "Submitted",
  skipped: "Skipped",
  archived: "Archived",
};
