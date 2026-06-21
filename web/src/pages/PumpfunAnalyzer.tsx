import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { History, Radar, Radio, Trophy } from "lucide-react";
import { useSearchParams } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { PumpfunAnalysisSkeleton } from "@/components/pumpfun/PumpfunAnalysisSkeleton";
import { PumpfunCallShareModal } from "@/components/pumpfun/PumpfunCallShareModal";
import { PumpfunCallerLeaderboard } from "@/components/pumpfun/PumpfunCallerLeaderboard";
import { PumpfunChartPanel } from "@/components/pumpfun/PumpfunChartPanel";
import { PumpfunClusterPanel } from "@/components/pumpfun/PumpfunClusterPanel";
import { PumpfunHoldersPanel } from "@/components/pumpfun/PumpfunHoldersPanel";
import { PumpfunKolPanel } from "@/components/pumpfun/PumpfunKolPanel";
import { PumpfunRiskPanel } from "@/components/pumpfun/PumpfunRiskPanel";
import { PumpfunLiveCallsPanel } from "@/components/pumpfun/PumpfunLiveCallsPanel";
import { PumpfunScanHistoryPanel } from "@/components/pumpfun/PumpfunScanHistoryPanel";
import { PumpfunScanShareBar } from "@/components/pumpfun/PumpfunScanShareBar";
import { PumpfunSearchHero } from "@/components/pumpfun/PumpfunSearchHero";
import { PumpfunStatGrid } from "@/components/pumpfun/PumpfunStatGrid";
import { PumpfunVerdictCard } from "@/components/pumpfun/PumpfunVerdictCard";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  useMemecoinAnalysis,
  useMemecoinAnalysisQuota,
  clearPumpfunScanSessionCache,
  memecoinAnalysisQueryKey,
} from "@/hooks/useMemecoinAnalysis";
import { isValidSolanaMint, MemecoinAnalysisQuotaError, normalizeMintInput } from "@/lib/pumpfunAnalysisApi";
import type { PumpfunScanRecord } from "@/lib/pumpfunScanHistoryApi";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

type PumpfunTab = "scan" | "live" | "history" | "callers";

function parseTab(raw: string | null): PumpfunTab {
  if (raw === "live" || raw === "history" || raw === "callers") return raw;
  return "scan";
}

