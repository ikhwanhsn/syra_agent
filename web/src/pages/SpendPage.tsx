import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Search, Sparkles, Wrench } from "lucide-react";
import { Link } from "@/lib/navigation";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { PillarConnectCTA } from "@/components/pillars/PillarConnectCTA";
import {
  SpendPageSkeleton,
  SpendPreviewSkeleton,
} from "@/components/pillars/PillarPageSkeletons";
import { SpendToolCard } from "@/components/spend/SpendToolCard";
import { AgentBillingDashboard } from "@/components/wallet/AgentBillingDashboard";
import { OverviewStatCard } from "@/components/dashboard/overview/OverviewStatCard";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewCardShell,
  overviewChartPanelShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import {
  categorizeSpendTool,
  fetchAnalyticsKpi,
  fetchPreviewNews,
  fetchPreviewSentiment,
  fetchPreviewSignal,
  fetchSpendTools,
  type PreviewNewsResponse,
  type PreviewSentimentResponse,
  type PreviewSignalResponse,
  type SpendTool,
  type SpendToolCategory,
} from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

const CATEGORIES: Array<SpendToolCategory | "All"> = [
  "All",
  "Intelligence",
  "Signals",
  "Nansen",
  "Assets",
  "DeFi",
];

type PreviewKind = "news" | "sentiment" | "signal";

type PreviewResult =
  | { kind: "news"; data: PreviewNewsResponse }
  | { kind: "sentiment"; data: PreviewSentimentResponse }
  | { kind: "signal"; data: PreviewSignalResponse };

