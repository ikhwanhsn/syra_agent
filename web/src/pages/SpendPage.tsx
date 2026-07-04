import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Link } from "@/lib/navigation";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { PillarConnectCTA } from "@/components/pillars/PillarConnectCTA";
import {
  SpendPageSkeleton,
  SpendPreviewSkeleton,
} from "@/components/pillars/PillarPageSkeletons";
import { AgentBillingDashboard } from "@/components/wallet/AgentBillingDashboard";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
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

function formatPrice(usd: number): string {
  if (!Number.isFinite(usd)) return "—";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

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
      <div className="grid grid-cols-3 gap-3 sm:gap-6">
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
          <Link to="/playground">Playground</Link>
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
          ) : null}

          <div className="grid grid-cols-3 gap-3 sm:gap-8">
            <div className="min-w-0">
              <p className={overviewKickerClass}>Settled</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight sm:text-2xl lg:text-3xl">
                {formatCount(kpiQ.data?.totalPaidApiCalls ?? 0)}
              </p>
            </div>
            <div className="min-w-0">
              <p className={overviewKickerClass}>7 days</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight sm:text-2xl lg:text-3xl">
                {formatCount(kpiQ.data?.paidApiCallsLast7Days ?? 0)}
              </p>
            </div>
            <div className="min-w-0">
              <p className={overviewKickerClass}>Tools</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight sm:text-2xl lg:text-3xl">
                {tools.length}
              </p>
            </div>
          </div>

          <div className="grid w-full gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="flex min-w-0 flex-col gap-6 lg:col-span-4">
              <section className={cn(overviewCardShell, "p-4 sm:p-6")}>
                <p className={overviewKickerClass}>Try free</p>
                <p className="mt-1 text-sm text-muted-foreground">
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
                        "h-9 min-w-[4.5rem] flex-1 rounded-full px-3 text-sm capitalize transition-colors sm:flex-none sm:px-4",
                        activePreview === kind
                          ? "bg-foreground text-background"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      {kind}
                    </button>
                  ))}
                </div>
                <div className="mt-5 min-h-[5rem]">
                  {showPreviewSkeleton ? (
                    <SpendPreviewSkeleton />
                  ) : previewMutation.isError ? (
                    <p className="text-sm text-muted-foreground">Preview unavailable.</p>
                  ) : previewResult ? (
                    <PreviewOutput result={previewResult} />
                  ) : (
                    <p className="text-sm text-muted-foreground">Pick a preview above.</p>
                  )}
                </div>
              </section>

              {syraAuthenticated ? <AgentBillingDashboard compact /> : null}
            </div>

            <section className="min-w-0 lg:col-span-8">
              <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">Catalog</h2>
                <div className="relative w-full sm:w-64 lg:w-72">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    className="h-10 w-full rounded-full border-border/40 bg-muted/20 pl-9 text-sm sm:h-9"
                  />
                </div>
              </div>

              <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "h-8 shrink-0 rounded-full px-3 text-xs transition-colors",
                      category === c
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {toolsQ.isError ? (
                <p className="text-sm text-muted-foreground">Could not load catalog.</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches.</p>
              ) : (
                <ul
                  className={cn(
                    overviewCardShell,
                    "max-h-[min(28rem,60vh)] divide-y divide-border/40 overflow-y-auto sm:max-h-[min(32rem,65vh)] lg:max-h-[min(36rem,70vh)]",
                  )}
                >
                  {filtered.map((tool) => (
                    <li
                      key={tool.id}
                      className="flex items-start gap-3 px-4 py-3.5 sm:items-center sm:gap-4 sm:px-5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium tracking-tight">{tool.name}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:line-clamp-1">
                          {tool.description}
                        </p>
                      </div>
                      <span className="shrink-0 pt-0.5 font-mono text-sm tabular-nums text-muted-foreground sm:pt-0">
                        {formatPrice(tool.priceUsd)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </PillarLayout>
  );
}
