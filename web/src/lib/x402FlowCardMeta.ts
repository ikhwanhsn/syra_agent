import type { ExampleFlowPreset } from "@/hooks/useApiPlayground";
import type { RequestParam } from "@/types/api";

export interface X402FlowCatalogMeta {
  segment: string;
  name: string;
  summary: string;
  description?: string;
  priceUsd?: string;
  category?: string;
}

export interface FlowParamPreview {
  key: string;
  value: string;
}

export interface FlowCardDisplay {
  name: string;
  summary: string;
  description?: string;
  priceUsd?: string;
  priceLabel: string | null;
  categoryLabel: string | null;
  groupName?: string;
  path: string;
  paramPreview: FlowParamPreview[];
  extraParamCount: number;
  hasParams: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  analytics: "Analytics",
  news: "News",
  signals: "Signals",
  ai: "AI",
  data: "Data",
  execution: "Execution",
  health: "Health",
};

export function formatFlowPriceUsd(priceUsd: string | undefined): string | null {
  if (!priceUsd?.trim()) return null;
  const n = Number(priceUsd);
  if (Number.isNaN(n)) return `$${priceUsd}`;
  if (n === 0) return "Free";
  if (n < 0.01) return `$${n.toFixed(4).replace(/\.?0+$/, "")}`;
  if (n < 1) return `$${n.toFixed(2).replace(/\.?0+$/, "")}`;
  return `$${n.toFixed(2)}`;
}

export function categoryToLabel(category: string | undefined): string | null {
  if (!category?.trim()) return null;
  return CATEGORY_LABELS[category.toLowerCase()] ?? category;
}

export function parseFlowLabel(label: string): { name: string; summary: string } {
  const idx = label.indexOf(":");
  if (idx < 1) return { name: label.trim(), summary: "" };
  return {
    name: label.slice(0, idx).trim(),
    summary: label.slice(idx + 1).trim(),
  };
}

export function getParamPreview(params: RequestParam[]): {
  preview: FlowParamPreview[];
  extraCount: number;
} {
  const candidates = params.filter((p) => p.enabled && p.key);
  const withValues = candidates.filter((p) => p.value.trim() !== "");
  const source = withValues.length > 0 ? withValues : candidates;
  const preview = source.slice(0, 3).map((p) => ({
    key: p.key,
    value: p.value.trim() || "…",
  }));
  return { preview, extraCount: Math.max(0, source.length - preview.length) };
}

export function segmentFromFlowUrl(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\/+|\/+$/g, "") || "";
  } catch {
    return "";
  }
}

export function resolveFlowCatalogMeta(flow: ExampleFlowPreset): X402FlowCatalogMeta {
  if (flow.catalogMeta) return flow.catalogMeta;
  const parsed = parseFlowLabel(flow.label);
  return {
    segment: segmentFromFlowUrl(flow.url),
    name: parsed.name || flow.label,
    summary: parsed.summary,
  };
}

export function buildFlowCardDisplay(
  flow: ExampleFlowPreset,
  path: string,
  groupName?: string,
): FlowCardDisplay {
  const meta = resolveFlowCatalogMeta(flow);
  const { preview, extraCount } = getParamPreview(flow.params);
  const priceLabel = formatFlowPriceUsd(meta.priceUsd);
  const categoryLabel = categoryToLabel(meta.category);

  return {
    name: meta.name,
    summary: meta.summary,
    description: meta.description,
    priceUsd: meta.priceUsd,
    priceLabel,
    categoryLabel,
    groupName,
    path,
    paramPreview: preview,
    extraParamCount: extraCount,
    hasParams: flow.params.length > 0,
  };
}
