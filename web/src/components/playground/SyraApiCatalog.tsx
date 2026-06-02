import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getExampleFlowGroups,
  getExampleFlowsX402,
  getFlowGroup,
  getParamsForExampleFlow,
  type ExampleFlowPreset,
} from "@/hooks/useApiPlayground";
import { usePlaygroundSession } from "@/contexts/PlaygroundSessionContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { QueryParamsModal } from "@/components/QueryParamsModal";
import { SyraApiCard } from "@/components/playground/SyraApiCard";
import { PlaygroundResponseSheet } from "@/components/playground/PlaygroundResponseSheet";
import { playgroundSectionEnter } from "@/components/playground/playgroundMotion";
import { playgroundChipClass } from "@/components/playground/playgroundStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { flowNeedsParamModal } from "@/lib/playgroundFlow";
import { getPlaygroundSyraPathname } from "@/lib/playgroundUrl";
import { resolvePlaygroundPaymentLane } from "@/lib/paymentLane";
import type { RequestParam } from "@/types/api";
import { cn } from "@/lib/utils";
import { Search, Wallet } from "lucide-react";

function flowPath(url: string): string {
  const path = getPlaygroundSyraPathname(url);
  return path || url;
}

function splitFlowLabel(label: string): { detail: string } {
  const idx = label.indexOf(":");
  if (idx < 1) return { detail: label };
  const detail = label.slice(idx + 1).trim();
  return { detail: detail || label };
}

