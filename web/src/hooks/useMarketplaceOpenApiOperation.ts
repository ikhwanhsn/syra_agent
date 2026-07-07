import { useEffect, useState } from "react";
import { resolveApiBaseUrl, resolveSyraBrowserFetchUrl } from "@/lib/resolveApiBaseUrl";

interface OpenApiOperation {
  summary?: string;
  description?: string;
  tags?: string[];
}

let cachedOpenApiDoc: { paths?: Record<string, Record<string, OpenApiOperation>> } | null = null;
let inflight: Promise<{ paths?: Record<string, Record<string, OpenApiOperation>> } | null> | null = null;

async function loadOpenApiDoc() {
  if (cachedOpenApiDoc) return cachedOpenApiDoc;
  if (inflight) return inflight;
  const base = resolveApiBaseUrl().replace(/\/$/, "");
  inflight = fetch(resolveSyraBrowserFetchUrl(`${base}/openapi.json`))
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  cachedOpenApiDoc = await inflight;
  return cachedOpenApiDoc;
}

export interface MarketplaceOpenApiOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  loading: boolean;
}

/** Fetch OpenAPI operation metadata for a Syra gateway path (e.g. /news). */
export function useMarketplaceOpenApiOperation(openApiPath: string): MarketplaceOpenApiOperation {
  const normalized = openApiPath.startsWith("/") ? openApiPath : `/${openApiPath}`;
  const [state, setState] = useState<MarketplaceOpenApiOperation>({ loading: true });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));
    void loadOpenApiDoc().then((doc) => {
      if (cancelled) return;
      if (!doc) {
        setState({ loading: false });
        return;
      }
      const pathItem = doc.paths?.[normalized];
      const op = pathItem?.get ?? pathItem?.post ?? pathItem?.put ?? pathItem?.patch;
      setState({
        summary: op?.summary,
        description: op?.description,
        tags: op?.tags,
        loading: false,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [normalized]);

  return state;
}
