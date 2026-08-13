import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Copy,
  Loader2,
  Pause,
  Play,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { playgroundStaggerStyle } from "@/components/playground/playgroundMotion";
import {
  activateLlmProvider,
  deleteLlmProvider,
  llmProtocolLabel,
  pauseLlmProvider,
  type LlmProviderRecord,
} from "@/lib/earnLlmApi";
import { cn } from "@/lib/utils";

function formatCalls(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function formatPriceHint(provider: LlmProviderRecord): string {
  if (provider.pricing.mode === "flat") {
    const usd = provider.callerPriceHintUsd ?? provider.pricing.flatUsdPerCall;
    return `$${usd.toFixed(usd >= 0.01 ? 3 : 4)} / call`;
  }
  const inR = provider.pricing.inputUsdPer1M;
  const outR = provider.pricing.outputUsdPer1M;
  return `$${inR}/${outR} per 1M`;
}

function statusLabel(status: LlmProviderRecord["status"]): string {
  switch (status) {
    case "active":
      return "Live";
    case "paused":
      return "Paused";
    case "delisted":
      return "Delisted";
    default:
      return "Draft";
  }
}

type LlmCardProps = {
  provider: LlmProviderRecord;
  isOwner: boolean;
  queryKeys: readonly (readonly unknown[])[];
  staggerIndex?: number;
  onCopySnippet?: (provider: LlmProviderRecord) => void;
};

export function LlmCard({
  provider,
  isOwner,
  queryKeys,
  staggerIndex = 0,
  onCopySnippet,
}: LlmCardProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const invalidate = () => {
    for (const key of queryKeys) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };

  const activateM = useMutation({
    mutationFn: () => activateLlmProvider(provider.id),
    onSuccess: invalidate,
  });

  const pauseM = useMutation({
    mutationFn: () => pauseLlmProvider(provider.id),
    onSuccess: invalidate,
  });

  const deleteM = useMutation({
    mutationFn: () => deleteLlmProvider(provider.id),
    onSuccess: invalidate,
  });

  const pending = activateM.isPending || pauseM.isPending || deleteM.isPending;
  const callability = Math.round((provider.health.callabilityScore || 0) * 100);
  const modelsPreview = provider.models
    .slice(0, 2)
    .map((m) => m.displayName || m.id)
    .join(", ");

  const handleCopy = async () => {
    if (onCopySnippet) {
      onCopySnippet(provider);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      return;
    }
    try {
      await navigator.clipboard.writeText(
        `POST /llm/route · model=${provider.models[0]?.id || ""} · X-Syra-Provider=${provider.id}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <li
      className={cn(
        "group relative list-none overflow-hidden rounded-[1.35rem]",
        "border border-border/40 bg-card/40",
        "shadow-[0_1px_0_0_hsl(var(--border)/0.35)]",
        "transition-[border-color,box-shadow,transform,background-color] duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-border/70 hover:bg-card/70",
        "hover:shadow-[0_1px_0_0_hsl(var(--border)/0.4),0_24px_48px_-32px_rgba(0,0,0,0.45)]",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
      )}
      style={playgroundStaggerStyle(staggerIndex)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.08] to-transparent"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/30 bg-muted/20 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <Bot className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-[1.05rem] font-semibold leading-snug tracking-tight text-foreground line-clamp-1">
                  {provider.title}
                  {provider.featured ? (
                    <Star
                      className="ml-1.5 inline h-3.5 w-3.5 text-amber-500"
                      aria-label="Featured seller"
                    />
                  ) : null}
                </h3>
                <p className="mt-0.5 text-[13px] font-medium tracking-wide text-muted-foreground line-clamp-1">
                  {modelsPreview || "LLM endpoint"}
                </p>
                <span className="mt-1.5 inline-flex items-center rounded-md border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {llmProtocolLabel(provider.protocol)}
                </span>
              </div>
              <span className="shrink-0 pt-1 text-[11px] tabular-nums text-muted-foreground/80">
                {formatCalls(provider.useCount)} calls
              </span>
            </div>
          </div>
        </div>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {provider.description?.trim() ||
            "Marketplace LLM for Syra smart routing via POST /llm/route."}
        </p>

        <div className="space-y-3">
          <p className="font-mono text-xl font-semibold tracking-tight tabular-nums text-foreground">
            {formatPriceHint(provider)}
          </p>
          <div className="grid grid-cols-3 gap-3 border-t border-border/30 pt-3">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
                Callability
              </p>
              <p className="mt-0.5 text-[13px] font-medium tabular-nums text-foreground/90">
                {callability}%
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
                p50
              </p>
              <p className="mt-0.5 text-[13px] font-medium tabular-nums text-foreground/90">
                {provider.health.p50LatencyMs != null
                  ? `${Math.round(provider.health.p50LatencyMs)}ms`
                  : "-"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
                Status
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-foreground/90">
                {statusLabel(provider.status)}
              </p>
            </div>
          </div>
          {isOwner && provider.totalSellerEarnedUsd != null ? (
            <p className="text-[12px] text-muted-foreground">
              Earned{" "}
              <span className="font-mono tabular-nums text-foreground">
                ${provider.totalSellerEarnedUsd.toFixed(4)}
              </span>
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-9 gap-1.5 rounded-full px-3 text-[13px] text-muted-foreground hover:text-foreground"
            onClick={() => void handleCopy()}
          >
            <Copy className="h-3.5 w-3.5 opacity-60" />
            {copied ? "Copied" : "Try snippet"}
          </Button>

          {isOwner ? (
            <div className="flex items-center gap-1">
              {provider.status === "active" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 gap-1.5 rounded-full px-3 text-[13px]"
                  onClick={() => pauseM.mutate()}
                  disabled={pending}
                >
                  {pauseM.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Pause className="h-3.5 w-3.5 opacity-70" />
                  )}
                  Pause
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-9 gap-1.5 rounded-full px-4 text-[13px] shadow-none"
                  onClick={() => activateM.mutate()}
                  disabled={pending}
                >
                  {activateM.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5 opacity-70" />
                  )}
                  Activate
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => deleteM.mutate()}
                disabled={pending}
                title="Delist LLM"
                aria-label="Delist LLM"
              >
                {deleteM.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
