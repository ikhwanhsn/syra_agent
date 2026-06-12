import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, Rocket, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  agentBiasLabel,
  fetchSpcxTelegramPreview,
  formatFeedTimestamp,
  type SpcxIntelligenceReport,
} from "@/lib/spcxApi";
import { cn } from "@/lib/utils";
import { spcxCardClass } from "@/components/spcx/spcxStyles";
import { SpcxDecisionFeed } from "@/components/spcx/SpcxDecisionFeed";

function LatestSnapshot({ entry }: { entry: SpcxIntelligenceReport }) {
  const ts = entry.tickAt || entry.computedAt;
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-muted-foreground">Latest check</p>
        <Badge variant="outline" className="rounded-lg capitalize text-[10px]">
          {agentBiasLabel(entry.agentBias)}
        </Badge>
      </div>
      <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
        {entry.agentTake || "No summary available."}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">{formatFeedTimestamp(ts)}</p>
    </div>
  );
}

function ShareBlock() {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const previewQ = useQuery({
    queryKey: ["spcx-telegram-preview"],
    queryFn: fetchSpcxTelegramPreview,
    staleTime: 60_000,
  });

  const message = previewQ.data?.message ?? "";

  const copy = async () => {
    if (!message) return;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 border-t border-border/40 pt-5">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold text-foreground">Share with friends</p>
          <p className="text-xs text-muted-foreground">Copy a summary for Telegram or X</p>
        </div>
      </div>
      <p
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground",
          !expanded && "line-clamp-4",
        )}
      >
        {previewQ.isLoading ? "Loading summary…" : message || "No preview available"}
      </p>
      {message.length > 180 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Show full summary <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 rounded-xl"
        onClick={copy}
        disabled={!message}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy summary"}
      </Button>
    </div>
  );
}

export function SpcxSidebar({
  entries,
  loading,
  error,
  onRetry,
  retrying,
}: {
  entries: SpcxIntelligenceReport[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const latest = entries[0];

  return (
    <aside className="flex flex-col gap-6 xl:col-span-4 xl:self-start">
      <Card id="spcx-share" className={cn(spcxCardClass, "scroll-mt-28")}>
        <CardHeader className="border-b border-border/40 bg-muted/[0.03] pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
            <Rocket className="h-4 w-4 text-primary" />
            Agent pulse
          </CardTitle>
          <CardDescription>
            Latest SpaceX IPO intel — refreshes automatically every ~45s
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {latest && !error ? <LatestSnapshot entry={latest} /> : null}
          <SpcxDecisionFeed
            entries={entries}
            loading={loading}
            error={error}
            onRetry={onRetry}
            retrying={retrying}
            embedded
          />
          <ShareBlock />
        </CardContent>
      </Card>
    </aside>
  );
}
