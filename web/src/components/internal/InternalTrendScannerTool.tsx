"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Loader2, Radar, Sparkles, Trash2, TrendingUp } from "lucide-react";
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
  deleteTrendScanPost,
  fetchRecentTrendScanPosts,
  generateTrendPost,
  scanNarrativeTrends,
  type TrendScanItem,
  type TrendScanPost,
  type TrendScannerWoeidId,
} from "@/lib/internalToolsApi";

const WOEID_OPTIONS: Array<{ id: TrendScannerWoeidId; label: string }> = [
  { id: "worldwide", label: "Worldwide" },
  { id: "usa", label: "USA" },
  { id: "uk", label: "UK" },
];

const FIT_COLORS: Record<string, string> = {
  high: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  medium: "text-[#F3BA2F] border-[#F3BA2F]/30 bg-[#F3BA2F]/10",
  low: "text-muted-foreground border-border/50 bg-muted/20",
};

interface InternalTrendScannerToolProps {
  wallet?: string | null;
}

export function InternalTrendScannerTool({ wallet }: InternalTrendScannerToolProps) {
  const queryClient = useQueryClient();
  const [woeid, setWoeid] = useState<TrendScannerWoeidId>("worldwide");
  const [trends, setTrends] = useState<TrendScanItem[]>([]);
  const [activeTrend, setActiveTrend] = useState<TrendScanItem | null>(null);
  const [activePost, setActivePost] = useState<TrendScanPost | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const recentQ = useQuery({
    queryKey: ["internal-tools", "trend-scanner-recent"],
    queryFn: () => fetchRecentTrendScanPosts(15),
    staleTime: 30_000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "trend-scanner-recent"] });
  }, [queryClient]);

  const scanM = useMutation({
    mutationFn: () => scanNarrativeTrends(woeid),
    onSuccess: (res) => {
      setTrends(res.data.trends);
      setActiveTrend(res.data.trends[0] ?? null);
      setActivePost(null);
      toast.success(`Scanned ${res.data.trends.length} trends`);
    },
    onError: (err: Error) => toast.error(err.message || "Scan failed"),
  });

  const generateM = useMutation({
    mutationFn: (t: TrendScanItem) =>
      generateTrendPost(t.name, t.angle, t.relevanceScore, wallet),
    onSuccess: (res) => {
      setActivePost(res.data);
      setCopied(false);
      invalidate();
      toast.success("Trend post ready");
    },
    onError: (err: Error) => toast.error(err.message || "Generate failed"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteTrendScanPost(id),
    onSuccess: (_res, id) => {
      setDeleteOpen(false);
      setActivePost((p) => (p?.id === id ? null : p));
      invalidate();
      toast.success("Deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });

  const displayPost = activePost ?? recentQ.data?.data[0] ?? null;
  const isBusy = scanM.isPending || generateM.isPending || deleteM.isPending;

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy");
    }
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {WOEID_OPTIONS.map((opt) => (
          <button key={opt.id} type="button" onClick={() => setWoeid(opt.id)} disabled={isBusy} className={cn("rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors", woeid === opt.id ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]" : "border-border/50 text-muted-foreground hover:text-foreground")}>
            {opt.label}
          </button>
        ))}
      </div>

      <Button type="button" className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25" onClick={() => scanM.mutate()} disabled={isBusy}>
        {scanM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
        {scanM.isPending ? "Scanning trends…" : "Scan live trends"}
      </Button>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)]">
        <div className="min-w-0 space-y-4">
          {trends.length > 0 ? (
            <div className="space-y-2">
              {trends.map((t) => (
                <div key={t.name} className={cn("rounded-xl border p-3 transition-colors", activeTrend?.name === t.name ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8" : "border-border/50 bg-muted/15")}>
                  <button type="button" className="w-full text-left" onClick={() => { setActiveTrend(t); setActivePost(null); }}>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase", FIT_COLORS[t.syraFit] ?? FIT_COLORS.low)}>{t.syraFit} fit · {t.relevanceScore}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">{t.angle}</p>
                  </button>
                  <Button type="button" size="sm" className="mt-2 rounded-lg border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-xs text-[#F3BA2F]" onClick={() => { setActiveTrend(t); generateM.mutate(t); }} disabled={isBusy}>
                    {generateM.isPending && activeTrend?.name === t.name ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                    Draft post
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Scan X trends and rank which narratives Syra should ride with on-brand posts.</p>
          )}

          {displayPost ? (
            <div className="space-y-3 border-t border-border/40 pt-4">
              <pre className="post-share-modal-body text-[13px] leading-relaxed">{displayPost.text}</pre>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F]" onClick={() => void handleCopy(displayPost.text)}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied" : "Copy post"}
                </Button>
                <Button type="button" variant="outline" className="rounded-xl border-border/60" asChild>
                  <a href={buildTweetOnXUrl(displayPost.text)} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Open on X</a>
                </Button>
                <Button type="button" variant="outline" className="rounded-xl border-border/60" onClick={() => setDeleteOpen(true)} disabled={isBusy}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
              </div>
            </div>
          ) : null}
        </div>

        {recentQ.data?.data && recentQ.data.data.length > 0 ? (
          <aside className="min-w-0 lg:sticky lg:top-0">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80"><Radar className="h-3 w-3" />Recent</p>
            <div className="grid gap-2 overflow-y-auto">
              {recentQ.data.data.slice(0, 8).map((item) => (
                <button key={item.id} type="button" onClick={() => { setActivePost(item); setCopied(false); }} className={cn("rounded-xl border px-3 py-2 text-left text-xs", activePost?.id === item.id ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8" : "border-border/50 bg-muted/20")}>
                  <span className="line-clamp-2">{item.text}</span>
                  <span className="mt-1 block font-mono text-[9px] text-muted-foreground">{item.trendText}</span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-border/60 bg-background sm:max-w-md">
          <AlertDialogHeader><AlertDialogTitle>Delete this post?</AlertDialogTitle><AlertDialogDescription>Removes from saved library.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={deleteM.isPending || !displayPost} onClick={() => displayPost && deleteM.mutate(displayPost.id)}>Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
