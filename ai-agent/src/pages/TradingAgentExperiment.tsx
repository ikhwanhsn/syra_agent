import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Compass,
  FlaskConical,
  Loader2,
  Trophy,
  RefreshCw,
  Sun,
  Moon,
  Users,
  Trash2,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletNav } from "@/components/chat/WalletNav";
import {
  decodeExperimentLabAgentId,
  fetchTradingExperimentStatsAll,
  TRADING_EXPERIMENT_LAB_SUITES,
  MAX_USER_CUSTOM_STRATEGIES_PER_WALLET,
  createUserCustomStrategy,
  deleteUserCustomStrategy,
  fetchUserCustomStats,
  fetchUserCustomRuns,
  fetchTradingExperimentRuns,
  normalizeExperimentSuite,
  TRADING_EXPERIMENT_RUN_STATUSES,
  type TradingExperimentAgentStats,
  type TradingExperimentRunRow,
  type TradingExperimentSuiteId,
  type UserCustomStrategyAgentStats,
} from "@/lib/tradingExperimentApi";
import {
  explorerRunStatusBadgeClass,
  explorerSignalBadgeClass,
} from "@/lib/tradingExperimentRunBadges";
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
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TradingExperimentChartsPanel } from "@/components/experiment/TradingExperimentChartsPanel";
import { ExperimentTokenCombobox } from "@/components/experiment/ExperimentTokenCombobox";
import { AgentBackgroundLiveIndicator } from "@/components/experiment/AgentBackgroundLiveIndicator";
import { CoingeckoBatchImageProvider } from "@/contexts/CoingeckoBatchImageContext";
import { CoinLogo } from "@/components/crypto/CoinLogo";

/** Resolved wins+losses at or above this count use full win-rate ranking. */
const LEADERBOARD_MIN_DECIDED = 5;

/** Client route for trading experiment (under dashboard). */
const TRADING_EXPERIMENT_ROUTE_BASE = "/dashboard/trading-experiment";

const TABLE_PAGE_SIZE = 10;

/** Paginated merged run history on the Explorer tab. */
const EXPLORER_PAGE_SIZE = 25;

function labAgentProfileHref(a: Pick<TradingExperimentAgentStats, "agentId" | "experimentSuite">): string {
  const suite = a.experimentSuite ?? "primary";
  return `${TRADING_EXPERIMENT_ROUTE_BASE}/agent/${a.agentId}?suite=${encodeURIComponent(suite)}`;
}

function labAgentRowKey(a: TradingExperimentAgentStats): string {
  return a.experimentSuite != null ? `${a.experimentSuite}-${a.agentId}` : String(a.agentId);
}

function formatPairLabel(token: string): string {
  if (!token) return "—";
  return token
    .split(/[\s_-]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

function winRateVisualClass(pct: number | null | undefined): string {
  if (pct == null) return "text-muted-foreground";
  if (pct >= 60) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 45) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function ledgerRank(s: TradingExperimentSuiteId | undefined): number {
  if (!s) return 99;
  const i = TRADING_EXPERIMENT_LAB_SUITES.indexOf(s);
  return i >= 0 ? i : 99;
}

type PageView = "lab" | "leaderboard" | "charts" | "explorer" | "my_agents";

type ExplorerLedgerFilter = "all" | TradingExperimentSuiteId;

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
  ledgerRank: number;
  /** Present for global lab agents (profile links + search). */
  experimentSuite?: TradingExperimentSuiteId;
};

function leaderboardTierFromDecided(decided: number): 0 | 1 | 2 {
  if (decided === 0) return 2;
  if (decided < LEADERBOARD_MIN_DECIDED) return 1;
  return 0;
}

type SortOrder = "asc" | "desc";

type LabSortKey = "id" | "suite" | "name" | "cex" | "pair" | "bar" | "wins" | "losses" | "winRate" | "open";

type LeaderboardSortKey =
  | "rank"
  | "ledger"
  | "agent"
  | "pair"
  | "bar"
  | "wins"
  | "losses"
  | "winRate"
  | "open"
  | "sample";

type MyAgentsWinSortKey = "name" | "pair" | "bar" | "wins" | "losses" | "winRate" | "open";

type MyRunsSortKey = "time" | "status" | "signal" | "symbol";

function defaultOrderLab(key: LabSortKey): SortOrder {
  if (key === "name" || key === "pair" || key === "bar" || key === "cex" || key === "suite") return "asc";
  return "desc";
}

function defaultOrderLeaderboard(key: LeaderboardSortKey): SortOrder {
  if (key === "agent" || key === "pair" || key === "bar" || key === "ledger") return "asc";
  return "desc";
}

function defaultOrderMyAgentsWin(key: MyAgentsWinSortKey): SortOrder {
  if (key === "name" || key === "pair" || key === "bar") return "asc";
  return "desc";
}

function defaultOrderMyRuns(key: MyRunsSortKey): SortOrder {
  if (key === "time") return "desc";
  return "asc";
}

function applyOrder(c: number, order: SortOrder): number {
  return order === "desc" ? -c : c;
}

function sortLabAgents(
  list: TradingExperimentAgentStats[],
  key: LabSortKey,
  order: SortOrder,
): TradingExperimentAgentStats[] {
  return [...list].sort((x, y) => {
    let cmp = 0;
    switch (key) {
      case "id": {
        const lr = ledgerRank(x.experimentSuite) - ledgerRank(y.experimentSuite);
        cmp = lr !== 0 ? lr : x.agentId - y.agentId;
        break;
      }
      case "suite":
        cmp = ledgerRank(x.experimentSuite) - ledgerRank(y.experimentSuite);
        if (cmp === 0) cmp = x.agentId - y.agentId;
        break;
      case "name":
        cmp = x.name.localeCompare(y.name);
        break;
      case "cex":
        cmp = (x.cexSource ?? "").localeCompare(y.cexSource ?? "");
        break;
      case "pair":
        cmp = x.token.localeCompare(y.token);
        break;
      case "bar":
        cmp = x.bar.localeCompare(y.bar);
        break;
      case "wins":
        cmp = x.wins - y.wins;
        break;
      case "losses":
        cmp = x.losses - y.losses;
        break;
      case "winRate": {
        const nx = x.winRate ?? -1;
        const ny = y.winRate ?? -1;
        cmp = nx - ny;
        break;
      }
      case "open":
        cmp = x.openPositions - y.openPositions;
        break;
      default:
        cmp = 0;
    }
    if (cmp !== 0) return applyOrder(cmp, order);
    const lr = ledgerRank(x.experimentSuite) - ledgerRank(y.experimentSuite);
    if (lr !== 0) return lr;
    return x.agentId - y.agentId;
  });
}

function sortLeaderboardRows(
  list: LeaderboardViewRow[],
  key: LeaderboardSortKey,
  order: SortOrder,
  scope: LeaderboardScope,
): LeaderboardViewRow[] {
  return [...list].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "rank":
        if (scope === "global") {
          cmp = a.ledgerRank - b.ledgerRank;
          if (cmp === 0) cmp = Number(a.idLabel) - Number(b.idLabel);
        } else {
          cmp = a.idLabel.localeCompare(b.idLabel);
        }
        break;
      case "ledger":
        cmp = a.ledgerRank - b.ledgerRank;
        if (scope === "global" && cmp === 0) cmp = Number(a.idLabel) - Number(b.idLabel);
        break;
      case "agent":
        cmp = a.name.localeCompare(b.name);
        break;
      case "pair":
        cmp = a.token.localeCompare(b.token);
        break;
      case "bar":
        cmp = a.bar.localeCompare(b.bar);
        break;
      case "wins":
        cmp = a.wins - b.wins;
        break;
      case "losses":
        cmp = a.losses - b.losses;
        break;
      case "winRate": {
        const na = a.winRatePct ?? -1;
        const nb = b.winRatePct ?? -1;
        cmp = na - nb;
        break;
      }
      case "open":
        cmp = a.openPositions - b.openPositions;
        break;
      case "sample":
        cmp = leaderboardTierFromDecided(a.decided) - leaderboardTierFromDecided(b.decided);
        break;
      default:
        cmp = 0;
    }
    if (cmp !== 0) return applyOrder(cmp, order);
    if (scope === "global") {
      const lr = a.ledgerRank - b.ledgerRank;
      if (lr !== 0) return lr;
      return Number(a.idLabel) - Number(b.idLabel);
    }
    return a.idLabel.localeCompare(b.idLabel);
  });
}

function sortMyAgentsWinList(
  list: UserCustomStrategyAgentStats[],
  key: MyAgentsWinSortKey,
  order: SortOrder,
): UserCustomStrategyAgentStats[] {
  return [...list].sort((x, y) => {
    let cmp = 0;
    switch (key) {
      case "name":
        cmp = x.name.localeCompare(y.name);
        break;
      case "pair":
        cmp = x.token.localeCompare(y.token);
        break;
      case "bar":
        cmp = x.bar.localeCompare(y.bar);
        break;
      case "wins":
        cmp = x.wins - y.wins;
        break;
      case "losses":
        cmp = x.losses - y.losses;
        break;
      case "winRate": {
        const nx = x.winRate ?? -1;
        const ny = y.winRate ?? -1;
        cmp = nx - ny;
        break;
      }
      case "open":
        cmp = x.openPositions - y.openPositions;
        break;
      default:
        cmp = 0;
    }
    if (cmp !== 0) return applyOrder(cmp, order);
    return x.strategyId.localeCompare(y.strategyId);
  });
}

