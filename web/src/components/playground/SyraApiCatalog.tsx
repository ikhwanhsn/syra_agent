import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getExampleFlowGroupsFromFlows,
  getFlowGroup,
  getParamsForExampleFlow,
  type ExampleFlowPreset,
} from "@/hooks/useApiPlayground";
import { useX402DiscoveryCatalog } from "@/hooks/useX402DiscoveryCatalog";
import { usePlaygroundSession } from "@/contexts/PlaygroundSessionContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { QueryParamsModal } from "@/components/QueryParamsModal";
import { SyraApiCard } from "@/components/playground/SyraApiCard";
import { PlaygroundResponseSheet } from "@/components/playground/PlaygroundResponseSheet";
import { PlaygroundHero } from "@/components/playground/PlaygroundHero";
import { PlaygroundCatalogSkeleton } from "@/components/playground/PlaygroundCatalogSkeleton";
import { PlaygroundEmptyState } from "@/components/playground/PlaygroundEmptyState";
import { playgroundSectionEnter } from "@/components/playground/playgroundMotion";
import {
  PLAYGROUND_PAGE_CLASS,
  playgroundChipClass,
  playgroundFilterRailClass,
  playgroundSearchClass,
  playgroundStatPillClass,
  playgroundToolbarClass,
} from "@/components/playground/playgroundStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { flowNeedsParamModal } from "@/lib/playgroundFlow";
import { getPlaygroundSyraPathname } from "@/lib/playgroundUrl";
import { resolvePlaygroundPaymentLane } from "@/lib/paymentLane";
import type { RequestParam } from "@/types/api";
import { cn } from "@/lib/utils";
import { Radio, Search, Sparkles, X } from "lucide-react";

function flowPath(url: string): string {
  const path = getPlaygroundSyraPathname(url);
  return path || url;
}

function splitFlowLabel(label: string): { name: string; detail: string } {
  const idx = label.indexOf(":");
  if (idx < 1) return { name: label, detail: label };
  return {
    name: label.slice(0, idx).trim(),
    detail: label.slice(idx + 1).trim() || label,
  };
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
    paymentOptionsByChain,
    isResponsePanelOpen,
    setIsResponsePanelOpen,
  } = usePlaygroundSession();

  const { flows: allFlows, segments, loading: catalogLoading, source } =
    useX402DiscoveryCatalog();
  const groups = useMemo(() => getExampleFlowGroupsFromFlows(allFlows), [allFlows]);

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
  const hasFilters = Boolean(search.trim() || activeGroup);

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

  const clearFilters = () => {
    setSearch("");
    setActiveGroup(null);
  };

  return (
    <div className={cn(PLAYGROUND_PAGE_CLASS, "space-y-6 sm:space-y-8")}>
      <PlaygroundHero
        kicker="x402 API rail"
        title="Test pay-per-call endpoints"
        description="Browse Syra's machine-money catalog, connect a wallet, and fire live x402 requests with USDC on any PayAI mainnet."
        walletConnected={wallet.connected}
        walletBalance={wallet.balance}
        onConnectWallet={() => openConnectModal()}
        stats={[
          {
            label: "Catalog",
            value: catalogLoading ? "…" : String(segments.length),
          },
          {
            label: "Visible",
            value: catalogLoading ? "…" : String(filteredFlows.length),
          },
          {
            label: "Source",
            value: source === "live" ? "Live" : "Cached",
          },
        ]}
        badges={
          <>
            <span className={playgroundStatPillClass}>
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              x402 v2
            </span>
            <span className={playgroundStatPillClass}>
              <Radio className="h-3.5 w-3.5 text-primary" aria-hidden />
              USDC · PayAI mainnets
            </span>
          </>
        }
      />

      <div
        className={cn(playgroundToolbarClass, playgroundSectionEnter)}
        style={{ animationDelay: "60ms" }}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search endpoints by name, path, or ID…"
            className={playgroundSearchClass}
            aria-label="Search API catalog"
          />
        </div>
        {hasFilters ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 shrink-0 rounded-xl px-3"
            onClick={clearFilters}
          >
            <X className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Clear filters
          </Button>
        ) : null}
      </div>

      <div
        className={cn(playgroundFilterRailClass, playgroundSectionEnter)}
        style={{ animationDelay: "100ms" }}
        role="group"
        aria-label="Filter by category"
      >
        <button
          type="button"
          onClick={() => setActiveGroup(null)}
          className={playgroundChipClass(activeGroup === null)}
        >
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
            <span className="ml-1 tabular-nums text-muted-foreground/80">({g.count})</span>
          </button>
        ))}
      </div>

      {catalogLoading && allFlows.length === 0 ? (
        <PlaygroundCatalogSkeleton count={12} />
      ) : filteredFlows.length === 0 ? (
        <PlaygroundEmptyState
          title={allFlows.length === 0 ? "No endpoints available" : "No matches found"}
          description={
            allFlows.length === 0
              ? "The x402 catalog could not be loaded. Check your API connection or try again shortly."
              : "Try a different search term or clear your category filter."
          }
          action={
            hasFilters ? (
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div
          key={activeGroup ?? "all"}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredFlows.map((flow, index) => {
            const path = flowPath(flow.url);
            const groupName = getFlowGroup(flow).name;
            return (
              <SyraApiCard
                key={flow.id}
                flow={flow}
                path={path}
                groupName={groupName}
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
        title={
          selectedFlow
            ? splitFlowLabel(selectedFlow.label).name
            : "API request"
        }
        subtitle={selectedFlow ? flowPath(selectedFlow.url) : undefined}
        status={status}
        response={response}
        paymentDetails={paymentDetails}
        paymentLane={paymentLane}
        isLoading={isLoading}
        selectedPaymentChain={selectedPaymentChain}
        onSelectPaymentChain={selectPaymentChain}
        paymentOptionsByChain={paymentOptionsByChain}
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
