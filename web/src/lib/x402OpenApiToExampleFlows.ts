import type { HttpMethod } from "@/types/api";
import type { RequestParam } from "@/types/api";
import {
  X402_PLAYGROUND_RESOURCE_TEMPLATES,
  type X402PlaygroundResourceTemplate,
} from "@/lib/x402PlaygroundCatalog.generated";
import { X402_DISCOVERY_RESOURCE_PATHS } from "@/lib/x402DiscoveryResourcePaths";

/** Minimal flow shape (avoids importing useApiPlayground). */
export interface X402FlowCatalogMeta {
  segment: string;
  name: string;
  summary: string;
  description?: string;
  priceUsd?: string;
  category?: string;
}

export interface X402DiscoveryFlowPreset {
  id: string;
  label: string;
  method: HttpMethod;
  url: string;
  params: RequestParam[];
  body?: string;
  catalogMeta?: X402FlowCatalogMeta;
}

const SELECTOR_PARAM_KEYS = new Set([
  "segment",
  "view",
  "period",
  "ticker",
  "token",
  "symbol",
  "limit",
  "topN",
  "ref",
  "mint",
  "question",
  "list",
  "query",
  "assetClass",
  "sort",
  "order",
]);

interface OpenApiParameter {
  name: string;
  in?: string;
  required?: boolean;
  description?: string;
  schema?: {
    type?: string;
    default?: unknown;
    description?: string;
  };
}

interface OpenApiOperation {
  summary?: string;
  description?: string;
  parameters?: OpenApiParameter[];
  tags?: string[];
  "x-payment-info"?: {
    price?: { amount?: string | number; currency?: string };
  };
}

interface WellKnownResourceDetail {
  url?: string;
  name?: string;
  description?: string;
  price?: number | null;
}

