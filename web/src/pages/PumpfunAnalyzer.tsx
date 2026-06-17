import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { PumpfunAnalysisSkeleton } from "@/components/pumpfun/PumpfunAnalysisSkeleton";
import { PumpfunChartPanel } from "@/components/pumpfun/PumpfunChartPanel";
import { PumpfunClusterPanel } from "@/components/pumpfun/PumpfunClusterPanel";
import { PumpfunHoldersPanel } from "@/components/pumpfun/PumpfunHoldersPanel";
import { PumpfunKolPanel } from "@/components/pumpfun/PumpfunKolPanel";
import { PumpfunRiskPanel } from "@/components/pumpfun/PumpfunRiskPanel";
import { PumpfunSearchHero } from "@/components/pumpfun/PumpfunSearchHero";
import { PumpfunStatGrid } from "@/components/pumpfun/PumpfunStatGrid";
import { PumpfunVerdictCard } from "@/components/pumpfun/PumpfunVerdictCard";
import { useMemecoinAnalysis, useMemecoinAnalysisQuota } from "@/hooks/useMemecoinAnalysis";
import { isValidSolanaMint, MemecoinAnalysisQuotaError, normalizeMintInput } from "@/lib/pumpfunAnalysisApi";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

export default function PumpfunAnalyzer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMint = searchParams.get("mint")?.trim() ?? "";
  const [input, setInput] = useState(urlMint);
  const [activeMint, setActiveMint] = useState<string | null>(
    urlMint && isValidSolanaMint(urlMint) ? urlMint : null,
  );

  const analysisQ = useMemecoinAnalysis(activeMint);
  const quotaQ = useMemecoinAnalysisQuota();

  const syncUrl = useCallback(
    (mint: string) => {
      const next = new URLSearchParams(searchParams);
      next.set("mint", mint);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleAnalyze = useCallback(
    (raw: string) => {
      const mint = normalizeMintInput(raw);
      if (!mint) return;
      setInput(mint);
      setActiveMint(mint);
      syncUrl(mint);
    },
    [syncUrl],
  );

  useEffect(() => {
    if (urlMint && isValidSolanaMint(urlMint) && urlMint !== activeMint) {
      setInput(urlMint);
      setActiveMint(urlMint);
    }
  }, [urlMint, activeMint]);

  useEffect(() => {
    if (analysisQ.data?.pumpfun.ok || analysisQ.data?.dossier.ok) {
      const name =
        analysisQ.data.pumpfun.data?.symbol ??
        analysisQ.data.dossier.data?.asset?.symbol ??
        "Token";
      document.title = `${name} · Pumpfun Alpha · Syra`;
      return () => {
        document.title = "Syra";
      };
    }
    document.title = "Pumpfun Alpha · Syra";
    return () => {
      document.title = "Syra";
    };
  }, [analysisQ.data]);

  const showSkeleton = analysisQ.isLoading && !analysisQ.data;
  const hasResults = Boolean(analysisQ.data);

  return (
    <div className="relative min-h-full">
      <OverviewPageBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
          "relative z-[1] space-y-6 pb-14",
        )}
      >
        <PumpfunSearchHero
          value={input}
          onChange={setInput}
          onAnalyze={handleAnalyze}
          isLoading={analysisQ.isFetching}
          quota={quotaQ.data}
          quotaLoading={quotaQ.isLoading}
          scanLimitReached={
            quotaQ.data != null &&
            quotaQ.data.tier !== "bypass" &&
            quotaQ.data.limit > 0 &&
            quotaQ.data.remaining <= 0
          }
        />

        {showSkeleton ? <PumpfunAnalysisSkeleton /> : null}

        {analysisQ.isError ? (
          <Card className={cn(overviewCardShell, "max-w-xl border-destructive/40")}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-destructive">
                {analysisQ.error instanceof MemecoinAnalysisQuotaError
                  ? analysisQ.error.message
                  : analysisQ.error instanceof Error
                    ? analysisQ.error.message
                    : "Analysis failed"}
              </p>
              {analysisQ.error instanceof MemecoinAnalysisQuotaError ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Resets at midnight UTC
                  {analysisQ.error.quota.resetAt
                    ? ` (${new Date(analysisQ.error.quota.resetAt).toUTCString()})`
                    : ""}
                  .
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  void quotaQ.refetch();
                  analysisQ.refetch();
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {hasResults && analysisQ.data ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
            <PumpfunVerdictCard data={analysisQ.data} />
            <PumpfunStatGrid data={analysisQ.data} />
            <PumpfunChartPanel data={analysisQ.data} />
            <div className="grid gap-6 lg:grid-cols-2">
              <PumpfunRiskPanel data={analysisQ.data} />
              <PumpfunHoldersPanel data={analysisQ.data} />
            </div>
            <PumpfunClusterPanel data={analysisQ.data} />
            <PumpfunKolPanel data={analysisQ.data} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
