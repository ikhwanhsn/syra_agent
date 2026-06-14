"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Loader2, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { analyzeFounderPulse, type FounderPulseSnapshot } from "@/lib/internalToolsApi";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface InternalFounderPulseToolProps {
  wallet?: string | null;
}

export function InternalFounderPulseTool({ wallet }: InternalFounderPulseToolProps) {
  const [handle, setHandle] = useState("");
  const [result, setResult] = useState<FounderPulseSnapshot | null>(null);

  const analyzeM = useMutation({
    mutationFn: () => analyzeFounderPulse(handle.trim() || undefined, wallet),
    onSuccess: (res) => {
      setResult(res.data);
      toast.success("Founder pulse analyzed");
    },
    onError: (err: Error) => toast.error(err.message || "Analysis failed"),
  });

  const a = result?.analytics;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1 space-y-1">
          <label htmlFor="founder-handle" className="text-xs font-medium text-muted-foreground">Your X handle</label>
          <Input id="founder-handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourhandle (or set SYRA_FOUNDER_X_HANDLE)" className="rounded-xl border-border/60 bg-background/60 text-[13px]" disabled={analyzeM.isPending} />
        </div>
        <Button type="button" className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25" onClick={() => analyzeM.mutate()} disabled={analyzeM.isPending}>
          {analyzeM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
          {analyzeM.isPending ? "Analyzing…" : "Analyze account"}
        </Button>
      </div>

      {result && a ? (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Followers", value: fmtFollowers(result.followers), delta: result.followerDelta },
              { label: "Avg engagement", value: String(a.avgEngagement) },
              { label: "Tweets/day", value: a.tweetsPerDay != null ? String(a.tweetsPerDay) : "—" },
              { label: "Analyzed", value: String(a.tweetsAnalyzed) },
            ].map((chip) => (
              <div key={chip.label} className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{chip.label}</p>
                <p className="mt-0.5 text-sm font-medium">
                  {chip.value}
                  {chip.delta != null ? (
                    <span className={cn("ml-1.5 text-xs", chip.delta >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {chip.delta >= 0 ? "+" : ""}{chip.delta}
                    </span>
                  ) : null}
                </p>
              </div>
            ))}
          </div>

          {result.insight ? (
            <div className="rounded-xl border border-[#F3BA2F]/25 bg-[#F3BA2F]/8 px-4 py-3">
              <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#F3BA2F]">AI insight</p>
              <p className="text-[13px] leading-relaxed text-foreground/90">{result.insight}</p>
            </div>
          ) : null}

          {a.bestHours.length > 0 ? (
            <div>
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Best hours (UTC)</p>
              <div className="flex flex-wrap gap-2">
                {a.bestHours.map((h) => (
                  <span key={h.hour} className="rounded-full border border-border/50 bg-muted/20 px-2.5 py-1 font-mono text-[10px]">
                    {h.hour}:00 · {h.avgEngagement.toFixed(1)} avg
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {a.bestDays.length > 0 ? (
            <div>
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Best days</p>
              <div className="flex flex-wrap gap-2">
                {a.bestDays.map((d) => (
                  <span key={d.day} className="rounded-full border border-border/50 bg-muted/20 px-2.5 py-1 font-mono text-[10px]">
                    {DAY_LABELS[d.day]} · {d.avgEngagement.toFixed(1)} avg
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {a.topTweets.length > 0 ? (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground"><TrendingUp className="h-3 w-3" />Top tweets</p>
              {a.topTweets.map((t) => (
                <a key={t.id} href={t.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/25">
                  <p className="line-clamp-3 text-[12px] leading-relaxed">{t.text}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">engagement {t.engagement} · {t.metrics.likeCount} likes</p>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <User className="mt-0.5 h-4 w-4 shrink-0" />
          Analytics on your personal X: followers, engagement rate, top tweets, and best times to post.
        </p>
      )}
    </div>
  );
}
