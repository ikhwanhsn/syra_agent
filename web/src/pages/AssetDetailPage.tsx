import { useEffect, useMemo } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "@/lib/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { AssetIntelligenceSection } from "@/components/assets/intelligence/AssetIntelligenceSection";
import {
  ASSETS_HUB_QUERY_KEY,
  findBoardPlaceholder,
} from "@/hooks/useAssetsHubRows";
import { useAssetIntelligence } from "@/hooks/useAssetIntelligence";
import type { AssetTableRow } from "@/lib/assetsHub";
import {
  assetPathFromQuery,
  fetchMintDossier,
  parseDossierQueryParams,
  slugToDossierQuery,
  type TokensDossierQuery,
} from "@/lib/tokensDossierApi";

function resolveLookup(params: URLSearchParams, slug?: string): TokensDossierQuery | null {
  const parsed = parseDossierQueryParams(params);
  if (parsed) return parsed;
  return slugToDossierQuery(slug);
}

function canonicalDetailPath(params: URLSearchParams, slug?: string): string | null {
  const parsed = parseDossierQueryParams(params);
  if (!parsed) return null;
  if (parsed.q?.trim()) return null;

  const clean = assetPathFromQuery(parsed);
  const current = slug && slug !== "lookup" ? `/assets/${encodeURIComponent(slug)}` : null;
  if (clean === "/assets") return null;
  if (current && clean === current) return null;
  if (slug === "lookup" || params.has("assetId") || params.has("mint") || params.has("ref")) {
    return clean;
  }
  return null;
}

export default function AssetDetailPage({ embedded }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { assetKey } = useParams<{ assetKey: string }>();
  const [searchParams] = useSearchParams();
  const canonicalPath = useMemo(
    () => canonicalDetailPath(searchParams, assetKey),
    [assetKey, searchParams],
  );
  const lookup = useMemo(() => resolveLookup(searchParams, assetKey), [assetKey, searchParams]);

  const boardRows = queryClient.getQueryData<AssetTableRow[]>(ASSETS_HUB_QUERY_KEY);
  const boardPlaceholder = useMemo(
    () => findBoardPlaceholder(boardRows, lookup),
    [boardRows, lookup],
  );

  const dossierQ = useQuery({
    queryKey: ["asset-detail", lookup],
    queryFn: ({ signal }) => fetchMintDossier(lookup!, { signal }),
    enabled: lookup != null && canonicalPath == null,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
    placeholderData: boardPlaceholder,
  });

  // Stable identity only — do not inject symbol/name (that restarted the query forever).
  const intelligenceLookup = useMemo(() => {
    if (canonicalPath != null || lookup == null) return null;
    return lookup;
  }, [canonicalPath, lookup]);

  const intelligenceQ = useAssetIntelligence(intelligenceLookup);

  const intelligencePending = intelligenceQ.isPending && !intelligenceQ.isError;
  const showInitialSkeleton = dossierQ.isPending && !dossierQ.data && !boardPlaceholder;

  // Prefer board assetId immediately so intelligence does not start on a ref slug then restart.
  useEffect(() => {
    const assetId = dossierQ.data?.assetId ?? boardPlaceholder?.assetId;
    if (!assetId || !assetKey || assetKey === "lookup") return;
    const canonical = assetPathFromQuery({ assetId });
    const current = `/assets/${encodeURIComponent(assetKey)}`;
    if (canonical !== current) {
      navigate(canonical, { replace: true });
    }
  }, [assetKey, boardPlaceholder?.assetId, dossierQ.data?.assetId, navigate]);

  useEffect(() => {
    if (!dossierQ.data?.asset?.name) return;
    document.title = `${dossierQ.data.asset.symbol ?? dossierQ.data.asset.name} · Assets · Syra`;
    return () => {
      document.title = "Syra";
    };
  }, [dossierQ.data]);

  if (canonicalPath) return <Navigate to={canonicalPath} replace />;
  if (!lookup) return <Navigate to="/assets" replace />;

  const dossierData = dossierQ.data ?? boardPlaceholder;

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
          symbol={dossierData?.asset?.symbol}
          name={dossierData?.asset?.name ?? assetKey}
        />

        {showInitialSkeleton ? (
          <div className="space-y-6">
            <AssetDetailSkeleton />
          </div>
        ) : null}

        {dossierQ.isError && !dossierData ? (
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

        {dossierData ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
            <MintDossierView
              data={dossierData}
              embeddedInDetail
              intelligence={intelligenceQ.data ?? null}
            />
            <AssetIntelligenceSection
              data={intelligenceQ.data}
              isLoading={intelligencePending}
              isError={intelligenceQ.isError}
              errorMessage={
                intelligenceQ.error instanceof Error
                  ? intelligenceQ.error.message
                  : undefined
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
