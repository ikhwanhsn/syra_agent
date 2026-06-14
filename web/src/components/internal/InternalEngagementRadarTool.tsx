"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  Heart,
  Loader2,
  MessageCircle,
  Radar,
  Repeat2,
  Sparkles,
  Trash2,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  buildReplyOnXUrl,
  deleteEngagementReply,
  draftEngagementReply,
  fetchRecentEngagementReplies,
  searchEngagementOpportunities,
  type EngagementOpportunity,
  type EngagementQueryType,
  type EngagementReplyItem,
  type EngagementReplyToneId,
  type EngagementTopicId,
  type EngagementWindowId,
} from "@/lib/internalToolsApi";

const TOPIC_OPTIONS: Array<{ id: EngagementTopicId; label: string }> = [
  { id: "solana", label: "Solana" },
  { id: "ai-agents", label: "AI agents" },
  { id: "x402", label: "x402" },
  { id: "agent-economy", label: "Agent economy" },
  { id: "defi-agents", label: "DeFi agents" },
  { id: "autonomous", label: "Autonomous" },
];

const WINDOW_OPTIONS: Array<{ id: EngagementWindowId; label: string }> = [
  { id: "6h", label: "6h" },
  { id: "12h", label: "12h" },
  { id: "24h", label: "24h" },
  { id: "48h", label: "48h" },
];

const MIN_FAVES_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 10, label: "10+ likes" },
  { value: 25, label: "25+ likes" },
  { value: 50, label: "50+ likes" },
  { value: 100, label: "100+ likes" },
];

const QUERY_TYPE_OPTIONS: Array<{ id: EngagementQueryType; label: string }> = [
  { id: "Latest", label: "Latest" },
  { id: "Top", label: "Top" },
];

const TONE_OPTIONS: Array<{ id: EngagementReplyToneId | "auto"; label: string }> = [
  { id: "auto", label: "Auto tone" },
  { id: "insight", label: "Sharp insight" },
  { id: "builder", label: "Builder peer" },
  { id: "amplify", label: "Amplify + bridge" },
  { id: "question", label: "Question hook" },
  { id: "contrast", label: "Smart contrast" },
  { id: "hype", label: "Founder hype" },
];

const DEFAULT_TOPICS: EngagementTopicId[] = ["ai-agents", "x402", "solana"];

