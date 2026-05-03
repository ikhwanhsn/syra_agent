import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Loader2,
  MessageCircle,
  RefreshCw,
  Repeat2,
  Sparkles,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import { fetchXProjectAnalyzeAccount, type XRecentTweet } from "@/lib/xProjectsAnalyzeApi";
import {
  BREAKDOWN_ORDER,
  formatDetailValue,
  formatFollowers,
  formatSignalLabel,
  gradeBadgeClassName,
  scoreRingStyle,
} from "@/lib/alphaIntelUi";

const STALE_MS = 55_000;
const FEED_TYPE = "x402";

function tweetEngagement(t: XRecentTweet): number {
  const m = t.public_metrics;
  if (!m) return 0;
  return (
    (Number(m.like_count) || 0) +
    (Number(m.retweet_count) || 0) +
    (Number(m.reply_count) || 0) +
    (Number(m.quote_count) || 0)
  );
}

function formatTweetDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function AlphaAccountDetail() {
  const { username: usernameParam } = useParams<{ username: string }>();
  const username = usernameParam ? decodeURIComponent(usernameParam) : "";

  const detailQ = useQuery({
    queryKey: ["alpha", "x-account", FEED_TYPE, username.toLowerCase()],
    queryFn: () =>
      fetchXProjectAnalyzeAccount({
        username,
        type: FEED_TYPE,
        max_results: 40,
        includeAiSummary: true,
      }),
    enabled: Boolean(username && /^[A-Za-z0-9_]{1,15}$/.test(username)),
    staleTime: STALE_MS,
  });

  const d = detailQ.data;
  const signalsEntries = d?.signals ? Object.entries(d.signals).sort(([a], [b]) => a.localeCompare(b)) : [];

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
          "flex flex-col gap-8 pb-12",
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 rounded-xl px-2 text-muted-foreground hover:text-foreground" asChild>
            <Link to="/dashboard/alpha">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Alpha
            </Link>
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <span className="truncate font-mono text-sm text-foreground">@{username || "…"}</span>
          {d?.feedLabel ? (
            <Badge variant="secondary" className="ml-auto shrink-0 rounded-lg text-[10px] font-semibold uppercase tracking-wide">
              {d.feedLabel}
            </Badge>
          ) : null}
        </div>

        {!username || !/^[A-Za-z0-9_]{1,15}$/.test(username) ? (
          <Card className="border-destructive/25">
            <CardContent className="p-6 text-sm text-muted-foreground">Invalid handle in URL.</CardContent>
          </Card>
        ) : detailQ.isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <div className="grid gap-4 lg:grid-cols-3">
              <Skeleton className="h-40 rounded-2xl lg:col-span-2" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : detailQ.isError ? (
          <Card className="border-destructive/25 bg-destructive/[0.03]">
            <CardHeader>
              <CardTitle className="text-lg">Could not load profile intel</CardTitle>
              <CardDescription className="text-muted-foreground">
                {(detailQ.error as Error)?.message ||
                  "Check your connection, API configuration, or whether this account is in the Alpha feed."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="rounded-xl" asChild>
                <Link to="/dashboard/alpha">Back to watchlist</Link>
              </Button>
              <Button type="button" variant="outline" className="rounded-xl gap-2" onClick={() => void detailQ.refetch()}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : d ? (
          <>
            <Card className="overflow-hidden border-border/55 bg-gradient-to-br from-card/95 via-card/80 to-muted/[0.05] shadow-[0_28px_90px_-48px_rgba(0,0,0,0.88)] backdrop-blur-xl">
              <CardContent className="relative p-6 sm:p-10">
                <div
                  className="pointer-events-none absolute inset-0 opacity-50"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, hsl(var(--border) / 0.18) 1px, transparent 1px),
                      linear-gradient(to bottom, hsl(var(--border) / 0.18) 1px, transparent 1px)
                    `,
                    backgroundSize: "44px 44px",
                  }}
                />
                <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
                    <div
                      className="relative shrink-0 rounded-full p-[4px] shadow-[0_16px_48px_-20px_rgba(0,0,0,0.9)]"
                      style={scoreRingStyle(d.score)}
                    >
                      <div className="flex h-[148px] w-[148px] flex-col items-center justify-center rounded-full bg-card ring-1 ring-border/60">
                        <span className="font-mono text-5xl font-bold tabular-nums tracking-tight text-foreground">
                          {d.score}
                        </span>
                        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Syra score
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 space-y-4 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                          {d.user?.name?.trim() || d.username}
                        </h1>
                        {d.user?.verified ? (
                          <Badge variant="outline" className="rounded-lg border-primary/25 bg-primary/[0.06] text-[10px] uppercase">
                            Verified
                          </Badge>
                        ) : null}
                        <span className={gradeBadgeClassName(d.grade)}>{d.grade}</span>
                      </div>
                      <p className="font-mono text-sm text-muted-foreground">@{d.username}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <Button size="sm" className="rounded-xl gap-2" asChild>
                          <a href={`https://x.com/${encodeURIComponent(d.username)}`} target="_blank" rel="noopener noreferrer">
                            Open on X
                            <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
                          </a>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl gap-2 border-border/70"
                          onClick={() => void detailQ.refetch()}
                          disabled={detailQ.isFetching}
                        >
                          {detailQ.isFetching ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                          )}
                          Refresh intel
                        </Button>
                      </div>
                      {d.updatedAt ? (
                        <p className="text-[12px] text-muted-foreground/80">
                          Snapshot {new Date(d.updatedAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="w-full max-w-md shrink-0 space-y-4 rounded-2xl border border-border/50 bg-background/40 p-5 backdrop-blur-md">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Profile</p>
                    {d.user?.description ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">{d.user.description}</p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">No bio on file.</p>
                    )}
                    <Separator className="bg-border/50" />
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Followers</dt>
                        <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                          {formatFollowers(d.user?.public_metrics?.followers_count)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Following</dt>
                        <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                          {formatFollowers(d.user?.public_metrics?.following_count)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Posts (profile)</dt>
                        <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                          {d.user?.public_metrics?.tweet_count != null
                            ? Number(d.user.public_metrics.tweet_count).toLocaleString()
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Joined</dt>
                        <dd className="mt-0.5 text-foreground/90">
                          {d.user?.created_at
                            ? new Date(d.user.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                              })
                            : "—"}
                        </dd>
                      </div>
                      {d.user?.url ? (
                        <div className="col-span-2">
                          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Link</dt>
                          <dd className="mt-0.5 truncate">
                            <a
                              href={d.user.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                            >
                              {d.user.url}
                            </a>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="border-border/55 bg-card/60 backdrop-blur-md xl:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                    Operational signals
                  </CardTitle>
                  <CardDescription>Derived metrics from the sampled tweet window and public profile.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {signalsEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-xl border border-border/45 bg-muted/[0.12] px-4 py-3 transition-colors hover:bg-muted/[0.18]"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {formatSignalLabel(key)}
                        </p>
                        <p className="mt-1 font-mono text-sm font-medium tabular-nums text-foreground">{formatDetailValue(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/55 bg-card/60 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Score trajectory</CardTitle>
                  <CardDescription>Category caps mirror the Syra rubric.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {BREAKDOWN_ORDER.map(([key, label]) => {
                    const slice = d.breakdown[key];
                    const pct = slice && slice.max > 0 ? Math.round((slice.score / slice.max) * 100) : 0;
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[13px]">
                          <span className="font-medium text-muted-foreground">{label}</span>
                          <span className="font-mono text-xs tabular-nums text-foreground">
                            {slice ? `${slice.score.toFixed(1)} / ${slice.max}` : "—"}
                          </span>
                        </div>
                        <Progress value={pct} className="h-2 bg-secondary/70" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/55 bg-card/55 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg">Scoring methodology — detail</CardTitle>
                <CardDescription>Everything the engine surfaced inside each rubric bucket.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={[...BREAKDOWN_ORDER.map(([k]) => k)]} className="w-full">
                  {BREAKDOWN_ORDER.map(([key, label]) => {
                    const slice = d.breakdown[key];
                    const detailPairs = slice?.details ? Object.entries(slice.details) : [];
                    return (
                      <AccordionItem key={key} value={key} className="border-border/45">
                        <AccordionTrigger className="py-4 text-left hover:no-underline">
                          <div className="flex w-full flex-wrap items-center justify-between gap-3 pr-2">
                            <span className="font-semibold text-foreground">{label}</span>
                            {slice ? (
                              <Badge variant="outline" className="font-mono text-xs tabular-nums">
                                {slice.score.toFixed(1)} / {slice.max}
                              </Badge>
                            ) : null}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 pt-0">
                          {detailPairs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No sub-signals recorded.</p>
                          ) : (
                            <dl className="grid gap-2 sm:grid-cols-2">
                              {detailPairs.map(([dk, dv]) => (
                                <div key={dk} className="rounded-lg border border-border/35 bg-muted/[0.08] px-3 py-2">
                                  <dt className="text-[11px] font-medium text-muted-foreground">{formatSignalLabel(dk)}</dt>
                                  <dd className="mt-1 whitespace-pre-wrap break-words font-mono text-[12px] text-foreground/95">
                                    {formatDetailValue(dv)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>

            {Array.isArray(d.redFlags) && d.redFlags.length > 0 ? (
              <Card className="border-amber-500/20 bg-amber-500/[0.04] backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg text-amber-100">
                    <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
                    Review queue
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Heuristic flags from the sample — not investment advice.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {d.redFlags.map((flag) => (
                      <li key={flag} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/90" aria-hidden />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {d.aiSummary ? (
              <Card className="border-border/55 bg-card/55 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Grounded synthesis</CardTitle>
                  <CardDescription>Optional LLM summary constrained to the metrics above.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-2xl border border-border/40 bg-muted/[0.08] px-5 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/95">{d.aiSummary}</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-border/55 bg-card/55 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg">Recent posts (sample)</CardTitle>
                <CardDescription>
                  Chronological slice from the same window used for scoring — engagement proxies shown per post.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!d.recentTweets?.length ? (
                  <p className="text-sm text-muted-foreground">No tweet text returned for this snapshot.</p>
                ) : (
                  <ScrollArea className="max-h-[min(520px,55vh)] pr-4">
                    <div className="space-y-4">
                      {d.recentTweets.map((t, idx) => (
                        <div
                          key={t.id ?? `tweet-${idx}`}
                          className="rounded-2xl border border-border/45 bg-muted/[0.06] p-4 transition-colors hover:bg-muted/[0.1]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/35 pb-3">
                            <p className="text-[12px] font-medium text-muted-foreground">{formatTweetDate(t.created_at)}</p>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono tabular-nums text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Heart className="h-3 w-3" aria-hidden />
                                {t.public_metrics?.like_count ?? "—"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Repeat2 className="h-3 w-3" aria-hidden />
                                {t.public_metrics?.retweet_count ?? "—"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" aria-hidden />
                                {t.public_metrics?.reply_count ?? "—"}
                              </span>
                              <span className="text-[10px] uppercase tracking-wide opacity-70">
                                Σ {tweetEngagement(t)}
                              </span>
                            </div>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/95">{t.text || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
