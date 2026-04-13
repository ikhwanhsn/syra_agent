import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Filter,
  Play,
  Copy,
  BarChart3,
  Calendar,
  FileJson,
  List,
  Heading,
  Eye,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/TopBar';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { resolveApiBaseUrl } from '@/lib/resolveApiBaseUrl';
import { BRAND_NAME, MAIN_CONTENT_PT_CLASS, MAIN_CONTENT_PB_SAFE_CLASS } from '@/lib/branding';
import { formatDistanceToNow, format } from 'date-fns';

const CHART_TICK = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };
const CHART_AXIS_LINE = { stroke: 'hsl(var(--border))' };

interface ShareItem {
  slug: string;
  method: string;
  url: string;
  paramsCount: number;
  headersCount: number;
  bodyLength: number;
  createdAt: string;
  updatedAt: string;
  sharedByWallet: string | null;
  sharedByChain: string | null;
  sharedByEmail: string | null;
}

interface ExplorerStats {
  total: number;
  byMethod: Record<string, number>;
  lastCreatedAt: string | null;
}

interface ExplorerCharts {
  sharesOverTime: { date: string; count: number }[];
  byMethod: { method: string; count: number }[];
  byChain: { chain: string; count: number }[];
  last24h: number;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-secondary/90 text-foreground border border-border/80 font-semibold',
  POST: 'bg-warning/20 text-warning-foreground border border-warning/40 font-semibold',
  PUT: 'bg-warning/15 text-warning border border-warning/30 font-semibold',
  PATCH: 'bg-primary/15 text-foreground border border-primary/35 font-semibold',
  DELETE: 'bg-destructive/20 text-destructive-foreground border border-destructive/35 font-semibold',
};

const CHART_METHOD_COLORS: Record<string, string> = {
  GET: 'hsl(215 16% 72%)',
  POST: 'hsl(var(--warning))',
  PUT: 'hsl(38 85% 55%)',
  PATCH: 'hsl(var(--primary))',
  DELETE: 'hsl(var(--destructive))',
};
const CHAIN_COLORS = ['hsl(215 70% 55%)', 'hsl(220 14% 78%)'];

const PAGE_SIZES = [20, 50, 100];

