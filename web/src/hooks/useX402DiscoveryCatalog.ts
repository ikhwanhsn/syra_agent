import { useEffect, useMemo, useState } from "react";
import type { ExampleFlowPreset } from "@/hooks/useApiPlayground";
import {
  buildX402DiscoveryFlowsFromOpenApi,
  buildX402DiscoveryFlowsFromTemplates,
  parseDiscoverySegmentsFromWellKnown,
} from "@/lib/x402OpenApiToExampleFlows";
import { X402_DISCOVERY_RESOURCE_PATHS } from "@/lib/x402DiscoveryResourcePaths";
import { resolveApiBaseUrl, resolveSyraBrowserFetchUrl } from "@/lib/resolveApiBaseUrl";

export type X402DiscoveryCatalogSource = "live" | "generated";

export interface X402DiscoveryCatalogState {
  flows: ExampleFlowPreset[];
  segments: readonly string[];
  loading: boolean;
  error: string | null;
  source: X402DiscoveryCatalogSource;
}

let cachedCatalog: X402DiscoveryCatalogState | null = null;
let inflight: Promise<X402DiscoveryCatalogState> | null = null;

async function loadX402DiscoveryCatalog(
  syraBase: string,
): Promise<X402DiscoveryCatalogState> {
  const base = syraBase.replace(/\/$/, "");
  try {
    const [wellKnownRes, openApiRes] = await Promise.all([
      fetch(resolveSyraBrowserFetchUrl(`${base}/.well-known/x402`)),
      fetch(resolveSyraBrowserFetchUrl(`${base}/openapi.json`)),
    ]);
    if (!wellKnownRes.ok) {
      throw new Error(`/.well-known/x402 ${wellKnownRes.status}`);
    }
    if (!openApiRes.ok) {
      throw new Error(`/openapi.json ${openApiRes.status}`);
    }
    const wellKnown = await wellKnownRes.json();
    const openapiDoc = await openApiRes.json();
    const segments = parseDiscoverySegmentsFromWellKnown(wellKnown, base);
    const resourceDetails = Array.isArray(wellKnown?.resourceDetails)
      ? wellKnown.resourceDetails
      : [];
    const flows = buildX402DiscoveryFlowsFromOpenApi(
      base,
      segments,
      openapiDoc,
      resourceDetails,
    );
    return {
      flows,
      segments,
      loading: false,
      error: null,
      source: "live",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load x402 catalog";
    return {
      flows: buildX402DiscoveryFlowsFromTemplates(base),
      segments: X402_DISCOVERY_RESOURCE_PATHS,
      loading: false,
      error: message,
      source: "generated",
    };
  }
}

export function fetchX402DiscoveryCatalog(
  syraBase = resolveApiBaseUrl(),
): Promise<X402DiscoveryCatalogState> {
  if (cachedCatalog && cachedCatalog.source === "live") {
    return Promise.resolve(cachedCatalog);
  }
  if (inflight) return inflight;
  inflight = loadX402DiscoveryCatalog(syraBase).then((state) => {
    cachedCatalog = state;
    inflight = null;
    return state;
  });
  return inflight;
}

/** Bust in-memory catalog cache (e.g. after API deploy). */
export function invalidateX402DiscoveryCatalogCache(): void {
  cachedCatalog = null;
  inflight = null;
}

/** Live x402 catalog from /.well-known/x402 + /openapi.json, with generated fallback. */
export function useX402DiscoveryCatalog(): X402DiscoveryCatalogState {
  const syraBase = useMemo(() => resolveApiBaseUrl(), []);
  const [state, setState] = useState<X402DiscoveryCatalogState>(() =>
    cachedCatalog ?? {
      flows: buildX402DiscoveryFlowsFromTemplates(syraBase),
      segments: X402_DISCOVERY_RESOURCE_PATHS,
      loading: true,
      error: null,
      source: "generated",
    },
  );

  useEffect(() => {
    let cancelled = false;
    void fetchX402DiscoveryCatalog(syraBase).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [syraBase]);

  return state;
}