function formatDefault(value: unknown, type?: string): string {
  if (value === undefined || value === null) return "";
  if (type === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isParamEnabled(param: OpenApiParameter, allQueryParams: OpenApiParameter[]): boolean {
  if (param.required) return true;
  if (allQueryParams.length === 1) return true;
  if (
    param.schema?.default !== undefined &&
    SELECTOR_PARAM_KEYS.has(param.name)
  ) {
    return true;
  }
  return false;
}

export function openApiQueryParamsToRequestParams(
  parameters: OpenApiParameter[] | undefined,
): RequestParam[] {
  if (!parameters?.length) return [];
  const queryParams = parameters.filter((p) => p.in === "query");
  return queryParams.map((p) => ({
    key: p.name,
    value: formatDefault(p.schema?.default, p.schema?.type),
    enabled: isParamEnabled(p, queryParams),
    description: p.description ?? p.schema?.description ?? "",
  }));
}

function segmentToId(segment: string): string {
  return `x402-${segment.replace(/\//g, "-")}`;
}

function segmentFromWellKnownUrl(url: string, syraBase: string): string | null {
  try {
    const resource = new URL(url);
    const base = new URL(syraBase.replace(/\/$/, "") || "http://local");
    if (resource.origin !== base.origin) return null;
    const path = resource.pathname.replace(/^\/+|\/+$/g, "");
    return path || null;
  } catch {
    return null;
  }
}

/** Parse discovery path segments from GET /.well-known/x402. */
export function parseDiscoverySegmentsFromWellKnown(
  doc: unknown,
  syraBase: string,
): string[] {
  if (!doc || typeof doc !== "object") return [];
  const resources = (doc as { resources?: unknown }).resources;
  if (!Array.isArray(resources)) return [];

  const segments = resources
    .map((entry) => {
      if (typeof entry !== "string") return null;
      return segmentFromWellKnownUrl(entry, syraBase);
    })
    .filter((s): s is string => Boolean(s));

  return segments.length > 0 ? segments : [...X402_DISCOVERY_RESOURCE_PATHS];
}

function labelFromResourceDetail(
  segment: string,
  detail: WellKnownResourceDetail | undefined,
  openApiOp: OpenApiOperation | undefined,
): string {
  const name = detail?.name?.trim();
  const openApiSummary = openApiOp?.summary?.trim();
  if (name && openApiSummary && openApiSummary !== name) {
    return `${name}: ${openApiSummary}`;
  }
  if (name) return name;
  if (openApiSummary) return openApiSummary;
  return segment;
}

function pickMethod(
  pathItem: Record<string, OpenApiOperation> | undefined,
): HttpMethod {
  if (pathItem?.get) return "GET";
  if (pathItem?.post) return "POST";
  return "GET";
}

function truncateText(text: string | undefined, max = 140): string | undefined {
  if (!text?.trim()) return undefined;
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function buildCatalogMetaFromSources(
  segment: string,
  op: OpenApiOperation | undefined,
  detail: WellKnownResourceDetail | undefined,
  generated: X402PlaygroundResourceTemplate | undefined,
): X402FlowCatalogMeta {
  if (generated?.catalogMeta) return generated.catalogMeta;

  const name = detail?.name?.trim() || op?.summary?.trim() || segment;
  const summary = op?.summary?.trim() || name;
  const priceFromOp = op?.["x-payment-info"]?.price?.amount;
  const priceFromDetail =
    detail?.price != null && !Number.isNaN(Number(detail.price))
      ? String(detail.price)
      : undefined;

  return {
    segment,
    name,
    summary: summary === name ? generated?.catalogMeta?.summary ?? "" : summary,
    description: truncateText(detail?.description ?? op?.description),
    priceUsd:
      priceFromOp != null && priceFromOp !== ""
        ? String(priceFromOp)
        : priceFromDetail,
    category: generated?.catalogMeta?.category,
  };
}

function buildFlowFromSegment(
  segment: string,
  syraBase: string,
  openapiDoc: unknown,
  resourceDetailsBySegment: Map<string, WellKnownResourceDetail>,
): X402DiscoveryFlowPreset {
  const openApiPath = `/${segment}`;
  const paths = (openapiDoc as { paths?: Record<string, Record<string, OpenApiOperation>> })
    ?.paths;
  const pathItem = paths?.[openApiPath];
  const op = pathItem?.get ?? pathItem?.post;
  const detail = resourceDetailsBySegment.get(segment);
  const generated = X402_PLAYGROUND_RESOURCE_TEMPLATES.find(
    (t) => t.segment === segment,
  );

  return {
    id: segmentToId(segment),
    label: labelFromResourceDetail(segment, detail, op) ?? generated?.label ?? segment,
    method: pickMethod(pathItem) ?? generated?.method ?? "GET",
    url: `${syraBase.replace(/\/$/, "")}/${segment}`,
    params:
      openApiQueryParamsToRequestParams(op?.parameters).length > 0
        ? openApiQueryParamsToRequestParams(op?.parameters)
        : (generated?.params ?? []),
    catalogMeta: buildCatalogMetaFromSources(segment, op, detail, generated),
    ...(generated?.body ? { body: generated.body } : {}),
  };
}

export function buildX402DiscoveryFlowsFromTemplates(
  syraBase: string,
  templates: X402PlaygroundResourceTemplate[] = X402_PLAYGROUND_RESOURCE_TEMPLATES,
): X402DiscoveryFlowPreset[] {
  const base = syraBase.replace(/\/$/, "");
  return templates.map((template) => ({
    id: template.id,
    label: template.label,
    method: template.method,
    url: `${base}/${template.segment}`,
    params: template.params.map((p) => ({ ...p })),
    ...(template.catalogMeta ? { catalogMeta: { ...template.catalogMeta } } : {}),
    ...(template.body ? { body: template.body } : {}),
  }));
}

/** Build playground flows from live /.well-known/x402 + /openapi.json. */
export function buildX402DiscoveryFlowsFromOpenApi(
  syraBase: string,
  segments: string[],
  openapiDoc: unknown,
  resourceDetails: WellKnownResourceDetail[] = [],
): X402DiscoveryFlowPreset[] {
  const detailsBySegment = new Map<string, WellKnownResourceDetail>();
  for (const detail of resourceDetails) {
    if (!detail?.url) continue;
    const segment = segmentFromWellKnownUrl(detail.url, syraBase);
    if (segment) detailsBySegment.set(segment, detail);
  }

  return segments.map((segment) =>
    buildFlowFromSegment(segment, syraBase, openapiDoc, detailsBySegment),
  );
}

export function buildX402PlaygroundParamsByPath(
  flows: X402DiscoveryFlowPreset[],
): Record<string, RequestParam[]> {
  const out: Record<string, RequestParam[]> = {};
  for (const flow of flows) {
    try {
      const path = new URL(flow.url).pathname.replace(/\/+$/, "") || "/";
      if (flow.params.length > 0) {
        out[path] = flow.params.map((p) => ({ ...p }));
      }
    } catch {
      // ignore invalid URLs
    }
  }
  return out;
}
