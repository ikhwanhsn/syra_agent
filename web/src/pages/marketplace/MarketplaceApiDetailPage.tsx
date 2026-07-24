import { Link, useParams } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { PlaygroundPageShell } from "@/components/playground/PlaygroundPageShell";
import { MarketplaceApiDetailView } from "@/components/marketplace/MarketplaceApiDetailView";
import { PlaygroundSessionProvider } from "@/contexts/PlaygroundSessionContext";
import { useMarketplaceCatalogFlows } from "@/hooks/useMarketplaceCatalogFlows";
import { MARKETPLACE_ROUTE } from "@/lib/marketplaceConstants";
import { GenericPageSkeleton } from "@/components/RouteFallback";

function MarketplaceApiDetailInner() {
  const { flowId } = useParams<{ flowId: string }>();
  const { flows, loading } = useMarketplaceCatalogFlows();
  const decodedId = flowId ? decodeURIComponent(flowId) : "";
  const flow = flows.find((item) => item.id === decodedId) ?? null;

  if (loading && !flow) {
    return (
      <PlaygroundPageShell>
        <div className="relative z-[1]">
          <GenericPageSkeleton />
        </div>
      </PlaygroundPageShell>
    );
  }

  if (!flow) {
    return (
      <PlaygroundPageShell>
        <div className="relative z-[1] flex min-h-[40vh] items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-border/50 bg-card/80 p-8 text-center">
            <p className="font-display text-lg font-semibold text-foreground">API not found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This endpoint may have been removed from the catalog or the link is invalid.
            </p>
            <Button asChild variant="outline" className="mt-6 rounded-xl">
              <Link to={MARKETPLACE_ROUTE}>Back to marketplace</Link>
            </Button>
          </div>
        </div>
      </PlaygroundPageShell>
    );
  }

  return (
    <PlaygroundPageShell>
      <MarketplaceApiDetailView flow={flow} />
    </PlaygroundPageShell>
  );
}

export default function MarketplaceApiDetailPage() {
  return (
    <PlaygroundSessionProvider>
      <MarketplaceApiDetailInner />
    </PlaygroundSessionProvider>
  );
}
