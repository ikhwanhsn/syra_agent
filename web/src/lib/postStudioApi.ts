import { getApiBaseUrl } from "@/lib/chatApi";

export interface PostStudioState {
  postedOnX: Record<string, boolean>;
  deleted: number[];
  updatedAt?: string | null;
}

interface PostStudioStateResponse {
  success: boolean;
  data: PostStudioState;
  migrated?: boolean;
  deleted?: number[];
}

async function fetchPostStudioJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, { ...init, credentials: "include" });
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

export async function fetchPostStudioState(): Promise<PostStudioState> {
  const res = await fetchPostStudioJson<PostStudioStateResponse>("/post/studio/state");
  return res.data;
}

export async function migratePostStudioState(state: {
  postedOnX: Record<string, boolean>;
  deleted: number[];
}): Promise<PostStudioState> {
  const res = await fetchPostStudioJson<PostStudioStateResponse>("/post/studio/state/migrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  return res.data;
}

export async function patchPostStudioPosted(
  updateNumber: number,
  posted: boolean,
): Promise<PostStudioState> {
  const res = await fetchPostStudioJson<PostStudioStateResponse>(
    `/post/studio/updates/${encodeURIComponent(String(updateNumber))}/posted`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posted }),
    },
  );
  return res.data;
}

export async function deletePostStudioUpdates(updateNumbers: number[]): Promise<PostStudioState> {
  const res = await fetchPostStudioJson<PostStudioStateResponse>("/post/studio/updates/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updateNumbers }),
  });
  return res.data;
}