export default function PumpfunAnalyzer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { connected, address } = useWalletContext();
  const { syraAuthReady, syraAuthenticated, ensureSyraAuth, requestSyraAuth } = useSyraAuth();
  const { openConnectModal } = useConnectModal();

  const urlMint = searchParams.get("mint")?.trim() ?? "";
  const urlTab = parseTab(searchParams.get("tab"));
  const [input, setInput] = useState(urlMint);
  const [activeMint, setActiveMint] = useState<string | null>(
    urlMint && isValidSolanaMint(urlMint) ? urlMint : null,
  );
  const [tab, setTab] = useState<PumpfunTab>(urlTab);
  const [shareRecord, setShareRecord] = useState<PumpfunScanRecord | null>(null);
  const [authRestoring, setAuthRestoring] = useState(false);

  const scanReady = connected && syraAuthenticated;
  const authPending = authRestoring && connected && !syraAuthenticated;

  /** Privy connect ≠ Syra JWT — silently restore session when wallet is already linked. */
  useEffect(() => {
    if (!syraAuthReady || !connected || !address) {
      setAuthRestoring(false);
      return;
    }
    if (syraAuthenticated) {
      setAuthRestoring(false);
      return;
    }
    let cancelled = false;
    setAuthRestoring(true);
    void ensureSyraAuth().finally(() => {
      if (!cancelled) setAuthRestoring(false);
    });
    return () => {
      cancelled = true;
    };
  }, [syraAuthReady, connected, address, syraAuthenticated, ensureSyraAuth]);

  const analysisQ = useMemecoinAnalysis(scanReady ? activeMint : null, { sessionCache: true });
  const quotaQ = useMemecoinAnalysisQuota(scanReady);

  /** Drop scan cache when leaving the pumpfun page so the next visit starts fresh. */
  useEffect(() => {
    return () => {
      clearPumpfunScanSessionCache(queryClient);
    };
  }, [queryClient]);

  const syncUrl = useCallback(
    (mint: string, nextTab?: PumpfunTab) => {
      const next = new URLSearchParams(searchParams);
      next.set("mint", mint);
      if (nextTab) next.set("tab", nextTab);
      else if (tab !== "scan") next.set("tab", tab);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, tab],
  );

  const handleTabChange = useCallback(
    (value: string) => {
      const nextTab = parseTab(value);
      setTab(nextTab);
      const next = new URLSearchParams(searchParams);
      next.set("tab", nextTab);
      if (activeMint) next.set("mint", activeMint);
      else next.delete("mint");
      setSearchParams(next, { replace: true });
    },
    [activeMint, searchParams, setSearchParams],
  );

  const handleConnectWallet = useCallback(() => {
    openConnectModal();
  }, [openConnectModal]);

  const ensureScanSession = useCallback(async (): Promise<boolean> => {
    if (!connected) {
      openConnectModal();
      return false;
    }
    if (syraAuthenticated) return true;
    const restored = await ensureSyraAuth();
    if (restored) return true;
    const signed = await requestSyraAuth();
    return signed != null;
  }, [connected, ensureSyraAuth, openConnectModal, requestSyraAuth, syraAuthenticated]);

  const handleAnalyze = useCallback(
    async (raw: string, opts?: { force?: boolean }) => {
      const mint = normalizeMintInput(raw);
      if (!mint) return;
      const ready = await ensureScanSession();
      if (!ready) return;

      if (opts?.force) {
        queryClient.removeQueries({ queryKey: memecoinAnalysisQueryKey(mint) });
      }

      setInput(mint);
      setTab("scan");
      syncUrl(mint, "scan");
      setActiveMint(mint);

      if (opts?.force) {
        void queryClient.invalidateQueries({ queryKey: memecoinAnalysisQueryKey(mint) });
      }
    },
    [ensureScanSession, queryClient, syncUrl],
  );

  const handleLiveScan = useCallback(
    (mint: string) => {
      void handleAnalyze(mint, { force: true });
    },
    [handleAnalyze],
  );

  useEffect(() => {
    if (urlMint && isValidSolanaMint(urlMint) && urlMint !== activeMint) {
      setInput(urlMint);
      setActiveMint(urlMint);
    }
  }, [urlMint, activeMint]);

  useEffect(() => {
    setTab(urlTab);
  }, [urlTab]);

  const analysisPayload = analysisQ.data?.data;
  const latestScanRecord = useMemo((): PumpfunScanRecord | null => {
    const raw = analysisQ.data?.scanRecord;
    if (!raw) return null;
    return {
      callId: raw.callId,
      callerWallet: raw.callerWallet,
      mint: raw.mint,
      symbol: raw.symbol,
      name: raw.name,
      imageUri: raw.imageUri,
      scanPriceUsd: null,
      scanMarketCapUsd: raw.scanMarketCapUsd,
      currentMarketCapUsd: raw.scanMarketCapUsd,
      peakMarketCapUsd: raw.scanMarketCapUsd,
      gainMultiplier: 1,
      peakGainMultiplier: raw.peakGainMultiplier ?? 1,
      syraAlphaScore: analysisPayload?.syraAlpha.score ?? 0,
      syraAlphaVerdict: analysisPayload?.syraAlpha.verdict ?? "",
      syraAlphaTone: analysisPayload?.syraAlpha.tone ?? "warning",
      scannedAt: raw.scannedAt,
      lastRefreshedAt: null,
    };
  }, [analysisQ.data?.scanRecord, analysisPayload?.syraAlpha]);

  useEffect(() => {
    if (analysisPayload?.pumpfun.ok || analysisPayload?.dossier.ok) {
      const name =
        analysisPayload.pumpfun.data?.symbol ??
        analysisPayload.dossier.data?.asset?.symbol ??
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
  }, [analysisPayload]);

  const showSkeleton = tab === "scan" && analysisQ.isLoading && !analysisPayload;
  const hasResults = Boolean(analysisPayload);

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
          isLoading={analysisQ.isFetching && !analysisQ.data}
          quota={quotaQ.data}
          quotaLoading={quotaQ.isLoading}
          scanLimitReached={
            quotaQ.data != null &&
            quotaQ.data.tier !== "bypass" &&
            quotaQ.data.limit > 0 &&
            quotaQ.data.remaining <= 0
          }
          walletConnected={connected}
          authPending={authPending}
          onConnectWallet={handleConnectWallet}
        />

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="scan" className="gap-1.5 text-xs sm:text-sm">
              <Radar className="h-3.5 w-3.5" aria-hidden />
              Scan
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-1.5 text-xs sm:text-sm">
              <Radio className="h-3.5 w-3.5" aria-hidden />
              Live
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
              <History className="h-3.5 w-3.5" aria-hidden />
              My calls
            </TabsTrigger>
            <TabsTrigger value="callers" className="gap-1.5 text-xs sm:text-sm">
              <Trophy className="h-3.5 w-3.5" aria-hidden />
              Best callers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-6 space-y-6">
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
                  ) : analysisQ.error instanceof Error &&
                    analysisQ.error.message.toLowerCase().includes("wallet") ? (
                    <Button
                      type="button"
                      variant="neon"
                      size="sm"
                      className="mt-4"
                      onClick={() => openConnectModal()}
                    >
                      Connect wallet
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 ml-0 sm:ml-2"
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

            {hasResults && analysisPayload ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
                <PumpfunScanShareBar
                  scanRecord={latestScanRecord}
                  onShare={() => {
                    if (latestScanRecord) setShareRecord(latestScanRecord);
                  }}
                />
                <PumpfunVerdictCard data={analysisPayload} />
                <PumpfunStatGrid data={analysisPayload} />
                <PumpfunChartPanel data={analysisPayload} />
                <div className="grid gap-6 lg:grid-cols-2">
                  <PumpfunRiskPanel data={analysisPayload} />
                  <PumpfunHoldersPanel data={analysisPayload} />
                </div>
                <PumpfunClusterPanel data={analysisPayload} />
                <PumpfunKolPanel data={analysisPayload} />
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="live" className="mt-6">
            <PumpfunLiveCallsPanel
              onScanMint={handleLiveScan}
              scanning={analysisQ.isFetching}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <PumpfunScanHistoryPanel enabled={scanReady} authPending={authPending} />
          </TabsContent>

          <TabsContent value="callers" className="mt-6">
            <PumpfunCallerLeaderboard />
          </TabsContent>
        </Tabs>
      </div>

      {shareRecord ? (
        <PumpfunCallShareModal
          open
          onClose={() => setShareRecord(null)}
          record={shareRecord}
        />
      ) : null}
    </div>
  );
}
