import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { HistoryPanel } from '@/components/HistoryPanel';
import { RequestBuilder } from '@/components/RequestBuilder';
import { ResponseViewer } from '@/components/ResponseViewer';
import { PaymentModal } from '@/components/PaymentModal';
import { ConnectChainModal, type ConnectOption } from '@/components/ConnectChainModal';
import { UnsupportedApiModal } from '@/components/UnsupportedApiModal';
import { V1UnsupportedModal } from '@/components/V1UnsupportedModal';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { useWalletContext } from '@/contexts/WalletContext';
import { PaymentDetails, RequestParam } from '@/types/api';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MppLaneStrip } from '@/components/MppLaneStrip';
import { resolvePlaygroundPaymentLane } from '@/lib/paymentLane';
import { InvalidShareLink } from '@/pages/InvalidShareLink';

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
    connectWallet,
    pay,
    retryAfterPayment,
    sendRequest,
    tryDemo,
    runExampleFlow,
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
  const { setConnectChainOverride, openLoginModal, isPrivyMounted, requestConnect } = useWalletContext();

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

  // Chain picker modal: user picks Solana or Base first, then Privy modal opens for that chain
  const [isConnectChainModalOpen, setIsConnectChainModalOpen] = useState(false);

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

  // Run example flow when navigated from /examples with state.runFlowId (and optional runFlowParams).
  // Only run once per flowId so we don't get double history entries (e.g. React Strict Mode double-invoke).
  useEffect(() => {
    const state = location.state as { runFlowId?: string; runFlowParams?: RequestParam[] } | null;
    const flowId = state?.runFlowId;
    if (!flowId) {
      lastRunFlowIdRef.current = null;
      return;
    }
    if (lastRunFlowIdRef.current === flowId) return;
    lastRunFlowIdRef.current = flowId;
    runExampleFlow(flowId, state?.runFlowParams);
    navigate('/', { replace: true, state: {} }); // Clear state so back doesn't re-run
  }, [location.state, runExampleFlow, navigate]);

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
      
      const containerRect = panelsContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const containerWidth = containerRect.width;
      
      // Calculate percentage (constrain between 20% and 80%)
      const newRatio = Math.min(Math.max(20, (relativeX / containerWidth) * 100), 80);
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
      <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-hidden max-w-[100vw]">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => setIsConnectChainModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          paymentNetwork={selectedPaymentChain}
        />
        <div className="flex-1 flex min-h-0 pt-14 sm:pt-16">
          <InvalidShareLink slug={attemptedSlug} />
        </div>
      </div>
    );
  }

  // Loading shared request: show loading state below TopBar
  if (shareSlug && shareLoadStatus === 'loading') {
    return (
      <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-hidden max-w-[100vw]">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => setIsConnectChainModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          paymentNetwork={selectedPaymentChain}
        />
        <div className="flex-1 flex items-center justify-center pt-14 sm:pt-16">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm">Loading shared request…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-hidden max-w-[100vw]">
      {/* Top Bar */}
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => setIsConnectChainModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        paymentNetwork={selectedPaymentChain}
      />

      {/* Main Content - fills viewport below fixed navbar; on mobile panels scroll */}
      <div className="flex-1 flex min-h-0 w-full max-w-full pt-14 sm:pt-16 overflow-hidden">
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

        {/* Main Panels - on mobile: single scrollable column (content-sized, not fixed); on desktop: side-by-side fixed */}
        <div 
          ref={panelsContainerRef}
          className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto overflow-x-hidden lg:overflow-hidden relative w-full max-w-full touch-pan-y"
        >
          {/* Request Builder - on mobile: full content height so POST, URL, Params/Body are all visible when scrolling */}
          <div 
            className="min-w-0 flex-shrink-0 lg:flex-initial lg:min-h-0 p-3 sm:p-4 lg:p-5 overflow-visible lg:overflow-hidden border-b lg:border-b-0 lg:border-r border-border/50"
            style={{
              ...(isDesktop && {
                width: `${panelSplitRatio}%`,
                flexShrink: 0,
                minWidth: '300px',
                maxWidth: '80%',
              })
            }}
          >
            <div className="glass-panel h-auto min-h-0 lg:h-full lg:min-h-0 p-3 sm:p-4 lg:p-5 overflow-visible lg:overflow-hidden flex flex-col rounded-xl">
              <div className="shrink-0 mb-3">
                {paymentLane === 'mpp' ? (
                  <MppLaneStrip />
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Payment lane</span>
                    <Badge variant="secondary" className="text-xs">
                      x402
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Standard Syra x402 v2 resources.
                    </span>
                  </div>
                )}
              </div>
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
                onExampleFlow={runExampleFlow}
                onCreateShareLink={createShareLink}
                onAfterShare={handleAfterShare}
              />
            </div>
          </div>

          {/* Resize handle - only on desktop */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingPanels(true);
            }}
            className="hidden lg:flex absolute top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-primary/30 transition-colors group/resize"
            style={{
              left: `${panelSplitRatio}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-12 rounded-md bg-background/80 backdrop-blur-sm border border-border/60 opacity-0 group-hover/resize:opacity-100 transition-opacity flex items-center justify-center">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Response Viewer - taller on mobile; on desktop gets more space via default split */}
          <div 
            className="min-w-0 flex-shrink-0 lg:flex-1 p-3 sm:p-4 lg:p-5 overflow-visible lg:overflow-hidden min-h-[55vh] lg:min-h-[420px]"
            style={{
              ...(isDesktop && {
                width: `${100 - panelSplitRatio}%`,
                minWidth: '300px',
              })
            }}
          >
            <div className="glass-panel h-auto min-h-[50vh] lg:h-full lg:min-h-0 p-3 sm:p-4 lg:p-5 overflow-visible lg:overflow-hidden flex flex-col rounded-xl">
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
          onOpenConnectModal={() => setIsConnectChainModalOpen(true)}
          onPay={pay}
          onRetry={retryAfterPayment}
          paymentOptionsByChain={paymentOptionsByChainForLane}
          selectedPaymentChain={selectedPaymentChain}
          onSelectPaymentChain={selectPaymentChain}
        />
      )}

      {/* Chain picker: user picks Solana or Base, then Privy connect modal opens for that chain */}
      <ConnectChainModal
        isOpen={isConnectChainModalOpen}
        onClose={() => setIsConnectChainModalOpen(false)}
        onPick={(option) => {
          setIsConnectChainModalOpen(false);
          if (!isPrivyMounted) {
            requestConnect(option);
            if (option !== 'email') selectPaymentChain(option);
            return;
          }
          if (option === 'email') {
            openLoginModal();
            return;
          }
          selectPaymentChain(option);
          // Don't set connectChainOverride here so the provider doesn't re-render with solana-only before the modal; connectForChain passes walletChainType in the call so the modal shows the right wallets. That way Phantom doesn't open until the user clicks it in the modal.
          connectWallet(option);
        }}
      />

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
