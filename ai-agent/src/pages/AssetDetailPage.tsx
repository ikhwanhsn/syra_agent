import { useEffect, useMemo } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AssetDetailNav } from "@/components/assets/AssetDetailNav";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { MintDossierView } from "@/components/dossier/MintDossierView";
import { AssetDetailSkeleton } from "@/components/assets/AssetDetailSkeleton";
import { fetchMintDossier, parseDossierQueryParams, type TokensDossierQuery } from "@/lib/tokensDossierApi";

function resolveLookup(params: URLSearchParams, slug?: string): TokensDossierQuery | null {
  const parsed = parseDossierQueryParams(params);
  if (parsed) return parsed;
  if (!slug || slug === "lookup") return null;
  return { ref: slug };
}

export default function AssetDetailPage({ embedded }: { embedded?: boolean }) {
  const { assetKey } = useParams<{ assetKey: string }>();
  const [searchParams] = useSearchParams();
  const lookup = useMemo(() => resolveLookup(searchParams, assetKey), [assetKey, searchParams]);

  const dossierQ = useQuery({
    queryKey: ["asset-detail", lookup],
    queryFn: () => fetchMintDossier(lookup!),
    enabled: lookup != null,
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (!dossierQ.data?.asset?.name) return;
    document.title = `${dossierQ.data.asset.symbol ?? dossierQ.data.asset.name} · Assets · Syra`;
    return () => {
      document.title = "Syra";
    };
  }, [dossierQ.data]);

  if (!lookup) return <Navigate to="/assets" replace />;

  return (
    <div className={cn("relative min-h-full", embedded && "min-h-0")}>
      <OverviewPageBackdrop />

      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM,
          "relative z-[1] pb-14",
        )}
      >
        <AssetDetailNav
          symbol={dossierQ.data?.asset?.symbol}
          name={dossierQ.data?.asset?.name ?? assetKey}
        />

        {dossierQ.isFetching && !dossierQ.isLoading ? (
          <p className="mb-3 inline-flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Syncing live market data…
          </p>
        ) : null}

        {dossierQ.isLoading ? <AssetDetailSkeleton /> : null}

        {dossierQ.isError ? (
          <Card className={cn(overviewCardShell, "max-w-xl border-destructive/40 animate-in fade-in")}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-destructive">
                {dossierQ.error instanceof Error ? dossierQ.error.message : "Could not load asset detail"}
              </p>
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => dossierQ.refetch()}>
                  Retry
                </Button>
                <Button type="button" variant="ghost" size="sm" asChild>
                  <Link to="/assets">Back to board</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {dossierQ.data ? (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
            <MintDossierView data={dossierQ.data} embeddedInDetail />
          </div>
        ) : null}
      </div>
    </div>
  );
}
