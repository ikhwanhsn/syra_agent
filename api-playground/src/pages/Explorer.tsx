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
import { BRAND_NAME } from '@/lib/branding';
import { formatDistanceToNow, format } from 'date-fns';

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
  GET: 'bg-accent/20 text-foreground border border-accent/35',
  POST: 'bg-warning/15 text-warning border-warning/25',
  PUT: 'bg-warning/15 text-warning border-warning/25',
  PATCH: 'bg-primary/20 text-foreground border border-primary/40',
  DELETE: 'bg-destructive/15 text-destructive border-destructive/25',
};

const CHART_METHOD_COLORS: Record<string, string> = {
  GET: 'hsl(var(--accent))',
  POST: 'hsl(var(--warning))',
  PUT: 'hsl(var(--warning))',
  PATCH: 'hsl(var(--primary))',
  DELETE: 'hsl(var(--destructive))',
};
const CHAIN_COLORS = ['hsl(var(--accent))', 'hsl(var(--neon-blue))'];

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

  return (
    <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-x-hidden max-w-[100vw]">
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => {}}
        onToggleSidebar={() => {}}
        isSidebarOpen={false}
      />
      <div className="flex-1 min-h-0 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4rem+env(safe-area-inset-top,0px))] w-full overflow-y-scroll overflow-x-hidden">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/50 shrink-0">
                  <Compass className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Explorer</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Shared request history — discover and try API calls others have run.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          {chartsLoading && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-4 min-h-[200px] flex items-center justify-center">
                  <div className="animate-pulse rounded-lg bg-muted/50 h-[180px] w-full" />
                </div>
              ))}
            </section>
          )}
          {!chartsLoading && charts && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* 1. Shares over time (area) */}
              <div className="rounded-xl border border-border/50 bg-card/50 p-4 min-h-[200px]">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Shares over time (14 days)
                </h3>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.sharesOverTime} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sharesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis width={28} tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ fontSize: 11 }}
                        labelFormatter={(v) => v}
                        formatter={(value: number) => [value, 'Shares']}
                      />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#sharesGradient)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. By HTTP method (bar) */}
              <div className="rounded-xl border border-border/50 bg-card/50 p-4 min-h-[200px]">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Requests by method
                </h3>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.byMethod} layout="vertical" margin={{ top: 4, right: 8, left: 36, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="method" width={36} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 11 }} formatter={(value: number) => [value, 'Requests']} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {charts.byMethod.map((_, i) => (
                          <Cell key={i} fill={CHART_METHOD_COLORS[charts.byMethod[i].method] || 'hsl(var(--muted-foreground))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. By chain (pie) */}
              <div className="rounded-xl border border-border/50 bg-card/50 p-4 min-h-[200px]">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Compass className="h-4 w-4 text-primary" />
                  Shares by chain
                </h3>
                <div className="h-[180px] w-full">
                  {charts.byChain.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.byChain}
                          dataKey="count"
                          nameKey="chain"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={2}
                          label={({ chain, count }) => `${chain} ${count}`}
                        >
                          {charts.byChain.map((_, i) => (
                            <Cell key={i} fill={CHAIN_COLORS[i % CHAIN_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11 }} formatter={(value: number) => [value, 'Shares']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No chain data yet</div>
                  )}
                </div>
              </div>

              {/* 4. Last 24h (single metric card) */}
              <div className="rounded-xl border border-border/50 bg-card/50 p-4 flex flex-col justify-center min-h-[200px]">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Last 24 hours
                </h3>
                <p className="text-3xl font-bold text-foreground tabular-nums">{charts.last24h}</p>
                <p className="text-xs text-muted-foreground mt-1">shared requests</p>
              </div>
            </section>
          )}

          {/* Stats cards — full-width row: Total, Last 24h, GET–DELETE, Last shared, Solana, Base */}
          {!loading && stats && (
            <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-3 mb-4 w-full">
              <div className="rounded-xl border border-border/50 bg-card/50 p-4 flex flex-col gap-1 min-w-0">
                <BarChart3 className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xl lg:text-2xl font-bold text-foreground tabular-nums truncate">{stats.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total shared</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/50 p-4 flex flex-col gap-1 min-w-0">
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xl lg:text-2xl font-bold text-foreground tabular-nums">{(charts?.last24h ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Last 24h</p>
              </div>
              {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((m) => (
                <div key={m} className="rounded-xl border border-border/50 bg-card/50 p-4 flex flex-col gap-1 min-w-0">
                  <span className={cn('text-xs font-bold border rounded px-2 py-0.5 w-fit', METHOD_COLORS[m] || 'bg-muted text-muted-foreground')}>{m}</span>
                  <p className="text-xl lg:text-2xl font-bold text-foreground tabular-nums">{(stats.byMethod[m] ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">requests</p>
                </div>
              ))}
              <div className="rounded-xl border border-border/50 bg-card/50 p-4 flex flex-col gap-1 min-w-0">
                <Calendar className="h-4 w-4 text-accent shrink-0" />
                <p className="text-sm font-semibold text-foreground truncate">
                  {stats.lastCreatedAt ? formatDistanceToNow(new Date(stats.lastCreatedAt), { addSuffix: true }) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Last shared</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/50 p-4 flex flex-col gap-1 min-w-0">
                <span className="text-xs font-bold text-primary">Solana</span>
                <p className="text-xl lg:text-2xl font-bold text-foreground tabular-nums">{(charts?.byChain?.find((c) => c.chain === 'solana')?.count ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">by chain</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/50 p-4 flex flex-col gap-1 min-w-0">
                <span className="text-xs font-bold text-foreground">Base</span>
                <p className="text-xl lg:text-2xl font-bold text-foreground tabular-nums">{(charts?.byChain?.find((c) => c.chain === 'base')?.count ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">by chain</p>
              </div>
            </section>
          )}

          {/* Search and filters — search left, filters right (justify-between) */}
          <section className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="relative min-w-[200px] w-full sm:w-80 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setPage(0)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(0);
                }}
                className="h-9 rounded-lg border border-border bg-background text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All methods</option>
                {methods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Table — full width */}
          <section className="rounded-xl border border-border/50 bg-card/30 overflow-hidden w-full">
            {loadingList ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Compass className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No shared requests found</p>
                <p className="text-xs mt-1">{`Share a request from ${BRAND_NAME} to see it here.`}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground w-20">Method</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground min-w-0">URL</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground w-28">Slug</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground w-32">Params / Headers / Body</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground w-36">Shared by</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground w-24">Created</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground w-24">Updated</th>
                        <th className="text-right py-2.5 px-3 font-medium text-muted-foreground w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.slug}
                          onClick={(e) => goToDetail(item.slug, e)}
                          className="border-b border-border/30 hover:bg-muted/25 transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-3">
                            <span className={cn('inline-flex rounded border px-2 py-0.5 text-xs font-medium', METHOD_COLORS[item.method] || 'bg-muted text-muted-foreground')}>
                              {item.method}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 min-w-0">
                            <span className="truncate block font-mono text-xs text-foreground max-w-[320px] sm:max-w-[420px]" title={item.url}>
                              {item.url}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <code className="text-xs text-foreground/90 font-mono bg-muted border border-border/60 px-1.5 py-0.5 rounded">
                              {item.slug}
                            </code>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {item.paramsCount > 0 && <span className="flex items-center gap-0.5" title="Params"><List className="h-3 w-3" />{item.paramsCount}</span>}
                              {item.headersCount > 0 && <span className="flex items-center gap-0.5" title="Headers"><Heading className="h-3 w-3" />{item.headersCount}</span>}
                              {item.bodyLength > 0 && <span className="flex items-center gap-0.5" title="Body"><FileJson className="h-3 w-3" />{item.bodyLength}</span>}
                              {item.paramsCount === 0 && item.headersCount === 0 && item.bodyLength === 0 && <span>—</span>}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">
                            {item.sharedByWallet ? (
                              <span className="font-mono truncate block" title={item.sharedByWallet}>
                                {item.sharedByWallet.slice(0, 6)}…{item.sharedByWallet.slice(-4)}
                              </span>
                            ) : item.sharedByEmail ? (
                              <span className="truncate block" title={item.sharedByEmail}>{item.sharedByEmail}</span>
                            ) : (
                              <span>—</span>
                            )}
                            {item.sharedByChain && <span className="text-[10px] text-muted-foreground/80 block">{item.sharedByChain}</span>}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">
                            {format(new Date(item.createdAt), 'MMM d, HH:mm')}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                          </td>
                          <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-0.5">
                              <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={() => goToDetail(item.slug)} title="View details">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={(e) => copyShareLink(item.slug, e)} title="Copy share link">
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="default" size="sm" className="gap-1 h-8" asChild>
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
                <div className="flex flex-wrap items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20 gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Show</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(0);
                      }}
                      className="h-8 rounded-md border border-border bg-background text-sm text-foreground px-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground px-2 whitespace-nowrap">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Info — compact */}
          <div className="mt-4 py-2 text-xs text-muted-foreground border-t border-border/30">
            Click a row or <strong className="text-foreground">View details</strong> to open the full request. Use <strong className="text-foreground">Try</strong> to open it in {BRAND_NAME}.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explorer;
