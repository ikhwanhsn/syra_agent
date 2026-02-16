import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Loader2, Medal, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, User, Bot, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletNav } from "@/components/chat/WalletNav";
import { agentLeaderboardApi, type AgentLeaderboardEntry } from "@/lib/chatApi";
import { cn } from "@/lib/utils";

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

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return "—";
  }
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="w-5 h-5 text-amber-500" aria-hidden />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" aria-hidden />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" aria-hidden />;
  return <span className="text-sm font-medium text-muted-foreground w-6 text-right">{rank}</span>;
}

type LeaderboardTab = "user" | "agent";

export default function Leaderboard() {
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
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

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

  /** Page numbers to show: around current page, max MAX_PAGE_BUTTONS */
  const pageNumbers = (() => {
    const pages: number[] = [];
    let start = Math.max(1, page - Math.floor(MAX_PAGE_BUTTONS / 2));
    let end = Math.min(totalPages, start + MAX_PAGE_BUTTONS - 1);
    if (end - start + 1 < MAX_PAGE_BUTTONS) start = Math.max(1, end - MAX_PAGE_BUTTONS + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background min-h-0">
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

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Top Leaderboard</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Top users by activity. Click a column header to sort.
          </p>

          <div className="flex items-center gap-2 mb-6">
            <Button
              variant={activeTab === "user" ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setActiveTab("user")}
            >
              <User className="w-4 h-4" />
              User
            </Button>
            <Button
              variant={activeTab === "agent" ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setActiveTab("agent")}
            >
              <Bot className="w-4 h-4" />
              Agent
            </Button>
          </div>

          {activeTab === "agent" && (
            <div className="rounded-xl border border-border bg-card flex items-center justify-center py-16 px-6">
              <p className="text-muted-foreground font-medium">Coming soon</p>
            </div>
          )}

          {activeTab === "user" && loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading leaderboard…</span>
            </div>
          )}

          {activeTab === "user" && error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {activeTab === "user" && !loading && !error && data && (
            <>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left font-medium text-muted-foreground py-3 px-4 w-14">#</th>
                        <th className="text-left font-medium text-muted-foreground py-3 px-4">User</th>
                        {SORT_COLUMNS.map(({ key, label, align }) => (
                          <th
                            key={key}
                            className={cn(
                              "font-medium text-muted-foreground py-3 px-4 cursor-pointer select-none hover:text-foreground hover:bg-muted/70 transition-colors",
                              align === "right" && "text-right"
                            )}
                            onClick={() => handleSort(key)}
                            title={`Sort by ${label} (${sort === key ? (order === "desc" ? "ascending" : "descending") : "descending"})`}
                          >
                            <span className="inline-flex items-center gap-1">
                              {label}
                              {sort === key ? (
                                order === "desc" ? (
                                  <ArrowDown className="w-4 h-4 shrink-0" aria-hidden />
                                ) : (
                                  <ArrowUp className="w-4 h-4 shrink-0" aria-hidden />
                                )
                              ) : (
                                <ArrowUpDown className="w-4 h-4 shrink-0 opacity-50" aria-hidden />
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">
                            No activity yet. Start chatting to appear on the leaderboard!
                          </td>
                        </tr>
                      ) : (
                        data.leaderboard.map((entry) => (
                          <tr
                            key={entry.anonymousId}
                            className={cn(
                              "border-b border-border/80 hover:bg-muted/30 transition-colors",
                              entry.rank <= 3 && "bg-primary/5"
                            )}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-start">
                                <RankIcon rank={entry.rank} />
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-foreground">
                              {maskAnonymousId(entry.anonymousId)}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums">{entry.totalMessages}</td>
                            <td className="py-3 px-4 text-right tabular-nums">{entry.totalChats}</td>
                            <td className="py-3 px-4 text-right tabular-nums">{entry.totalToolCalls ?? 0}</td>
                            <td className="py-3 px-4 text-right tabular-nums">
                              {(entry.x402VolumeUsd ?? 0) > 0
                                ? `$${Number(entry.x402VolumeUsd).toFixed(2)}`
                                : "—"}
                            </td>
                            <td className="py-3 px-4 text-right text-muted-foreground">
                              {formatDate(entry.lastActiveAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {data.total > PAGE_SIZE && (
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(data.skip || 0) + 1}–{Math.min(data.skip + data.limit, data.total)} of {data.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!canPrev}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {pageNumbers.map((n) => (
                        <Button
                          key={n}
                          variant={page === n ? "secondary" : "ghost"}
                          size="sm"
                          className="min-w-[2rem]"
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
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={!canNext}
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
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
