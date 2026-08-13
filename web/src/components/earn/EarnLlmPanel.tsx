import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Copy, Plus, Search, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { LlmCard } from "@/components/earn/LlmCard";
import { LlmForm } from "@/components/earn/LlmForm";
import { EarnCardGridSkeleton } from "@/components/earn/EarnSkeleton";
import { playgroundTabPanelEnter } from "@/components/playground/playgroundMotion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { baseAnonymousIdFrom } from "@/lib/agentWalletPurpose";
import {
  claimLlmPayout,
  fetchLlmEarnings,
  fetchLlmMarketplace,
  fetchMyLlmProviders,
  llmRoutePlaygroundSnippet,
  type LlmProviderRecord,
} from "@/lib/earnLlmApi";
import { getApiBaseUrl } from "@/lib/env";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

type EarnLlmPanelProps = {
  anonymousId: string | null;
  llmQueryKey: readonly unknown[];
  connected: boolean;
  syraAuthenticated: boolean;
  syraAuthReady: boolean;
  onSignIn: () => void;
  onRequestAuth: () => Promise<boolean>;
  onLlmChanged: () => void;
};

function isOwnedBy(provider: LlmProviderRecord, anonymousId: string | null): boolean {
  if (!anonymousId) return false;
  return provider.creatorAnonymousId === baseAnonymousIdFrom(anonymousId);
}

