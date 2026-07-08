import { getApiBaseUrl } from "@/lib/env";

export type OrganizeEntryType =
  | "hackathon"
  | "funding"
  | "event"
  | "partnership"
  | "application"
  | "other";

export type OrganizeEntryStatus =
  | "interested"
  | "applied"
  | "registered"
  | "in_progress"
  | "submitted"
  | "won"
  | "rejected"
  | "done";

export interface OrganizeEntry {
  id: string;
  anonymousId: string;
  type: OrganizeEntryType;
  title: string;
  status: OrganizeEntryStatus;
  organizer: string;
  url: string;
  amount: number | null;
  deadline: string | null;
  eventDate: string | null;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizeEntryInput {
  type: OrganizeEntryType;
  title: string;
  status: OrganizeEntryStatus;
  organizer?: string;
  url?: string;
  amount?: number | null;
  deadline?: string | null;
  eventDate?: string | null;
  notes?: string;
  tags?: string[];
}

export interface OrganizeMeta {
  types: OrganizeEntryType[];
  statuses: OrganizeEntryStatus[];
}

export const ORGANIZE_ENTRY_TYPE_LABELS: Record<OrganizeEntryType, string> = {
  hackathon: "Hackathon",
  funding: "Funding / Grant",
  event: "Event",
  partnership: "Partnership",
  application: "Application",
  other: "Other",
};

export const ORGANIZE_ENTRY_STATUS_LABELS: Record<OrganizeEntryStatus, string> = {
  interested: "Interested",
  applied: "Applied",
  registered: "Registered",
  in_progress: "In progress",
  submitted: "Submitted",
  won: "Won",
  rejected: "Rejected",
  done: "Done",
};

async function fetchOrganizeJson<T>(
  path: string,
  adminWallet: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("x-admin-wallet", adminWallet);
  headers.set("x-wallet-address", adminWallet);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers, credentials: "include" });
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

export async function fetchOrganizeEntries(
  adminWallet: string,
  filters?: { type?: OrganizeEntryType; status?: OrganizeEntryStatus },
): Promise<OrganizeEntry[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  if (filters?.status) params.set("status", filters.status);
  const qs = params.toString();
  const res = await fetchOrganizeJson<{ success: boolean; data: OrganizeEntry[] }>(
    `/labs/organize/entries${qs ? `?${qs}` : ""}`,
    adminWallet,
  );
  return res.data;
}

export async function createOrganizeEntry(
  adminWallet: string,
  input: OrganizeEntryInput,
): Promise<OrganizeEntry> {
  const res = await fetchOrganizeJson<{ success: boolean; data: OrganizeEntry }>(
    "/labs/organize/entries",
    adminWallet,
    { method: "POST", body: JSON.stringify(input) },
  );
  return res.data;
}

export async function updateOrganizeEntry(
  adminWallet: string,
  id: string,
  patch: Partial<OrganizeEntryInput>,
): Promise<OrganizeEntry> {
  const res = await fetchOrganizeJson<{ success: boolean; data: OrganizeEntry }>(
    `/labs/organize/entries/${id}`,
    adminWallet,
    { method: "PATCH", body: JSON.stringify(patch) },
  );
  return res.data;
}

export async function deleteOrganizeEntry(
  adminWallet: string,
  id: string,
): Promise<void> {
  await fetchOrganizeJson<{ success: boolean }>(
    `/labs/organize/entries/${id}`,
    adminWallet,
    { method: "DELETE" },
  );
}

export async function fetchOrganizeMeta(adminWallet: string): Promise<OrganizeMeta> {
  const res = await fetchOrganizeJson<{ success: boolean; data: OrganizeMeta }>(
    "/labs/organize/meta",
    adminWallet,
  );
  return res.data;
}
