import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Loader2,
  Trophy,
  RefreshCw,
  Sun,
  Moon,
  Users,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletNav } from "@/components/chat/WalletNav";
import {
  fetchTradingExperimentStats,
  fetchTradingExperimentSuites,
  normalizeExperimentSuite,
  MAX_USER_CUSTOM_STRATEGIES_PER_WALLET,
  createUserCustomStrategy,
  deleteUserCustomStrategy,
  fetchUserCustomStats,
  fetchUserCustomRuns,
  TRADING_EXPERIMENT_RUN_STATUSES,
  type TradingExperimentAgentStats,
  type TradingExperimentRunRow,
  type TradingExperimentSuiteId,
  type TradingExperimentSuiteMeta,
  type UserCustomStrategyAgentStats,
} from "@/lib/tradingExperimentApi";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TradingExperimentChartsPanel } from "@/components/experiment/TradingExperimentChartsPanel";
import { ExperimentTokenCombobox } from "@/components/experiment/ExperimentTokenCombobox";

/** Resolved wins+losses at or above this count use full win-rate ranking. */
const LEADERBOARD_MIN_DECIDED = 5;

const TABLE_PAGE_SIZE = 10;

type PageView = "lab" | "leaderboard" | "charts" | "my_agents";

type LeaderboardScope = "global" | "mine";

/** Row shape shared by global + custom agent leaderboard UIs. */
type LeaderboardViewRow = {
  key: string;
  name: string;
  subLabel: string;
  token: string;
  bar: string;
  idLabel: string;
  wins: number;
  losses: number;
  decided: number;
  winRatePct: number | null;
  openPositions: number;
  profileHref: string | null;
};

function leaderboardTierFromDecided(decided: number): 0 | 1 | 2 {
  if (decided === 0) return 2;
  if (decided < LEADERBOARD_MIN_DECIDED) return 1;
  return 0;
}

function leaderboardTier(a: TradingExperimentAgentStats): 0 | 1 | 2 {
  return leaderboardTierFromDecided(a.decided);
}

function leaderboardTierCustom(a: UserCustomStrategyAgentStats): 0 | 1 | 2 {
  return leaderboardTierFromDecided(a.decided);
}

function sortAgentsForLeaderboard(list: TradingExperimentAgentStats[]): TradingExperimentAgentStats[] {
  return [...list].sort((x, y) => {
    const tx = leaderboardTier(x);
    const ty = leaderboardTier(y);
    if (tx !== ty) return tx - ty;
    const rx = x.winRate ?? -1;
    const ry = y.winRate ?? -1;
    if (ry !== rx) return ry - rx;
    if (y.wins !== x.wins) return y.wins - x.wins;
    if (y.decided !== x.decided) return y.decided - x.decided;
    return x.agentId - y.agentId;
  });
}

function sortCustomAgentsForLeaderboard(
  list: UserCustomStrategyAgentStats[],
): UserCustomStrategyAgentStats[] {
  return [...list].sort((x, y) => {
    const tx = leaderboardTierCustom(x);
    const ty = leaderboardTierCustom(y);
    if (tx !== ty) return tx - ty;
    const rx = x.winRate ?? -1;
    const ry = y.winRate ?? -1;
    if (ry !== rx) return ry - rx;
    if (y.wins !== x.wins) return y.wins - x.wins;
    if (y.decided !== x.decided) return y.decided - x.decided;
    return x.strategyId.localeCompare(y.strategyId);
  });
}

function statusOptionLabel(s: string) {
  return s.replace(/_/g, " ");
}