export function EarnLlmPanel({
  anonymousId,
  llmQueryKey,
  connected,
  syraAuthenticated,
  syraAuthReady,
  onRequestAuth,
  onLlmChanged,
}: EarnLlmPanelProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [policy, setPolicy] = useState("cheapest");
  const [snippet, setSnippet] = useState(() =>
    llmRoutePlaygroundSnippet({ policy: "cheapest", apiBase: getApiBaseUrl() }),
  );

  const publishedQueryKey = ["earn", "llm", "marketplace"] as const;
  const earningsQueryKey = ["earn", "llm", "earnings", anonymousId] as const;

  const publishedQ = useQuery({
    queryKey: publishedQueryKey,
    queryFn: () => fetchLlmMarketplace({ limit: 100 }),
    staleTime: 30_000,
  });

  const mineQ = useQuery({
    queryKey: llmQueryKey,
    queryFn: fetchMyLlmProviders,
    enabled: connected && syraAuthReady && syraAuthenticated,
    staleTime: 30_000,
  });

  const earningsQ = useQuery({
    queryKey: earningsQueryKey,
    queryFn: fetchLlmEarnings,
    enabled: connected && syraAuthReady && syraAuthenticated,
    staleTime: 30_000,
  });

  const claimM = useMutation({
    mutationFn: () => claimLlmPayout(),
    onSuccess: (result) => {
      if (!result.success) {
        notify.error("Claim failed", result.error || "No claimable earnings");
        return;
      }
      notify.success(
        "Payout queued",
        `Claimed $${(result.claimedUsd ?? 0).toFixed(4)} across ${result.count ?? 0} calls`,
      );
      void queryClient.invalidateQueries({ queryKey: earningsQueryKey });
      onLlmChanged();
    },
    onError: (e: Error) => notify.error("Claim failed", e.message),
  });

  const handleCreate = async () => {
    if (!connected) {
      notify.error("Connect wallet", "Connect a wallet to list an LLM.");
      return;
    }
    if (!syraAuthenticated) {
      const ok = await onRequestAuth();
      if (!ok) return;
    }
    setCreateOpen(true);
  };

  const showSkeleton = useMinimumSkeleton(publishedQ.isLoading);
  const published = publishedQ.data ?? [];
  const mine = mineQ.data ?? [];

  const catalog = useMemo(() => {
    const byId = new Map<string, LlmProviderRecord>();
    for (const s of published) byId.set(s.id, s);
    for (const s of mine) byId.set(s.id, s);
    return [...byId.values()];
  }, [published, mine]);

  const q = search.trim().toLowerCase();
  const visible = catalog.filter((s) => {
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      s.models.some(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.displayName.toLowerCase().includes(q),
      )
    );
  });

  const queryKeys = [publishedQueryKey, llmQueryKey, earningsQueryKey] as const;
  const earnings = earningsQ.data;

  const refreshSnippet = (nextPolicy: string, model?: string) => {
    setPolicy(nextPolicy);
    setSnippet(
      llmRoutePlaygroundSnippet({
        policy: nextPolicy,
        model,
        apiBase: getApiBaseUrl(),
      }),
    );
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      notify.success("Copied", "Playground snippet copied to clipboard");
    } catch {
      notify.error("Copy failed", "Could not copy snippet");
    }
  };

  return (
    <section className={cn("space-y-8", playgroundTabPanelEnter)}>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-xl">
          <h2 className="font-display text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[2rem]">
            LLM Exchange
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            List Claude, Gemini, DeepSeek, or any OpenAI-compatible endpoint, set your price, and earn USDC when agents
            call POST /llm/route. Syra keeps ~20% for $SYRA buyback and routes by cheapest
            or most callable.
          </p>
        </div>
        <Button
          className="h-11 shrink-0 gap-2 rounded-full px-5 text-[13px] font-medium shadow-sm"
          onClick={() => void handleCreate()}
        >
          <Plus className="h-4 w-4" />
          List LLM
        </Button>
      </header>

      {connected && syraAuthenticated ? (
        <div className="grid gap-3 rounded-[1.35rem] border border-border/40 bg-card/40 p-4 sm:grid-cols-3 sm:p-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
              Pending
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
              ${(earnings?.pendingUsd ?? 0).toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
              Claimed
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
              ${(earnings?.paidUsd ?? 0).toFixed(4)}
            </p>
          </div>
          <div className="flex items-end">
            <Button
              className="h-10 w-full gap-2 rounded-full sm:w-auto"
              variant="secondary"
              disabled={claimM.isPending || (earnings?.pendingUsd ?? 0) < 0.01}
              onClick={() => claimM.mutate()}
            >
              <Wallet className="h-4 w-4 opacity-70" />
              {claimM.isPending ? "Claiming…" : "Claim payout"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-[1.35rem] border border-border/40 bg-muted/10 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            <Bot className="h-4 w-4 text-muted-foreground" aria-hidden />
            Agent playground
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={policy} onValueChange={(v) => refreshSnippet(v)}>
              <SelectTrigger className="h-9 w-[140px] rounded-full border-border/40 bg-background/80 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cheapest">Cheapest</SelectItem>
                <SelectItem value="reliable">Reliable</SelectItem>
                <SelectItem value="fastest">Fastest</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 gap-1.5 rounded-full px-3"
              onClick={() => void copySnippet()}
            >
              <Copy className="h-3.5 w-3.5 opacity-60" />
              Copy
            </Button>
          </div>
        </div>
        <pre className="overflow-x-auto rounded-xl border border-border/30 bg-background/70 p-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
          {snippet}
        </pre>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models or providers"
            className={cn(
              "h-11 rounded-full border-border/40 bg-muted/20 pl-10 pr-4 shadow-none",
              "placeholder:text-muted-foreground/50",
              "focus-visible:border-border/60 focus-visible:bg-background/80 focus-visible:ring-1 focus-visible:ring-foreground/10",
            )}
            aria-label="Search LLM marketplace"
          />
        </div>
      </div>

      {showSkeleton ? (
        <EarnCardGridSkeleton count={6} heightClass="h-[17rem]" />
      ) : publishedQ.isError ? (
        <div className="rounded-[1.35rem] border border-border/40 bg-card/40 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Could not load the LLM marketplace. Try again shortly.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[1.35rem] border border-dashed border-border/50 bg-muted/10 px-6 py-14 text-center">
          <Bot className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden />
          <p className="mt-4 text-[15px] font-medium text-foreground">No LLMs listed yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first seller. Agents still route to Syra OpenRouter as fallback.
          </p>
          <Button className="mt-5 rounded-full" onClick={() => void handleCreate()}>
            List LLM
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((provider, i) => (
            <LlmCard
              key={provider.id}
              provider={provider}
              isOwner={isOwnedBy(provider, anonymousId)}
              queryKeys={queryKeys}
              staggerIndex={i}
              onCopySnippet={(p) => {
                const next = llmRoutePlaygroundSnippet({
                  policy,
                  model: p.models[0]?.id,
                  apiBase: getApiBaseUrl(),
                });
                setSnippet(next);
                void navigator.clipboard.writeText(next).catch(() => {});
              }}
            />
          ))}
        </ul>
      )}

      <LlmForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          onLlmChanged();
          void queryClient.invalidateQueries({ queryKey: publishedQueryKey });
          void queryClient.invalidateQueries({ queryKey: llmQueryKey });
        }}
      />
    </section>
  );
}
