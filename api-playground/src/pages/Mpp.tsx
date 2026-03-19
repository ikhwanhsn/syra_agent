import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { HistoryPanel } from "@/components/HistoryPanel";
import { RequestBuilder } from "@/components/RequestBuilder";
import { ResponseViewer } from "@/components/ResponseViewer";
import { PaymentModal } from "@/components/PaymentModal";
import { ConnectChainModal, type ConnectOption } from "@/components/ConnectChainModal";
import { UnsupportedApiModal } from "@/components/UnsupportedApiModal";
import { V1UnsupportedModal } from "@/components/V1UnsupportedModal";
import { useApiPlayground } from "@/hooks/useApiPlayground";
import { useWalletContext } from "@/contexts/WalletContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:3000";
  }
  return "https://api.syraa.fun";
}

/**
 * MPP test playground: preloads GET /mpp/v1/check-status (x402 v2–compatible twin of /check-status).
 */
const Mpp = () => {
  const initializedRef = useRef(false);
  const [isConnectChainModalOpen, setIsConnectChainModalOpen] = useState(false);
  const panelsContainerRef = useRef<HTMLDivElement>(null);

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
    isAutoDetecting,
    allowedMethods,
    createShareLink,
  } = useApiPlayground();

  const { openLoginModal, isPrivyMounted, requestConnect } = useWalletContext();

  const effectivePaymentDetails = paymentDetails;

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const base = getApiBaseUrl().replace(/\/$/, "");
    setMethod("GET");
    setUrl(`${base}/mpp/v1/check-status`);
    setBody("");
    setParams([]);
  }, [setMethod, setUrl, setBody, setParams]);

  const handleAfterShare = () => {};

  return (
    <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-hidden max-w-[100vw]">
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => setIsConnectChainModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        paymentNetwork={selectedPaymentChain}
      />

      <div className="flex-1 flex min-h-0 w-full max-w-full pt-14 sm:pt-16 overflow-hidden">
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

        <div
          ref={panelsContainerRef}
          className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto overflow-x-hidden lg:overflow-hidden w-full max-w-full touch-pan-y"
        >
          <div className="min-w-0 flex-1 lg:min-h-0 p-3 sm:p-4 lg:p-5 overflow-visible lg:overflow-hidden border-b lg:border-b-0 lg:border-r border-border/50 lg:max-w-[50%]">
            <div className="glass-panel h-auto min-h-0 lg:h-full lg:min-h-0 p-3 sm:p-4 lg:pb-3 lg:pt-2 overflow-visible lg:overflow-hidden flex flex-col gap-3 rounded-xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  MPP test
                </Badge>
                <h2 className="text-sm font-semibold">Machine payments (x402-compatible)</h2>
                <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                  <Link to="/">Main playground</Link>
                </Button>
              </div>
              <Alert className="border-primary/30 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertTitle className="text-sm">What this is</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground space-y-2">
                  <p>
                    <code className="text-foreground">GET /mpp/v1/check-status</code> mirrors{" "}
                    <code className="text-foreground">/check-status</code> (same x402 v2 payment + facilitator) but tags responses for{" "}
                    <strong>MPP-style</strong> client testing.
                  </p>
                  <p className="flex flex-wrap gap-x-3 gap-y-1">
                    <a
                      href="https://docs.tempo.xyz/guide/payments/make-machine-payments"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Tempo — Make machine payments <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href="https://docs.stripe.com/payments/machine/x402"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Stripe — x402 machine payments <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </AlertDescription>
              </Alert>
              <div className="flex-1 min-h-0">
                <RequestBuilder
                  method={method}
                  url={url}
                  headers={headers}
                  body={body}
                  params={params}
                  isLoading={status === "loading"}
                  isAutoDetecting={isAutoDetecting}
                  allowedMethods={allowedMethods}
                  wallet={wallet}
                  onMethodChange={setMethod}
                  onUrlChange={setUrl}
                  onHeadersChange={setHeaders}
                  onBodyChange={setBody}
                  onParamsChange={setParams}
                  onSend={sendRequest}
                  onTryDemo={() => {}}
                  onExampleFlow={() => {}}
                  onCreateShareLink={createShareLink}
                  onAfterShare={handleAfterShare}
                />
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 p-3 sm:p-4 lg:p-5 overflow-visible lg:overflow-hidden min-h-[55vh] lg:min-h-[420px]">
            <div className="glass-panel h-auto min-h-[50vh] lg:h-full lg:min-h-[400px] p-3 sm:p-4 lg:p-5 overflow-visible lg:overflow-hidden flex flex-col rounded-xl">
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
          paymentOptionsByChain={paymentOptionsByChain}
          selectedPaymentChain={selectedPaymentChain}
          onSelectPaymentChain={selectPaymentChain}
        />
      )}

      <ConnectChainModal
        isOpen={isConnectChainModalOpen}
        onClose={() => setIsConnectChainModalOpen(false)}
        onPick={(option: ConnectOption) => {
          setIsConnectChainModalOpen(false);
          if (!isPrivyMounted) {
            requestConnect(option);
            if (option !== "email") selectPaymentChain(option);
            return;
          }
          if (option === "email") {
            openLoginModal();
            return;
          }
          selectPaymentChain(option);
          connectWallet(option);
        }}
      />

      <UnsupportedApiModal isOpen={isUnsupportedApiModalOpen} onClose={() => setIsUnsupportedApiModalOpen(false)} />
      <V1UnsupportedModal isOpen={isV1UnsupportedModalOpen} onClose={() => setIsV1UnsupportedModalOpen(false)} />
    </div>
  );
};

export default Mpp;
