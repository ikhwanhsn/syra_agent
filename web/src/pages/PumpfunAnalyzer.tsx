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
import { PumpfunLiveCallsPanel } from "@/components/pumpfun/PumpfunLiveCallsPanel";
import { PumpfunScanHistoryPanel } from "@/components/pumpfun/PumpfunScanHistoryPanel";
import { PumpfunScanLimitModal } from "@/components/pumpfun/PumpfunScanLimitModal";
import { PumpfunScanWorkspace, parsePumpfunScanSubTab, type PumpfunScanSubTab } from "@/components/pumpfun/PumpfunScanWorkspace";
import { PumpfunSearchHero } from "@/components/pumpfun/PumpfunSearchHero";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  useMemecoinAnalysis,
  useMemecoinAnalysisQuota,
  memecoinAnalysisQueryKey,
  MEMECOIN_ANALYSIS_QUERY_ROOT,
} from "@/hooks/useMemecoinAnalysis";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { isValidSolanaMint, MemecoinAnalysisQuotaError, normalizeMintInput } from "@/lib/pumpfunAnalysisApi";
import { isGuestScanEligible } from "@/lib/pumpfunGuestScan";
import { isPumpfunScanLimitReached } from "@/lib/pumpfunScanQuota";
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
  const urlSub = parsePumpfunScanSubTab(searchParams.get("sub"));
  const [input, setInput] = useState(urlMint);
  const [activeMint, setActiveMint] = useState<string | null>(
    urlMint && isValidSolanaMint(urlMint) ? urlMint : null,
  );
  const [tab, setTab] = useState<PumpfunTab>(urlTab);
  const [scanSubTab, setScanSubTab] = useState<PumpfunScanSubTab>(urlSub);
  const [shareRecord, setShareRecord] = useState<PumpfunScanRecord | null>(null);
  const [authRestoring, setAuthRestoring] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [historySigningIn, setHistorySigningIn] = useState(false);
  const [scanBust, setScanBust] = useState(0);

  const scanReady = connected && syraAuthenticated;
  const authPending = authRestoring && connected && !syraAuthenticated;

  const quotaQ = useMemecoinAnalysisQuota(true);
  const guestScanEligible = isGuestScanEligible(connected, quotaQ.data, {
    quotaLoading: quotaQ.isLoading,
  });

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

  const analysisQ = useMemecoinAnalysis(activeMint, {
    sessionCache: true,
    bust: scanBust,
    scanReady,
    guestScanReady: guestScanEligible,
  });

  const handleHistorySignIn = useCallback(async () => {
    setHistorySigningIn(true);
    try {
      const restored = await ensureSyraAuth();
      if (!restored) {
        await requestSyraAuth();
      }
    } finally {
      setHistorySigningIn(false);
    }
  }, [ensureSyraAuth, requestSyraAuth]);

  /** Silently restore Syra session when opening My calls with wallet already connected. */
  useEffect(() => {
    if (tab !== "history" || !connected || syraAuthenticated || !syraAuthReady) return;
    void ensureSyraAuth();
  }, [tab, connected, syraAuthenticated, syraAuthReady, ensureSyraAuth]);

  const syncUrl = useCallback(
    (mint: string, nextTab?: PumpfunTab, nextSub?: PumpfunScanSubTab) => {
      const next = new URLSearchParams(searchParams);
      next.set("mint", mint);
      if (nextTab) next.set("tab", nextTab);
      else if (tab !== "scan") next.set("tab", tab);
      const sub = nextSub ?? scanSubTab;
      if (sub !== "overview") next.set("sub", sub);
      else next.delete("sub");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, tab, scanSubTab],
  );

  const handleSubTabChange = useCallback(
    (nextSub: PumpfunScanSubTab) => {
      setScanSubTab(nextSub);
      const next = new URLSearchParams(searchParams);
      if (activeMint) next.set("mint", activeMint);
      next.set("tab", "scan");
      if (nextSub !== "overview") next.set("sub", nextSub);
      else next.delete("sub");
      setSearchParams(next, { replace: true });
    },
    [activeMint, searchParams, setSearchParams],
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
      if (isGuestScanEligible(false, quotaQ.data, { quotaLoading: quotaQ.isLoading })) return true;
      openConnectModal();
      return false;
    }
    if (syraAuthenticated) return true;
    const restored = await ensureSyraAuth();
    if (restored) return true;
    const signed = await requestSyraAuth();
    return signed != null;
  }, [connected, ensureSyraAuth, openConnectModal, quotaQ.data, quotaQ.isLoading, requestSyraAuth, syraAuthenticated]);

  const handleAnalyze = useCallback(
    async (raw: string, opts?: { force?: boolean }) => {
      const mint = normalizeMintInput(raw);
      if (!mint) return;
      const ready = await ensureScanSession();
      if (!ready) return;

      if (opts?.force) {
        setScanBust((n) => n + 1);
        queryClient.removeQueries({ queryKey: [MEMECOIN_ANALYSIS_QUERY_ROOT, mint.trim()] });
      } else {
        setScanBust(0);
      }

      setInput(mint);
      setTab("scan");
      setScanSubTab("overview");
      syncUrl(mint, "scan", "overview");
      setActiveMint(mint);

      if (opts?.force) {
        void queryClient.invalidateQueries({ queryKey: [MEMECOIN_ANALYSIS_QUERY_ROOT, mint.trim()] });
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

  useEffect(() => {
    setScanSubTab(urlSub);
  }, [urlSub]);

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

  const scanLimitReached = isPumpfunScanLimitReached(quotaQ.data);

  const openLimitModal = useCallback(() => {
    setLimitModalOpen(true);
  }, []);

  useEffect(() => {
    if (analysisQ.isError && analysisQ.error instanceof MemecoinAnalysisQuotaError) {
      setLimitModalOpen(true);
    }
  }, [analysisQ.isError, analysisQ.error]);

  const skeletonActive = tab === "scan" && analysisQ.isFetching && !analysisPayload;
  const showSkeleton = useMinimumSkeleton(skeletonActive);
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
          scanLimitReached={scanLimitReached}
          walletConnected={connected}
          guestScanEligible={guestScanEligible}
          authPending={authPending}
          onConnectWallet={handleConnectWallet}
          onScanLimitClick={openLimitModal}
        />

        <PumpfunScanLimitModal
          open={limitModalOpen}
          onClose={() => setLimitModalOpen(false)}
          quota={quotaQ.data}
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
                      ? "Daily scan limit reached."
                      : analysisQ.error instanceof Error
                        ? analysisQ.error.message
                        : "Analysis failed"}
                  </p>
                  {analysisQ.error instanceof MemecoinAnalysisQuotaError ? (
                    <Button
                      type="button"
                      variant="neon"
                      size="sm"
                      className="mt-4"
                      onClick={openLimitModal}
                    >
                      View scan limits
                    </Button>
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
              <PumpfunScanWorkspace
                data={analysisPayload}
                scanRecord={latestScanRecord}
                subTab={scanSubTab}
                onSubTabChange={handleSubTabChange}
                onShare={() => {
                  if (latestScanRecord) setShareRecord(latestScanRecord);
                }}
                toolsEnabled={scanReady}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="live" className="mt-6">
            <PumpfunLiveCallsPanel
              onScanMint={handleLiveScan}
              scanning={analysisQ.isFetching}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <PumpfunScanHistoryPanel
              walletConnected={connected}
              syraAuthenticated={syraAuthenticated}
              authPending={authPending}
              signingIn={historySigningIn}
              onConnectWallet={handleConnectWallet}
              onSignIn={handleHistorySignIn}
            />
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
