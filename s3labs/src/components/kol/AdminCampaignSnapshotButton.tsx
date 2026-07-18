import { useCallback, useState } from "react";
import { Camera, CheckCircle2, Link2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminSnapshotCampaign,
  adminTrackTweet,
  KolApiError,
  type KolAdminTrackTweetResult,
} from "@/lib/kolApi";

interface AdminCampaignSnapshotButtonProps {
  campaignId: string;
  wallet: string;
  onRefresh?: () => void;
}

export function AdminCampaignSnapshotButton({
  campaignId,
  wallet,
  onRefresh,
}: AdminCampaignSnapshotButtonProps) {
  const [loading, setLoading] = useState(false);
  const [tweetUrl, setTweetUrl] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [lastResult, setLastResult] = useState<KolAdminTrackTweetResult | null>(
    null,
  );

  const handleSnapshot = useCallback(async () => {
    if (!wallet || loading) return;
    setLoading(true);
    try {
      const result = await adminSnapshotCampaign(campaignId, wallet);
      const refreshed = result.metrics?.refreshed ?? 0;
      const failed = result.metrics?.failed ?? 0;
      const skipped = result.metrics?.skipped === true;

      if (skipped) {
        toast.message("Snapshot skipped", {
          description: result.metrics?.reason
            ? `Reason: ${result.metrics.reason}`
            : "Metrics reported skipped (still fresh).",
        });
      } else {
        toast.success("Snapshot complete", {
          description: `Metrics refreshed ${refreshed}${failed > 0 ? ` · failed ${failed}` : ""}`,
        });
      }
      onRefresh?.();
    } catch (e) {
      const message =
        e instanceof KolApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Snapshot failed";
      toast.error("Snapshot failed", { description: message });
    } finally {
      setLoading(false);
    }
  }, [campaignId, loading, onRefresh, wallet]);

  const handleTrackTweet = useCallback(async () => {
    const url = tweetUrl.trim();
    if (!url || !wallet || trackLoading) return;
    setTrackLoading(true);
    setLastResult(null);
    try {
      const result = await adminTrackTweet(campaignId, url, wallet);
      setLastResult(result);
      if (result.found) {
        const handleLabel = result.handle ? `@${result.handle}` : "Post";
        toast.success(
          result.alreadyTracked
            ? `${handleLabel} already on the board`
            : `${handleLabel} added`,
          {
            description: result.mode
              ? `${result.mode} · score ${result.score ?? 0}`
              : undefined,
          },
        );
        onRefresh?.();
      } else {
        toast.message("Post not tracked", {
          description:
            result.message ??
            (result.reason ? `Reason: ${result.reason}` : "Could not track this post."),
        });
      }
    } catch (e) {
      const message =
        e instanceof KolApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Track failed";
      toast.error("Track failed", { description: message });
    } finally {
      setTrackLoading(false);
    }
  }, [campaignId, onRefresh, trackLoading, tweetUrl, wallet]);

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow text-amber-600/90 dark:text-amber-400/90">Admin</p>
          <h3 className="font-semibold tracking-tight">Manual snapshot</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Force-refresh engagement metrics for submitted posts (batched X API).
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full gap-2 shrink-0 border-amber-500/40 hover:bg-amber-500/10"
          disabled={loading || !wallet}
          onClick={() => void handleSnapshot()}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Refreshing…
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              Refresh metrics
            </>
          )}
        </Button>
      </div>

      <div className="border-t border-amber-500/20 pt-3 space-y-2">
        <p className="text-sm font-medium text-foreground">Track a post by link</p>
        <p className="text-xs text-muted-foreground">
          Paste the KOL&apos;s reply or quote URL (e.g.{" "}
          <span className="text-foreground/80">x.com/web3divaa/status/…</span>
          ). We fetch that post directly and add it to the leaderboard.
        </p>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void handleTrackTweet();
          }}
        >
          <Input
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            placeholder="https://x.com/user/status/123…"
            className="h-10 rounded-xl border-border/60 bg-background/80"
            autoComplete="off"
            spellCheck={false}
            aria-label="X post URL to track"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="rounded-full gap-2 shrink-0 border-amber-500/40 hover:bg-amber-500/10"
            disabled={trackLoading || !wallet || !tweetUrl.trim()}
          >
            {trackLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Tracking…
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5" />
                Track post
              </>
            )}
          </Button>
        </form>

        {lastResult ? (
          <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-medium">
              {lastResult.found ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">
                    {lastResult.alreadyTracked
                      ? `Already tracked @${lastResult.handle}`
                      : `Tracked @${lastResult.handle} (${lastResult.mode})`}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-500">
                    Not tracked ({lastResult.reason ?? "unknown"})
                  </span>
                </>
              )}
            </div>

            {lastResult.message ? (
              <p className="text-muted-foreground leading-relaxed">{lastResult.message}</p>
            ) : null}

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted-foreground">
              <dt>Campaign source</dt>
              <dd className="tabular-nums break-all text-foreground">
                {lastResult.sourceTweetId ?? "—"}
                {lastResult.sourceAuthorHandle
                  ? ` (@${lastResult.sourceAuthorHandle})`
                  : ""}
              </dd>
              <dt>Pasted post</dt>
              <dd className="tabular-nums break-all text-foreground">
                {lastResult.tweetId ?? "—"}
                {lastResult.handle ? ` (@${lastResult.handle})` : ""}
              </dd>
              <dt>Relations</dt>
              <dd className="break-all text-foreground">
                quoted: {lastResult.quotedTweetId ?? "—"} · replyTo:{" "}
                {lastResult.inReplyToId ?? "—"} · conversation:{" "}
                {lastResult.conversationId ?? "—"}
                {lastResult.isQuote ? " · isQuote" : ""}
              </dd>
              {lastResult.found && lastResult.score != null ? (
                <>
                  <dt>Score</dt>
                  <dd className="tabular-nums text-foreground">{lastResult.score}</dd>
                </>
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}