function formatTone(tone: string): string {
  return tone.replace(/-/g, " ") || "auto";
}

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function formatMetric(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

interface InternalEngagementRadarToolProps {
  wallet?: string | null;
}

export function InternalEngagementRadarTool({ wallet }: InternalEngagementRadarToolProps) {
  const queryClient = useQueryClient();
  const [topics, setTopics] = useState<EngagementTopicId[]>(DEFAULT_TOPICS);
  const [keyword, setKeyword] = useState("");
  const [window, setWindow] = useState<EngagementWindowId>("24h");
  const [minFaves, setMinFaves] = useState(25);
  const [queryType, setQueryType] = useState<EngagementQueryType>("Latest");
  const [tone, setTone] = useState<EngagementReplyToneId | "auto">("auto");
  const [opportunities, setOpportunities] = useState<EngagementOpportunity[]>([]);
  const [searchMeta, setSearchMeta] = useState<string | null>(null);
  const [activeOpportunity, setActiveOpportunity] = useState<EngagementOpportunity | null>(null);
  const [activeReply, setActiveReply] = useState<EngagementReplyItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const recentQ = useQuery({
    queryKey: ["internal-tools", "engagement-radar-recent"],
    queryFn: () => fetchRecentEngagementReplies(15),
    staleTime: 30_000,
  });

  const invalidateRecent = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "engagement-radar-recent"] });
  }, [queryClient]);

  const searchM = useMutation({
    mutationFn: () =>
      searchEngagementOpportunities({
        topics,
        keyword,
        minFaves,
        window,
        queryType,
      }),
    onSuccess: (res) => {
      setOpportunities(res.data.opportunities);
      setSearchMeta(
        `${res.data.meta.returnedCount} opportunities · ${res.data.meta.window} · ${res.data.meta.minFaves}+ likes`,
      );
      setActiveOpportunity(res.data.opportunities[0] ?? null);
      setActiveReply(null);
      setCopied(false);
      if (res.data.opportunities.length === 0) {
        toast.message("No opportunities found — try broader topics or lower min likes");
      } else {
        toast.success(`Found ${res.data.opportunities.length} engagement opportunities`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to search opportunities");
    },
  });

  const draftM = useMutation({
    mutationFn: (opp: EngagementOpportunity) =>
      draftEngagementReply(
        opp.id,
        opp.text,
        opp.author.userName,
        wallet,
        tone === "auto" ? null : tone,
      ),
    onSuccess: (res) => {
      setActiveReply(res.data);
      setCopied(false);
      invalidateRecent();
      toast.success("Reply draft ready — open on X to post from your account");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to draft reply");
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteEngagementReply(id),
    onSuccess: (_res, deletedId) => {
      setDeleteOpen(false);
      setActiveReply((prev) => (prev?.id === deletedId ? null : prev));
      invalidateRecent();
      toast.success("Reply draft deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete");
    },
  });

  const toggleTopic = useCallback((id: EngagementTopicId) => {
    setTopics((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== id);
      }
      if (prev.length >= 3) {
        toast.message("Max 3 topics per search");
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied — paste as your reply on X");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, []);

  const isBusy = searchM.isPending || draftM.isPending || deleteM.isPending;
  const displayReply = activeReply ?? recentQ.data?.data[0] ?? null;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Topics (pick up to 3)</p>
        <div className="flex flex-wrap gap-1.5">
          {TOPIC_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleTopic(opt.id)}
              disabled={isBusy}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
                topics.includes(opt.id)
                  ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="engagement-keyword" className="text-xs font-medium text-muted-foreground">
          Extra keyword (optional)
        </label>
        <Input
          id="engagement-keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="e.g. pump.fun, Jupiter, agent wallets…"
          className="rounded-xl border-border/60 bg-background/60 text-[13px]"
          disabled={isBusy}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {WINDOW_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setWindow(opt.id)}
              disabled={isBusy}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
                window === opt.id
                  ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MIN_FAVES_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMinFaves(opt.value)}
              disabled={isBusy}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
                minFaves === opt.value
                  ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUERY_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setQueryType(opt.id)}
              disabled={isBusy}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
                queryType === opt.id
                  ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
        onClick={() => searchM.mutate()}
        disabled={isBusy || topics.length === 0}
      >
        {searchM.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Radar className="mr-2 h-4 w-4" aria-hidden />
        )}
        {searchM.isPending ? "Scanning X…" : "Find opportunities"}
      </Button>

      {searchMeta ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80">
          {searchMeta}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)] lg:items-start">
        <div className="min-w-0 space-y-4">
          {opportunities.length > 0 ? (
            <div className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
                Opportunities
              </p>
              {opportunities.map((opp) => {
                const isActive = activeOpportunity?.id === opp.id;
                return (
                  <div
                    key={opp.id}
                    className={cn(
                      "rounded-xl border p-3 transition-colors",
                      isActive
                        ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8"
                        : "border-border/50 bg-muted/15 hover:border-border hover:bg-muted/25",
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        setActiveOpportunity(opp);
                        setActiveReply(null);
                        setCopied(false);
                      }}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          @{opp.author.userName}
                        </span>
                        {opp.author.verified ? (
                          <BadgeCheck className="h-3.5 w-3.5 text-[#F3BA2F]" aria-hidden />
                        ) : null}
                        <span className="text-[11px] text-muted-foreground">
                          {formatFollowers(opp.author.followers)} followers
                        </span>
                        <span className="rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#F3BA2F]">
                          score {opp.score}
                        </span>
                      </div>
                      <p className="line-clamp-4 text-[13px] leading-relaxed text-foreground/90">
                        {opp.text}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3 w-3" aria-hidden />
                          {formatMetric(opp.metrics.likeCount)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Repeat2 className="h-3 w-3" aria-hidden />
                          {formatMetric(opp.metrics.retweetCount)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" aria-hidden />
                          {formatMetric(opp.metrics.replyCount)}
                        </span>
                      </div>
                    </button>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-border/60 text-xs"
                        asChild
                      >
                        <a href={opp.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                          Open tweet
                        </a>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-lg border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-xs text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
                        onClick={() => {
                          setActiveOpportunity(opp);
                          draftM.mutate(opp);
                        }}
                        disabled={isBusy}
                      >
                        {draftM.isPending && activeOpportunity?.id === opp.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        )}
                        Draft reply
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Scan live X for high-traction tweets in your niche, then draft founder replies that build
              hype for Syra. You post manually from your personal account.
            </p>
          )}

          {activeOpportunity ? (
            <div className="space-y-3 border-t border-border/40 pt-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
                Reply draft
              </p>

              <div className="flex flex-wrap gap-1.5">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTone(opt.id)}
                    disabled={isBusy}
                    className={cn(
                      "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
                      tone === opt.id
                        ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]"
                        : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {displayReply ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {displayReply.tone ? (
                      <span className="rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]">
                        {formatTone(displayReply.tone)}
                      </span>
                    ) : null}
                    <span className="text-[11px] text-muted-foreground">
                      replying to @{displayReply.authorHandle}
                    </span>
                  </div>

                  <pre className="post-share-modal-body max-h-[min(36vh,14rem)] text-[13px] leading-relaxed">
                    {displayReply.text}
                  </pre>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
                      onClick={() => void handleCopy(displayReply.text)}
                    >
                      {copied ? (
                        <Check className="mr-2 h-4 w-4" aria-hidden />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" aria-hidden />
                      )}
                      {copied ? "Copied" : "Copy reply"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-border/60"
                      asChild
                    >
                      <a
                        href={buildReplyOnXUrl(displayReply.sourceTweetId, displayReply.text)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
                        Reply on X
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-border/60"
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
                  Pick an opportunity and draft a reply — tone pills apply to the next draft.
                </p>
              )}
            </div>
          ) : null}
        </div>

        {recentQ.data?.data && recentQ.data.data.length > 0 ? (
          <aside className="min-w-0 lg:sticky lg:top-0">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
              <Radar className="h-3 w-3" aria-hidden />
              Recent · {recentQ.data.total}
            </p>
            <div className="grid max-h-[min(52dvh,28rem)] gap-2 overflow-y-auto pr-0.5 lg:max-h-[min(60dvh,32rem)]">
              {recentQ.data.data.slice(0, 12).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveReply(item);
                    setCopied(false);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    activeReply?.id === item.id
                      ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8"
                      : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/35",
                  )}
                >
                  <span className="line-clamp-2 text-xs leading-relaxed text-foreground/85">
                    {item.text}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    @{item.authorHandle} · {formatTone(item.tone)}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-border/60 bg-background sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reply draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from your saved library. You can regenerate from the same tweet anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteM.isPending || !displayReply}
              onClick={() => displayReply && deleteM.mutate(displayReply.id)}
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
