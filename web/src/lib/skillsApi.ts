import { syraFetch } from "@/lib/agentAuthApi";
import { getApiBaseUrl } from "@/lib/env";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/agent/marketplace/skills`;

export type SkillCategory =
  | "live_data"
  | "research"
  | "trading"
  | "learning"
  | "tools"
  | "general";

export type SkillStatus = "draft" | "published";

export type SkillRecord = {
  id: string;
  creatorAnonymousId: string;
  slug: string;
  title: string;
  description: string;
  category: SkillCategory;
  upstreamUrl: string;
  upstreamMethod: "GET" | "POST";
  hasUpstreamHeaders: boolean;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  priceUsd: number;
  payToAddress: string | null;
  payToChain: "solana";
  status: SkillStatus;
  useCount: number;
  endpointUrl: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string };

async function parseJson<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiEnvelope<T> & { error?: string };
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }
  if (json.data === undefined) {
    throw new Error("Missing response data");
  }
  return json.data;
}

export type CreateSkillPayload = {
  title: string;
  description?: string;
  category?: SkillCategory;
  upstreamUrl: string;
  upstreamMethod?: "GET" | "POST";
  upstreamHeaders?: Record<string, string>;
  priceUsd: number;
  slug?: string;
};

export type UpdateSkillPayload = Partial<
  Omit<CreateSkillPayload, "slug"> & {
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
  }
>;

export async function fetchMySkills(): Promise<SkillRecord[]> {
  const res = await syraFetch(`${base()}/mine`);
  return parseJson<SkillRecord[]>(res);
}

export async function fetchPublishedSkills(params?: {
  category?: SkillCategory;
  limit?: number;
  skip?: number;
}): Promise<SkillRecord[]> {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.skip != null) search.set("skip", String(params.skip));
  const qs = search.toString();
  const res = await fetch(`${base()}${qs ? `?${qs}` : ""}`, {
    headers: { Accept: "application/json" },
  });
  return parseJson<SkillRecord[]>(res);
}

export async function createSkill(payload: CreateSkillPayload): Promise<SkillRecord> {
  const res = await syraFetch(base(), {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseJson<SkillRecord>(res);
}

export async function updateSkill(id: string, payload: UpdateSkillPayload): Promise<SkillRecord> {
  const res = await syraFetch(`${base()}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return parseJson<SkillRecord>(res);
}

export async function publishSkill(id: string): Promise<SkillRecord> {
  const res = await syraFetch(`${base()}/${encodeURIComponent(id)}/publish`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return parseJson<SkillRecord>(res);
}

export async function unpublishSkill(id: string): Promise<SkillRecord> {
  const res = await syraFetch(`${base()}/${encodeURIComponent(id)}/unpublish`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return parseJson<SkillRecord>(res);
}

export async function deleteSkill(id: string): Promise<void> {
  const res = await syraFetch(`${base()}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const json = (await res.json()) as { success: boolean; error?: string };
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Delete failed (${res.status})`);
  }
}

export function skillCurlSnippet(skill: SkillRecord): string {
  const method = skill.upstreamMethod === "POST" ? "POST" : "GET";
  if (method === "POST") {
    return `curl -X POST "${skill.endpointUrl}" \\\n  -H "Accept: application/json" \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`;
  }
  return `curl "${skill.endpointUrl}" \\\n  -H "Accept: application/json"`;
}
