import { useState, useEffect, useRef } from 'react';
import { TopBar } from '@/components/TopBar';
import { HistoryPanel } from '@/components/HistoryPanel';
import { RequestBuilder } from '@/components/RequestBuilder';
import { ResponseViewer } from '@/components/ResponseViewer';
import { PaymentModal } from '@/components/PaymentModal';
import { UnsupportedApiModal } from '@/components/UnsupportedApiModal';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { PaymentDetails } from '@/types/api';
import { GripVertical } from 'lucide-react';

// Default payment details when we can't parse x402 response
const DEFAULT_PAYMENT_DETAILS: PaymentDetails = {
  amount: '0',
  token: 'USDC',
  recipient: 'Unknown',
  network: 'Solana',
};

const Index = () => {
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
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isUnsupportedApiModalOpen,
    setIsUnsupportedApiModalOpen,
    isDesktopSidebarOpen,
    setIsDesktopSidebarOpen,
    sidebarWidth,
    setSidebarWidth,
    panelSplitRatio,
    setPanelSplitRatio,
    isAutoDetecting,
  } = useApiPlayground();

  // Panel resize state
  const [isResizingPanels, setIsResizingPanels] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const panelsContainerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <TopBar
        wallet={wallet}
        onConnectWallet={connectWallet}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
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

        {/* Main Panels */}
        <div 
          ref={panelsContainerRef}
          className="flex-1 flex flex-col lg:flex-row overflow-hidden relative"
        >
          {/* Request Builder */}
          <div 
            className="min-w-0 p-4 lg:p-5 overflow-hidden border-b lg:border-b-0 lg:border-r border-border/50"
            style={{
              ...(isDesktop && {
                width: `${panelSplitRatio}%`,
                flexShrink: 0,
                minWidth: '300px',
                maxWidth: '80%',
              })
            }}
          >
            <div className="glass-panel h-full p-4 sm:p-5 overflow-hidden flex flex-col rounded-xl">
              <RequestBuilder
                method={method}
                url={url}
                headers={headers}
                body={body}
                params={params}
                isLoading={status === 'loading'}
                isAutoDetecting={isAutoDetecting}
                wallet={wallet}
                onMethodChange={setMethod}
                onUrlChange={setUrl}
                onHeadersChange={setHeaders}
                onBodyChange={setBody}
                onParamsChange={setParams}
                onSend={sendRequest}
                onTryDemo={tryDemo}
                onExampleFlow={runExampleFlow}
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

          {/* Response Viewer */}
          <div 
            className="flex-1 min-w-0 p-4 lg:p-5 overflow-hidden"
            style={{
              ...(isDesktop && {
                width: `${100 - panelSplitRatio}%`,
                minWidth: '300px',
              })
            }}
          >
            <div className="glass-panel h-full p-5 overflow-hidden flex flex-col rounded-xl">
              <ResponseViewer
                response={response}
                status={status}
                paymentDetails={effectivePaymentDetails}
                onPayAndRetry={() => setIsPaymentModalOpen(true)}
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
          onConnectWallet={connectWallet}
          onPay={pay}
          onRetry={retryAfterPayment}
        />
      )}

      {/* Unsupported API Modal */}
      <UnsupportedApiModal
        isOpen={isUnsupportedApiModalOpen}
        onClose={() => setIsUnsupportedApiModalOpen(false)}
      />
    </div>
  );
};

export default Index;
