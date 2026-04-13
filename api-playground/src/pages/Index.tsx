import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { HistoryPanel } from '@/components/HistoryPanel';
import { RequestBuilder } from '@/components/RequestBuilder';
import { ResponseViewer } from '@/components/ResponseViewer';
import { PaymentModal } from '@/components/PaymentModal';
import { UnsupportedApiModal } from '@/components/UnsupportedApiModal';
import { V1UnsupportedModal } from '@/components/V1UnsupportedModal';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { useWalletContext } from '@/contexts/WalletContext';
import { PaymentDetails, RequestParam } from '@/types/api';
import type { ExampleFlowPreset } from '@/hooks/useApiPlayground';
import { GripVertical } from 'lucide-react';
import { MppLaneStrip } from '@/components/MppLaneStrip';
import { resolvePlaygroundPaymentLane } from '@/lib/paymentLane';
import { InvalidShareLink } from '@/pages/InvalidShareLink';
import { MAIN_CONTENT_PT_CLASS, MAIN_CONTENT_PB_SAFE_CLASS } from '@/lib/branding';
import { cn } from '@/lib/utils';

// Default payment details when we can't parse x402 response
const DEFAULT_PAYMENT_DETAILS: PaymentDetails = {
  amount: '0',
  token: 'USDC',
  recipient: 'Unknown',
  network: 'Solana',
};

