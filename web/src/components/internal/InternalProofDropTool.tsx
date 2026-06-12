"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Check, Copy, ImageIcon, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buildMetricShareSectionBundle } from "@/components/info/metricsShare/buildMetricSharePayloads";
import { MetricsShareModal } from "@/components/info/metricsShare/MetricsShareModal";
import type { MetricShareSectionBundle } from "@/components/info/metricsShare/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchInternalAnalyticsBundle } from "@/lib/internalAnalyticsApi";
import {
  deleteProofDrop,
  fetchProofDropMetricsPreview,
  fetchRecentProofDrops,
  generateProofDrop,
  type ProofDropAngleId,
  type ProofDropItem,
} from "@/lib/internalToolsApi";

const ANGLE_OPTIONS: Array<{ id: ProofDropAngleId | "auto"; label: string }> = [
  { id: "auto", label: "Auto angle" },
  { id: "headline", label: "Headline KPIs" },
  { id: "growth", label: "30d growth" },
  { id: "monetization", label: "Monetization" },
  { id: "engagement", label: "Engagement" },
  { id: "playground", label: "Playground" },
];

function formatAngle(angle: string): string {
  return angle.replace(/-/g, " ") || "auto";
}

interface InternalProofDropToolProps {
  wallet?: string | null;
}

export function InternalProofDropTool({ wallet }: InternalProofDropToolProps) {
  const queryClient = useQueryClient();
  const [angle, setAngle] = useState<ProofDropAngleId | "auto">("auto");
  const [activeItem, setActiveItem] = useState<ProofDropItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareBundle, setShareBundle] = useState<MetricShareSectionBundle | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  const metricsPreviewQ = useQuery({
    queryKey: ["internal-tools", "proof-drop-metrics-preview"],
    queryFn: fetchProofDropMetricsPreview,
    staleTime: 60_000,
  });

  const recentQ = useQuery({
    queryKey: ["internal-tools", "proof-drop-recent"],
    queryFn: () => fetchRecentProofDrops(15),
    staleTime: 30_000,
  });

  const invalidateRecent = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "proof-drop-recent"] });
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "proof-drop-metrics-preview"] });
  }, [queryClient]);

  const generateM = useMutation({
    mutationFn: () => generateProofDrop(wallet, angle === "auto" ? null : angle),
    onSuccess: (res) => {
      setActiveItem(res.data);
      setCopied(false);
      invalidateRecent();
      toast.success("Proof drop generated with live metrics");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to generate proof drop"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteProofDrop(id),
    onSuccess: (_res, deletedId) => {
      setDeleteOpen(false);
      setActiveItem((prev) => (prev?.id === deletedId ? null : prev));
      invalidateRecent();
      toast.success("Proof drop deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });

  const displayItem = activeItem ?? recentQ.data?.data[0] ?? null;
  const liveMetrics = metricsPreviewQ.data?.data;

  const metricChips = useMemo(() => {
    const m = displayItem?.metricsSnapshot ?? liveMetrics;
    if (!m) return [];
    return [
      { label: "Paid calls", value: m.totalPaidApiCalls.toLocaleString() },
      { label: "7d paid", value: m.paidApiCallsLast7Days.toLocaleString() },
      { label: "30d growth", value: m.paidGrowth30dLabel },
      { label: "Users", value: m.uniqueUsersTotal.toLocaleString() },
      { label: "Conversion", value: m.paidConversionLabel },
    ];
  }, [displayItem?.metricsSnapshot, liveMetrics]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied — pair with proof image on X");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, []);

  const openShareImage = useCallback(async () => {
    if (!displayItem) return;
    setShareLoading(true);
    try {
      const { kpi, extended } = await fetchInternalAnalyticsBundle();
      const bundle = buildMetricShareSectionBundle(displayItem.shareSectionId, kpi, extended);
      if (!bundle) {
        toast.error("Could not build metrics share image");
        return;
      }
      setShareBundle(bundle);
    } catch {
      toast.error("Failed to load metrics for share image");
    } finally {
      setShareLoading(false);
    }
  }, [displayItem]);

  const isBusy = generateM.isPending || deleteM.isPending || shareLoading;

  return (
    <div className="space-y-5">
      {metricChips.length > 0 ? (
        <div className="rounded-xl border border-border/50 bg-muted/15 px-3 py-3 sm:px-4">
          <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
            <BarChart3 className="h-3 w-3" aria-hidden />
            Live metrics · used in copy
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {metricChips.map((chip) => (
              <span
                key={chip.label}
                className="rounded-full border border-border/50 bg-background/50 px-2.5 py-1 text-[11px] text-foreground/85"
              >
                <span className="text-muted-foreground">{chip.label}:</span> {chip.value}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {ANGLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setAngle(opt.id)}
            disabled={isBusy}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
              angle === opt.id
                ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]"
                : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
        onClick={() => generateM.mutate()}
        disabled={isBusy}
      >
        {generateM.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" aria-hidden />
        )}
        {generateM.isPending ? "Generating…" : "Generate proof drop"}
      </Button>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)] lg:items-start">
        <div className="min-w-0 space-y-3">
          {displayItem ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]">
                  {formatAngle(displayItem.angle)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Image section: {displayItem.shareSectionId}
                </span>
                {displayItem.createdAt ? (
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(displayItem.createdAt).toLocaleString()}
                  </span>
                ) : null}
              </div>

              <pre className="post-share-modal-body max-h-[min(36vh,14rem)] text-[13px] leading-relaxed">
                {displayItem.text}
              </pre>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
                  onClick={() => void handleCopy(displayItem.text)}
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" aria-hidden />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  {copied ? "Copied" : "Copy post text"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-border/60"
                  onClick={() => void openShareImage()}
                  disabled={isBusy}
                >
                  {shareLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <ImageIcon className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  Export proof image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isBusy}
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              One click pulls live KPIs and writes a hype post with real numbers — then export a matching metrics
              image.
            </p>
          )}
        </div>

        {recentQ.data?.data && recentQ.data.data.length > 0 ? (
          <aside className="min-w-0 lg:sticky lg:top-0">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
              Recent · {recentQ.data.total}
            </p>
            <div className="grid max-h-[min(52dvh,28rem)] gap-2 overflow-y-auto pr-0.5">
              {recentQ.data.data.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveItem(item);
                    setCopied(false);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    activeItem?.id === item.id
                      ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8"
                      : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/35",
                  )}
                >
                  <span className="line-clamp-2 text-xs leading-relaxed text-foreground/85">{item.text}</span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {formatAngle(item.angle)}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <MetricsShareModal bundle={shareBundle} onClose={() => setShareBundle(null)} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-border/60 bg-background sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this proof drop?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes the saved caption. Metrics stay live — you can regenerate anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteM.isPending || !displayItem}
              onClick={() => displayItem && deleteM.mutate(displayItem.id)}
            >
              {deleteM.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              )}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
