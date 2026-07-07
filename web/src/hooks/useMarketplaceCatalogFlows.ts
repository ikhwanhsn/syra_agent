import { useMemo } from "react";
import { getExampleFlowsX402 } from "@/hooks/useApiPlayground";
import { useX402DiscoveryCatalog } from "@/hooks/useX402DiscoveryCatalog";
import { mergeX402DiscoveryFlows } from "@/lib/x402OpenApiToExampleFlows";

/** Merged live + curated x402 marketplace catalog flows. */
export function useMarketplaceCatalogFlows() {
  const { flows: discoveryFlows, loading, source } = useX402DiscoveryCatalog();
  const flows = useMemo(
    () => mergeX402DiscoveryFlows(discoveryFlows, getExampleFlowsX402()),
    [discoveryFlows],
  );
  return { flows, loading, source };
}
