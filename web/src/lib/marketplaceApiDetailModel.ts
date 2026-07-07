import type { ExampleFlowPreset } from "@/hooks/useApiPlayground";
import { getFlowGroup, getParamsForExampleFlow } from "@/hooks/useApiPlayground";
import {
  getMarketplaceTier,
  getPartnerServiceBrand,
  MARKETPLACE_FILTER_LABELS,
} from "@/lib/marketplaceCatalog";
import { marketplaceApiDetailPath } from "@/lib/marketplaceConstants";
import { buildExampleRequestUrl } from "@/lib/marketplaceApiUsage";
import { resolveFlowCatalogMeta, formatFlowPriceUsd } from "@/lib/x402FlowCardMeta";
import { getPlaygroundSyraPathname } from "@/lib/playgroundUrl";
import { resolveApiBaseUrl } from "@/lib/resolveApiBaseUrl";

export interface MarketplaceApiParameter {
  name: string;
  required: boolean;
  example: string;
  description: string;
}

export interface ParsedAgentDescription {
  overview: string;
  whenToUse: string | null;
  inputsSummary: string | null;
  returnsSummary: string | null;
}

export interface MarketplaceApiDetail {
  flowId: string;
  name: string;
  summary: string;
  description: string;
  parsed: ParsedAgentDescription;
  method: ExampleFlowPreset["method"];
  path: string;
  absoluteUrl: string;
  exampleRequestUrl: string;
  tierLabel: string;
  brand: string | null;
  category: string | null;
  priceUsd: string | null;
  priceLabel: string | null;
  paymentProtocol: "x402";
  paymentNetworks: readonly ["solana", "base"];
  parameters: MarketplaceApiParameter[];
  requestBody: string | null;
  tags: string[];
  discoveryUrl: string;
  openApiUrl: string;
  openApiPath: string;
  detailPageUrl: string;
  docsUrl: string;
  agentManifest: Record<string, unknown>;
  humanBullets: string[];
}

const DOCS_URL = "https://docs.syraa.fun/docs/x402-agent/getting-started";

/** Split agent-oriented catalog copy into scannable sections. */
export function parseAgentDescription(text: string): ParsedAgentDescription {
  const trimmed = text.trim();
  if (!trimmed) {
    return { overview: "", whenToUse: null, inputsSummary: null, returnsSummary: null };
  }

  const useWhen = trimmed.match(/\bUse when ([^.]+(?:\.[^A-Z])?\.?)/i)?.[1]?.trim() ?? null;
  const inputs =
    trimmed.match(/\bInputs?: ([^.]+(?:\.[^A-Z])?\.?)/i)?.[1]?.trim() ??
    trimmed.match(/\bInput: ([^.]+(?:\.[^A-Z])?\.?)/i)?.[1]?.trim() ??
    null;
  const returns = trimmed.match(/\bReturns ([^.]+(?:\.[^A-Z])?\.?)/i)?.[1]?.trim() ?? null;

  let overview = trimmed;
  for (const clause of [/\bUse when [^.]+(?:\.[^A-Z])?\.?/i, /\bInputs?: [^.]+(?:\.[^A-Z])?\.?/i, /\bInput: [^.]+(?:\.[^A-Z])?\.?/i, /\bReturns [^.]+(?:\.[^A-Z])?\.?/i]) {
    overview = overview.replace(clause, "").trim();
  }
  overview = overview.replace(/\s{2,}/g, " ").replace(/\.\s*\./g, ".").trim();

  return {
    overview: overview || trimmed,
    whenToUse: useWhen,
    inputsSummary: inputs,
    returnsSummary: returns,
  };
}

function tierLabel(flow: ExampleFlowPreset): string {
  const tier = getMarketplaceTier(flow);
  return tier === "core" ? MARKETPLACE_FILTER_LABELS.core : MARKETPLACE_FILTER_LABELS.partner;
}

function resolveBrand(flow: ExampleFlowPreset): string | null {
  if (getMarketplaceTier(flow) === "partner") {
    return getPartnerServiceBrand(flow).name;
  }
  const group = getFlowGroup(flow);
  return group.slug === "syra-core" ? null : group.name;
}

function buildHumanBullets(detail: {
  summary: string;
  whenToUse: string | null;
  returnsSummary: string | null;
  priceLabel: string | null;
  method: string;
  path: string;
}): string[] {
  const bullets: string[] = [];
  if (detail.summary) bullets.push(detail.summary);
  if (detail.whenToUse) bullets.push(`Best for: ${detail.whenToUse.replace(/\.$/, "")}.`);
  if (detail.returnsSummary) bullets.push(`Response includes: ${detail.returnsSummary.replace(/\.$/, "")}.`);
  bullets.push(
    `${detail.method} ${detail.path}${detail.priceLabel ? ` · ${detail.priceLabel} USDC per successful call` : ""} · pay via x402 (Solana or Base).`,
  );
  return bullets.slice(0, 4);
}

