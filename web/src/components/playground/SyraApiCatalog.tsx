import { useMemo, useState } from "react";
import { getFlowGroup, getExampleFlowsX402 } from "@/hooks/useApiPlayground";
import { useX402DiscoveryCatalog } from "@/hooks/useX402DiscoveryCatalog";
import { mergeX402DiscoveryFlows } from "@/lib/x402OpenApiToExampleFlows";
import {
  filterFlowsByMarketplaceTier,
  getPartnerServiceBrand,
  groupPartnerFlowsByBrand,
  type MarketplaceFilter,
} from "@/lib/marketplaceCatalog";
import { marketplaceApiDetailPath } from "@/lib/marketplaceConstants";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { usePlaygroundSession } from "@/contexts/PlaygroundSessionContext";
import { SyraApiCard } from "@/components/playground/SyraApiCard";
import { PlaygroundCatalogSkeleton } from "@/components/playground/PlaygroundCatalogSkeleton";
import { PlaygroundEmptyState } from "@/components/playground/PlaygroundEmptyState";
import { MarketplaceBrowseHeader } from "@/components/marketplace/MarketplaceBrowseHeader";
import { MarketplacePartnerGroups } from "@/components/marketplace/MarketplacePartnerGroups";
import { PLAYGROUND_PAGE_CLASS } from "@/components/playground/playgroundStyles";
import { Button } from "@/components/ui/button";
import { getPlaygroundSyraPathname } from "@/lib/playgroundUrl";
import { cn } from "@/lib/utils";

type TierFilter = MarketplaceFilter;

function flowPath(url: string): string {
  const path = getPlaygroundSyraPathname(url);
  return path || url;
}

export function SyraApiCatalog() {
  const { openConnectModal } = useConnectModal();
  const { wallet } = usePlaygroundSession();
  const { flows: discoveryFlows, loading: catalogLoading, source } =
    useX402DiscoveryCatalog();
  const allFlows = useMemo(
    () => mergeX402DiscoveryFlows(discoveryFlows, getExampleFlowsX402()),
    [discoveryFlows],
  );

  const [search, setSearch] = useState("");
  const [activeTier, setActiveTier] = useState<TierFilter>("core");

  const tierFlows = useMemo(
    () => filterFlowsByMarketplaceTier(allFlows, activeTier),
    [allFlows, activeTier],
  );

  const filteredFlows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tierFlows.filter((flow) => {
      if (!q) return true;
      const path = flowPath(flow.url).toLowerCase();
      const brandName =
        activeTier === "partner" ? getPartnerServiceBrand(flow).name.toLowerCase() : "";
      return (
        flow.label.toLowerCase().includes(q) ||
        flow.id.toLowerCase().includes(q) ||
        path.includes(q) ||
        brandName.includes(q)
      );
    });
  }, [tierFlows, search, activeTier]);

  const partnerBrandGroups = useMemo(
    () => (activeTier === "partner" ? groupPartnerFlowsByBrand(filteredFlows) : []),
    [activeTier, filteredFlows],
  );

  const clearFilters = () => {
    setSearch("");
  };

  return (
    <div className={cn(PLAYGROUND_PAGE_CLASS, "space-y-5 sm:space-y-6")}>
      <MarketplaceBrowseHeader
        search={search}
        onSearchChange={setSearch}
        activeTier={activeTier}
        onTierChange={setActiveTier}
        showingCount={filteredFlows.length}
        catalogLive={source === "live"}
        walletConnected={wallet.connected}
        walletBalance={wallet.balance}
        onConnectWallet={() => openConnectModal()}
      />

      {catalogLoading && allFlows.length === 0 ? (
        <PlaygroundCatalogSkeleton count={activeTier === "core" ? 8 : 12} />
      ) : filteredFlows.length === 0 ? (
        <PlaygroundEmptyState
          title={
            tierFlows.length === 0
              ? `No ${activeTier === "core" ? "Syra Core" : "matching"} APIs`
              : "No matches found"
          }
          description={
            tierFlows.length === 0
              ? "Try another tier tab or check your API connection."
              : "Try a different search term or clear your filters."
          }
          action={
            search.trim() || activeTier !== "core" ? (
              <div className="flex flex-wrap justify-center gap-2">
                {search.trim() ? (
                  <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                    Clear search
                  </Button>
                ) : null}
                {activeTier !== "core" ? (
                  <Button type="button" variant="default" size="sm" onClick={() => setActiveTier("core")}>
                    View Syra Core
                  </Button>
                ) : null}
              </div>
            ) : undefined
          }
        />
      ) : activeTier === "partner" ? (
        <MarketplacePartnerGroups groups={partnerBrandGroups} flowPath={flowPath} />
      ) : (
        <div
          key={activeTier}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredFlows.map((flow, index) => {
            const path = flowPath(flow.url);
            const groupName = getFlowGroup(flow).name;
            return (
              <SyraApiCard
                key={flow.id}
                flow={flow}
                path={path}
                detailHref={marketplaceApiDetailPath(flow.id)}
                groupName={groupName}
                staggerIndex={index}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