const Explorer = () => {
  const navigate = useNavigate();
  const { wallet } = useApiPlayground();
  const { toast } = useToast();
  const [stats, setStats] = useState<ExplorerStats | null>(null);
  const [items, setItems] = useState<ShareItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(50);
  const [charts, setCharts] = useState<ExplorerCharts | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);

  const base = resolveApiBaseUrl();

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${base}/playground/explorer/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [base]);

  const fetchShares = useCallback(async () => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));
      if (methodFilter) params.set('method', methodFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`${base}/playground/shares?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total ?? 0);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoadingList(false);
    }
  }, [base, page, limit, methodFilter, search]);

  const fetchCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      const res = await fetch(`${base}/playground/explorer/charts?days=14`);
      if (res.ok) {
        const data = await res.json();
        setCharts(data);
      } else {
        setCharts(null);
      }
    } catch {
      setCharts(null);
    } finally {
      setChartsLoading(false);
    }
  }, [base]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const goToDetail = (slug: string, e?: React.MouseEvent) => {
    if (e) {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) return;
    }
    navigate(`/explorer/${slug}`);
  };

  const copyShareLink = (slug: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: 'Link copied', description: 'Share link copied to clipboard.' });
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const methods = stats?.byMethod ? Object.keys(stats.byMethod).sort() : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  const chartTooltipStyle = {
    fontSize: 12,
    borderRadius: 10,
    border: '1px solid hsl(var(--border) / 0.6)',
    background: 'hsl(var(--card) / 0.95)',
    backdropFilter: 'blur(8px)',
    color: 'hsl(var(--foreground))',
    boxShadow: '0 8px 24px hsl(0 0% 0% / 0.35)',
  };

  return (
    <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-x-hidden max-w-[100vw] playground-ambient relative">
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => {}}
        onToggleSidebar={() => {}}
        isSidebarOpen={false}
        flowStatus="idle"
      />
      <div
        className={cn(
          'flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden relative z-[1]',
          MAIN_CONTENT_PT_CLASS,
          MAIN_CONTENT_PB_SAFE_CLASS,
        )}
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 pb-24">
          {/* Header */}
          <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-8 border border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/25 via-ring/12 to-transparent blur-md opacity-80"
                  aria-hidden
                />
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-card/90 ring-1 ring-border/60 dark:ring-white/[0.08] shadow-md flex items-center justify-center border border-border/40">
                  <Compass className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  Explorer
                </h1>
                <p className="text-sm sm:text-[15px] text-muted-foreground mt-2 leading-relaxed max-w-2xl text-balance">
                  Shared request history — discover and try API calls others have run.
                </p>
              </div>
            </div>
          </div>

          {/* Charts */}
          {chartsLoading && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 min-h-[220px] flex items-center justify-center shadow-inner shadow-black/10"
                >
                  <div className="animate-pulse rounded-xl bg-muted/40 h-[190px] w-full" />
                </div>
              ))}
            </section>
          )}
          {!chartsLoading && charts && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-8">
              {/* 1. Shares over time (area) */}
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5 min-h-[220px] shadow-sm dark:shadow-black/20">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 tracking-tight">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-border/50">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </span>
                  Shares over time (14 days)
                </h3>
                <div className="h-[190px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.sharesOverTime} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
                      <defs>
                        <linearGradient id="sharesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={CHART_TICK}
                        tickLine={false}
                        axisLine={CHART_AXIS_LINE}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis width={36} tick={CHART_TICK} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        labelFormatter={(v) => v}
                        formatter={(value: number) => [value, 'Shares']}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        fill="url(#sharesGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. By HTTP method (bar) */}
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5 min-h-[220px] shadow-sm dark:shadow-black/20">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 tracking-tight">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-border/50">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </span>
                  Requests by method
                </h3>
                <div className="h-[190px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.byMethod} layout="vertical" margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                      <XAxis type="number" tick={CHART_TICK} tickLine={false} axisLine={CHART_AXIS_LINE} />
                      <YAxis
                        type="category"
                        dataKey="method"
                        width={48}
                        tick={{ ...CHART_TICK, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [value, 'Requests']} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {charts.byMethod.map((_, i) => (
                          <Cell key={i} fill={CHART_METHOD_COLORS[charts.byMethod[i].method] || 'hsl(var(--muted-foreground))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. By chain (pie) */}
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5 min-h-[220px] shadow-sm dark:shadow-black/20">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 tracking-tight">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-border/50">
                    <Compass className="h-4 w-4 text-primary" />
                  </span>
                  Shares by chain
                </h3>
                <div className="h-[190px] w-full">
                  {charts.byChain.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.byChain}
                          dataKey="count"
                          nameKey="chain"
                          cx="50%"
                          cy="50%"
                          innerRadius={44}
                          outerRadius={72}
                          paddingAngle={2}
                          label={(props: {
                            cx: number;
                            cy: number;
                            midAngle: number;
                            innerRadius: number;
                            outerRadius: number;
                            payload?: { chain?: string; count?: number };
                          }) => {
                            const { cx, cy, midAngle, innerRadius, outerRadius, payload } = props;
                            const chain = payload?.chain ?? '';
                            const count = payload?.count ?? 0;
                            const RADIAN = Math.PI / 180;
                            const r = innerRadius + (outerRadius - innerRadius) * 0.55;
                            const x = cx + r * Math.cos(-midAngle * RADIAN);
                            const y = cy + r * Math.sin(-midAngle * RADIAN);
                            return (
                              <text
                                x={x}
                                y={y}
                                fill="hsl(var(--foreground))"
                                textAnchor={x > cx ? 'start' : 'end'}
                                dominantBaseline="central"
                                style={{ fontSize: 11, fontWeight: 600 }}
                              >
                                {`${chain} · ${count}`}
                              </text>
                            );
                          }}
                        >
                          {charts.byChain.map((_, i) => (
                            <Cell key={i} fill={CHAIN_COLORS[i % CHAIN_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [value, 'Shares']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      No chain data yet
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Last 24h (single metric card) */}
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5 flex flex-col justify-center min-h-[220px] shadow-sm dark:shadow-black/20 relative overflow-hidden">
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.07] to-transparent"
                  aria-hidden
                />
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 tracking-tight relative">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-border/50">
                    <Calendar className="h-4 w-4 text-primary" />
                  </span>
                  Last 24 hours
                </h3>
                <p className="font-display text-4xl sm:text-5xl font-semibold text-foreground tabular-nums relative tracking-tight">
                  {charts.last24h}
                </p>
                <p className="text-sm text-muted-foreground mt-2 relative">Shared requests</p>
              </div>
            </section>
          )}

          {/* Stats cards — full-width row: Total, Last 24h, GET–DELETE, Last shared, Solana, Base */}
          {!loading && stats && (
            <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-3 sm:gap-3 mb-8 w-full auto-rows-fr">
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 flex flex-col gap-2 min-w-0 shadow-sm dark:shadow-black/15">
                <BarChart3 className="h-4 w-4 text-primary shrink-0" />
                <p className="font-display text-xl sm:text-2xl font-semibold text-foreground tabular-nums truncate leading-tight">
                  {stats.total.toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total shared</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 flex flex-col gap-2 min-w-0 shadow-sm dark:shadow-black/15">
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                <p className="font-display text-xl sm:text-2xl font-semibold text-foreground tabular-nums leading-tight">
                  {(charts?.last24h ?? 0).toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Last 24h</p>
              </div>
              {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((m) => (
                <div
                  key={m}
                  className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 flex flex-col gap-2 min-w-0 shadow-sm dark:shadow-black/15"
                >
                  <span className={cn('text-[10px] font-bold border rounded-md px-2 py-0.5 w-fit', METHOD_COLORS[m] || 'bg-muted text-muted-foreground')}>
                    {m}
                  </span>
                  <p className="font-display text-xl sm:text-2xl font-semibold text-foreground tabular-nums leading-tight">
                    {(stats.byMethod[m] ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Requests</p>
                </div>
              ))}
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 flex flex-col gap-2 min-w-0 shadow-sm dark:shadow-black/15">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-semibold text-foreground truncate leading-snug">
                  {stats.lastCreatedAt ? formatDistanceToNow(new Date(stats.lastCreatedAt), { addSuffix: true }) : '—'}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Last shared</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 flex flex-col gap-2 min-w-0 shadow-sm dark:shadow-black/15">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Solana</span>
                <p className="font-display text-xl sm:text-2xl font-semibold text-foreground tabular-nums leading-tight">
                  {(charts?.byChain?.find((c) => c.chain === 'solana')?.count ?? 0).toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">By chain</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-4 flex flex-col gap-2 min-w-0 shadow-sm dark:shadow-black/15">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Base</span>
                <p className="font-display text-xl sm:text-2xl font-semibold text-foreground tabular-nums leading-tight">
                  {(charts?.byChain?.find((c) => c.chain === 'base')?.count ?? 0).toLocaleString()}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">By chain</p>
              </div>
            </section>
          )}

          {/* Search and filters */}
          <section className="flex flex-wrap items-center justify-between gap-3 mb-5 rounded-2xl border border-border/50 bg-muted/15 dark:bg-black/20 p-3 sm:p-4 shadow-inner shadow-black/5">
            <div className="relative min-w-[200px] w-full sm:w-96 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setPage(0)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border/80 bg-background/80 dark:bg-card/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 transition-shadow"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/60 border border-border/50 shrink-0">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </span>
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(0);
                }}
                className="h-10 min-w-[9rem] flex-1 sm:flex-initial rounded-xl border border-border/80 bg-background/80 dark:bg-card/40 text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-primary/25 font-medium"
              >
                <option value="">All methods</option>
                {methods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Table */}
          <section className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden w-full shadow-sm dark:shadow-black/20">
            {loadingList ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <div className="animate-spin rounded-full h-9 w-9 border-2 border-primary border-t-transparent" />
                <p className="text-sm font-medium text-foreground">Loading shares…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/30 ring-1 ring-border/50 flex items-center justify-center mb-4">
                  <Compass className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="font-display text-base font-semibold text-foreground">No shared requests</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm text-balance">
                  {`Share a request from ${BRAND_NAME} to see it here.`}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 dark:bg-black/25">
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-24">
                          Method
                        </th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground min-w-0">
                          URL
                        </th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-28">
                          Slug
                        </th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-36">
                          Params / Headers / Body
                        </th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-40">
                          Shared by
                        </th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-28">
                          Created
                        </th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-28">
                          Updated
                        </th>
                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-36">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.slug}
                          onClick={(e) => goToDetail(item.slug, e)}
                          className="border-b border-border/40 transition-colors cursor-pointer group hover:bg-muted/15 dark:hover:bg-white/[0.03]"
                        >
                          <td className="py-3 px-4 align-middle">
                            <span
                              className={cn(
                                'inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                                METHOD_COLORS[item.method] || 'bg-muted text-muted-foreground',
                              )}
                            >
                              {item.method}
                            </span>
                          </td>
                          <td className="py-3 px-4 min-w-0 align-middle">
                            <span
                              className="truncate block font-mono text-[11px] sm:text-xs text-foreground/95 max-w-[320px] sm:max-w-[420px]"
                              title={item.url}
                            >
                              {item.url}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <code className="text-[11px] text-foreground font-mono bg-muted/60 border border-border/60 px-2 py-0.5 rounded-md">
                              {item.slug}
                            </code>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs align-middle">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {item.paramsCount > 0 && <span className="flex items-center gap-0.5" title="Params"><List className="h-3 w-3" />{item.paramsCount}</span>}
                              {item.headersCount > 0 && <span className="flex items-center gap-0.5" title="Headers"><Heading className="h-3 w-3" />{item.headersCount}</span>}
                              {item.bodyLength > 0 && <span className="flex items-center gap-0.5" title="Body"><FileJson className="h-3 w-3" />{item.bodyLength}</span>}
                              {item.paramsCount === 0 && item.headersCount === 0 && item.bodyLength === 0 && <span>—</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs align-middle">
                            {item.sharedByWallet ? (
                              <span className="font-mono truncate block text-foreground/90" title={item.sharedByWallet}>
                                {item.sharedByWallet.slice(0, 6)}…{item.sharedByWallet.slice(-4)}
                              </span>
                            ) : item.sharedByEmail ? (
                              <span className="truncate block text-foreground/85" title={item.sharedByEmail}>
                                {item.sharedByEmail}
                              </span>
                            ) : (
                              <span>—</span>
                            )}
                            {item.sharedByChain && (
                              <span className="text-[10px] font-medium text-muted-foreground mt-0.5 block capitalize">
                                {item.sharedByChain}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs align-middle tabular-nums">
                            {format(new Date(item.createdAt), 'MMM d, HH:mm')}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs align-middle">
                            {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                          </td>
                          <td className="py-3 px-4 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8 rounded-lg"
                                onClick={() => goToDetail(item.slug)}
                                title="View details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8 rounded-lg"
                                onClick={(e) => copyShareLink(item.slug, e)}
                                title="Copy share link"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="neon" size="sm" className="gap-1 h-8 rounded-full px-3 font-semibold shadow-sm" asChild>
                                <Link to={`/s/${item.slug}`}>
                                  <Play className="h-3.5 w-3.5" />
                                  Try
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination — bottom only: show per page + range + prev/next */}
                <div className="flex flex-wrap items-center justify-between px-4 py-3.5 border-t border-border/50 bg-muted/15 dark:bg-black/25 gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">Show</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(0);
                      }}
                      className="h-9 rounded-lg border border-border/80 bg-background/90 dark:bg-card/50 text-sm text-foreground px-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary/25"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span>per page</span>
                  </div>
                  <p className="text-xs text-muted-foreground order-last w-full sm:order-none sm:w-auto">
                    Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      className="rounded-full h-9"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-medium text-muted-foreground px-2 whitespace-nowrap tabular-nums">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      className="rounded-full h-9"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </section>

          <div className="mt-6 rounded-xl border border-dashed border-border/50 bg-muted/10 dark:bg-black/15 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
            Click a row or <span className="font-semibold text-foreground">View details</span> for the full snapshot.{' '}
            <span className="font-semibold text-foreground">Try</span> opens the share in {BRAND_NAME}.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explorer;
