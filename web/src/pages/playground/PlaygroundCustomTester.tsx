import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { History, Wallet } from "lucide-react";
import { HistoryPanel } from "@/components/HistoryPanel";
import { RequestBuilder } from "@/components/RequestBuilder";
import { PlaygroundResponseSheet } from "@/components/playground/PlaygroundResponseSheet";
import { usePlaygroundSession } from "@/contexts/PlaygroundSessionContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { MppLaneStrip } from "@/components/MppLaneStrip";
import { resolvePlaygroundPaymentLane } from "@/lib/paymentLane";
import { getPlaygroundSyraPathname } from "@/lib/playgroundUrl";
import { MAIN_CONTENT_PB_SAFE_CLASS } from "@/lib/branding";
import { playgroundSectionEnter } from "@/components/playground/playgroundMotion";
import { PLAYGROUND_PAGE_CLASS } from "@/components/playground/playgroundStyles";
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

        <div className="min-w-0 flex-1 space-y-5">
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-3",
              playgroundSectionEnter,
            )}
          >
            <div>
              <h2 className="text-lg font-semibold text-foreground">Custom API</h2>
              <p className="text-sm text-muted-foreground">
                Test any payment-gated URL · Send opens response panel
              </p>
            </div>
            <div className="flex items-center gap-2">
              {wallet.connected ? (
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {wallet.balance || "0 USDC"}
                </span>
              ) : (
                <Button
                  variant="neon"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => openConnectModal()}
                >
                  <Wallet className="mr-1.5 h-4 w-4" />
                  Connect
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <History className="mr-1.5 h-4 w-4" />
                History
              </Button>
            </div>
          </div>

          <div className={playgroundSectionEnter} style={{ animationDelay: "60ms" }}>
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