function sortMyRunsRows(list: TradingExperimentRunRow[], key: MyRunsSortKey, order: SortOrder): TradingExperimentRunRow[] {
  return [...list].sort((x, y) => {
    let cmp = 0;
    switch (key) {
      case "time": {
        const tx = x.createdAt ? new Date(x.createdAt).getTime() : 0;
        const ty = y.createdAt ? new Date(y.createdAt).getTime() : 0;
        cmp = tx - ty;
        break;
      }
      case "status":
        cmp = x.status.localeCompare(y.status);
        break;
      case "signal":
        cmp = x.clearSignal.localeCompare(y.clearSignal);
        break;
      case "symbol":
        cmp = x.symbol.localeCompare(y.symbol);
        break;
      default:
        cmp = 0;
    }
    if (cmp !== 0) return applyOrder(cmp, order);
    return x._id.localeCompare(y._id);
  });
}

function LeaderboardRankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300/95 via-amber-400 to-amber-600 text-amber-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-200/40"
        aria-label="Rank 1"
      >
        <Crown className="h-3.5 w-3.5" strokeWidth={2.25} />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-500 text-zinc-900 shadow-md shadow-zinc-500/15 ring-1 ring-white/25"
        aria-label="Rank 2"
      >
        <span className="text-xs font-bold tabular-nums">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-800/95 via-amber-900 to-amber-950 text-amber-100 shadow-md shadow-amber-950/40 ring-1 ring-amber-600/35"
        aria-label="Rank 3"
      >
        <span className="text-xs font-bold tabular-nums">3</span>
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-xs font-semibold tabular-nums text-muted-foreground">
      {rank}
    </div>
  );
}

function SortableTableHead(props: {
  label: string;
  sortKey: string;
  activeKey: string;
  order: SortOrder;
  onSort: (key: string) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const { label, sortKey, activeKey, order, onSort, align = "left", className } = props;
  const isActive = activeKey === sortKey;
  return (
    <TableHead className={cn(align === "right" && "text-right", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 -mx-2 px-2.5 py-2 rounded-lg",
          isActive
            ? "text-foreground bg-primary/[0.09] shadow-sm ring-1 ring-border/70 dark:bg-primary/[0.12] dark:ring-border/60"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/45",
          align === "right" ? "w-full justify-end" : "w-full justify-start",
        )}
        onClick={() => onSort(sortKey)}
      >
        <span>{label}</span>
        {isActive ? (
          order === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          ) : (
            <ArrowUp className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-35" aria-hidden />
        )}
      </button>
    </TableHead>
  );
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
  /** Omit default `mb-8` when the parent shell supplies outer margin (e.g. lab footer card). */
  className?: string;
}) {
  const { page, pageSize, totalItems, loading = false, onPageChange, className } = props;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  if (totalItems === 0) return null;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        "py-3 sm:py-3.5",
        "mb-8",
        className,
      )}
    >
      <p className="text-sm font-medium leading-none tabular-nums text-foreground/80 sm:self-center">
        {start}–{end} of {totalItems}
      </p>
      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
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
          <span className="text-sm tabular-nums text-foreground/75 px-1">
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

