import { getApiBaseUrl } from "@/lib/chatApi";
import { assetPathFromQuery, parseAssetLookupInput } from "@/lib/tokensDossierApi";

export interface AssetSearchHit {
  assetId: string;
  name: string;
  symbol: string;
  ref?: string;
  imageUrl?: string;
  category?: string;
}

function normalizeHit(raw: unknown): AssetSearchHit | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const assetId = String(row.assetId ?? row.id ?? row.asset_id ?? "").trim();
  const name = String(row.name ?? row.label ?? "").trim();
  const symbol = String(row.symbol ?? row.ticker ?? name ?? assetId).trim();
  if (!assetId && !symbol) return null;
  return {
    assetId: assetId || symbol.toLowerCase(),
    name: name || symbol,
    symbol: symbol || assetId,
    ref: typeof row.ref === "string" ? row.ref : undefined,
    imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : undefined,
    category: typeof row.category === "string" ? row.category : undefined,
  };
}

function extractHits(body: unknown): AssetSearchHit[] {
  if (!body || typeof body !== "object") return [];
  const root = body as Record<string, unknown>;
  const data = root.data;
  const candidates: unknown[] = [];

  if (Array.isArray(data)) candidates.push(...data);
  else if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.assets)) candidates.push(...d.assets);
    else if (Array.isArray(d.items)) candidates.push(...d.items);
    else if (Array.isArray(d.results)) candidates.push(...d.results);
  }
  if (Array.isArray(root.assets)) candidates.push(...root.assets);
  if (Array.isArray(root.items)) candidates.push(...root.items);

  const seen = new Set<string>();
  const hits: AssetSearchHit[] = [];
  for (const c of candidates) {
    const hit = normalizeHit(c);
    if (!hit) continue;
    const key = hit.assetId.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push(hit);
  }
  return hits;
}

export async function fetchAssetsSearch(q: string, limit = 8): Promise<AssetSearchHit[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  const base = getApiBaseUrl().replace(/\/$/, "");
  const sp = new URLSearchParams({ q: trimmed, limit: String(limit) });
  const res = await fetch(`${base}/agent/tokens/search?${sp}`, {
    headers: { Accept: "application/json" },
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { items?: unknown[] };
    error?: string;
  };
  if (!res.ok || body.success !== true) return [];
  if (Array.isArray(body.data?.items)) {
    return body.data.items
      .map((item) => normalizeHit(item))
      .filter((item): item is AssetSearchHit => item != null);
  }
  return extractHits(body.data ?? body);
}

export function assetSearchHitPath(hit: AssetSearchHit): string {
  return assetPathFromQuery({ assetId: hit.assetId });
}

export function assetLookupPath(raw: string): string {
  const parsed = parseAssetLookupInput(raw);
  if (!parsed) return "/assets";
  return assetPathFromQuery(parsed);
}
