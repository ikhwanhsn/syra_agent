import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { HistoryPanel } from "@/components/HistoryPanel";
import { RequestBuilder } from "@/components/RequestBuilder";
import { PlaygroundResponseSheet } from "@/components/playground/PlaygroundResponseSheet";
import { usePlaygroundSession } from "@/contexts/PlaygroundSessionContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { MppLaneStrip } from "@/components/MppLaneStrip";
import { resolvePlaygroundPaymentLane } from "@/lib/paymentLane";
import { getPlaygroundSyraPathname } from "@/lib/playgroundUrl";
import { MAIN_CONTENT_PB_SAFE_CLASS } from "@/lib/branding";
import { PlaygroundHero } from "@/components/playground/PlaygroundHero";
import { playgroundSectionEnter } from "@/components/playground/playgroundMotion";
import {
  PLAYGROUND_PAGE_CLASS,
  playgroundStatPillClass,
} from "@/components/playground/playgroundStyles";
import { cn } from "@/lib/utils";

/** Free-form x402 tester — full-width layout aligned with Syra APIs tab. */
export function PlaygroundCustomTester() {
  const navigate = useNavigate();
  const { openConnectModal } = useConnectModal();
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
    createShareLink,
    wallet,
    sendRequest,
    tryDemo,
    isSidebarOpen,
    setIsSidebarOpen,
    selectedPaymentChain,
    selectPaymentChain,
    paymentOptionsByChain,
    setIsPaymentModalOpen,
    isDesktopSidebarOpen,
    setIsDesktopSidebarOpen,
    sidebarWidth,
    setSidebarWidth,
    isAutoDetecting,
    allowedMethods,
    isResponsePanelOpen,
    setIsResponsePanelOpen,
  } = usePlaygroundSession();

  const paymentLane = useMemo(() => {
    try {
      return resolvePlaygroundPaymentLane(url, response);
    } catch {
      return "x402" as const;
    }
  }, [url, response]);

  useEffect(() => {
    if (paymentLane !== "mpp") return;
    if (selectedPaymentChain !== "solana") selectPaymentChain("solana");
  }, [paymentLane, selectedPaymentChain, selectPaymentChain]);

  const handleAfterShare = (link: string) => {
    try {
      const path = new URL(link, window.location.origin).pathname;
      if (path.startsWith("/playground/s/")) navigate(path, { replace: true });
      else if (path.startsWith("/s/")) navigate(`/playground${path}`, { replace: true });
    } catch {
      // ignore
    }
  };

  const requestPath = useMemo(() => {
    try {
      return getPlaygroundSyraPathname(url) || url.trim() || "/";
    } catch {
      return url.trim() || "/";
    }
  }, [url]);

  const handleSend = useCallback(() => {
    setIsResponsePanelOpen(true);
    void sendRequest();
  }, [sendRequest, setIsResponsePanelOpen]);

  const handleTryDemo = useCallback(() => {
    setIsResponsePanelOpen(true);
    tryDemo();
  }, [tryDemo, setIsResponsePanelOpen]);

  const effectivePaymentDetails =
    paymentDetails ||
    (status === "payment_required"
      ? { amount: "0", token: "USDC", recipient: "Unknown", network: "Solana" }
      : undefined);

  const isLoading = status === "loading";

  return (
    <div className={cn("relative w-full", MAIN_CONTENT_PB_SAFE_CLASS)}>
      <div className={cn(PLAYGROUND_PAGE_CLASS, "flex gap-0 lg:items-start lg:gap-4")}>
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

        <div className="min-w-0 flex-1 space-y-6">
          <PlaygroundHero
            kicker="Custom tester"
            title="Send any x402 request"
            description="Full control over method, headers, query params, and body — with history, sharing, and live payment flows."
            walletConnected={wallet.connected}
            walletBalance={wallet.balance}
            onConnectWallet={() => openConnectModal()}
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 rounded-xl lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <History className="mr-1.5 h-4 w-4" aria-hidden />
                History
              </Button>
            }
            badges={
              paymentLane === "mpp" ? (
                <span className={playgroundStatPillClass}>MPP lane</span>
              ) : (
                <span className={playgroundStatPillClass}>x402 lane</span>
              )
            }
          />

          <div className={playgroundSectionEnter} style={{ animationDelay: "80ms" }}>
            {paymentLane === "mpp" ? (
              <div className="mb-3">
                <MppLaneStrip />
              </div>
            ) : null}
            <RequestBuilder
              method={method}
              url={url}
              headers={headers}
              body={body}
              params={params}
              isLoading={isLoading}
              isAutoDetecting={isAutoDetecting}
              allowedMethods={allowedMethods}
              wallet={wallet}
              paymentLane={paymentLane}
              onMethodChange={setMethod}
              onUrlChange={setUrl}
              onHeadersChange={setHeaders}
              onBodyChange={setBody}
              onParamsChange={setParams}
              onSend={handleSend}
              onTryDemo={handleTryDemo}
              onCreateShareLink={createShareLink}
              onAfterShare={handleAfterShare}
            />
          </div>
        </div>
      </div>

      <PlaygroundResponseSheet
        open={isResponsePanelOpen}
        onOpenChange={setIsResponsePanelOpen}
        title={requestPath}
        subtitle={`${method} request`}
        status={status}
        response={response}
        paymentDetails={effectivePaymentDetails}
        paymentLane={paymentLane}
        isLoading={isLoading}
        selectedPaymentChain={selectedPaymentChain}
        onSelectPaymentChain={selectPaymentChain}
        paymentOptionsByChain={paymentOptionsByChain}
        onRunAgain={handleSend}
        onPayAndRetry={() => setIsPaymentModalOpen(true)}
        onResend={() => {
          setIsResponsePanelOpen(true);
          void sendRequest();
        }}
      />
    </div>
  );
}