export function SyraApiCatalog() {
  const { openConnectModal } = useConnectModal();
  const {
    wallet,
    status,
    response,
    paymentDetails,
    runExampleFlowFromPreset,
    sendRequest,
    setIsPaymentModalOpen,
    selectedPaymentChain,
    selectPaymentChain,
    isResponsePanelOpen,
    setIsResponsePanelOpen,
  } = usePlaygroundSession();

  const allFlows = useMemo(() => getExampleFlowsX402(), []);
  const groups = useMemo(() => getExampleFlowGroups(), []);

  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [paramsModalFlow, setParamsModalFlow] = useState<ExampleFlowPreset | null>(null);
  const [paramsModalInitialParams, setParamsModalInitialParams] = useState<RequestParam[]>([]);

  const filteredFlows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allFlows.filter((flow) => {
      if (activeGroup && getFlowGroup(flow).slug !== activeGroup) return false;
      if (!q) return true;
      const path = flowPath(flow.url).toLowerCase();
      return (
        flow.label.toLowerCase().includes(q) ||
        flow.id.toLowerCase().includes(q) ||
        path.includes(q)
      );
    });
  }, [allFlows, activeGroup, search]);

  const selectedFlow = useMemo(
    () => allFlows.find((f) => f.id === selectedFlowId) ?? null,
    [allFlows, selectedFlowId],
  );

  const paymentLane = useMemo(() => {
    try {
      return resolvePlaygroundPaymentLane(selectedFlow?.url ?? "", response);
    } catch {
      return "x402" as const;
    }
  }, [selectedFlow?.url, response]);

  const isLoading = status === "loading";

  useEffect(() => {
    if (paymentLane !== "mpp") return;
    if (selectedPaymentChain !== "solana") selectPaymentChain("solana");
  }, [paymentLane, selectedPaymentChain, selectPaymentChain]);

  useEffect(() => {
    if (paramsModalFlow) setIsResponsePanelOpen(false);
  }, [paramsModalFlow, setIsResponsePanelOpen]);

  const handleTry = useCallback(
    (flow: ExampleFlowPreset) => {
      setSelectedFlowId(flow.id);
      const paramsForFlow = getParamsForExampleFlow(flow);
      if (flowNeedsParamModal(flow, paramsForFlow)) {
        setIsResponsePanelOpen(false);
        setParamsModalFlow(flow);
        setParamsModalInitialParams(paramsForFlow);
        return;
      }
      setIsResponsePanelOpen(true);
      void runExampleFlowFromPreset(flow, paramsForFlow);
    },
    [runExampleFlowFromPreset, setIsResponsePanelOpen],
  );

  const handleRunWithParams = useCallback(
    (params: RequestParam[]) => {
      if (!paramsModalFlow) return;
      setSelectedFlowId(paramsModalFlow.id);
      setParamsModalFlow(null);
      setParamsModalInitialParams([]);
      setIsResponsePanelOpen(true);
      void runExampleFlowFromPreset(paramsModalFlow, params);
    },
    [paramsModalFlow, runExampleFlowFromPreset, setIsResponsePanelOpen],
  );

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-5 px-4 py-4 pb-16 sm:px-6 sm:py-6">
      {/* Header */}
      <div className={cn("flex flex-wrap items-center justify-between gap-3", playgroundSectionEnter)}>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Syra x402 APIs</h2>
          <p className="text-sm text-muted-foreground">
            {filteredFlows.length} endpoints · connect wallet · Try opens response panel
          </p>
        </div>
        {wallet.connected ? (
          <span className="text-sm font-medium tabular-nums text-foreground">
            {wallet.balance || "0 USDC"}
          </span>
        ) : (
          <Button variant="neon" size="sm" className="rounded-lg" onClick={() => openConnectModal()}>
            <Wallet className="mr-1.5 h-4 w-4" />
            Connect
          </Button>
        )}
      </div>

      {/* Search */}
      <div className={cn("relative", playgroundSectionEnter)} style={{ animationDelay: "60ms" }}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search APIs…"
          className="h-10 pl-9"
        />
      </div>

      {/* Filters */}
      <div
        className={cn("flex flex-wrap gap-1.5", playgroundSectionEnter)}
        style={{ animationDelay: "100ms" }}
      >
        <button type="button" onClick={() => setActiveGroup(null)} className={playgroundChipClass(activeGroup === null)}>
          All
        </button>
        {groups.map((g) => (
          <button
            key={g.slug}
            type="button"
            onClick={() => setActiveGroup(g.slug)}
            className={playgroundChipClass(activeGroup === g.slug)}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filteredFlows.length === 0 ? (
        <p
          className={cn(
            "py-12 text-center text-sm text-muted-foreground",
            "animate-in fade-in duration-300 fill-mode-both",
          )}
        >
          No APIs match your search.
        </p>
      ) : (
        <div
          key={activeGroup ?? "all"}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
        >
          {filteredFlows.map((flow, index) => {
            const { detail } = splitFlowLabel(flow.label);
            return (
              <SyraApiCard
                key={flow.id}
                flow={flow}
                detail={detail}
                path={flowPath(flow.url)}
                active={flow.id === selectedFlowId}
                isLoading={isLoading}
                staggerIndex={index}
                onTry={() => handleTry(flow)}
              />
            );
          })}
        </div>
      )}

      <PlaygroundResponseSheet
        open={isResponsePanelOpen}
        onOpenChange={setIsResponsePanelOpen}
        title={selectedFlow ? splitFlowLabel(selectedFlow.label).detail : "API request"}
        subtitle={selectedFlow ? flowPath(selectedFlow.url) : undefined}
        status={status}
        response={response}
        paymentDetails={paymentDetails}
        paymentLane={paymentLane}
        isLoading={isLoading}
        onRunAgain={selectedFlow ? () => handleTry(selectedFlow) : undefined}
        onPayAndRetry={() => setIsPaymentModalOpen(true)}
        onResend={() => {
          void sendRequest();
        }}
      />

      <QueryParamsModal
        isOpen={!!paramsModalFlow}
        onClose={() => {
          setParamsModalFlow(null);
          setParamsModalInitialParams([]);
        }}
        flow={paramsModalFlow}
        initialParams={paramsModalInitialParams}
        onRun={handleRunWithParams}
      />
    </div>
  );
}