/** Slug format for share links: 1–24 hex chars (same as API). */
function isValidShareSlug(s: string): boolean {
  return /^[a-f0-9]{1,24}$/i.test(s);
}

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug: shareSlug } = useParams<{ slug?: string }>();
  const {
    method,
    setMethod,
    url,
    setUrl,
    headers,
    setHeaders,
    body,
    setBody,
    params,
    setParams,
    response,
    status,
    paymentDetails,
    history,
    selectedHistoryId,
    selectHistoryItem,
    clearHistory,
    removeHistoryItem,
    createNewRequest,
    cloneHistoryItem,
    loadSharedRequest,
    createShareLink,
    wallet,
    transactionStatus,
    pay,
    retryAfterPayment,
    sendRequest,
    tryDemo,
    runExampleFlow,
    runExampleFlowFromPreset,
    isSidebarOpen,
    setIsSidebarOpen,
    paymentOptionsByChain,
    selectedPaymentChain,
    selectPaymentChain,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isUnsupportedApiModalOpen,
    setIsUnsupportedApiModalOpen,
    isV1UnsupportedModalOpen,
    setIsV1UnsupportedModalOpen,
    isDesktopSidebarOpen,
    setIsDesktopSidebarOpen,
    sidebarWidth,
    setSidebarWidth,
    panelSplitRatio,
    setPanelSplitRatio,
    isAutoDetecting,
    allowedMethods,
  } = useApiPlayground();
  const { connect, setConnectChainPickListener } = useWalletContext();

  useEffect(() => {
    setConnectChainPickListener((option) => {
      if (option !== 'email') selectPaymentChain(option);
    });
    return () => setConnectChainPickListener(null);
  }, [selectPaymentChain, setConnectChainPickListener]);

  const paymentLane = useMemo(
    () => {
      // Guard against rare stale-bundle situations where the helper symbol isn't
      // present yet; keep the playground usable.
      try {
        if (typeof resolvePlaygroundPaymentLane === 'function') {
          return resolvePlaygroundPaymentLane(url, response);
        }
      } catch {
        // ignore
      }
      return 'x402' as const;
    },
    [url, response]
  );

  // When testing MPP/x402-compatible lanes, keep the payment rail on Solana to
  // avoid triggering the EVM wallet ask/injection path (which may crash some
  // environments with "Cannot redefine property: ethereum").
  useEffect(() => {
    if (paymentLane !== 'mpp') return;
    if (selectedPaymentChain !== 'solana') selectPaymentChain('solana');
  }, [paymentLane, selectedPaymentChain, selectPaymentChain]);

  const paymentOptionsByChainForLane = useMemo(() => {
    if (paymentLane !== 'mpp') return paymentOptionsByChain;
    return {
      solana: paymentOptionsByChain.solana,
      base: null,
    };
  }, [paymentLane, paymentOptionsByChain]);

  // Panel resize state
  const [isResizingPanels, setIsResizingPanels] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const panelsContainerRef = useRef<HTMLDivElement>(null);
  const lastRunFlowIdRef = useRef<string | null>(null);
  const lastLoadedShareSlugRef = useRef<string | null>(null);

  // Share link load status: idle (no slug), loading, success, not_found
  const [shareLoadStatus, setShareLoadStatus] = useState<'idle' | 'loading' | 'success' | 'not_found'>('idle');

  // Dedicated invalid-share page: /s/invalid (redirect target when a share link is bad)
  const isInvalidSharePage = shareSlug === 'invalid';
  const attemptedSlug = (location.state as { attemptedSlug?: string } | null)?.attemptedSlug;

  // When no slug in URL, reset so next /s/:slug will load
  useEffect(() => {
    if (!shareSlug) {
      setShareLoadStatus('idle');
      lastLoadedShareSlugRef.current = null;
    }
  }, [shareSlug]);

  // Load shared request when visiting /s/:slug (e.g. shared link). Redirect to /s/invalid if invalid or not found.
  // Skip loading when the selected history item already has this shareSlug (we just synced URL after a 402/share) so we don't overwrite the response.
  useEffect(() => {
    if (!shareSlug || shareSlug === 'invalid' || !loadSharedRequest) return;
    const selected = history.find((h) => h.id === selectedHistoryId);
    if (selected?.shareSlug === shareSlug) {
      setShareLoadStatus('success');
      lastLoadedShareSlugRef.current = shareSlug;
      return;
    }
    if (lastLoadedShareSlugRef.current === shareSlug) return;
    lastLoadedShareSlugRef.current = shareSlug;
    if (!isValidShareSlug(shareSlug)) {
      navigate('/s/invalid', { replace: true, state: { attemptedSlug: shareSlug } });
      return;
    }
    setShareLoadStatus('loading');
    loadSharedRequest(shareSlug)
      .then((ok) => {
        if (ok) setShareLoadStatus('success');
        else navigate('/s/invalid', { replace: true, state: { attemptedSlug: shareSlug } });
      })
      .catch(() => navigate('/s/invalid', { replace: true, state: { attemptedSlug: shareSlug } }));
  }, [shareSlug, loadSharedRequest, navigate, history, selectedHistoryId]);

  // Keep browser URL in sync with share link: when on / and selected history item has shareSlug, show /s/:slug in address bar
  const locationPathname = location.pathname;
  useEffect(() => {
    if (locationPathname !== '/') return;
    if (!selectedHistoryId) return;
    const selected = history.find((h) => h.id === selectedHistoryId);
    if (!selected?.shareSlug) return;
    navigate(`/s/${selected.shareSlug}`, { replace: true });
  }, [locationPathname, selectedHistoryId, history, navigate]);

  // When the active history item (tab/link) is deleted, we're still on /s/:slug; navigate back to / so the URL matches the cleared state (skip when on /s/invalid)
  useEffect(() => {
    if (!locationPathname.startsWith('/s/') || shareSlug === 'invalid' || shareLoadStatus === 'loading') return;
    if (selectedHistoryId !== undefined) return;
    navigate('/', { replace: true });
  }, [locationPathname, selectedHistoryId, shareLoadStatus, shareSlug, navigate]);

  // After Share: update browser URL to the share link so address bar reflects it
  const handleAfterShare = useCallback(
    (link: string) => {
      try {
        const path = new URL(link).pathname;
        if (path.startsWith('/s/')) navigate(path, { replace: true });
      } catch {
        // ignore invalid URLs
      }
    },
    [navigate]
  );

  // Run example flow when navigated from /examples with state.runFlowId or full state.runFlowPreset (MPP catalog).
  // Only run once per id so we don't get double history entries (e.g. React Strict Mode double-invoke).
  useEffect(() => {
    const state = location.state as {
      runFlowId?: string;
      runFlowPreset?: ExampleFlowPreset;
      runFlowParams?: RequestParam[];
    } | null;
    const preset = state?.runFlowPreset;
    if (preset) {
      const key = `preset:${preset.id}`;
      if (lastRunFlowIdRef.current === key) return;
      lastRunFlowIdRef.current = key;
      runExampleFlowFromPreset(preset, state?.runFlowParams);
      navigate('/', { replace: true, state: {} });
      return;
    }
    const flowId = state?.runFlowId;
    if (!flowId) {
      lastRunFlowIdRef.current = null;
      return;
    }
    if (lastRunFlowIdRef.current === flowId) return;
    lastRunFlowIdRef.current = flowId;
    runExampleFlow(flowId, state?.runFlowParams);
    navigate('/', { replace: true, state: {} }); // Clear state so back doesn't re-run
  }, [location.state, runExampleFlow, runExampleFlowFromPreset, navigate]);

  // Detect desktop viewport
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Handle panel resize
  useEffect(() => {
    if (!isResizingPanels) {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      return;
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelsContainerRef.current) return;

      const el = panelsContainerRef.current;
      const containerRect = el.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const containerWidth = containerRect.width;
      const gapStr = getComputedStyle(el).columnGap;
      const gapPx = Number.isFinite(parseFloat(gapStr)) ? parseFloat(gapStr) : 0;
      const inner = Math.max(1, containerWidth - gapPx);
      // Invert: handle sits at (inner * r/100 + gapPx/2); solve for r from pointer x
      const rawRatio = ((relativeX - gapPx / 2) / inner) * 100;
      const newRatio = Math.min(Math.max(20, rawRatio), 80);
      setPanelSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsResizingPanels(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingPanels, setPanelSplitRatio]);

  // Use actual payment details or default for 402 responses
  const effectivePaymentDetails = paymentDetails || (status === 'payment_required' ? DEFAULT_PAYMENT_DETAILS : undefined);

  // Invalid share link page: /s/invalid (reached via redirect when a share link is bad or not found)
  if (isInvalidSharePage) {
    return (
      <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-hidden max-w-[100vw] playground-ambient">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => connect()}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          paymentNetwork={selectedPaymentChain}
          flowStatus={status}
        />
        <div className={cn('flex-1 flex min-h-0 relative z-[1]', MAIN_CONTENT_PT_CLASS, MAIN_CONTENT_PB_SAFE_CLASS)}>
          <InvalidShareLink slug={attemptedSlug} />
        </div>
      </div>
    );
  }

  // Loading shared request: show loading state below TopBar
  if (shareSlug && shareLoadStatus === 'loading') {
    return (
      <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-hidden max-w-[100vw] playground-ambient">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => connect()}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          paymentNetwork={selectedPaymentChain}
          flowStatus="loading"
        />
        <div className={cn('flex-1 flex items-center justify-center relative z-[1]', MAIN_CONTENT_PT_CLASS)}>
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm">Loading shared request…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-hidden max-w-[100vw] playground-ambient">
      {/* Top Bar */}
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => connect()}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        paymentNetwork={selectedPaymentChain}
        flowStatus={status}
      />

      {/* Main Content - fills viewport below fixed navbar; on mobile panels scroll */}
      <div
        className={cn(
          'flex-1 flex min-h-0 w-full max-w-full overflow-hidden relative z-[1]',
          MAIN_CONTENT_PT_CLASS,
          MAIN_CONTENT_PB_SAFE_CLASS,
        )}
      >
        {/* History Panel */}
        <HistoryPanel
          history={history}
          selectedId={selectedHistoryId}
          onSelect={selectHistoryItem}
          onClear={clearHistory}
          onRemove={removeHistoryItem}
          onCreateNew={createNewRequest}
          onClone={cloneHistoryItem}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          sidebarWidth={sidebarWidth}
          onSidebarWidthChange={setSidebarWidth}
        />

        {/* Main Panels - mobile: column; desktop: CSS Grid so tracks stay exact ratio (e.g. 50fr/50fr = true 50/50) */}
        <div
          ref={panelsContainerRef}
          className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden lg:overflow-hidden relative w-full max-w-full min-w-0 touch-pan-y overscroll-y-contain"
          style={{
            ...(isDesktop && {
              display: 'grid',
              gridTemplateColumns: `minmax(0, ${panelSplitRatio}fr) minmax(0, ${100 - panelSplitRatio}fr)`,
              gridTemplateRows: 'minmax(0, 1fr)',
              columnGap: '1rem', // keep in sync with resize rail `calc(... 1rem ...)`; mousemove uses computed gap
            }),
          }}
        >
          {/* Request Builder - on mobile: full content height so POST, URL, Params/Body are all visible when scrolling */}
          <div 
            className="min-w-0 flex-shrink-0 lg:min-h-0 p-3 sm:p-4 lg:p-5 overflow-visible lg:overflow-hidden border-b lg:border-b-0 border-border/50"
          >
            <div className="glass-panel glass-panel-playground-main h-auto min-h-0 lg:h-full lg:min-h-0 p-4 sm:p-5 lg:p-6 overflow-visible lg:overflow-hidden flex flex-col">
              {paymentLane === 'mpp' ? (
                <div className="shrink-0 mb-3">
                  <MppLaneStrip />
                </div>
              ) : null}
              <RequestBuilder
                method={method}
                url={url}
                headers={headers}
                body={body}
                params={params}
                isLoading={status === 'loading'}
                isAutoDetecting={isAutoDetecting}
                allowedMethods={allowedMethods}
                wallet={wallet}
                paymentLane={paymentLane}
                onMethodChange={setMethod}
                onUrlChange={setUrl}
                onHeadersChange={setHeaders}
                onBodyChange={setBody}
                onParamsChange={setParams}
                onSend={sendRequest}
                onTryDemo={tryDemo}
                onCreateShareLink={createShareLink}
                onAfterShare={handleAfterShare}
              />
            </div>
          </div>

          {/* Split rail — always-visible track + glow line; premium affordance for resize */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize request and response panels"
            title="Drag to resize panels"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingPanels(true);
            }}
            className="hidden lg:flex absolute top-3 bottom-3 z-20 w-5 cursor-col-resize select-none flex-col items-center justify-center group/panel-split touch-none"
            style={{
              left: isDesktop
                ? `calc((100% - 1rem) * ${panelSplitRatio} / 100 + 0.5rem)`
                : `${panelSplitRatio}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-y-1 left-1/2 w-2.5 -translate-x-1/2 rounded-full border border-border/60 bg-muted/30 shadow-[inset_0_2px_10px_rgba(0,0,0,0.28)] dark:border-white/[0.12] dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-12px_32px_rgba(0,0,0,0.45)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-1/2 top-6 bottom-6 w-[2px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/25 via-primary to-primary/25 opacity-90 shadow-[0_0_18px_hsl(var(--primary)/0.5),0_0_36px_hsl(var(--ring)/0.18)] dark:from-primary/30 dark:via-primary dark:to-primary/30"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 flex h-14 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-border/80 bg-background/90 shadow-lg shadow-black/30 backdrop-blur-md ring-1 ring-white/[0.08] transition-all duration-200 dark:border-white/[0.14] dark:bg-card/95 dark:shadow-black/50 opacity-[0.72] group-hover/panel-split:opacity-100 group-hover/panel-split:border-primary/40 group-hover/panel-split:ring-primary/25 group-hover/panel-split:shadow-[0_0_28px_hsl(var(--primary)/0.22)]"
              aria-hidden
            >
              <GripVertical className="h-4 w-4 text-muted-foreground transition-colors group-hover/panel-split:text-primary" />
            </div>
          </div>

          {/* Response Viewer - taller on mobile; on desktop shares row with request (default 50/50) */}
          <div 
            className="min-w-0 flex-shrink-0 max-lg:flex-1 p-3 sm:p-4 lg:p-5 overflow-visible lg:overflow-hidden min-h-[min(60dvh,520px)] sm:min-h-[55vh] lg:min-h-0"
          >
            <div className="glass-panel glass-panel-playground-main h-auto min-h-[50vh] lg:h-full lg:min-h-0 p-4 sm:p-5 lg:p-6 overflow-visible lg:overflow-hidden flex flex-col">
              <ResponseViewer
                response={response}
                status={status}
                paymentDetails={effectivePaymentDetails}
                paymentLane={paymentLane}
                onPayAndRetry={() => setIsPaymentModalOpen(true)}
                onResend={() => {
                  void sendRequest();
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal - Show for any 402 response */}
      {effectivePaymentDetails && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          paymentDetails={effectivePaymentDetails}
          wallet={wallet}
          transactionStatus={transactionStatus}
          onOpenConnectModal={() => connect()}
          onPay={pay}
          onRetry={retryAfterPayment}
          paymentOptionsByChain={paymentOptionsByChainForLane}
          selectedPaymentChain={selectedPaymentChain}
          onSelectPaymentChain={selectPaymentChain}
        />
      )}

      {/* Unsupported API Modal (invalid URL) */}
      <UnsupportedApiModal
        isOpen={isUnsupportedApiModalOpen}
        onClose={() => setIsUnsupportedApiModalOpen(false)}
      />

      {/* x402 v1 not supported Modal */}
      <V1UnsupportedModal
        isOpen={isV1UnsupportedModalOpen}
        onClose={() => setIsV1UnsupportedModalOpen(false)}
      />
    </div>
  );
};

export default Index;