export default function TradingAgentExperiment({ embedded = false }: { embedded?: boolean }) {
  const [isDarkMode, setIsDarkMode] = useState(
    () => !document.documentElement.classList.contains("light"),
  );
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

  const [labSortKey, setLabSortKey] = useState<LabSortKey>("winRate");
  const [labSortOrder, setLabSortOrder] = useState<SortOrder>("desc");
  const [lbSortKey, setLbSortKey] = useState<LeaderboardSortKey>("winRate");
  const [lbSortOrder, setLbSortOrder] = useState<SortOrder>("desc");
  const [myWinSortKey, setMyWinSortKey] = useState<MyAgentsWinSortKey>("winRate");
  const [myWinSortOrder, setMyWinSortOrder] = useState<SortOrder>("desc");
  const [myRunsSortKey, setMyRunsSortKey] = useState<MyRunsSortKey>("time");
  const [myRunsSortOrder, setMyRunsSortOrder] = useState<SortOrder>("desc");

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

  const [explorerRuns, setExplorerRuns] = useState<TradingExperimentRunRow[]>([]);
  const [explorerTotal, setExplorerTotal] = useState(0);
  const [explorerPage, setExplorerPage] = useState(1);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerError, setExplorerError] = useState<string | null>(null);
  const [explorerLedger, setExplorerLedger] = useState<ExplorerLedgerFilter>("all");
  const [explorerStatus, setExplorerStatus] = useState("");
  const [explorerSymbol, setExplorerSymbol] = useState("");
  const [explorerAgentId, setExplorerAgentId] = useState("");

  const load = useCallback(async () => {
    if (pageView === "my_agents" || pageView === "explorer") {
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
          const stats = await fetchTradingExperimentStatsAll();
          setAgents(stats.agents);
        }
      } else {
        const stats = await fetchTradingExperimentStatsAll();
        setAgents(stats.agents);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [
    pageView,
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

  const loadExplorer = useCallback(async () => {
    setExplorerError(null);
    setExplorerLoading(true);
    try {
      const suiteParam = explorerLedger === "all" ? "lab_all" : explorerLedger;
      const rawAid = explorerAgentId.trim();
      const parsedAid = rawAid === "" ? NaN : parseInt(rawAid, 10);
      const agentIdFilter =
        Number.isInteger(parsedAid) && parsedAid >= 0 && parsedAid <= 99 ? parsedAid : undefined;
      const runData = await fetchTradingExperimentRuns({
        limit: EXPLORER_PAGE_SIZE,
        offset: (explorerPage - 1) * EXPLORER_PAGE_SIZE,
        suite: suiteParam,
        status: explorerStatus.trim() || undefined,
        symbol: explorerSymbol.trim() || undefined,
        ...(agentIdFilter != null ? { agentId: agentIdFilter } : {}),
      });
      setExplorerRuns(runData.runs);
      setExplorerTotal(runData.total);
    } catch (e) {
      setExplorerError(e instanceof Error ? e.message : String(e));
      setExplorerRuns([]);
      setExplorerTotal(0);
    } finally {
      setExplorerLoading(false);
    }
  }, [explorerPage, explorerLedger, explorerStatus, explorerSymbol, explorerAgentId]);

  useEffect(() => {
    if (pageView !== "my_agents") return;
    loadMyAgents();
  }, [pageView, loadMyAgents]);

  useEffect(() => {
    if (pageView !== "explorer") return;
    void loadExplorer();
  }, [pageView, loadExplorer]);

  useEffect(() => {
    setExplorerPage(1);
  }, [explorerLedger, explorerStatus, explorerSymbol, explorerAgentId]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(explorerTotal / EXPLORER_PAGE_SIZE));
    setExplorerPage((p) => Math.min(Math.max(1, p), maxP));
  }, [explorerTotal]);

  const baseLeaderboardRows: LeaderboardViewRow[] = useMemo(() => {
    if (leaderboardScope === "global") {
      return agents.map((a) => ({
        key: `g-${a.experimentSuite ?? "primary"}-${a.agentId}`,
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
        profileHref: labAgentProfileHref(a),
        ledgerRank: ledgerRank(a.experimentSuite),
        experimentSuite: a.experimentSuite ?? "primary",
      }));
    }
    return myAgents.map((a) => ({
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
      ledgerRank: 99,
      experimentSuite: undefined,
    }));
  }, [leaderboardScope, agents, myAgents]);

  const filteredLeaderboardRows = useMemo(() => {
    const q = normalizeTableSearch(lbFilterSearch);
    return baseLeaderboardRows.filter((row) => {
      if (lbFilterToken !== "all" && row.token !== lbFilterToken) return false;
      if (lbFilterBar !== "all" && row.bar !== lbFilterBar) return false;
      if (lbFilterSample !== "any") {
        const tier = leaderboardTierFromDecided(row.decided);
        if (lbFilterSample === "0" && tier !== 0) return false;
        if (lbFilterSample === "1" && tier !== 1) return false;
        if (lbFilterSample === "2" && tier !== 2) return false;
      }
      if (!q) return true;
      const hay =
        `${row.name} ${row.subLabel} ${row.idLabel} ${row.token} ${row.bar} ${row.experimentSuite ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [baseLeaderboardRows, lbFilterSearch, lbFilterToken, lbFilterBar, lbFilterSample]);

  const sortedLeaderboardRows = useMemo(
    () => sortLeaderboardRows(filteredLeaderboardRows, lbSortKey, lbSortOrder, leaderboardScope),
    [filteredLeaderboardRows, lbSortKey, lbSortOrder, leaderboardScope],
  );

  const labCexOptions = useMemo(
    () => sortedUniqueStrings(agents.map((a) => (a.cexSource ?? "").trim()).filter(Boolean)),
    [agents],
  );
  const showLabCexUi = labCexOptions.length > 1;
  const labTableColSpan = 8 + (showLabCexUi ? 1 : 0);

  const filteredLabAgents = useMemo(() => {
    const q = normalizeTableSearch(labFilterSearch);
    return agents.filter((a) => {
      if (labFilterToken !== "all" && a.token !== labFilterToken) return false;
      if (labFilterBar !== "all" && a.bar !== labFilterBar) return false;
      if (showLabCexUi && labFilterCex !== "all") {
        const cex = (a.cexSource ?? "").trim();
        if (cex !== labFilterCex) return false;
      }
      if (labFilterOpen === "open" && a.openPositions <= 0) return false;
      if (labFilterOpen === "flat" && a.openPositions > 0) return false;
      if (!q) return true;
      const suiteHay = a.experimentSuite != null ? String(a.experimentSuite).toLowerCase() : "";
      const hay = `${a.name} ${a.agentId} ${a.token} ${a.bar} ${suiteHay}`.toLowerCase();
      return hay.includes(q);
    });
  }, [agents, labFilterSearch, labFilterToken, labFilterBar, labFilterCex, labFilterOpen, showLabCexUi]);

  const sortedLabAgents = useMemo(
    () => sortLabAgents(filteredLabAgents, labSortKey, labSortOrder),
    [filteredLabAgents, labSortKey, labSortOrder],
  );

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

  const sortedMyAgentsWin = useMemo(
    () => sortMyAgentsWinList(filteredMyAgentsWin, myWinSortKey, myWinSortOrder),
    [filteredMyAgentsWin, myWinSortKey, myWinSortOrder],
  );

  const sortedMyRuns = useMemo(
    () => sortMyRunsRows(myRuns, myRunsSortKey, myRunsSortOrder),
    [myRuns, myRunsSortKey, myRunsSortOrder],
  );

  const labTokenOptions = useMemo(() => sortedUniqueStrings(agents.map((a) => a.token)), [agents]);
  const labBarOptions = useMemo(() => sortedUniqueStrings(agents.map((a) => a.bar)), [agents]);

  const lbTokenOptions = useMemo(
    () => sortedUniqueStrings(baseLeaderboardRows.map((r) => r.token)),
    [baseLeaderboardRows],
  );
  const lbBarOptions = useMemo(
    () => sortedUniqueStrings(baseLeaderboardRows.map((r) => r.bar)),
    [baseLeaderboardRows],
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
      const suiteHay = a.experimentSuite != null ? String(a.experimentSuite).toLowerCase() : "";
      const hay = `${a.name} ${a.agentId} ${a.token} ${a.bar} ${suiteHay}`.toLowerCase();
      return hay.includes(q);
    });
  }, [agents, chartFilterSearch, chartFilterToken, chartFilterBar]);

  const coingeckoBatchSymbols = useMemo(() => {
    const out = new Set<string>();
    for (const a of agents) out.add(a.token);
    for (const r of baseLeaderboardRows) out.add(r.token);
    for (const r of explorerRuns) out.add(r.symbol);
    for (const r of myRuns) out.add(r.symbol);
    for (const a of myAgents) out.add(a.token);
    return [...out];
  }, [agents, baseLeaderboardRows, explorerRuns, myRuns, myAgents]);

  const pagedLeaderboardRows = useMemo(() => {
    const start = (leaderboardPage - 1) * TABLE_PAGE_SIZE;
    return sortedLeaderboardRows.slice(start, start + TABLE_PAGE_SIZE);
  }, [sortedLeaderboardRows, leaderboardPage]);

  const pagedLabAgents = useMemo(() => {
    const start = (labPage - 1) * TABLE_PAGE_SIZE;
    return sortedLabAgents.slice(start, start + TABLE_PAGE_SIZE);
  }, [sortedLabAgents, labPage]);

  const pagedMyAgentsWin = useMemo(() => {
    const start = (myAgentsTablePage - 1) * TABLE_PAGE_SIZE;
    return sortedMyAgentsWin.slice(start, start + TABLE_PAGE_SIZE);
  }, [sortedMyAgentsWin, myAgentsTablePage]);

  useEffect(() => {
    setLeaderboardPage(1);
  }, [leaderboardScope, lbFilterSearch, lbFilterToken, lbFilterBar, lbFilterSample]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(sortedLeaderboardRows.length / TABLE_PAGE_SIZE));
    setLeaderboardPage((p) => Math.min(Math.max(1, p), maxP));
  }, [sortedLeaderboardRows.length]);

  useEffect(() => {
    setLabPage(1);
  }, [labFilterSearch, labFilterToken, labFilterBar, labFilterCex, labFilterOpen, showLabCexUi]);

  useEffect(() => {
    setLabPage(1);
  }, [labSortKey, labSortOrder]);

  useEffect(() => {
    setLeaderboardPage(1);
  }, [lbSortKey, lbSortOrder]);

  useEffect(() => {
    setMyAgentsTablePage(1);
  }, [myWinSortKey, myWinSortOrder]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(sortedLabAgents.length / TABLE_PAGE_SIZE));
    setLabPage((p) => Math.min(Math.max(1, p), maxP));
  }, [sortedLabAgents.length]);

  useEffect(() => {
    setMyAgentsTablePage(1);
  }, [walletAddress, myAgents.length, myWinSearch, myWinToken, myWinBar]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(sortedMyAgentsWin.length / TABLE_PAGE_SIZE));
    setMyAgentsTablePage((p) => Math.min(Math.max(1, p), maxP));
  }, [sortedMyAgentsWin.length]);

  useEffect(() => {
    setMyRunsPage(1);
  }, [myRunsStatus, myRunsStrategyId]);

  useEffect(() => {
    setMyRunsPage(1);
  }, [walletAddress]);

  useEffect(() => {
    const maxP = Math.max(1, Math.ceil(myRunsTotal / TABLE_PAGE_SIZE));
    setMyRunsPage((p) => Math.min(Math.max(1, p), maxP));
  }, [myRunsTotal]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (embedded) return;
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [embedded, isDarkMode]);

  const onLabSort = useCallback((key: string) => {
    const k = key as LabSortKey;
    setLabSortKey((prev) => {
      if (prev === k) {
        setLabSortOrder((o) => (o === "desc" ? "asc" : "desc"));
        return prev;
      }
      setLabSortOrder(defaultOrderLab(k));
      return k;
    });
  }, []);

  const onLbSort = useCallback((key: string) => {
    const k = key as LeaderboardSortKey;
    setLbSortKey((prev) => {
      if (prev === k) {
        setLbSortOrder((o) => (o === "desc" ? "asc" : "desc"));
        return prev;
      }
      setLbSortOrder(defaultOrderLeaderboard(k));
      return k;
    });
  }, []);

  const onMyWinSort = useCallback((key: string) => {
    const k = key as MyAgentsWinSortKey;
    setMyWinSortKey((prev) => {
      if (prev === k) {
        setMyWinSortOrder((o) => (o === "desc" ? "asc" : "desc"));
        return prev;
      }
      setMyWinSortOrder(defaultOrderMyAgentsWin(k));
      return k;
    });
  }, []);

  const onMyRunsSort = useCallback((key: string) => {
    const k = key as MyRunsSortKey;
    setMyRunsSortKey((prev) => {
      if (prev === k) {
        setMyRunsSortOrder((o) => (o === "desc" ? "asc" : "desc"));
        return prev;
      }
      setMyRunsSortOrder(defaultOrderMyRuns(k));
      return k;
    });
  }, []);

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

  const onLeaderboardScopeChange = (v: string) => {
    setLeaderboardScope(v as LeaderboardScope);
  };

  return (
    <div
      className={cn(
        "bg-background text-foreground",
        /* Match Arbitrage: avoid `flex-1` on the Outlet root so `<main>` bottom padding extends scroll height. */
        embedded ? "w-full min-w-0" : "flex min-h-screen flex-col",
      )}
    >
      {!embedded && (
        <header className="flex items-center justify-between gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-b border-border bg-background/80 backdrop-blur-xl min-h-[52px] shrink-0 sticky top-0 z-20">
          <div className={cn(DASHBOARD_CONTENT_SHELL, "flex items-center justify-between gap-2 sm:gap-4")}>
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
                className="hidden h-9 w-9 shrink-0 lg:inline-flex"
                onClick={() => setIsDarkMode((d) => !d)}
                title={isDarkMode ? "Light mode" : "Dark mode"}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <WalletNav isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode((d) => !d)} />
            </div>
          </div>
        </header>
      )}

      <main
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "space-y-8",
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
          !embedded && "min-h-0 flex-1",
        )}
      >
        <CoingeckoBatchImageProvider symbols={coingeckoBatchSymbols}>
        <Tabs
          value={pageView}
          onValueChange={(v) => setPageView(v as PageView)}
          className="w-full"
        >
          <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="relative w-full max-w-2xl sm:w-auto sm:max-w-none sm:shrink-0 rounded-2xl border border-border/60 bg-muted/20 p-1 shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.04)] backdrop-blur-md dark:bg-muted/15 dark:shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.03)]">
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent dark:from-white/[0.02]"
                aria-hidden
              />
              <TabsList className="relative grid h-11 w-full grid-cols-5 gap-0.5 rounded-xl bg-transparent p-0 sm:w-[40rem] sm:min-w-0">
              <TabsTrigger
                value="lab"
                className="min-w-0 gap-1 rounded-lg px-1.5 text-xs transition-all duration-200 sm:gap-1.5 sm:px-2.5 sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-black/8 data-[state=active]:ring-1 data-[state=active]:ring-border/55 dark:data-[state=active]:shadow-black/45"
              >
                <FlaskConical className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">Lab</span>
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="min-w-0 gap-1 rounded-lg px-1.5 text-xs transition-all duration-200 sm:gap-1.5 sm:px-2.5 sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-black/8 data-[state=active]:ring-1 data-[state=active]:ring-border/55 dark:data-[state=active]:shadow-black/45"
              >
                <Trophy className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">Leaderboard</span>
              </TabsTrigger>
              <TabsTrigger
                value="charts"
                className="min-w-0 gap-1 rounded-lg px-1.5 text-xs transition-all duration-200 sm:gap-1.5 sm:px-2.5 sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-black/8 data-[state=active]:ring-1 data-[state=active]:ring-border/55 dark:data-[state=active]:shadow-black/45"
              >
                <BarChart3 className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">Charts</span>
              </TabsTrigger>
              <TabsTrigger
                value="explorer"
                className="min-w-0 gap-1 rounded-lg px-1.5 text-xs transition-all duration-200 sm:gap-1.5 sm:px-2.5 sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-black/8 data-[state=active]:ring-1 data-[state=active]:ring-border/55 dark:data-[state=active]:shadow-black/45"
              >
                <Compass className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">Explorer</span>
              </TabsTrigger>
              <TabsTrigger
                value="my_agents"
                className="min-w-0 gap-1 rounded-lg px-1.5 text-xs transition-all duration-200 sm:gap-1.5 sm:px-2.5 sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:shadow-black/8 data-[state=active]:ring-1 data-[state=active]:ring-border/55 dark:data-[state=active]:shadow-black/45"
              >
                <Users className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">My agents</span>
              </TabsTrigger>
            </TabsList>
            </div>
            <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2 w-full sm:w-auto sm:min-w-0 sm:flex-1 min-w-0 overflow-x-auto overscroll-x-contain py-0.5 [scrollbar-width:thin]">
              {pageView !== "my_agents" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 shrink-0 rounded-xl border-border/70 p-0 shadow-sm sm:h-9 sm:w-auto sm:gap-2 sm:px-3"
                  onClick={() => {
                    if (pageView === "explorer") void loadExplorer();
                    else void load();
                  }}
                  disabled={pageView === "explorer" ? explorerLoading : loading}
                  title="Refresh"
                  aria-label="Refresh"
                >
                  {pageView === "explorer" ? (
                    explorerLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )
                  ) : loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
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
          <div className="mt-4 rounded-xl border border-destructive/45 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
            {error}
          </div>
        ) : null}

          <TabsContent value="lab" className="mt-6 space-y-5 outline-none">
            <div className="space-y-5">
            {agents.length > 0 ? (
              <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/25 p-4 shadow-sm sm:p-5 dark:to-muted/10">
                <div
                  className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/[0.07] blur-2xl"
                  aria-hidden
                />
                <div className="relative mb-4 space-y-1">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">Roster filters</h3>
                  <p className="text-xs text-foreground/75 sm:text-sm">
                    Search by name or ID, then slice by market, timeframe, and open exposure.
                  </p>
                </div>
                <div className="relative flex flex-wrap items-end gap-2 sm:gap-3">
                  <div className="space-y-1.5 min-w-[140px] flex-1 sm:max-w-[260px]">
                    <Label htmlFor="lab-search" className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
                      Search
                    </Label>
                    <Input
                      id="lab-search"
                      value={labFilterSearch}
                      onChange={(e) => setLabFilterSearch(e.target.value)}
                      placeholder="Name, ID, pair…"
                      className="h-10 border-border/80 bg-background/80 shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/25"
                    />
                  </div>
                  <div className="space-y-1.5 w-[min(100%,148px)] sm:w-[148px]">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">Pair</Label>
                    <Select value={labFilterToken} onValueChange={setLabFilterToken}>
                      <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                  <div className="space-y-1.5 w-[min(100%,124px)] sm:w-[124px]">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">Bar</Label>
                    <Select value={labFilterBar} onValueChange={setLabFilterBar}>
                      <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                  {showLabCexUi ? (
                    <div className="space-y-1.5 w-[min(100%,148px)] sm:w-[148px]">
                      <Label className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">CEX</Label>
                      <Select value={labFilterCex} onValueChange={setLabFilterCex}>
                        <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                  <div className="space-y-1.5 min-w-[min(100%,172px)] sm:min-w-[176px]">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">Open positions</Label>
                    <Select
                      value={labFilterOpen}
                      onValueChange={(v) => setLabFilterOpen(v as "any" | "open" | "flat")}
                    >
                      <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                    variant="outline"
                    size="sm"
                    className="h-10 shrink-0 border-dashed border-border/80 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setLabFilterSearch("");
                      setLabFilterToken("all");
                      setLabFilterBar("all");
                      setLabFilterCex("all");
                      setLabFilterOpen("any");
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              </div>
            ) : null}
            <div
              className={cn(
                "relative overflow-hidden rounded-xl border px-4 py-3.5 sm:px-5",
                error
                  ? "border-destructive/40 bg-destructive/[0.08] text-destructive"
                  : loading
                    ? "border-amber-500/35 bg-muted/50 dark:bg-muted/30"
                    : "border-border bg-muted/50 text-foreground dark:bg-muted/30",
              )}
              role="status"
              aria-live="polite"
              aria-label={
                error
                  ? "Experiment service error"
                  : loading
                    ? "Experiment data syncing"
                    : "Experiment service online"
              }
            >
              {!error && !loading ? (
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-600"
                  aria-hidden
                />
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                {error ? (
                  <>
                    <span className="relative mt-0.5 flex h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" aria-hidden />
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold">Experiment API unavailable</p>
                      <p className="text-xs leading-relaxed text-destructive/90 sm:text-sm">
                        Use Refresh after checking your connection.
                      </p>
                    </div>
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-600 dark:text-amber-400" aria-hidden />
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-foreground">Syncing experiment data…</p>
                      <p className="text-xs leading-relaxed text-foreground/70 sm:text-sm">
                        Tables update when the request finishes.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0" aria-hidden>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50 opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.45)]" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-foreground">Experiment service online</p>
                      <p className="text-xs leading-relaxed text-foreground/75 sm:text-sm">
                        API reachable. In the table, agents with open positions show a green{" "}
                        <span className="font-medium text-foreground">Live</span> pill; TP/SL checks continue in the
                        background.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/40 shadow-md shadow-black/[0.04] backdrop-blur-sm dark:shadow-black/25">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 [&_tr]:border-b [&_tr]:border-border/80 [&_tr]:bg-card [&_tr]:backdrop-blur-md [&_tr:hover]:bg-card">
                    <TableRow className="border-0 hover:bg-transparent">
                      <SortableTableHead label="#" sortKey="id" activeKey={labSortKey} order={labSortOrder} onSort={onLabSort} />
                      <SortableTableHead label="Name" sortKey="name" activeKey={labSortKey} order={labSortOrder} onSort={onLabSort} />
                      {showLabCexUi ? (
                        <SortableTableHead label="CEX" sortKey="cex" activeKey={labSortKey} order={labSortOrder} onSort={onLabSort} />
                      ) : null}
                      <SortableTableHead label="Pair" sortKey="pair" activeKey={labSortKey} order={labSortOrder} onSort={onLabSort} />
                      <SortableTableHead label="Bar" sortKey="bar" activeKey={labSortKey} order={labSortOrder} onSort={onLabSort} />
                      <SortableTableHead label="W" sortKey="wins" activeKey={labSortKey} order={labSortOrder} onSort={onLabSort} align="right" />
                      <SortableTableHead label="L" sortKey="losses" activeKey={labSortKey} order={labSortOrder} onSort={onLabSort} align="right" />
                      <SortableTableHead label="Win %" sortKey="winRate" activeKey={labSortKey} order={labSortOrder} onSort={onLabSort} align="right" />
                      <SortableTableHead label="Open" sortKey="open" activeKey={labSortKey} order={labSortOrder} onSort={onLabSort} align="right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && agents.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={labTableColSpan}
                          className="py-14 text-center text-muted-foreground"
                        >
                          <span className="inline-flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin shrink-0 text-primary/60" aria-hidden />
                            <span className="text-sm font-medium">Loading lab agents…</span>
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {!loading && agents.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={labTableColSpan}
                          className="py-14 text-center"
                        >
                          <p className="text-sm font-medium text-foreground">No agents loaded</p>
                          <p className="mt-1 text-xs text-muted-foreground">Try Refresh or check the experiment API.</p>
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {!loading && agents.length > 0 && filteredLabAgents.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={labTableColSpan}
                          className="py-14 text-center text-muted-foreground"
                        >
                          No agents match these filters.{" "}
                          <button
                            type="button"
                            className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
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
                      <TableRow
                        key={labAgentRowKey(a)}
                        className="group border-border/40 transition-colors hover:bg-muted/35"
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground tabular-nums sm:text-sm">{a.agentId}</TableCell>
                        <TableCell className="font-medium">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <Link
                              to={labAgentProfileHref(a)}
                              className="min-w-0 truncate font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                            >
                              {a.name}
                            </Link>
                            <AgentBackgroundLiveIndicator openPositions={a.openPositions} />
                          </span>
                        </TableCell>
                        {showLabCexUi ? (
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {a.cexSource ?? "—"}
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <span className="inline-flex min-w-0 items-center gap-2.5">
                            <CoinLogo symbol={a.token} size="md" fallbackSeed={a.token} />
                            <span className="truncate text-sm font-medium text-foreground">
                              {formatPairLabel(a.token)}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-xs font-semibold tabular-nums">
                            {a.bar}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {a.wins}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-semibold text-rose-600 dark:text-rose-400">
                          {a.losses}
                        </TableCell>
                        <TableCell className="text-right">
                          {a.winRatePct != null ? (
                            <div className="ml-auto flex max-w-[7.5rem] flex-col items-end gap-1.5">
                              <span className={cn("text-sm font-semibold tabular-nums", winRateVisualClass(a.winRatePct))}>
                                {a.winRatePct}%
                              </span>
                              <Progress value={a.winRatePct} className="h-1.5 w-full bg-border" />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {a.openPositions > 0 ? (
                            <Badge
                              variant="outline"
                              className="border-primary/50 bg-primary/10 font-mono text-xs font-semibold text-primary hover:bg-primary/15"
                            >
                              {a.openPositions}
                            </Badge>
                          ) : (
                            <span className="text-sm tabular-nums text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            {filteredLabAgents.length > 0 ? (
              <div className="mb-8 rounded-xl border border-border/50 bg-muted/15 px-4 sm:px-5">
                <ExperimentTablePagination
                  className="mb-0"
                  page={labPage}
                  pageSize={TABLE_PAGE_SIZE}
                  totalItems={filteredLabAgents.length}
                  loading={loading}
                  onPageChange={setLabPage}
                />
              </div>
            ) : null}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6 space-y-5 outline-none">
            <div className="space-y-5">
              <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/25 p-4 shadow-lg shadow-black/[0.06] sm:p-5 dark:to-muted/10 dark:shadow-black/35">
                <div
                  className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary/[0.06] blur-3xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-primary/[0.04] blur-2xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent"
                  aria-hidden
                />
                <div className="relative mb-4 hidden sm:block">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">Rankings</h3>
                  <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                    Compare agents by resolved sample, win rate, and exposure. Filters apply instantly on this page.
                  </p>
                </div>
                <div className="relative flex flex-wrap items-end gap-3 sm:gap-4">
                  <div className="space-y-1.5 w-[min(100%,168px)] sm:w-[11rem]">
                    <Label
                      htmlFor="leaderboard-scope"
                      className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Ranking
                    </Label>
                    <Select value={leaderboardScope} onValueChange={onLeaderboardScopeChange}>
                      <SelectTrigger
                        id="leaderboard-scope"
                        className="h-10 border-border/80 bg-background/80 text-sm shadow-sm transition-shadow focus:ring-2 focus:ring-primary/20 [&>span]:truncate"
                        aria-label="Ranking scope"
                        title="All lab agents or your wallet agents only"
                      >
                        <SelectValue placeholder="Ranking" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">All agents</SelectItem>
                        <SelectItem value="mine">My agents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {baseLeaderboardRows.length > 0 ? (
                    <>
                      <div className="space-y-1.5 min-w-[140px] flex-1 sm:max-w-[260px]">
                        <Label htmlFor="lb-search" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Search
                        </Label>
                        <Input
                          id="lb-search"
                          value={lbFilterSearch}
                          onChange={(e) => setLbFilterSearch(e.target.value)}
                          placeholder="Agent, pair, ID…"
                          className="h-10 border-border/80 bg-background/80 shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5 w-[min(100%,148px)] sm:w-[148px]">
                        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pair</Label>
                        <Select value={lbFilterToken} onValueChange={setLbFilterToken}>
                          <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                      <div className="space-y-1.5 w-[min(100%,124px)] sm:w-[124px]">
                        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Bar</Label>
                        <Select value={lbFilterBar} onValueChange={setLbFilterBar}>
                          <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                      <div className="space-y-1.5 min-w-[min(100%,220px)] sm:min-w-[220px]">
                        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sample size</Label>
                        <Select
                          value={lbFilterSample}
                          onValueChange={(v) => setLbFilterSample(v as "any" | "0" | "1" | "2")}
                        >
                          <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                        variant="outline"
                        size="sm"
                        className="h-10 shrink-0 border-border/80 bg-background/60 px-4 text-xs font-medium shadow-sm"
                        onClick={() => {
                          setLbFilterSearch("");
                          setLbFilterToken("all");
                          setLbFilterBar("all");
                          setLbFilterSample("any");
                        }}
                      >
                        Clear
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              {baseLeaderboardRows.length > 0 ? (
                <>
                  <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.45)] backdrop-blur-sm dark:bg-card/35 dark:shadow-[0_28px_56px_-18px_rgba(0,0,0,0.65)]">
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
                      aria-hidden
                    />
                    <Table className="min-w-[840px] [&_td]:px-4 [&_td]:py-3.5 [&_th]:px-4 [&_th]:py-3">
                      <TableHeader>
                        <TableRow className="border-border/40 bg-muted/30 hover:bg-muted/30 [&>th]:align-middle">
                          <SortableTableHead
                            className="w-[4.5rem] pl-5 sm:pl-6"
                            label="Rank"
                            sortKey="rank"
                            activeKey={lbSortKey}
                            order={lbSortOrder}
                            onSort={onLbSort}
                          />
                          <SortableTableHead label="Agent" sortKey="agent" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} />
                          <SortableTableHead label="Pair" sortKey="pair" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} />
                          <SortableTableHead label="Bar" sortKey="bar" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} />
                          <SortableTableHead label="W" sortKey="wins" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} align="right" />
                          <SortableTableHead label="L" sortKey="losses" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} align="right" />
                          <SortableTableHead label="Win %" sortKey="winRate" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} align="right" />
                          <SortableTableHead label="Open" sortKey="open" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} align="right" />
                          <SortableTableHead
                            className="pr-5 sm:pr-6"
                            label="Sample"
                            sortKey="sample"
                            activeKey={lbSortKey}
                            order={lbSortOrder}
                            onSort={onLbSort}
                            align="right"
                          />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLeaderboardRows.length === 0 ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={9} className="py-16 text-center">
                              <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4">
                                <Trophy className="h-10 w-10 text-muted-foreground/35" aria-hidden />
                                <p className="text-sm font-medium text-foreground">No matches</p>
                                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                  No agents match these filters.{" "}
                                  <button
                                    type="button"
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                    onClick={() => {
                                      setLbFilterSearch("");
                                      setLbFilterToken("all");
                                      setLbFilterBar("all");
                                      setLbFilterSample("any");
                                    }}
                                  >
                                    Clear filters
                                  </button>
                                </p>
                              </div>
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
                                  "group border-border/35 transition-colors duration-150 hover:bg-muted/[0.28]",
                                  globalRank === 1 &&
                                    "bg-gradient-to-r from-amber-500/[0.08] via-transparent to-transparent dark:from-amber-500/[0.1]",
                                  globalRank === 2 &&
                                    "bg-gradient-to-r from-zinc-400/[0.07] via-transparent to-transparent dark:from-zinc-400/[0.09]",
                                  globalRank === 3 &&
                                    "bg-gradient-to-r from-amber-950/[0.18] via-transparent to-transparent dark:from-amber-950/[0.22]",
                                )}
                              >
                                <TableCell className="pl-5 sm:pl-6">
                                  <LeaderboardRankDisplay rank={globalRank} />
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex min-w-0 flex-col gap-0.5">
                                    <span className="inline-flex min-w-0 items-center gap-2">
                                      {row.profileHref ? (
                                        <Link
                                          to={row.profileHref}
                                          className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground decoration-primary/40 underline-offset-4 transition-colors hover:text-primary hover:underline"
                                        >
                                          {row.name}
                                        </Link>
                                      ) : (
                                        <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground">
                                          {row.name}
                                        </span>
                                      )}
                                      <AgentBackgroundLiveIndicator openPositions={row.openPositions} />
                                    </span>
                                    <span
                                      className="inline-block max-w-[10rem] truncate font-mono text-[11px] text-muted-foreground"
                                      title={leaderboardScope === "mine" ? row.idLabel : undefined}
                                    >
                                      {idDisplay}
                                    </span>
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex min-w-0 max-w-[11rem] items-center gap-2.5">
                                    <CoinLogo symbol={row.token} size="sm" fallbackSeed={row.token} />
                                    <span className="truncate text-sm font-medium text-foreground/90">
                                      {formatPairLabel(row.token)}
                                    </span>
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="font-mono text-xs font-semibold tabular-nums">
                                    {row.bar}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                  {row.wins}
                                </TableCell>
                                <TableCell className="text-right text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                                  {row.losses}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.winRatePct != null ? (
                                    <div className="ml-auto flex max-w-[5.75rem] flex-col items-end gap-1">
                                      <span
                                        className={cn("text-sm font-semibold tabular-nums", winRateVisualClass(row.winRatePct))}
                                      >
                                        {row.winRatePct}%
                                      </span>
                                      <Progress value={row.winRatePct} className="h-1.5 w-full bg-border/70" />
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.openPositions > 0 ? (
                                    <Badge
                                      variant="outline"
                                      className="border-primary/45 bg-primary/[0.08] font-mono text-xs font-semibold tabular-nums text-primary hover:bg-primary/[0.12]"
                                    >
                                      {row.openPositions}
                                    </Badge>
                                  ) : (
                                    <span className="tabular-nums text-sm text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell className="pr-5 text-right sm:pr-6">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "font-mono text-[10px] font-semibold tabular-nums",
                                      tier === 0 &&
                                        "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-800 dark:text-emerald-300",
                                      tier === 1 &&
                                        "border-amber-500/30 bg-amber-500/[0.08] text-amber-900 dark:text-amber-300",
                                      tier === 2 && "border-border/60 text-muted-foreground",
                                    )}
                                  >
                                    {tierLabel}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/10 shadow-sm">
                    <ExperimentTablePagination
                      page={leaderboardPage}
                      pageSize={TABLE_PAGE_SIZE}
                      totalItems={filteredLeaderboardRows.length}
                      loading={loading}
                      onPageChange={setLeaderboardPage}
                      className="mb-0 px-3 sm:px-4"
                    />
                  </div>
                </>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-xl shadow-black/[0.06] backdrop-blur-sm dark:shadow-black/40">
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    aria-hidden
                  />
                  <Table className="min-w-[840px] [&_td]:px-4 [&_td]:py-3.5 [&_th]:px-4 [&_th]:py-3">
                    <TableHeader>
                      <TableRow className="border-border/40 bg-muted/30 hover:bg-muted/30">
                        <SortableTableHead
                          className="w-[4.5rem] pl-5 sm:pl-6"
                          label="Rank"
                          sortKey="rank"
                          activeKey={lbSortKey}
                          order={lbSortOrder}
                          onSort={onLbSort}
                        />
                        <SortableTableHead label="Agent" sortKey="agent" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} />
                        <SortableTableHead label="Pair" sortKey="pair" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} />
                        <SortableTableHead label="Bar" sortKey="bar" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} />
                        <SortableTableHead label="W" sortKey="wins" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} align="right" />
                        <SortableTableHead label="L" sortKey="losses" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} align="right" />
                        <SortableTableHead label="Win %" sortKey="winRate" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} align="right" />
                        <SortableTableHead label="Open" sortKey="open" activeKey={lbSortKey} order={lbSortOrder} onSort={onLbSort} align="right" />
                        <SortableTableHead
                          className="pr-5 sm:pr-6"
                          label="Sample"
                          sortKey="sample"
                          activeKey={lbSortKey}
                          order={lbSortOrder}
                          onSort={onLbSort}
                          align="right"
                        />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={9} className="py-16 text-center">
                          {loading ? (
                            <span className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                              Loading…
                            </span>
                          ) : leaderboardScope === "mine" && !walletAddress ? (
                            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                              Connect your Solana or Base wallet to see your agents here.
                            </p>
                          ) : leaderboardScope === "mine" && walletAddress ? (
                            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                              No custom agents yet. Open the{" "}
                              <button
                                type="button"
                                className="font-medium text-primary underline-offset-4 hover:underline"
                                onClick={() => setPageView("my_agents")}
                              >
                                My agents
                              </button>{" "}
                              tab to create one.
                            </p>
                          ) : (
                            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                              No agents loaded for this experiment yet.
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="charts" className="mt-6 space-y-5 outline-none">
            <div className="space-y-5">
            {agents.length > 0 ? (
              <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/25 p-4 shadow-lg shadow-black/[0.06] sm:p-5 dark:to-muted/10 dark:shadow-black/35">
                <div
                  className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/[0.06] blur-3xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-primary/[0.04] blur-2xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent"
                  aria-hidden
                />
                <div className="relative mb-4 hidden sm:block">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">Chart data filters</h3>
                  <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                    Narrow which agents feed the bubble map and charts. Same roster as the Lab tab, scoped here for visualization.
                  </p>
                </div>
                <div className="relative flex flex-wrap items-end gap-3 sm:gap-4">
                  <div className="space-y-1.5 min-w-[140px] flex-1 sm:max-w-[260px]">
                    <Label htmlFor="chart-search" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Search
                    </Label>
                    <Input
                      id="chart-search"
                      value={chartFilterSearch}
                      onChange={(e) => setChartFilterSearch(e.target.value)}
                      placeholder="Name, ID, pair…"
                      className="h-10 border-border/80 bg-background/80 shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5 w-[min(100%,148px)] sm:w-[148px]">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pair</Label>
                    <Select value={chartFilterToken} onValueChange={setChartFilterToken}>
                      <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                  <div className="space-y-1.5 w-[min(100%,124px)] sm:w-[124px]">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Bar</Label>
                    <Select value={chartFilterBar} onValueChange={setChartFilterBar}>
                      <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                    variant="outline"
                    size="sm"
                    className="h-10 shrink-0 border-border/80 bg-background/60 px-4 text-xs font-medium shadow-sm"
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
              agentProfileHref={(encodedId) => {
                const { experimentSuite, agentId } = decodeExperimentLabAgentId(encodedId);
                return `${TRADING_EXPERIMENT_ROUTE_BASE}/agent/${agentId}?suite=${encodeURIComponent(experimentSuite)}`;
              }}
              emptyMessage={
                !loading && agents.length > 0 && filteredChartAgents.length === 0
                  ? "No agents match these filters."
                  : undefined
              }
            />
            </div>
          </TabsContent>

          <TabsContent value="explorer" className="mt-6 space-y-5 outline-none">
            <div className="space-y-5">
              <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Run explorer</p>
                <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  Full history across standard lab ledgers, newest first. Wallet-built agents live under{" "}
                  <button
                    type="button"
                    className="font-medium text-foreground underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
                    onClick={() => setPageView("my_agents")}
                  >
                    My agents
                  </button>
                  .
                </p>
              </div>
              {explorerError ? (
                <div className="rounded-xl border border-destructive/45 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
                  {explorerError}
                </div>
              ) : null}
              <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/25 p-4 shadow-lg shadow-black/[0.06] sm:p-5 dark:to-muted/10 dark:shadow-black/35">
                <div
                  className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-primary/[0.05] blur-3xl"
                  aria-hidden
                />
                <div className="relative mb-3 hidden sm:block">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">Run history filters</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:text-[13px]">Optionally narrow which data feed you query before paging rows.</p>
                </div>
                <div className="relative flex flex-wrap items-end gap-3 sm:gap-4">
                  <div className="space-y-1.5 w-[min(100%,168px)] sm:w-[188px]">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Feed</Label>
                    <Select
                      value={explorerLedger}
                      onValueChange={(v) => setExplorerLedger(v as ExplorerLedgerFilter)}
                    >
                      <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All feeds</SelectItem>
                        <SelectItem value="primary">Original</SelectItem>
                        <SelectItem value="secondary">Parallel</SelectItem>
                        <SelectItem value="multi_resource">BTC timeframes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 w-[min(100%,168px)] sm:w-[188px]">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
                    <Select
                      value={explorerStatus.trim() ? explorerStatus : "all"}
                      onValueChange={(v) => setExplorerStatus(v === "all" ? "" : v)}
                    >
                      <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                  <div className="space-y-1.5 min-w-[min(100%,140px)] sm:min-w-[160px] flex-1 sm:max-w-[200px]">
                    <Label htmlFor="explorer-agent-id" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Agent ID
                    </Label>
                    <Input
                      id="explorer-agent-id"
                      value={explorerAgentId}
                      onChange={(e) => setExplorerAgentId(e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="0–99"
                      className="h-10 border-border/80 bg-background/80 font-mono shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-[min(100%,160px)] flex-1 sm:max-w-[260px]">
                    <Label htmlFor="explorer-symbol" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Symbol contains
                    </Label>
                    <Input
                      id="explorer-symbol"
                      value={explorerSymbol}
                      onChange={(e) => setExplorerSymbol(e.target.value)}
                      placeholder="e.g. BTCUSDT"
                      className="h-10 border-border/80 bg-background/80 font-mono text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 shrink-0 border-border/80 bg-background/60 px-4 text-xs font-medium shadow-sm"
                    onClick={() => {
                      setExplorerLedger("all");
                      setExplorerStatus("");
                      setExplorerAgentId("");
                      setExplorerSymbol("");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.45)] backdrop-blur-sm dark:bg-card/35 dark:shadow-[0_28px_56px_-18px_rgba(0,0,0,0.65)]">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
                  aria-hidden
                />
                <div className="flex flex-col gap-0.5 border-b border-border/45 bg-muted/20 px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-3.5">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">Run log</h3>
                    <p className="text-xs text-muted-foreground">Signals and resolutions from the merged ledger feed.</p>
                  </div>
                  <p className="text-xs font-medium tabular-nums text-muted-foreground sm:text-right">
                    <span className="text-foreground/80">{explorerTotal.toLocaleString()}</span> runs
                    {explorerLoading ? <span className="ml-2 inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" aria-hidden /> updating</span> : null}
                  </p>
                </div>
                <Table className="min-w-[900px] [&_td]:px-4 [&_td]:py-3.5 [&_td:first-child]:pl-5 sm:[&_td:first-child]:pl-6 [&_td:last-child]:pr-5 sm:[&_td:last-child]:pr-6 [&_th]:px-4 [&_th]:py-3.5 [&_th:first-child]:pl-5 sm:[&_th:first-child]:pl-6 [&_th:last-child]:pr-5 sm:[&_th:last-child]:pr-6">
                  <TableHeader className="sticky top-0 z-10 border-b border-border/50 bg-muted/90 shadow-sm backdrop-blur-md dark:bg-muted/85 [&_tr]:border-b-0 [&_tr]:hover:bg-transparent">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Time
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Agent
                      </TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Symbol</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Signal</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Entry</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SL</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">TP1</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resolution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {explorerLoading && explorerRuns.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={10} className="py-16 text-center text-muted-foreground">
                          <span className="inline-flex items-center gap-2 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                            Loading history…
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {!explorerLoading && explorerRuns.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={10} className="py-16 text-center text-sm text-muted-foreground">
                          No runs match these filters.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {explorerRuns.map((r) => {
                        const suiteNorm = normalizeExperimentSuite(r.suite ?? undefined);
                        return (
                          <TableRow
                            key={r._id}
                            className="group border-border/25 transition-colors duration-150 hover:bg-muted/[0.22]"
                          >
                            <TableCell className="whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground">
                              {formatTime(r.createdAt)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold tabular-nums text-foreground/90">
                              {r.agentId}
                            </TableCell>
                            <TableCell className="max-w-[min(200px,28vw)]">
                              <Link
                                to={labAgentProfileHref({ agentId: r.agentId, experimentSuite: suiteNorm })}
                                className="block truncate text-sm font-semibold tracking-tight text-foreground decoration-primary/35 underline-offset-4 transition-colors hover:text-primary hover:underline"
                              >
                                {r.agentName}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex min-w-0 max-w-[140px] items-center gap-2">
                                <CoinLogo symbol={r.symbol} size="sm" fallbackSeed={r.symbol} />
                                <span className="truncate font-mono text-xs font-medium text-foreground/90">{r.symbol}</span>
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-mono text-[10px] font-semibold tabular-nums",
                                  explorerSignalBadgeClass(r.clearSignal),
                                )}
                              >
                                {r.clearSignal}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "max-w-[13rem] truncate font-mono text-[10px] font-semibold normal-case tracking-normal",
                                  explorerRunStatusBadgeClass(r.status),
                                )}
                                title={r.status}
                              >
                                {statusOptionLabel(r.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs tabular-nums text-foreground/85">
                              {r.entry != null ? r.entry.toFixed(4) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs tabular-nums text-foreground/85">
                              {r.stopLoss != null ? r.stopLoss.toFixed(4) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs tabular-nums text-foreground/85">
                              {r.firstTarget != null ? r.firstTarget.toFixed(4) : "—"}
                            </TableCell>
                            <TableCell className="max-w-[240px]">
                              <span
                                className="block truncate font-mono text-[11px] text-foreground/80 dark:text-zinc-200"
                                title={r.resolution ?? undefined}
                              >
                                {r.resolution ?? "—"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/10 shadow-sm">
                <ExperimentTablePagination
                  page={explorerPage}
                  pageSize={EXPLORER_PAGE_SIZE}
                  totalItems={explorerTotal}
                  loading={explorerLoading}
                  onPageChange={setExplorerPage}
                  className="mb-0 px-3 sm:px-4"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="my_agents" className="mt-6 space-y-8 outline-none">
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
                    <div className="rounded-xl border border-destructive/45 bg-destructive/10 px-3 py-2 text-sm text-destructive shadow-sm">
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
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-xl shadow-black/[0.06] backdrop-blur-sm dark:shadow-black/40">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  aria-hidden
                />
                <Table className="min-w-[720px] [&_td]:px-4 [&_td]:py-3.5 [&_th]:px-4 [&_th]:py-3.5">
                  <TableHeader className="sticky top-0 z-10 border-b border-border/50 bg-muted/90 backdrop-blur-md dark:bg-muted/85 [&_tr]:hover:bg-transparent">
                    <TableRow className="border-0 hover:bg-transparent">
                      <SortableTableHead label="Name" sortKey="name" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} />
                      <SortableTableHead label="Pair" sortKey="pair" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} />
                      <SortableTableHead label="Bar" sortKey="bar" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} />
                      <SortableTableHead label="W" sortKey="wins" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} align="right" />
                      <SortableTableHead label="L" sortKey="losses" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} align="right" />
                      <SortableTableHead label="Win %" sortKey="winRate" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} align="right" />
                      <SortableTableHead label="Open" sortKey="open" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} align="right" />
                      <TableHead className="w-12 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={8} className="py-16 text-center">
                        <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4">
                          <Users className="h-10 w-10 text-muted-foreground/35" aria-hidden />
                          <p className="text-sm font-semibold tracking-tight text-foreground">Connect a wallet</p>
                          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                            Connect your Solana or Base wallet to create agents and view stats.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="rounded-xl border border-border/50 bg-muted/10 px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">My workspace</p>
                  <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    Up to {MAX_USER_CUSTOM_STRATEGIES_PER_WALLET} custom strategies per wallet. Use{" "}
                    <span className="font-medium text-foreground">Create</span> in the toolbar, then track outcomes in{" "}
                    <span className="font-medium text-foreground">Experiment runs</span> below.
                  </p>
                </div>

                <div className="space-y-4">
                  {myAgents.length > 0 ? (
                    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/25 p-4 shadow-lg shadow-black/[0.06] sm:p-5 dark:to-muted/10 dark:shadow-black/35">
                      <div
                        className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-primary/[0.06] blur-3xl"
                        aria-hidden
                      />
                      <div className="relative mb-3 hidden sm:block">
                        <h3 className="text-sm font-semibold tracking-tight text-foreground">Agent list filters</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground sm:text-[13px]">Search and slice your roster before sorting columns.</p>
                      </div>
                      <div className="relative flex flex-wrap items-end gap-3 sm:gap-4">
                        <div className="space-y-1.5 min-w-[140px] flex-1 sm:max-w-[260px]">
                          <Label htmlFor="my-win-search" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Search
                          </Label>
                          <Input
                            id="my-win-search"
                            value={myWinSearch}
                            onChange={(e) => setMyWinSearch(e.target.value)}
                            placeholder="Name, strategy ID…"
                            className="h-10 border-border/80 bg-background/80 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-1.5 w-[min(100%,148px)] sm:w-[148px]">
                          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pair</Label>
                          <Select value={myWinToken} onValueChange={setMyWinToken}>
                            <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                        <div className="space-y-1.5 w-[min(100%,124px)] sm:w-[124px]">
                          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Bar</Label>
                          <Select value={myWinBar} onValueChange={setMyWinBar}>
                            <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                          variant="outline"
                          size="sm"
                          className="h-10 shrink-0 border-border/80 bg-background/60 px-4 text-xs font-medium shadow-sm"
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
                  <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.45)] backdrop-blur-sm dark:bg-card/35 dark:shadow-[0_28px_56px_-18px_rgba(0,0,0,0.65)]">
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
                      aria-hidden
                    />
                    <div className="flex flex-col gap-0.5 border-b border-border/45 bg-muted/20 px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-3.5">
                      <div>
                        <h3 className="text-sm font-semibold tracking-tight text-foreground">Your agents</h3>
                        <p className="text-xs text-muted-foreground">Performance and open exposure for this wallet.</p>
                      </div>
                      <p className="text-xs font-medium tabular-nums text-muted-foreground sm:text-right">
                        <span className="text-foreground/80">{filteredMyAgentsWin.length}</span> shown
                        {myAgents.length > 0 ? (
                          <>
                            {" "}
                            · <span className="text-foreground/80">{myAgents.length}</span> total
                          </>
                        ) : null}
                        {myLoading ? (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                            updating
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <Table className="min-w-[800px] [&_td]:px-4 [&_td]:py-3.5 [&_td:first-child]:pl-5 sm:[&_td:first-child]:pl-6 [&_td:last-child]:pr-5 sm:[&_td:last-child]:pr-6 [&_th]:px-4 [&_th]:py-3.5 [&_th:first-child]:pl-5 sm:[&_th:first-child]:pl-6 [&_th:last-child]:pr-5 sm:[&_th:last-child]:pr-6">
                      <TableHeader className="sticky top-0 z-10 border-b border-border/50 bg-muted/90 shadow-sm backdrop-blur-md dark:bg-muted/85 [&_tr]:border-b-0 [&_tr]:hover:bg-transparent">
                        <TableRow className="border-0 hover:bg-transparent">
                          <SortableTableHead label="Name" sortKey="name" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} />
                          <SortableTableHead label="Pair" sortKey="pair" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} />
                          <SortableTableHead label="Bar" sortKey="bar" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} />
                          <SortableTableHead label="W" sortKey="wins" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} align="right" />
                          <SortableTableHead label="L" sortKey="losses" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} align="right" />
                          <SortableTableHead label="Win %" sortKey="winRate" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} align="right" />
                          <SortableTableHead label="Open" sortKey="open" activeKey={myWinSortKey} order={myWinSortOrder} onSort={onMyWinSort} align="right" />
                          <TableHead className="w-14 text-right">
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myLoading && myAgents.length === 0 ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">
                              <span className="inline-flex items-center justify-center gap-2 text-sm">
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                                Loading…
                              </span>
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {!myLoading && myAgents.length === 0 ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={8} className="py-16 text-center">
                              <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4">
                                <FlaskConical className="h-10 w-10 text-muted-foreground/35" aria-hidden />
                                <p className="text-sm font-semibold tracking-tight text-foreground">No custom agents yet</p>
                                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                  Create a strategy from the toolbar to deploy it from this wallet.
                                </p>
                                <Button type="button" size="sm" variant="outline" className="mt-1 rounded-lg shadow-sm" onClick={() => setCreateModalOpen(true)}>
                                  Create agent
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {!myLoading && myAgents.length > 0 && filteredMyAgentsWin.length === 0 ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={8} className="py-16 text-center">
                              <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4">
                                <p className="text-sm font-medium text-foreground">No matches</p>
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                  No agents match these filters.{" "}
                                  <button
                                    type="button"
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                    onClick={() => {
                                      setMyWinSearch("");
                                      setMyWinToken("all");
                                      setMyWinBar("all");
                                    }}
                                  >
                                    Clear filters
                                  </button>
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {!myLoading &&
                          myAgents.length > 0 &&
                          filteredMyAgentsWin.length > 0 &&
                          pagedMyAgentsWin.map((a: UserCustomStrategyAgentStats) => (
                            <TableRow
                              key={a.strategyId}
                              className="group border-border/25 transition-colors duration-150 hover:bg-muted/[0.22]"
                            >
                              <TableCell>
                                <span className="inline-flex min-w-0 items-center gap-2">
                                  <span className="truncate text-sm font-semibold tracking-tight text-foreground">{a.name}</span>
                                  <AgentBackgroundLiveIndicator openPositions={a.openPositions} />
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex min-w-0 max-w-[220px] items-center gap-2">
                                  <CoinLogo symbol={a.token} size="sm" fallbackSeed={a.token} />
                                  <span className="truncate text-sm font-medium text-foreground/90">{formatPairLabel(a.token)}</span>
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="font-mono text-xs font-semibold tabular-nums">
                                  {a.bar}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                {a.wins}
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                                {a.losses}
                              </TableCell>
                              <TableCell className="text-right">
                                {a.winRatePct != null ? (
                                  <div className="ml-auto flex max-w-[5.75rem] flex-col items-end gap-1">
                                    <span className={cn("text-sm font-semibold tabular-nums", winRateVisualClass(a.winRatePct))}>
                                      {a.winRatePct}%
                                    </span>
                                    <Progress value={a.winRatePct} className="h-1.5 w-full bg-border/70" />
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {a.openPositions > 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="border-primary/45 bg-primary/[0.08] font-mono text-xs font-semibold tabular-nums text-primary hover:bg-primary/[0.12]"
                                  >
                                    {a.openPositions}
                                  </Badge>
                                ) : (
                                  <span className="tabular-nums text-sm text-muted-foreground">0</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                    <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/10 shadow-sm">
                      <ExperimentTablePagination
                        page={myAgentsTablePage}
                        pageSize={TABLE_PAGE_SIZE}
                        totalItems={filteredMyAgentsWin.length}
                        loading={myLoading}
                        onPageChange={setMyAgentsTablePage}
                        className="mb-0 px-3 sm:px-4"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4 border-t border-border/40 pt-8">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">Experiment runs</h3>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                      Live and historical executions for your wallet strategies. Filter by outcome or strategy, then page through results.
                    </p>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/25 p-4 shadow-lg shadow-black/[0.06] sm:p-5 dark:to-muted/10 dark:shadow-black/35">
                    <div
                      className="pointer-events-none absolute -right-12 -bottom-12 h-36 w-36 rounded-full bg-primary/[0.05] blur-3xl"
                      aria-hidden
                    />
                    <div className="relative flex flex-wrap items-end gap-3 sm:gap-4">
                      <div className="space-y-1.5 w-[min(100%,200px)] sm:w-[220px]">
                        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
                        <Select
                          value={myRunsStatus.trim() ? myRunsStatus : "all"}
                          onValueChange={(v) => setMyRunsStatus(v === "all" ? "" : v)}
                        >
                          <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
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
                      <div className="space-y-1.5 min-w-[min(100%,220px)] flex-1 sm:max-w-[360px]">
                        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Strategy</Label>
                        <Select
                          value={myRunsStrategyId.trim() ? myRunsStrategyId : "all"}
                          onValueChange={(v) => setMyRunsStrategyId(v === "all" ? "" : v)}
                        >
                          <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm [&>span]:truncate">
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
                        variant="outline"
                        size="sm"
                        className="h-10 shrink-0 border-border/80 bg-background/60 px-4 text-xs font-medium shadow-sm"
                        onClick={() => {
                          setMyRunsStatus("");
                          setMyRunsStrategyId("");
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.45)] backdrop-blur-sm dark:bg-card/35 dark:shadow-[0_28px_56px_-18px_rgba(0,0,0,0.65)]">
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
                      aria-hidden
                    />
                    <div className="flex flex-col gap-0.5 border-b border-border/45 bg-muted/20 px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-3.5">
                      <div>
                        <h3 className="text-sm font-semibold tracking-tight text-foreground">Run log</h3>
                        <p className="text-xs text-muted-foreground">Newest first · same statuses as the lab explorer.</p>
                      </div>
                      <p className="text-xs font-medium tabular-nums text-muted-foreground sm:text-right">
                        <span className="text-foreground/80">{myRunsTotal.toLocaleString()}</span> runs
                        {myLoading ? (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                            updating
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <Table className="min-w-[640px] [&_td]:px-4 [&_td]:py-3.5 [&_td:first-child]:pl-5 sm:[&_td:first-child]:pl-6 [&_td:last-child]:pr-5 sm:[&_td:last-child]:pr-6 [&_th]:px-4 [&_th]:py-3.5 [&_th:first-child]:pl-5 sm:[&_th:first-child]:pl-6 [&_th:last-child]:pr-5 sm:[&_th:last-child]:pr-6">
                      <TableHeader className="sticky top-0 z-10 border-b border-border/50 bg-muted/90 shadow-sm backdrop-blur-md dark:bg-muted/85 [&_tr]:border-b-0 [&_tr]:hover:bg-transparent">
                        <TableRow className="border-0 hover:bg-transparent">
                          <SortableTableHead label="Time" sortKey="time" activeKey={myRunsSortKey} order={myRunsSortOrder} onSort={onMyRunsSort} />
                          <SortableTableHead label="Status" sortKey="status" activeKey={myRunsSortKey} order={myRunsSortOrder} onSort={onMyRunsSort} />
                          <SortableTableHead label="Signal" sortKey="signal" activeKey={myRunsSortKey} order={myRunsSortOrder} onSort={onMyRunsSort} />
                          <SortableTableHead label="Symbol" sortKey="symbol" activeKey={myRunsSortKey} order={myRunsSortOrder} onSort={onMyRunsSort} />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myLoading && myRuns.length === 0 ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={4} className="py-14 text-center text-muted-foreground">
                              <span className="inline-flex items-center justify-center gap-2 text-sm">
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                                Loading runs…
                              </span>
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {!myLoading && myRunsTotal === 0 ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={4} className="py-14 text-center">
                              <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4">
                                <p className="text-sm font-medium text-foreground">
                                  {myRunsStatus.trim() || myRunsStrategyId.trim()
                                    ? "No runs match these filters"
                                    : "No experiment runs yet"}
                                </p>
                                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                  {myRunsStatus.trim() || myRunsStrategyId.trim()
                                    ? "Try clearing filters or pick another strategy."
                                    : "When your agents execute, their runs will appear here."}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {!myLoading && myRunsTotal > 0 && myRuns.length === 0 ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={4} className="py-14 text-center text-sm text-muted-foreground">
                              No runs on this page match the current filters.
                            </TableCell>
                          </TableRow>
                        ) : null}
                        {!myLoading &&
                          sortedMyRuns.map((r) => (
                            <TableRow
                              key={r._id}
                              className="group border-border/25 transition-colors duration-150 hover:bg-muted/[0.22]"
                            >
                              <TableCell className="whitespace-nowrap font-mono text-[11px] tabular-nums text-muted-foreground">
                                {formatTime(r.createdAt)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "max-w-[14rem] truncate font-mono text-[10px] font-semibold normal-case tracking-normal",
                                    explorerRunStatusBadgeClass(r.status),
                                  )}
                                  title={r.status}
                                >
                                  {statusOptionLabel(r.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "font-mono text-[10px] font-semibold tabular-nums",
                                    explorerSignalBadgeClass(r.clearSignal),
                                  )}
                                >
                                  {r.clearSignal}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex min-w-0 max-w-[180px] items-center gap-2">
                                  <CoinLogo symbol={r.symbol} size="sm" fallbackSeed={r.symbol} />
                                  <span className="truncate font-mono text-xs font-medium text-foreground/90">{r.symbol}</span>
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/10 shadow-sm">
                    <ExperimentTablePagination
                      page={myRunsPage}
                      pageSize={TABLE_PAGE_SIZE}
                      totalItems={myRunsTotal}
                      loading={myLoading}
                      onPageChange={setMyRunsPage}
                      className="mb-0 px-3 sm:px-4"
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </CoingeckoBatchImageProvider>
      </main>
    </div>
  );
}
