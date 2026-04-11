import { useState, useEffect, useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Bot,
  Sun,
  Moon,
  Crown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletNav } from "@/components/chat/WalletNav";
import { agentLeaderboardApi, type AgentLeaderboardEntry } from "@/lib/chatApi";
import { cn } from "@/lib/utils";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_STANDARD, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface LeaderboardProps {
  /** When true, render without full-page chrome (used inside Dashboard layout). */
  embedded?: boolean;
}

type SortKey = "messages" | "chats" | "recent" | "tools" | "volume";

const SORT_COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "messages", label: "Messages", align: "right" },
  { key: "chats", label: "Chats", align: "right" },
  { key: "tools", label: "Tool calls", align: "right" },
  { key: "volume", label: "x402 vol.", align: "right" },
  { key: "recent", label: "Last active", align: "right" },
];

const PAGE_SIZE = 20;
const MAX_PAGE_BUTTONS = 7;

const intlNum = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

function maskAnonymousId(id: string): string {
  if (!id) return "—";
  if (id.startsWith("wallet:")) {
    const pubkey = id.slice(7).trim();
    if (pubkey.length <= 8) return pubkey;
    return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
  }
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function userInitials(id: string): string {
  if (!id) return "?";
  if (id.startsWith("wallet:")) {
    const pk = id.slice(7).replace(/[^a-zA-Z0-9]/g, "");
    if (pk.length >= 2) return pk.slice(0, 2).toUpperCase();
  }
  const alnum = id.replace(/[^a-zA-Z0-9]/g, "");
  if (alnum.length >= 2) return alnum.slice(0, 2).toUpperCase();
  return id.slice(0, 2).toUpperCase();
}

function idGradientStyle(id: string): CSSProperties {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const hue2 = (hue + 48) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue} 58% 46%), hsl(${hue2} 62% 36%))`,
  };
}

function isWalletId(id: string): boolean {
  return id.startsWith("wallet:");
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) {
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300/90 via-amber-400 to-amber-600 text-amber-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-200/40"
        aria-label="Rank 1"
      >
        <Crown className="h-4 w-4" strokeWidth={2.25} />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 text-slate-800 shadow-md shadow-slate-500/15 ring-1 ring-white/30"
        aria-label="Rank 2"
      >
        <span className="text-sm font-bold tabular-nums">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-700/90 via-amber-800 to-amber-950 text-amber-100 shadow-md shadow-amber-900/30 ring-1 ring-amber-600/40"
        aria-label="Rank 3"
      >
        <span className="text-sm font-bold tabular-nums">3</span>
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/50 text-sm font-semibold tabular-nums text-muted-foreground">
      {rank}
    </div>
  );
}

type LeaderboardTab = "user" | "agent";

export default function Leaderboard({ embedded = false }: LeaderboardProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => !document.documentElement.classList.contains("light"));
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("user");
  const [sort, setSort] = useState<SortKey>("messages");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    leaderboard: AgentLeaderboardEntry[];
    total: number;
    limit: number;
    skip: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (embedded) return;
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [embedded, isDarkMode]);

  useEffect(() => {
    if (activeTab !== "user") return;
    setLoading(true);
    setError(null);
    const skip = (page - 1) * PAGE_SIZE;
    agentLeaderboardApi
      .get({ sort, order, limit: PAGE_SIZE, skip })
      .then((res) =>
        setData({
          leaderboard: res.leaderboard ?? [],
          total: res.total ?? 0,
          limit: res.limit ?? PAGE_SIZE,
          skip: res.skip ?? 0,
        })
      )
      .catch((e) => setError(e?.message ?? "Failed to load leaderboard"))
      .finally(() => setLoading(false));
  }, [activeTab, sort, order, page]);

  const handleSort = (key: SortKey) => {
    if (sort === key) {
      setOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSort(key);
      setOrder("desc");
    }
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const maxMessagesOnPage = useMemo(() => {
    if (!data?.leaderboard.length) return 1;
    return Math.max(1, ...data.leaderboard.map((e) => e.totalMessages ?? 0));
  }, [data]);

  /** Page numbers to show: around current page, max MAX_PAGE_BUTTONS */
  const pageNumbers = (() => {
    const pages: number[] = [];
    let start = Math.max(1, page - Math.floor(MAX_PAGE_BUTTONS / 2));
    const end = Math.min(totalPages, start + MAX_PAGE_BUTTONS - 1);
    if (end - start + 1 < MAX_PAGE_BUTTONS) start = Math.max(1, end - MAX_PAGE_BUTTONS + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  return (
    <div
      className={cn(
        "flex flex-col bg-background min-h-0",
        embedded ? "flex-1 min-h-0" : "h-dvh min-h-dvh max-h-dvh overflow-hidden overscroll-none"
      )}
    >
      {!embedded && (
        <header className="flex items-center justify-between gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-b border-border bg-background/80 backdrop-blur-xl min-h-[52px] shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Back to agent" aria-label="Back to agent">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="w-5 h-5 text-primary shrink-0" />
              <h1 className="text-sm font-bold text-foreground truncate">Leaderboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Light mode" : "Dark mode"}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <WalletNav />
          </div>
        </header>
      )}

      <div className="flex-1 min-h-0 overflow-auto">
        <div className={cn(DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_STANDARD, PAGE_SAFE_AREA_BOTTOM)}>
          <section className="relative mb-8 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/25 p-6 shadow-lg shadow-black/[0.03] sm:p-8 dark:from-card dark:via-card dark:to-muted/10 dark:shadow-black/25">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/[0.12] blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-primary/[0.06] blur-3xl"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                  Community
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Leaderboard</h2>
                  <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    Ranked by engagement across the network. Sort any column to explore how builders show up.
                  </p>
                </div>
              </div>

              {activeTab === "user" && data != null && !loading && !error && (
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-right backdrop-blur-sm">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Tracked</p>
                    <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{intlNum.format(data.total)}</p>
                    <p className="text-xs text-muted-foreground">profiles on this board</p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative mt-6 inline-flex rounded-full border border-border/60 bg-muted/30 p-1 shadow-inner backdrop-blur-sm">
              <button
                type="button"
                aria-pressed={activeTab === "user"}
                onClick={() => setActiveTab("user")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  activeTab === "user"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <User className="h-4 w-4 opacity-80" aria-hidden />
                Users
              </button>
              <button
                type="button"
                aria-pressed={activeTab === "agent"}
                onClick={() => setActiveTab("agent")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  activeTab === "agent"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Bot className="h-4 w-4 opacity-80" aria-hidden />
                Agents
              </button>
            </div>
          </section>

          {activeTab === "agent" && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 py-20 px-6 text-center">
              <Bot className="mb-4 h-12 w-12 text-muted-foreground/50" aria-hidden />
              <p className="text-lg font-medium text-foreground">Agent leaderboard</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">We are polishing aggregate agent stats. Check back soon.</p>
            </div>
          )}

          {activeTab === "user" && loading && (
            <div className="space-y-3 rounded-2xl border border-border/60 bg-card/40 p-4">
              <div className="flex gap-4 border-b border-border/60 pb-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 max-w-[200px]" />
                  <Skeleton className="h-3 w-1/2 max-w-[280px]" />
                </div>
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 flex-1 max-w-[140px]" />
                  <Skeleton className="h-4 w-16 shrink-0" />
                  <Skeleton className="h-4 w-12 shrink-0" />
                  <Skeleton className="h-4 w-12 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {activeTab === "user" && error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {activeTab === "user" && !loading && !error && data && (
            <>
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-xl shadow-black/[0.04] backdrop-blur-sm dark:shadow-black/30">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40 backdrop-blur-md">
                        <th className="w-16 py-4 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:pl-5">
                          Rank
                        </th>
                        <th className="py-4 pl-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:pr-5">
                          User
                        </th>
                        {SORT_COLUMNS.map(({ key, label, align }) => (
                          <th
                            key={key}
                            className={cn(
                              "whitespace-nowrap px-3 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors cursor-pointer select-none hover:text-foreground sm:px-4",
                              align === "right" && "text-right"
                            )}
                            onClick={() => handleSort(key)}
                            title={`Sort by ${label} (${sort === key ? (order === "desc" ? "ascending" : "descending") : "descending"})`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              {label}
                              {sort === key ? (
                                order === "desc" ? (
                                  <ArrowDown className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                                ) : (
                                  <ArrowUp className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                                )
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                              <Trophy className="h-10 w-10 text-muted-foreground/40" aria-hidden />
                              <p className="text-base font-medium text-foreground">No one on the board yet</p>
                              <p className="text-sm text-muted-foreground">Start a conversation to earn your first messages and show up here.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        data.leaderboard.map((entry) => {
                          const topTier = entry.rank <= 3;
                          const msgPct = Math.round(((entry.totalMessages ?? 0) / maxMessagesOnPage) * 100);
                          return (
                            <tr
                              key={entry.anonymousId}
                              className={cn(
                                "group border-b border-border/50 transition-colors duration-200 last:border-b-0",
                                "hover:bg-muted/40",
                                topTier &&
                                  "bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent dark:from-primary/[0.09]"
                              )}
                            >
                              <td className="relative py-4 pl-4 pr-2 sm:pl-5">
                                {topTier && (
                                  <div
                                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-primary/80 to-primary/20"
                                    aria-hidden
                                  />
                                )}
                                <RankBadge rank={entry.rank} />
                              </td>
                              <td className="py-4 pl-2 pr-4 sm:pr-5">
                                <Tooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <div className="flex min-w-0 cursor-default items-center gap-3">
                                      <Avatar className="h-10 w-10 shrink-0 ring-2 ring-background shadow-sm">
                                        <AvatarFallback
                                          className="text-xs font-semibold text-white"
                                          style={idGradientStyle(entry.anonymousId)}
                                        >
                                          {userInitials(entry.anonymousId)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-foreground">{maskAnonymousId(entry.anonymousId)}</p>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                          <Badge
                                            variant="secondary"
                                            className="h-5 border-0 px-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                                          >
                                            {isWalletId(entry.anonymousId) ? "Wallet" : "Guest"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-sm font-mono text-xs">
                                    {entry.anonymousId}
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                              <td className="px-3 py-4 sm:px-4">
                                <div className="flex flex-col items-end gap-1.5">
                                  <span className="tabular-nums font-medium text-foreground">{intlNum.format(entry.totalMessages)}</span>
                                  <Progress value={msgPct} className="h-1 w-[4.5rem] bg-muted/80" />
                                </div>
                              </td>
                              <td className="px-3 py-4 text-right tabular-nums text-foreground/90 sm:px-4">
                                {intlNum.format(entry.totalChats)}
                              </td>
                              <td className="px-3 py-4 text-right tabular-nums text-foreground/90 sm:px-4">
                                {intlNum.format(entry.totalToolCalls ?? 0)}
                              </td>
                              <td className="px-3 py-4 text-right sm:px-4">
                                {(entry.x402VolumeUsd ?? 0) > 0 ? (
                                  <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                                    ${Number(entry.x402VolumeUsd).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="tabular-nums text-muted-foreground/70">—</span>
                                )}
                              </td>
                              <td className="px-3 py-4 text-right text-muted-foreground sm:px-4">{formatDate(entry.lastActiveAt)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {data.total > PAGE_SIZE && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 sm:px-5">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{(data.skip || 0) + 1}</span>–
                    <span className="font-medium text-foreground">{Math.min(data.skip + data.limit, data.total)}</span> of{" "}
                    <span className="font-medium text-foreground">{intlNum.format(data.total)}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 border-border/80"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!canPrev}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1 rounded-lg bg-background/80 p-0.5 ring-1 ring-border/60">
                      {pageNumbers.map((n) => (
                        <Button
                          key={n}
                          variant={page === n ? "secondary" : "ghost"}
                          size="sm"
                          className={cn("h-8 min-w-[2rem] px-2 text-xs", page === n && "shadow-sm")}
                          onClick={() => setPage(n)}
                          aria-label={`Page ${n}`}
                          aria-current={page === n ? "page" : undefined}
                        >
                          {n}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 border-border/80"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={!canNext}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