function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function PreviewOutput({ result }: { result: PreviewResult }) {
  if (result.kind === "news") {
    const items = result.data.news?.slice(0, 3) ?? [];
    if (result.data.error || items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          {result.data.error ?? "No headlines."}
        </p>
      );
    }
    return (
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={`${item.title ?? "n"}-${i}`}>
            <p className="text-sm font-medium leading-snug tracking-tight">
              {item.title ?? "Untitled"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.source_name ?? "source"}
            </p>
          </li>
        ))}
      </ul>
    );
  }

  if (result.kind === "sentiment") {
    const total = result.data.sentiment?.total;
    if (result.data.error || !total) {
      return (
        <p className="text-sm text-muted-foreground">
          {result.data.error ?? "No sentiment data."}
        </p>
      );
    }
    return (
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div>
          <p className={overviewKickerClass}>Score</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums sm:text-xl">
            {total["Sentiment Score"] ?? "—"}
          </p>
        </div>
        <div>
          <p className={overviewKickerClass}>Positive</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums sm:text-xl">
            {total["Total Positive"] ?? "—"}
          </p>
        </div>
        <div>
          <p className={overviewKickerClass}>Negative</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums sm:text-xl">
            {total["Total Negative"] ?? "—"}
          </p>
        </div>
      </div>
    );
  }

  const signal = result.data.signal;
  if (result.data.error || !signal) {
    return (
      <p className="text-sm text-muted-foreground">
        {result.data.error ?? "No signal."}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {signal.recommendation ? (
        <p className="text-base font-medium tracking-tight sm:text-lg">
          {String(signal.recommendation)}
        </p>
      ) : null}
      {signal.summary ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {String(signal.summary)}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground/80">Analysis only — not advice.</p>
    </div>
  );
}

export default function SpendPage() {
  const { syraAuthenticated } = useSyraAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SpendToolCategory | "All">("All");
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [activePreview, setActivePreview] = useState<PreviewKind | null>(null);

  const toolsQ = useQuery({
    queryKey: ["spend", "tools"],
    queryFn: fetchSpendTools,
    staleTime: 120_000,
  });

  const kpiQ = useQuery({
    queryKey: ["spend", "kpi"],
    queryFn: fetchAnalyticsKpi,
    staleTime: 120_000,
    retry: 1,
  });

  const previewMutation = useMutation({
    mutationFn: async (kind: PreviewKind) => {
      if (kind === "news") {
        const data = await fetchPreviewNews("BTC");
        return { kind: "news" as const, data };
      }
      if (kind === "sentiment") {
        const data = await fetchPreviewSentiment("general");
        return { kind: "sentiment" as const, data };
      }
      const data = await fetchPreviewSignal("solana");
      return { kind: "signal" as const, data };
    },
    onSuccess: (result) => setPreviewResult(result),
  });

  function runPreview(kind: PreviewKind) {
    setActivePreview(kind);
    previewMutation.mutate(kind);
  }

  function clearFilters() {
    setQuery("");
    setCategory("All");
  }

  const tools = toolsQ.data?.tools ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t: SpendTool) => {
      const cat = categorizeSpendTool(t);
      if (category !== "All" && cat !== category) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [tools, query, category]);

  const hasActiveFilters = query.trim().length > 0 || category !== "All";

  const initialLoading =
    (toolsQ.isLoading && !toolsQ.data) || (kpiQ.isLoading && !kpiQ.data);
  const showSkeleton = useMinimumSkeleton(initialLoading);
  const showPreviewSkeleton = useMinimumSkeleton(previewMutation.isPending);

  return (
    <PillarLayout
      embedded
      title="Spend"
      tagline="Pay per call"
      description="Browse free. Taste live data. Pay in USDC when you connect."
      actions={
        <Button variant="outline" size="sm" className="h-9 w-full rounded-full px-4 sm:w-auto" asChild>
          <Link to="/marketplace">Marketplace</Link>
        </Button>
      }
    >
      {showSkeleton ? (
        <SpendPageSkeleton />
      ) : (
        <div className="w-full space-y-6 sm:space-y-8">
          {!syraAuthenticated ? (
            <PillarConnectCTA
              title="Connect to pay from your agent wallet"
              description="Catalog is free. Fund USDC to run full tools."
            />
          ) : (
            <PillarConnectCTA
              title="Fund your spend wallet to run paid tools"
              description="Browse freely. Fund USDC when you're ready to settle calls."
              fundHref="/wallet"
              fundLabel="Fund wallet"
            />
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <OverviewStatCard
              compact
              label="Settled"
              value={formatCount(kpiQ.data?.totalPaidApiCalls ?? 0)}
              hint="Paid API calls all time"
              icon={Activity}
              accent="marketplace"
              error={kpiQ.isError}
            />
            <OverviewStatCard
              compact
              label="7 days"
              value={formatCount(kpiQ.data?.paidApiCallsLast7Days ?? 0)}
              hint="Recent settled volume"
              icon={Sparkles}
              accent="neutral"
              error={kpiQ.isError}
            />
            <OverviewStatCard
              compact
              label="Tools"
              value={formatCount(tools.length)}
              hint="x402 catalog endpoints"
              icon={Wrench}
              accent="alpha"
              href="/marketplace"
              error={toolsQ.isError}
            />
          </div>

          <div className="grid w-full gap-6 lg:grid-cols-12 lg:gap-8">
            <section className="min-w-0 lg:col-span-8">
              <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-medium tracking-tight text-foreground sm:text-lg">
                    Catalog
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {filtered.length === tools.length
                      ? `${tools.length} tools · pay per call`
                      : `${filtered.length} of ${tools.length} tools`}
                  </p>
                </div>
                <div className="relative w-full sm:w-64 lg:w-72">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tools"
                    className="h-10 w-full rounded-full border-border/40 bg-muted/20 pl-9 text-sm sm:h-9"
                  />
                </div>
              </div>

              <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors duration-200",
                      category === c
                        ? "border-foreground/10 bg-foreground text-background shadow-sm"
                        : "border-border/40 bg-muted/30 text-muted-foreground hover:border-border/60 hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {toolsQ.isError ? (
                <div
                  className={cn(
                    overviewCardShell,
                    "flex flex-col items-center justify-center px-6 py-14 text-center",
                  )}
                >
                  <p className="text-sm font-medium tracking-tight text-foreground">
                    Could not load catalog
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Check your connection and try again.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 h-9 rounded-full px-4"
                    onClick={() => void toolsQ.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className={cn(
                    overviewCardShell,
                    "flex flex-col items-center justify-center px-6 py-14 text-center",
                  )}
                >
                  <p className="text-sm font-medium tracking-tight text-foreground">
                    No matching tools
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Try a different search or category.
                  </p>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 h-9 rounded-full px-4"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {filtered.map((tool, index) => (
                    <SpendToolCard key={tool.id} tool={tool} staggerIndex={index} />
                  ))}
                </ul>
              )}
            </section>

            <aside className="flex min-w-0 flex-col gap-6 lg:col-span-4">
              <section className={cn(overviewCardShell, "relative overflow-hidden")}>
                <div
                  className={overviewCardGlow}
                  style={{ background: overviewAccentBackground("marketplace") }}
                  aria-hidden
                />
                <div className="relative z-[1] p-4 sm:p-6">
                  <p className={overviewKickerClass}>Try free</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Live previews — no payment required.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(["news", "sentiment", "signal"] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        disabled={previewMutation.isPending}
                        onClick={() => runPreview(kind)}
                        className={cn(
                          "h-9 min-w-[4.5rem] flex-1 rounded-full border px-3 text-sm capitalize transition-colors duration-200 sm:flex-none sm:px-4",
                          activePreview === kind
                            ? "border-foreground/10 bg-foreground text-background shadow-sm"
                            : "border-border/40 bg-muted/30 text-muted-foreground hover:border-border/60 hover:bg-muted/50 hover:text-foreground",
                          previewMutation.isPending && "opacity-60",
                        )}
                      >
                        {kind}
                      </button>
                    ))}
                  </div>
                  <div className={cn(overviewChartPanelShell, "mt-5 min-h-[6.5rem] p-3.5 sm:p-4")}>
                    {showPreviewSkeleton ? (
                      <SpendPreviewSkeleton />
                    ) : previewMutation.isError ? (
                      <p className="text-sm text-muted-foreground">Preview unavailable.</p>
                    ) : previewResult ? (
                      <PreviewOutput result={previewResult} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Pick a preview above to taste live data.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {syraAuthenticated ? <AgentBillingDashboard compact /> : null}
            </aside>
          </div>
        </div>
      )}
    </PillarLayout>
  );
}
