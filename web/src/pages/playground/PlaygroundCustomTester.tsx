import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { HistoryPanel } from "@/components/HistoryPanel";
import { RequestBuilder } from "@/components/RequestBuilder";
import { ResponseViewer } from "@/components/ResponseViewer";
import { usePlaygroundSession } from "@/contexts/PlaygroundSessionContext";
import { MppLaneStrip } from "@/components/MppLaneStrip";
import { resolvePlaygroundPaymentLane } from "@/lib/paymentLane";
import { MAIN_CONTENT_PB_SAFE_CLASS } from "@/lib/branding";
import { playgroundSectionEnter } from "@/components/playground/playgroundMotion";
import { cn } from "@/lib/utils";

/** Free-form x402 tester — scrollable stacked layout. */
export function PlaygroundCustomTester() {
  const navigate = useNavigate();
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

  const responseSectionRef = useRef<HTMLElement>(null);
  const [responseHighlight, setResponseHighlight] = useState(false);

  const paymentLane = useMemo(() => {
    try {
      if (typeof resolvePlaygroundPaymentLane === "function") {
        return resolvePlaygroundPaymentLane(url, response);
      }
    } catch {
      // ignore
    }
    return "x402" as const;
  }, [url, response]);

  useEffect(() => {
    if (paymentLane !== "mpp") return;
    if (selectedPaymentChain !== "solana") selectPaymentChain("solana");
  }, [paymentLane, selectedPaymentChain, selectPaymentChain]);

  useEffect(() => {
    if (!isResponsePanelOpen) return;
    responseSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setResponseHighlight(true);
    setIsResponsePanelOpen(false);
    const timer = window.setTimeout(() => setResponseHighlight(false), 2500);
    return () => window.clearTimeout(timer);
  }, [isResponsePanelOpen, setIsResponsePanelOpen]);

  const handleAfterShare = (link: string) => {
    try {
      const path = new URL(link, window.location.origin).pathname;
      if (path.startsWith("/playground/s/")) navigate(path, { replace: true });
      else if (path.startsWith("/s/")) navigate(`/playground${path}`, { replace: true });
    } catch {
      // ignore
    }
  };

  const effectivePaymentDetails =
    paymentDetails ||
    (status === "payment_required"
      ? { amount: "0", token: "USDC", recipient: "Unknown", network: "Solana" }
      : undefined);

  return (
    <div className={cn("relative w-full", MAIN_CONTENT_PB_SAFE_CLASS)}>
      <div className={cn("border-b border-border/60 px-4 py-3 sm:px-6", playgroundSectionEnter)}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Custom API</h2>
            <p className="text-sm text-muted-foreground">Test any payment-gated URL</p>
          </div>
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

      <div className="mx-auto flex w-full max-w-[1400px] gap-0 lg:gap-4">
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

        <div className="min-w-0 flex-1 space-y-4 px-4 py-4 pb-16 sm:px-6 sm:py-6">
          <section
            className={cn(
              "rounded-xl border border-border/60 bg-card p-4 sm:p-5",
              playgroundSectionEnter,
            )}
            style={{ animationDelay: "80ms" }}
          >
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
              isLoading={status === "loading"}
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
          </section>

          <section
            ref={responseSectionRef}
            className={cn(
              "rounded-xl border bg-card p-4 transition-[box-shadow,border-color] duration-500 sm:p-5",
              responseHighlight
                ? "border-emerald-500/40 ring-2 ring-emerald-500/25"
                : "border-border/60",
              playgroundSectionEnter,
            )}
            style={{ animationDelay: "140ms" }}
          >
            <h3 className="mb-3 text-sm font-semibold text-foreground">Response</h3>
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
          </section>
        </div>
      </div>
    </div>
  );
}
