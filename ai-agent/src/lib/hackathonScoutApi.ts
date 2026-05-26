import { getApiBaseUrl } from "@/lib/chatApi";

export type HackathonLeadStatus =
  | "new"
  | "interested"
  | "participate"
  | "applied"
  | "skip"
  | "archived";

export interface HackathonLead {
  _id: string;
  tweetId: string;
  status: HackathonLeadStatus;
  title: string;
  organizer: string;
  description: string;
  relevanceScore: number;
  relevanceReason: string;
  tags: string[];
  deadline: string | null;
  prizePool: string | null;
  applicationUrl: string | null;
  tweetUrl: string;
  tweetText: string;
  authorHandle: string;
  notes: string;
  discoveredAt: string;
  statusUpdatedAt: string;
}

export interface HackathonScoutRunMeta {
  ranAt: string;
  query: string;
  tweetsSampled: number;
  tweetsSentToLlm?: number;
  extracted: number;
  newSaved: number;
  skippedExisting?: number;
  fromCache: boolean;
  xConfigured: boolean;
}

async function fetchInternalJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, { ...init, credentials: "include" });
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

export type FetchHackathonLeadsParams = {
  status?: string;
  limit?: number;
  skip?: number;
};

export async function fetchHackathonLeads(params: FetchHackathonLeadsParams = {}) {
  const status = params.status ?? "all";
  const limit = params.limit ?? 100;
  const skip = params.skip ?? 0;
  const qs = new URLSearchParams({
    status,
    limit: String(limit),
    skip: String(skip),
  });
  return fetchInternalJson<{
    success: boolean;
    items: HackathonLead[];
    total: number;
    counts: Record<string, number>;
  }>(`/internal/hackathon-scout/leads?${qs.toString()}`);
}

export async function fetchHackathonLatestRun() {
  return fetchInternalJson<{
    success: boolean;
    data: HackathonScoutRunMeta | null;
    savedAt?: string;
  }>("/internal/hackathon-scout/latest-run");
}

export async function runHackathonScoutPipeline() {
  return fetchInternalJson<{
    success: boolean;
    data: HackathonScoutRunMeta;
    newLeads: HackathonLead[];
    counts: Record<string, number>;
  }>("/internal/hackathon-scout/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
}

export async function patchHackathonLead(
  id: string,
  patch: { status?: HackathonLeadStatus; notes?: string },
) {
  return fetchInternalJson<{
    success: boolean;
    data: HackathonLead;
    counts: Record<string, number>;
  }>(`/internal/hackathon-scout/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}