function formatTime(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

function normalizeTableSearch(s: string): string {
  return s.trim().toLowerCase();
}

function sortedUniqueStrings(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function ExperimentTablePagination(props: {
  page: number;
  pageSize: number;
  totalItems: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}) {
  const { page, pageSize, totalItems, loading = false, onPageChange } = props;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  if (totalItems === 0) return null;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground tabular-nums">
        {start}–{end} of {totalItems}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={loading || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums px-1">
            Page {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={loading || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function TradingAgentExperiment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDarkMode, setIsDarkMode] = useState(
    () => !document.documentElement.classList.contains("light"),
  );
  const [activeSuite, setActiveSuite] = useState<TradingExperimentSuiteId>("primary");
  const [suiteMeta, setSuiteMeta] = useState<TradingExperimentSuiteMeta[]>([]);
  const [agents, setAgents] = useState<TradingExperimentAgentStats[]>([]);
  const [pageView, setPageView] = useState<PageView>("lab");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { publicKey, baseConnected, baseAddress, effectiveChain } = useWalletContext();
  const walletAddress = useMemo(() => {
    if (effectiveChain === "base" && baseConnected && baseAddress) return baseAddress;
    if (publicKey) return publicKey.toBase58();
    return null;
  }, [effectiveChain, baseConnected, baseAddress, publicKey]);

  const [myAgents, setMyAgents] = useState<UserCustomStrategyAgentStats[]>([]);
  const [myRuns, setMyRuns] = useState<TradingExperimentRunRow[]>([]);
  const [myRunsTotal, setMyRunsTotal] = useState(0);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formToken, setFormToken] = useState("bitcoin");
  const [formBar, setFormBar] = useState("1h");
  const [formLimit, setFormLimit] = useState("200");
  const [formLookAhead, setFormLookAhead] = useState("48");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [leaderboardScope, setLeaderboardScope] = useState<LeaderboardScope>("global");
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [labPage, setLabPage] = useState(1);
  const [myAgentsTablePage, setMyAgentsTablePage] = useState(1);
  const [myRunsPage, setMyRunsPage] = useState(1);

  const [labFilterSearch, setLabFilterSearch] = useState("");
  const [labFilterToken, setLabFilterToken] = useState<string>("all");
  const [labFilterBar, setLabFilterBar] = useState<string>("all");
  const [labFilterCex, setLabFilterCex] = useState<string>("all");
  const [labFilterOpen, setLabFilterOpen] = useState<"any" | "open" | "flat">("any");

  const [lbFilterSearch, setLbFilterSearch] = useState("");
  const [lbFilterToken, setLbFilterToken] = useState<string>("all");
  const [lbFilterBar, setLbFilterBar] = useState<string>("all");
  const [lbFilterSample, setLbFilterSample] = useState<"any" | "0" | "1" | "2">("any");

  const [myWinSearch, setMyWinSearch] = useState("");
  const [myWinToken, setMyWinToken] = useState<string>("all");
  const [myWinBar, setMyWinBar] = useState<string>("all");

  const [myRunsStatus, setMyRunsStatus] = useState<string>("");
  const [myRunsStrategyId, setMyRunsStrategyId] = useState<string>("");

  const [chartFilterSearch, setChartFilterSearch] = useState("");
  const [chartFilterToken, setChartFilterToken] = useState<string>("all");
  const [chartFilterBar, setChartFilterBar] = useState<string>("all");

  const load = useCallback(async () => {
    if (pageView === "my_agents") {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (pageView === "leaderboard") {
        if (leaderboardScope === "mine") {
          if (!walletAddress) {
            setMyAgents([]);
            return;
          }
          const custom = await fetchUserCustomStats(walletAddress);
          setMyAgents(custom.agents);
        } else {
          const stats = await fetchTradingExperimentStats(activeSuite);
          setAgents(stats.agents);
        }
      } else {
        const stats = await fetchTradingExperimentStats(activeSuite);
        setAgents(stats.agents);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [
    pageView,
    activeSuite,
    leaderboardScope,
    walletAddress,
  ]);

  const loadMyAgents = useCallback(async () => {
    if (!walletAddress) {
      setMyAgents([]);
      setMyRuns([]);
      setMyRunsTotal(0);
      return;
    }
    setMyError(null);
    setMyLoading(true);
    try {
      const stats = await fetchUserCustomStats(walletAddress);
      setMyAgents(stats.agents);
      const runData = await fetchUserCustomRuns({
        walletAddress,
        limit: TABLE_PAGE_SIZE,
        offset: (myRunsPage - 1) * TABLE_PAGE_SIZE,
        status: myRunsStatus.trim() || undefined,
        strategyId: myRunsStrategyId.trim() || undefined,
      });
      setMyRuns(runData.runs);
      setMyRunsTotal(runData.total);
    } catch (e) {
      setMyError(e instanceof Error ? e.message : String(e));
    } finally {
      setMyLoading(false);
    }
  }, [walletAddress, myRunsPage, myRunsStatus, myRunsStrategyId]);

  useEffect(() => {
    if (pageView !== "my_agents") return;
    loadMyAgents();
  }, [pageView, loadMyAgents]);

  const rankedAgents = useMemo(() => sortAgentsForLeaderboard(agents), [agents]);

  const rankedMyLeaderboardAgents = useMemo(
    () => sortCustomAgentsForLeaderboard(myAgents),
    [myAgents],
  );

  const rankedLeaderboardRows: LeaderboardViewRow[] = useMemo(() => {
    if (leaderboardScope === "global") {
      return rankedAgents.map((a) => ({
        key: `g-${a.agentId}`,
        name: a.name,
        subLabel: `#${a.agentId} · ${a.token} · ${a.bar}`,
        token: a.token,
        bar: a.bar,
        idLabel: String(a.agentId),
        wins: a.wins,
        losses: a.losses,
        decided: a.decided,
        winRatePct: a.winRatePct,
        openPositions: a.openPositions,
        profileHref: `/experiment/trading-agent/agent/${a.agentId}?suite=${encodeURIComponent(activeSuite)}`,
      }));
    }
    return rankedMyLeaderboardAgents.map((a) => ({
      key: `m-${a.strategyId}`,
      name: a.name,
      subLabel: `#${a.strategyId.slice(-6)} · ${a.token} · ${a.bar}`,
      token: a.token,
      bar: a.bar,
      idLabel: a.strategyId,
      wins: a.wins,
      losses: a.losses,
      decided: a.decided,
      winRatePct: a.winRatePct,
      openPositions: a.openPositions,
      profileHref: null,
    }));
  }, [leaderboardScope, rankedAgents, rankedMyLeaderboardAgents, activeSuite]);

  const filteredLeaderboardRows = useMemo(() => {
    const q = normalizeTableSearch(lbFilterSearch);
    return rankedLeaderboardRows.filter((row) => {
      if (lbFilterToken !== "all" && row.token !== lbFilterToken) return false;
      if (lbFilterBar !== "all" && row.bar !== lbFilterBar) return false;
      if (lbFilterSample !== "any") {
        const tier = leaderboardTierFromDecided(row.decided);
        if (lbFilterSample === "0" && tier !== 0) return false;
        if (lbFilterSample === "1" && tier !== 1) return false;
        if (lbFilterSample === "2" && tier !== 2) return false;
      }
      if (!q) return true;
      const hay = `${row.name} ${row.subLabel} ${row.idLabel} ${row.token} ${row.bar}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rankedLeaderboardRows, lbFilterSearch, lbFilterToken, lbFilterBar, lbFilterSample]);

  const filteredLabAgents = useMemo(() => {
    const q = normalizeTableSearch(labFilterSearch);
    return agents.filter((a) => {
      if (labFilterToken !== "all" && a.token !== labFilterToken) return false;
      if (labFilterBar !== "all" && a.bar !== labFilterBar) return false;
      if (activeSuite === "multi_resource" && labFilterCex !== "all") {
        const cex = (a.cexSource ?? "").trim();
        if (cex !== labFilterCex) return false;
      }
      if (labFilterOpen === "open" && a.openPositions <= 0) return false;
      if (labFilterOpen === "flat" && a.openPositions > 0) return false;
      if (!q) return true;
      const hay = `${a.name} ${a.agentId} ${a.token} ${a.bar}`.toLowerCase();
      return hay.includes(q);
    });
  }, [agents, labFilterSearch, labFilterToken, labFilterBar, labFilterCex, labFilterOpen, activeSuite]);

  const filteredMyAgentsWin = useMemo(() => {
    const q = normalizeTableSearch(myWinSearch);
    return myAgents.filter((a) => {
      if (myWinToken !== "all" && a.token !== myWinToken) return false;
      if (myWinBar !== "all" && a.bar !== myWinBar) return false;
      if (!q) return true;
      const hay = `${a.name} ${a.strategyId} ${a.token} ${a.bar}`.toLowerCase();
      return hay.includes(q);
    });
  }, [myAgents, myWinSearch, myWinToken, myWinBar]);

  const labTokenOptions = useMemo(() => sortedUniqueStrings(agents.map((a) => a.token)), [agents]);
  const labBarOptions = useMemo(() => sortedUniqueStrings(agents.map((a) => a.bar)), [agents]);
  const labCexOptions = useMemo(
    () => sortedUniqueStrings(agents.map((a) => (a.cexSource ?? "").trim()).filter(Boolean)),
    [agents],
  );

  const lbTokenOptions = useMemo(
    () => sortedUniqueStrings(rankedLeaderboardRows.map((r) => r.token)),
    [rankedLeaderboardRows],
  );
  const lbBarOptions = useMemo(
    () => sortedUniqueStrings(rankedLeaderboardRows.map((r) => r.bar)),
    [rankedLeaderboardRows],
  );

  const myWinTokenOptions = useMemo(() => sortedUniqueStrings(myAgents.map((a) => a.token)), [myAgents]);
  const myWinBarOptions = useMemo(() => sortedUniqueStrings(myAgents.map((a) => a.bar)), [myAgents]);

  const chartTokenOptions = useMemo(() => sortedUniqueStrings(agents.map((a) => a.token)), [agents]);
  const chartBarOptions = useMemo(() => sortedUniqueStrings(agents.map((a) => a.bar)), [agents]);

  const filteredChartAgents = useMemo(() => {
    const q = normalizeTableSearch(chartFilterSearch);
    return agents.filter((a) => {
      if (chartFilterToken !== "all" && a.token !== chartFilterToken) return false;
      if (chartFilterBar !== "all" && a.bar !== chartFilterBar) return false;
      if (!q) return true;
      const hay = `${a.name} ${a.agentId} ${a.token} ${a.bar}`.toLowerCase();
      return hay.includes(q);
    });
  }, [agents, chartFilterSearch, chartFilterToken, chartFilterBar]);

  const pagedLeaderboardRows = useMemo(() => {
    const start = (leaderboardPage - 1) * TABLE_PAGE_SIZE;
    return filteredLeaderboardRows.slice(start, start + TABLE_PAGE_SIZE);
  }, [filteredLeaderboardRows, leaderboardPage]);

  const pagedLabAgents = useMemo(() => {
    const start = (labPage - 1) * TABLE_PAGE_SIZE;
    return filteredLabAgents.slice(start, start + TABLE_PAGE_SIZE);
  }, [filteredLabAgents, labPage]);

  const pagedMyAgentsWin = useMemo(() => {
    const start = (myAgentsTablePage - 1) * TABLE_PAGE_SIZE;
    return filteredMyAgentsWin.slice(start, start + TABLE_PAGE_SIZE);
  }, [filteredMyAgentsWin, myAgentsTablePage]);

  useEffect(() => {
    setLeaderboardPage(1);
  }, [activeSuite, leaderboardScope, lbFilterSearch, lbFilterToken, lbFilterBar, lbFilterSample]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(filteredLeaderboardRows.length / TABLE_PAGE_SIZE));
    setLeaderboardPage((p) => Math.min(Math.max(1, p), maxP));
  }, [filteredLeaderboardRows.length]);

  useEffect(() => {
    setLabPage(1);
  }, [activeSuite, labFilterSearch, labFilterToken, labFilterBar, labFilterCex, labFilterOpen]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(filteredLabAgents.length / TABLE_PAGE_SIZE));
    setLabPage((p) => Math.min(Math.max(1, p), maxP));
  }, [filteredLabAgents.length]);

  useEffect(() => {
    setMyAgentsTablePage(1);
  }, [walletAddress, myAgents.length, myWinSearch, myWinToken, myWinBar]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(filteredMyAgentsWin.length / TABLE_PAGE_SIZE));
    setMyAgentsTablePage((p) => Math.min(Math.max(1, p), maxP));
  }, [filteredMyAgentsWin.length]);

  useEffect(() => {
    setMyRunsPage(1);
  }, [myRunsStatus, myRunsStrategyId]);

  useEffect(() => {
    setChartFilterSearch("");
    setChartFilterToken("all");
    setChartFilterBar("all");
  }, [activeSuite]);

  useEffect(() => {
    setMyRunsPage(1);
  }, [walletAddress]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(myRunsTotal / TABLE_PAGE_SIZE));
    setMyRunsPage((p) => Math.min(Math.max(1, p), maxP));
  }, [myRunsTotal]);

  useEffect(() => {
    fetchTradingExperimentSuites()
      .then(setSuiteMeta)
      .catch(() => setSuiteMeta([]));
  }, []);

  useEffect(() => {
    const raw = searchParams.get("suite");
    if (raw) {
      setActiveSuite(normalizeExperimentSuite(raw));
    }
  }, [searchParams]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  const onSuiteChange = (v: string) => {
    const id = v as TradingExperimentSuiteId;
    setActiveSuite(id);
    setSearchParams({ suite: id });
  };

  const agentProfileHref = (agentId: number) =>
    `/experiment/trading-agent/agent/${agentId}?suite=${encodeURIComponent(activeSuite)}`;

  const onCreateMyStrategy = async (e: FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return;
    const limit = Number(formLimit);
    const lookAheadBars = Number(formLookAhead);
    if (!formName.trim()) {
      setMyError("Name is required");
      return;
    }
    if (!Number.isFinite(limit) || !Number.isFinite(lookAheadBars)) {
      setMyError("Limit and look-ahead bars must be numbers");
      return;
    }
    setCreating(true);
    setMyError(null);
    try {
      await createUserCustomStrategy({
        walletAddress,
        name: formName.trim(),
        token: formToken.trim() || "bitcoin",
        bar: formBar,
        limit,
        lookAheadBars,
      });
      setFormName("");
      setCreateModalOpen(false);
      setMyRunsPage(1);
      await loadMyAgents();
    } catch (err) {
      setMyError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const onDeleteMyStrategy = async (strategyId: string) => {
    if (!walletAddress) return;
    setDeletingId(strategyId);
    setMyError(null);
    try {
      await deleteUserCustomStrategy(walletAddress, strategyId);
      await loadMyAgents();
    } catch (err) {
      setMyError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  };

  const showLeaderboardScopeSelect = pageView === "leaderboard";

  const showExperimentSelect =
    pageView === "lab" ||
    pageView === "charts" ||
    (pageView === "leaderboard" && leaderboardScope === "global");

  const experimentSelectOptions = useMemo((): TradingExperimentSuiteMeta[] => {
    const base =
      suiteMeta.length > 0
        ? suiteMeta
        : [
            { id: "primary", title: "Experiment 1", description: "" },
            { id: "secondary", title: "Experiment 2", description: "" },
          ];
    if (base.some((m) => m.id === activeSuite)) return base;
    return [...base, { id: activeSuite, title: activeSuite, description: "" }];
  }, [suiteMeta, activeSuite]);

  const onLeaderboardScopeChange = (v: string) => {
    setLeaderboardScope(v as LeaderboardScope);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-b border-border bg-background/80 backdrop-blur-xl min-h-[52px] shrink-0 sticky top-0 z-20">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link to="/">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                title="Back to chat"
                aria-label="Back to chat"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <FlaskConical className="w-5 h-5 text-primary shrink-0" />
              <h1 className="text-sm font-bold text-foreground truncate">Trading agent experiment</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setIsDarkMode((d) => !d)}
              title={isDarkMode ? "Light mode" : "Dark mode"}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <WalletNav />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Tabs
          value={pageView}
          onValueChange={(v) => setPageView(v as PageView)}
          className="w-full"
        >
          <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <TabsList className="grid h-10 w-full max-w-md grid-cols-4 gap-1 p-1 sm:w-[32rem] sm:max-w-none sm:shrink-0">
              <TabsTrigger
                value="lab"
                className="min-w-0 px-1.5 text-xs sm:text-sm gap-1 data-[state=active]:shadow-sm"
              >
                <FlaskConical className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">Lab</span>
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="min-w-0 px-1.5 text-xs sm:text-sm gap-1 data-[state=active]:shadow-sm"
              >
                <Trophy className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">Leaderboard</span>
              </TabsTrigger>
              <TabsTrigger
                value="charts"
                className="min-w-0 px-1.5 text-xs sm:text-sm gap-1 data-[state=active]:shadow-sm"
              >
                <BarChart3 className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">Charts</span>
              </TabsTrigger>
              <TabsTrigger
                value="my_agents"
                className="min-w-0 px-1.5 text-xs sm:text-sm gap-1 data-[state=active]:shadow-sm"
              >
                <Users className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">My agents</span>
              </TabsTrigger>
            </TabsList>
            <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto sm:min-w-0 sm:flex-1 min-w-0 overflow-x-auto overscroll-x-contain py-0.5 [scrollbar-width:thin]">
              {showLeaderboardScopeSelect ? (
                <Select value={leaderboardScope} onValueChange={onLeaderboardScopeChange}>
                  <SelectTrigger
                    id="leaderboard-scope"
                    aria-label="Ranking scope"
                    title="Ranking: all agents or your wallet agents only"
                    className="h-9 w-[9.5rem] sm:w-[10.5rem] shrink-0 text-sm [&>span]:truncate"
                  >
                    <SelectValue placeholder="Ranking" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">All agents</SelectItem>
                    <SelectItem value="mine">My agents</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {showExperimentSelect ? (
                <Select value={activeSuite} onValueChange={onSuiteChange}>
                  <SelectTrigger
                    id="experiment-suite"
                    aria-label="Experiment suite"
                    title={experimentSelectOptions.find((m) => m.id === activeSuite)?.title ?? "Select experiment"}
                    className="h-9 w-[10.5rem] sm:w-[12.5rem] shrink-0 text-sm [&>span]:truncate"
                  >
                    <SelectValue placeholder="Experiment" />
                  </SelectTrigger>
                  <SelectContent>
                    {experimentSelectOptions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              {pageView !== "my_agents" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 shrink-0 p-0 sm:h-9 sm:w-auto sm:gap-2 sm:px-3"
                  onClick={() => load()}
                  disabled={loading}
                  title="Refresh"
                  aria-label="Refresh"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              ) : null}
              {pageView === "my_agents" && walletAddress ? (
                <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums pr-0.5 max-sm:hidden">
                    {myAgents.length}/{MAX_USER_CUSTOM_STRATEGIES_PER_WALLET}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 shrink-0 px-2 sm:px-3"
                    onClick={() => setCreateModalOpen(true)}
                    disabled={myAgents.length >= MAX_USER_CUSTOM_STRATEGIES_PER_WALLET}
                    title="Create agent"
                  >
                    <span className="hidden min-[400px]:inline">Create</span>
                    <span className="min-[400px]:hidden">+</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 shrink-0 p-0 sm:h-9 sm:w-auto sm:gap-2 sm:px-3"
                    onClick={() => loadMyAgents()}
                    disabled={myLoading}
                    title="Refresh"
                    aria-label="Refresh"
                  >
                    {myLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

          <TabsContent value="lab" className="mt-6 space-y-3 outline-none">
            <div className="space-y-3">
            {agents.length > 0 ? (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
                <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                  <div className="space-y-1.5 min-w-[140px] flex-1 sm:max-w-[240px]">
                    <Label htmlFor="lab-search" className="text-xs text-muted-foreground">
                      Search
                    </Label>
                    <Input
                      id="lab-search"
                      value={labFilterSearch}
                      onChange={(e) => setLabFilterSearch(e.target.value)}
                      placeholder="Name, ID, pair…"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5 w-[min(100%,140px)] sm:w-[140px]">
                    <Label className="text-xs text-muted-foreground">Pair</Label>
                    <Select value={labFilterToken} onValueChange={setLabFilterToken}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All pairs</SelectItem>
                        {labTokenOptions.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 w-[min(100%,120px)] sm:w-[120px]">
                    <Label className="text-xs text-muted-foreground">Bar</Label>
                    <Select value={labFilterBar} onValueChange={setLabFilterBar}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {labBarOptions.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {activeSuite === "multi_resource" ? (
                    <div className="space-y-1.5 w-[min(100%,140px)] sm:w-[140px]">
                      <Label className="text-xs text-muted-foreground">CEX</Label>
                      <Select value={labFilterCex} onValueChange={setLabFilterCex}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {labCexOptions.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <div className="space-y-1.5 min-w-[min(100%,160px)] sm:min-w-[168px]">
                    <Label className="text-xs text-muted-foreground">Open positions</Label>
                    <Select
                      value={labFilterOpen}
                      onValueChange={(v) => setLabFilterOpen(v as "any" | "open" | "flat")}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="open">Has open</SelectItem>
                        <SelectItem value="flat">None open</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      setLabFilterSearch("");
                      setLabFilterToken("all");
                      setLabFilterBar("all");
                      setLabFilterCex("all");
                      setLabFilterOpen("any");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    {activeSuite === "multi_resource" ? <TableHead>CEX</TableHead> : null}
                    <TableHead>Pair</TableHead>
                    <TableHead>Bar</TableHead>
                    <TableHead className="text-right">W</TableHead>
                    <TableHead className="text-right">L</TableHead>
                    <TableHead className="text-right">Win %</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && agents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={activeSuite === "multi_resource" ? 9 : 8}
                        className="text-center text-muted-foreground py-10"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                          Loading…
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {!loading && agents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={activeSuite === "multi_resource" ? 9 : 8}
                        className="text-center text-muted-foreground py-10"
                      >
                        No agents for this experiment.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {!loading && agents.length > 0 && filteredLabAgents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={activeSuite === "multi_resource" ? 9 : 8}
                        className="text-center text-muted-foreground py-10"
                      >
                        No agents match these filters.{" "}
                        <button
                          type="button"
                          className="text-primary underline underline-offset-2 font-medium"
                          onClick={() => {
                            setLabFilterSearch("");
                            setLabFilterToken("all");
                            setLabFilterBar("all");
                            setLabFilterCex("all");
                            setLabFilterOpen("any");
                          }}
                        >
                          Clear filters
                        </button>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {pagedLabAgents.map((a) => (
                    <TableRow key={a.agentId}>
                      <TableCell className="font-mono text-muted-foreground">{a.agentId}</TableCell>
                      <TableCell className="font-medium">
                        <Link
                          to={agentProfileHref(a.agentId)}
                          className="text-foreground font-medium hover:text-primary hover:underline underline-offset-2"
                        >
                          {a.name}
                        </Link>
                      </TableCell>
                      {activeSuite === "multi_resource" ? (
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {a.cexSource ?? "—"}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-muted-foreground">{a.token}</TableCell>
                      <TableCell className="text-muted-foreground">{a.bar}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.wins}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.losses}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {a.winRatePct != null ? `${a.winRatePct}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{a.openPositions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ExperimentTablePagination
              page={labPage}
              pageSize={TABLE_PAGE_SIZE}
              totalItems={filteredLabAgents.length}
              loading={loading}
              onPageChange={setLabPage}
            />
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6 space-y-3 outline-none">
            <div className="space-y-3">
            {rankedLeaderboardRows.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
                  <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                    <div className="space-y-1.5 min-w-[140px] flex-1 sm:max-w-[240px]">
                      <Label htmlFor="lb-search" className="text-xs text-muted-foreground">
                        Search
                      </Label>
                      <Input
                        id="lb-search"
                        value={lbFilterSearch}
                        onChange={(e) => setLbFilterSearch(e.target.value)}
                        placeholder="Agent, pair, ID…"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5 w-[min(100%,140px)] sm:w-[140px]">
                      <Label className="text-xs text-muted-foreground">Pair</Label>
                      <Select value={lbFilterToken} onValueChange={setLbFilterToken}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All pairs</SelectItem>
                          {lbTokenOptions.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 w-[min(100%,120px)] sm:w-[120px]">
                      <Label className="text-xs text-muted-foreground">Bar</Label>
                      <Select value={lbFilterBar} onValueChange={setLbFilterBar}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {lbBarOptions.map((b) => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 min-w-[min(100%,200px)] sm:min-w-[200px]">
                      <Label className="text-xs text-muted-foreground">Sample size</Label>
                      <Select
                        value={lbFilterSample}
                        onValueChange={(v) => setLbFilterSample(v as "any" | "0" | "1" | "2")}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="0">{`${LEADERBOARD_MIN_DECIDED}+ resolved`}</SelectItem>
                          <SelectItem value="1">{`<${LEADERBOARD_MIN_DECIDED} resolved`}</SelectItem>
                          <SelectItem value="2">No resolved yet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        setLbFilterSearch("");
                        setLbFilterToken("all");
                        setLbFilterBar("all");
                        setLbFilterSample("any");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="rounded-md border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">Rank</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Pair</TableHead>
                        <TableHead>Bar</TableHead>
                        <TableHead className="text-right">W</TableHead>
                        <TableHead className="text-right">L</TableHead>
                        <TableHead className="text-right">Win %</TableHead>
                        <TableHead className="text-right">Open</TableHead>
                        <TableHead className="text-right">Sample</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeaderboardRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                            No agents match these filters.{" "}
                            <button
                              type="button"
                              className="text-primary underline underline-offset-2 font-medium"
                              onClick={() => {
                                setLbFilterSearch("");
                                setLbFilterToken("all");
                                setLbFilterBar("all");
                                setLbFilterSample("any");
                              }}
                            >
                              Clear filters
                            </button>
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {filteredLeaderboardRows.length > 0 &&
                        pagedLeaderboardRows.map((row, idx) => {
                        const tier = leaderboardTierFromDecided(row.decided);
                        const tierLabel =
                          tier === 0 ? `${LEADERBOARD_MIN_DECIDED}+` : tier === 1 ? `<${LEADERBOARD_MIN_DECIDED}` : "—";
                        const idDisplay =
                          leaderboardScope === "global" ? `#${row.idLabel}` : `…${row.idLabel.slice(-6)}`;
                        const globalRank = (leaderboardPage - 1) * TABLE_PAGE_SIZE + idx + 1;
                        return (
                          <TableRow
                            key={row.key}
                            className={cn(
                              globalRank === 1 && "bg-amber-500/5",
                              globalRank === 2 && "bg-slate-500/5",
                              globalRank === 3 && "bg-amber-950/10",
                            )}
                          >
                            <TableCell className="font-semibold tabular-nums text-muted-foreground">{globalRank}</TableCell>
                            <TableCell>
                              {row.profileHref ? (
                                <Link
                                  to={row.profileHref}
                                  className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2"
                                >
                                  {row.name}
                                </Link>
                              ) : (
                                <span className="font-medium text-foreground">{row.name}</span>
                              )}
                              <span
                                className="font-mono text-xs text-muted-foreground ml-2 max-w-[100px] inline-block align-bottom truncate"
                                title={leaderboardScope === "mine" ? row.idLabel : undefined}
                              >
                                {idDisplay}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{row.token}</TableCell>
                            <TableCell className="text-muted-foreground">{row.bar}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.wins}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.losses}</TableCell>
                            <TableCell className="text-right tabular-nums font-medium">
                              {row.winRatePct != null ? `${row.winRatePct}%` : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{row.openPositions}</TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground tabular-nums">{tierLabel}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <ExperimentTablePagination
                  page={leaderboardPage}
                  pageSize={TABLE_PAGE_SIZE}
                  totalItems={filteredLeaderboardRows.length}
                  loading={loading}
                  onPageChange={setLeaderboardPage}
                />
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Rank</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Pair</TableHead>
                      <TableHead>Bar</TableHead>
                      <TableHead className="text-right">W</TableHead>
                      <TableHead className="text-right">L</TableHead>
                      <TableHead className="text-right">Win %</TableHead>
                      <TableHead className="text-right">Open</TableHead>
                      <TableHead className="text-right">Sample</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                        {loading ? (
                          <span className="inline-flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                            Loading…
                          </span>
                        ) : leaderboardScope === "mine" && !walletAddress ? (
                          "Connect your Solana or Base wallet to see your agents here."
                        ) : leaderboardScope === "mine" && walletAddress ? (
                          <>
                            No custom agents yet. Open the{" "}
                            <button
                              type="button"
                              className="text-primary underline underline-offset-2 font-medium"
                              onClick={() => setPageView("my_agents")}
                            >
                              My agents
                            </button>{" "}
                            tab to create one.
                          </>
                        ) : (
                          "No agents loaded for this experiment yet."
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
            </div>
          </TabsContent>

          <TabsContent value="charts" className="mt-6 space-y-3 outline-none">
            <div className="space-y-3">
            {agents.length > 0 ? (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
                <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                  <div className="space-y-1.5 min-w-[140px] flex-1 sm:max-w-[240px]">
                    <Label htmlFor="chart-search" className="text-xs text-muted-foreground">
                      Search
                    </Label>
                    <Input
                      id="chart-search"
                      value={chartFilterSearch}
                      onChange={(e) => setChartFilterSearch(e.target.value)}
                      placeholder="Name, ID, pair…"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5 w-[min(100%,140px)] sm:w-[140px]">
                    <Label className="text-xs text-muted-foreground">Pair</Label>
                    <Select value={chartFilterToken} onValueChange={setChartFilterToken}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All pairs</SelectItem>
                        {chartTokenOptions.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 w-[min(100%,120px)] sm:w-[120px]">
                    <Label className="text-xs text-muted-foreground">Bar</Label>
                    <Select value={chartFilterBar} onValueChange={setChartFilterBar}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {chartBarOptions.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      setChartFilterSearch("");
                      setChartFilterToken("all");
                      setChartFilterBar("all");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : null}
            <TradingExperimentChartsPanel
              agents={filteredChartAgents}
              chartRuns={[]}
              loading={loading}
              agentProfileHref={agentProfileHref}
              emptyMessage={
                !loading && agents.length > 0 && filteredChartAgents.length === 0
                  ? "No agents match these filters."
                  : undefined
              }
            />
            </div>
          </TabsContent>

          <TabsContent value="my_agents" className="mt-6 space-y-6 outline-none">
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create strategy agent</DialogTitle>
                  <DialogDescription>
                    Build one custom strategy for this wallet. Limit: {MAX_USER_CUSTOM_STRATEGIES_PER_WALLET} agents.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onCreateMyStrategy} className="space-y-4">
                  {myError ? (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {myError}
                    </div>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="my-agent-name">Name</Label>
                      <Input
                        id="my-agent-name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. My BTC 1h swing"
                        maxLength={80}
                        required
                      />
                    </div>
                    <ExperimentTokenCombobox
                      id="my-agent-token"
                      label="Token"
                      value={formToken}
                      onChange={setFormToken}
                    />
                    <div className="space-y-2">
                      <Label>Bar</Label>
                      <Select value={formBar} onValueChange={setFormBar}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["15m", "30m", "1h", "4h", "1d"].map((b) => (
                            <SelectItem key={b} value={b}>
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="my-agent-limit">Kline limit</Label>
                      <Input
                        id="my-agent-limit"
                        type="number"
                        min={50}
                        max={500}
                        value={formLimit}
                        onChange={(e) => setFormLimit(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="my-agent-la">Look-ahead bars</Label>
                      <Input
                        id="my-agent-la"
                        type="number"
                        min={1}
                        max={720}
                        value={formLookAhead}
                        onChange={(e) => setFormLookAhead(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={creating || myAgents.length >= MAX_USER_CUSTOM_STRATEGIES_PER_WALLET}
                    >
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Create agent
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {!walletAddress ? (
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Pair</TableHead>
                      <TableHead>Bar</TableHead>
                      <TableHead className="text-right">W</TableHead>
                      <TableHead className="text-right">L</TableHead>
                      <TableHead className="text-right">Win %</TableHead>
                      <TableHead className="text-right">Open</TableHead>
                      <TableHead className="w-12 text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                        Connect your Solana or Base wallet to create agents and view stats.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  {myAgents.length > 0 ? (
                    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
                      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                        <div className="space-y-1.5 min-w-[140px] flex-1 sm:max-w-[240px]">
                          <Label htmlFor="my-win-search" className="text-xs text-muted-foreground">
                            Search
                          </Label>
                          <Input
                            id="my-win-search"
                            value={myWinSearch}
                            onChange={(e) => setMyWinSearch(e.target.value)}
                            placeholder="Name, strategy ID…"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5 w-[min(100%,140px)] sm:w-[140px]">
                          <Label className="text-xs text-muted-foreground">Pair</Label>
                          <Select value={myWinToken} onValueChange={setMyWinToken}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All pairs</SelectItem>
                              {myWinTokenOptions.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5 w-[min(100%,120px)] sm:w-[120px]">
                          <Label className="text-xs text-muted-foreground">Bar</Label>
                          <Select value={myWinBar} onValueChange={setMyWinBar}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              {myWinBarOptions.map((b) => (
                                <SelectItem key={b} value={b}>
                                  {b}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9"
                          onClick={() => {
                            setMyWinSearch("");
                            setMyWinToken("all");
                            setMyWinBar("all");
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="rounded-md border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Pair</TableHead>
                          <TableHead>Bar</TableHead>
                          <TableHead className="text-right">W</TableHead>
                          <TableHead className="text-right">L</TableHead>
                          <TableHead className="text-right">Win %</TableHead>
                          <TableHead className="text-right">Open</TableHead>
                          <TableHead className="w-12 text-right" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myLoading && myAgents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                              <span className="inline-flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                                Loading…
                              </span>
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {!myLoading && myAgents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                              No custom agents yet. Use Create agent in the toolbar to add one.
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {!myLoading && myAgents.length > 0 && filteredMyAgentsWin.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                              No agents match these filters.{" "}
                              <button
                                type="button"
                                className="text-primary underline underline-offset-2 font-medium"
                                onClick={() => {
                                  setMyWinSearch("");
                                  setMyWinToken("all");
                                  setMyWinBar("all");
                                }}
                              >
                                Clear filters
                              </button>
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {!myLoading &&
                          myAgents.length > 0 &&
                          filteredMyAgentsWin.length > 0 &&
                          pagedMyAgentsWin.map((a: UserCustomStrategyAgentStats) => (
                            <TableRow key={a.strategyId}>
                              <TableCell className="font-medium">{a.name}</TableCell>
                              <TableCell className="text-muted-foreground">{a.token}</TableCell>
                              <TableCell className="text-muted-foreground">{a.bar}</TableCell>
                              <TableCell className="text-right tabular-nums">{a.wins}</TableCell>
                              <TableCell className="text-right tabular-nums">{a.losses}</TableCell>
                              <TableCell className="text-right tabular-nums font-medium">
                                {a.winRatePct != null ? `${a.winRatePct}%` : "—"}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{a.openPositions}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  title={
                                    a.openPositions > 0
                                      ? "Delete disabled while a run is open"
                                      : "Delete agent"
                                  }
                                  disabled={deletingId === a.strategyId || a.openPositions > 0}
                                  onClick={() => onDeleteMyStrategy(a.strategyId)}
                                >
                                  {deletingId === a.strategyId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  {myAgents.length > 0 ? (
                    <ExperimentTablePagination
                      page={myAgentsTablePage}
                      pageSize={TABLE_PAGE_SIZE}
                      totalItems={filteredMyAgentsWin.length}
                      loading={myLoading}
                      onPageChange={setMyAgentsTablePage}
                    />
                  ) : null}
                </div>

                <div className="space-y-3">
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
                  <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                    <div className="space-y-1.5 w-[min(100%,200px)] sm:w-[200px]">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Select
                        value={myRunsStatus.trim() ? myRunsStatus : "all"}
                        onValueChange={(v) => setMyRunsStatus(v === "all" ? "" : v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {TRADING_EXPERIMENT_RUN_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusOptionLabel(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 min-w-[min(100%,220px)] sm:min-w-[240px] flex-1 sm:max-w-[320px]">
                      <Label className="text-xs text-muted-foreground">Strategy</Label>
                      <Select
                        value={myRunsStrategyId.trim() ? myRunsStrategyId : "all"}
                        onValueChange={(v) => setMyRunsStrategyId(v === "all" ? "" : v)}
                      >
                        <SelectTrigger className="h-9 [&>span]:truncate">
                          <SelectValue placeholder="All strategies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All strategies</SelectItem>
                          {myAgents.map((a) => (
                            <SelectItem key={a.strategyId} value={a.strategyId}>
                              {a.name.length > 40 ? `${a.name.slice(0, 38)}…` : a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        setMyRunsStatus("");
                        setMyRunsStrategyId("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="rounded-md border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Signal</TableHead>
                        <TableHead>Symbol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myLoading && myRuns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" aria-hidden />
                            Loading…
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {!myLoading && myRunsTotal === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            {myRunsStatus.trim() || myRunsStrategyId.trim()
                              ? "No runs match these filters."
                              : "No experiment runs for this wallet yet."}
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {!myLoading && myRunsTotal > 0 && myRuns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No runs on this page match the current filters.
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {!myLoading &&
                        myRuns.map((r) => (
                          <TableRow key={r._id}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(r.createdAt)}
                            </TableCell>
                            <TableCell className="text-xs">{statusOptionLabel(r.status)}</TableCell>
                            <TableCell className="font-mono text-xs">{r.clearSignal}</TableCell>
                            <TableCell className="text-xs">{r.symbol}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                <ExperimentTablePagination
                  page={myRunsPage}
                  pageSize={TABLE_PAGE_SIZE}
                  totalItems={myRunsTotal}
                  loading={myLoading}
                  onPageChange={setMyRunsPage}
                />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