function buildAgentManifest(input: {
  flow: ExampleFlowPreset;
  name: string;
  summary: string;
  description: string;
  path: string;
  absoluteUrl: string;
  exampleRequestUrl: string;
  priceUsd: string | null;
  parameters: MarketplaceApiParameter[];
  requestBody: string | null;
  tierLabel: string;
  brand: string | null;
  category: string | null;
  tags: string[];
  detailPageUrl: string;
  apiBase: string;
}): Record<string, unknown> {
  return {
    syraMarketplaceVersion: "1.0",
    id: input.flow.id,
    name: input.name,
    summary: input.summary,
    description: input.description,
    tier: input.tierLabel,
    provider: input.brand ?? "Syra",
    category: input.category,
    tags: input.tags,
    endpoint: {
      method: input.flow.method,
      path: input.path,
      url: input.absoluteUrl,
      exampleUrl: input.exampleRequestUrl,
    },
    payment: {
      protocol: "x402",
      currency: "USDC",
      networks: ["solana", "base"],
      priceUsd: input.priceUsd,
      flow: [
        "Send request without payment signature",
        "Receive HTTP 402 with payment requirements",
        "Sign micropayment with wallet",
        "Retry with PAYMENT-SIGNATURE header",
      ],
    },
    parameters: input.parameters.map((p) => ({
      name: p.name,
      required: p.required,
      example: p.example || null,
      description: p.description || null,
    })),
    requestBody: (() => {
      if (!input.requestBody) return null;
      try {
        return JSON.parse(input.requestBody) as unknown;
      } catch {
        return input.requestBody;
      }
    })(),
    discovery: {
      x402: `${input.apiBase.replace(/\/$/, "")}/.well-known/x402`,
      openApi: `${input.apiBase.replace(/\/$/, "")}/openapi.json`,
      humanDocs: input.detailPageUrl,
      gettingStarted: DOCS_URL,
    },
    mcp: {
      server: "@syra-ai/mcp-server",
      note: "Syra MCP tools mirror paid HTTP routes — use discover_api_endpoints on api.syraa.fun",
    },
  };
}

export function buildMarketplaceApiDetail(
  flow: ExampleFlowPreset,
  options?: {
    openApiDescription?: string;
    openApiSummary?: string;
    openApiTags?: string[];
    origin?: string;
  },
): MarketplaceApiDetail {
  const apiBase = resolveApiBaseUrl().replace(/\/$/, "");
  const path = getPlaygroundSyraPathname(flow.url) || flow.url;
  const openApiPath = path.startsWith("/") ? path : `/${path}`;
  const meta = resolveFlowCatalogMeta(flow);
  const params = getParamsForExampleFlow(flow);
  const exampleRequestUrl = buildExampleRequestUrl(flow, params);
  const absoluteUrl = flow.url.startsWith("http") ? flow.url : `${apiBase}${openApiPath}`;

  const description =
    options?.openApiDescription?.trim() ||
    meta.description?.trim() ||
    meta.summary?.trim() ||
    flow.label;

  const summary = options?.openApiSummary?.trim() || meta.summary?.trim() || meta.name;
  const parsed = parseAgentDescription(description);
  const priceUsd = meta.priceUsd ?? null;
  const priceLabel = formatFlowPriceUsd(priceUsd ?? undefined);
  const brand = resolveBrand(flow);
  const tags = options?.openApiTags ?? (meta.category ? [meta.category] : []);

  const parameters: MarketplaceApiParameter[] = params.map((p) => ({
    name: p.key,
    required: p.enabled,
    example: p.value.trim(),
    description: p.description?.trim() || "",
  }));

  const origin = options?.origin ?? (typeof window !== "undefined" ? window.location.origin : "https://syraa.fun");
  const detailPageUrl = `${origin}${marketplaceApiDetailPath(flow.id)}`;

  const humanBullets = buildHumanBullets({
    summary,
    whenToUse: parsed.whenToUse,
    returnsSummary: parsed.returnsSummary,
    priceLabel,
    method: flow.method,
    path: openApiPath,
  });

  const agentManifest = buildAgentManifest({
    flow,
    name: meta.name,
    summary,
    description,
    path: openApiPath,
    absoluteUrl,
    exampleRequestUrl,
    priceUsd,
    parameters,
    requestBody: flow.body?.trim() || null,
    tierLabel: tierLabel(flow),
    brand,
    category: meta.category ?? null,
    tags,
    detailPageUrl,
    apiBase,
  });

  return {
    flowId: flow.id,
    name: meta.name,
    summary,
    description,
    parsed,
    method: flow.method,
    path: openApiPath,
    absoluteUrl,
    exampleRequestUrl,
    tierLabel: tierLabel(flow),
    brand,
    category: meta.category ?? null,
    priceUsd,
    priceLabel,
    paymentProtocol: "x402",
    paymentNetworks: ["solana", "base"],
    parameters,
    requestBody: flow.body?.trim() || null,
    tags,
    discoveryUrl: `${apiBase}/.well-known/x402`,
    openApiUrl: `${apiBase}/openapi.json`,
    openApiPath,
    detailPageUrl,
    docsUrl: DOCS_URL,
    agentManifest,
    humanBullets,
  };
}
