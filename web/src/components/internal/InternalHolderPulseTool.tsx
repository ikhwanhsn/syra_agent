"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Coins, Copy, ExternalLink, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  buildTweetOnXUrl,
  deleteHolderPulsePost,
  fetchHolderPulseSnapshot,
  fetchRecentHolderPulsePosts,
  generateHolderPulsePost,
  type HolderPulseAngleId,
  type HolderPulsePost,
} from "@/lib/internalToolsApi";

const ANGLE_OPTIONS: Array<{ id: HolderPulseAngleId | "auto"; label: string }> = [
  { id: "auto", label: "Auto angle" },
  { id: "holder-growth", label: "Holder growth" },
  { id: "staking", label: "Staking" },
  { id: "concentration", label: "Concentration" },
  { id: "price-momentum", label: "Price momentum" },
  { id: "liquidity", label: "Liquidity" },
];

function fmtNum(n: number | null | undefined, prefix = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(n < 1 ? 6 : 2)}`;
}

interface InternalHolderPulseToolProps {
  wallet?: string | null;
}

export function InternalHolderPulseTool({ wallet }: InternalHolderPulseToolProps) {
  const queryClient = useQueryClient();
  const [angle, setAngle] = useState<HolderPulseAngleId | "auto">("auto");
  const [activeItem, setActiveItem] = useState<HolderPulsePost | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const snapshotQ = useQuery({
    queryKey: ["internal-tools", "holder-pulse-snapshot"],
    queryFn: fetchHolderPulseSnapshot,
    staleTime: 120_000,
  });

  const recentQ = useQuery({
    queryKey: ["internal-tools", "holder-pulse-recent"],
    queryFn: () => fetchRecentHolderPulsePosts(15),
    staleTime: 30_000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "holder-pulse-recent"] });
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "holder-pulse-snapshot"] });
  }, [queryClient]);

  const generateM = useMutation({
    mutationFn: () => generateHolderPulsePost(wallet, angle === "auto" ? null : angle),
    onSuccess: (res) => {
      setActiveItem(res.data);
      setCopied(false);
      invalidate();
      toast.success("Onchain proof post ready");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to generate"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteHolderPulsePost(id),
    onSuccess: (_res, id) => {
      setDeleteOpen(false);
      setActiveItem((p) => (p?.id === id ? null : p));
      invalidate();
      toast.success("Deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });

  const display = activeItem ?? recentQ.data?.data[0] ?? null;
  const snap = snapshotQ.data?.data;

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied — post from @syra_agent");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy");
    }
  }, []);

  const isBusy = generateM.isPending || deleteM.isPending;

  return (
    <div className="space-y-5">
      {snap ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Price", value: fmtNum(snap.price?.priceUsd, "$") },
            { label: "24h vol", value: fmtNum(snap.price?.volume24h, "$") },
            { label: "Liquidity", value: fmtNum(snap.price?.liquidityUsd, "$") },
            { label: "Mcap", value: fmtNum(snap.marketCapUsd, "$") },
            { label: "Top10 %", value: snap.holders?.top10ConcentrationPct != null ? `${snap.holders.top10ConcentrationPct.toFixed(1)}%` : "—" },
            { label: "Stakers", value: String(snap.staking?.uniqueWallets ?? "—") },
            { label: "Staked", value: snap.staking?.totalStakedFormatted ?? "—" },
            { label: "Supply", value: fmtNum(snap.holders?.supplyHuman) },
          ].map((chip) => (
            <div key={chip.label} className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{chip.label}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{chip.value}</p>
            </div>
          ))}
        </div>
      ) : snapshotQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading onchain snapshot…</p>
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
        {generateM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coins className="mr-2 h-4 w-4" />}
        {generateM.isPending ? "Generating…" : "Generate onchain post"}
      </Button>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)]">
        <div className="min-w-0 space-y-3">
          {display ? (
            <>
              <span className="rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]">
                {display.angle.replace(/-/g, " ") || "auto"}
              </span>
              <pre className="post-share-modal-body max-h-[min(36vh,14rem)] text-[13px] leading-relaxed">{display.text}</pre>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25" onClick={() => void handleCopy(display.text)}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied" : "Copy post"}
                </Button>
                <Button type="button" variant="outline" className="rounded-xl border-border/60" asChild>
                  <a href={buildTweetOnXUrl(display.text)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />Open on X
                  </a>
                </Button>
                <Button type="button" variant="outline" className="rounded-xl border-border/60" onClick={() => setDeleteOpen(true)} disabled={isBusy}>
                  <Trash2 className="mr-2 h-4 w-4" />Delete
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Real $SYRA holder, staking, and market data → hype posts for the brand account.</p>
          )}
        </div>

        {recentQ.data?.data && recentQ.data.data.length > 0 ? (
          <aside className="min-w-0 lg:sticky lg:top-0">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">Recent · {recentQ.data.total}</p>
            <div className="grid max-h-[min(52dvh,28rem)] gap-2 overflow-y-auto">
              {recentQ.data.data.slice(0, 10).map((item) => (
                <button key={item.id} type="button" onClick={() => { setActiveItem(item); setCopied(false); }} className={cn("rounded-xl border px-3 py-2.5 text-left transition-colors", activeItem?.id === item.id ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8" : "border-border/50 bg-muted/20 hover:bg-muted/35")}>
                  <span className="line-clamp-2 text-xs leading-relaxed">{item.text}</span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-border/60 bg-background sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>Removes from your saved library.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={deleteM.isPending || !display} onClick={() => display && deleteM.mutate(display.id)}>
              {deleteM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
