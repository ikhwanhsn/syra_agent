import { getApiBaseUrl } from "@/lib/chatApi";
import type { PartnershipTarget } from "@/lib/internalTeamAgentsApi";

export type PartnershipLeadStatus =
  | "new"
  | "interested"
  | "participate"
  | "applied"
  | "skip"
  | "archived";

export type PartnershipLeadKind = "target" | "integration";

export interface PartnershipLead extends PartnershipTarget {
  _id: string;
  dedupeKey: string;
  kind: PartnershipLeadKind;
  status: PartnershipLeadStatus;
  integrationText: string;
  notes: string;
  discoveredAt: string;
  statusUpdatedAt: string;
  lastSeenAt?: string;
}

export interface PartnershipScoutRunMeta {
  ranAt: string;
  ecosystemSummary?: string;
  onchainThemes?: string[];
  risksOrCaveats?: string[];
  generatedAt?: string;
  sourceStats?: Record<string, number>;
  candidatesScanned?: number;
  candidatesFresh?: number;
  extractedTargets?: number;
  extractedIntegrations?: number;
  newSaved?: number;
  skippedExisting?: number;
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

export type FetchPartnershipLeadsParams = {
  status?: string;
  kind?: PartnershipLeadKind | "all";
  limit?: number;
  skip?: number;
};

export async function fetchPartnershipLeads(params: FetchPartnershipLeadsParams = {}) {
  const qs = new URLSearchParams({
    status: params.status ?? "all",
    kind: params.kind ?? "all",
    limit: String(params.limit ?? 100),
    skip: String(params.skip ?? 0),
  });
  return fetchInternalJson<{
    success: boolean;
    items: PartnershipLead[];
    total: number;
    counts: Record<string, number>;
  }>(`/internal/partnership-scout/leads?${qs.toString()}`);
}

export async function fetchPartnershipLatestRun() {
  return fetchInternalJson<{
    success: boolean;
    data: PartnershipScoutRunMeta | null;
    savedAt?: string;
  }>("/internal/partnership-scout/latest-run");
}

export async function runPartnershipScoutPipeline() {
  return fetchInternalJson<{
    success: boolean;
    data: PartnershipScoutRunMeta;
    newLeads: PartnershipLead[];
    counts: Record<string, number>;
  }>("/internal/partnership-scout/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

export async function patchPartnershipLead(
  id: string,
  patch: { status?: PartnershipLeadStatus; notes?: string },
) {
  return fetchInternalJson<{
    success: boolean;
    data: PartnershipLead;
    counts: Record<string, number>;
  }>(`/internal/partnership-scout/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

/** Map persisted lead to table row shape for targets. */
export function partnershipLeadAsTarget(lead: PartnershipLead): PartnershipTarget {
  return {
    name: lead.name,
    projectType: lead.projectType,
    utility: lead.utility,
    whyFitForSyra: lead.whyFitForSyra,
    collaborationIdea: lead.collaborationIdea,
    onchainSignals: lead.onchainSignals,
    priority: lead.priority,
    link: lead.link,
  };
}
