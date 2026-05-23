import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { agentWalletApi } from "@/lib/chatApi";
import {
  agentDetailPath,
  defaultSortOrder,
  explorerUrl,
  formatRelativeTime,
  isSolanaAgent,
  shortenAddress,
  sortAgentRows,
  type AgentSortKey,
  type AgentSortOrder,
  type AgentWalletRow,
} from "@/lib/agentWalletUi";
import { formatCompactUsd, formatSol } from "@/lib/dashboardOverviewAggregates";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { AgentsPageHero } from "@/components/dashboard/agents/AgentsPageHero";
import { AgentsSortableHeader } from "@/components/dashboard/agents/AgentsSortableHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PremiumTablePagination } from "@/components/experiment/PremiumTablePagination";
import { useTablePagination } from "@/hooks/useTablePagination";

const STALE_MS = 45_000;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type OwnershipFilter = "all" | "mine";

function listErrorMessage(error: unknown, ownershipFilter: OwnershipFilter): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg === "auth_required") {
    return "Connect your wallet and approve the Syra sign-in message to load agents.";
  }
  if (msg === "not_admin" || msg === "admin_required" || msg === "admin_disabled") {
    if (ownershipFilter === "all") {
      return "The global agent directory is admin-only. Switch ownership to My wallets to see your agents.";
    }
  }
  return "Could not load agents. Check the API and try again.";
}

export interface DashboardAgentsProps {
  embedded?: boolean;
}

function AddressCell({
  address,
  isEvm,
  onCopy,
  explorer,
}: {
  address: string;
  isEvm: boolean;
  onCopy: (text: string, label: string) => void;
  explorer: string | null;
}) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <code className="font-mono text-xs font-medium tabular-nums text-foreground sm:text-[13px]">
        {shortenAddress(address, isEvm)}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onCopy(address, "Address");
        }}
        aria-label="Copy address"
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      {explorer ? (
        <a
          href={explorer}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-colors hover:bg-muted/50 hover:text-foreground group-hover/row:opacity-100 focus-visible:opacity-100"
          aria-label="Open in explorer"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null}
    </div>
  );
}

function BalanceCell({ anonymousId, chain }: { anonymousId: string; chain: AgentWalletRow["chain"] }) {
  const balanceQ = useQuery({
    queryKey: ["agent-wallet-balance", anonymousId],
    queryFn: () => agentWalletApi.getBalance(anonymousId),
    enabled: chain === "solana",
    staleTime: STALE_MS,
    retry: 1,
  });

  if (chain !== "solana") {
    return <span className="font-mono text-xs tabular-nums text-muted-foreground">—</span>;
  }
  if (balanceQ.isLoading) return <Skeleton className="ml-auto h-4 w-20 rounded-md" />;
  if (balanceQ.isError || !balanceQ.data) {
    return <span className="font-mono text-xs tabular-nums text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col items-end gap-0.5 font-mono text-xs tabular-nums">
      <span className="text-foreground">{formatSol(balanceQ.data.solBalance)} SOL</span>
      <span className="text-muted-foreground">{formatCompactUsd(balanceQ.data.usdcBalance)} USDC</span>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/50"
    >
      {label}
      <X className="h-3 w-3 text-muted-foreground" aria-hidden />
    </button>
  );
}

export default function DashboardAgents({ embedded = false }: DashboardAgentsProps) {
  const navigate = useNavigate();
  const { address, requestConnect } = useWalletContext();
  const { syraAuthReady, syraAuthenticated, requestSyraAuth } = useSyraAuth();
  const {
    ready: agentWalletReady,
    anonymousId: contextAnonymousId,
    agentAddress: contextAgentAddress,
    avatarUrl: contextAvatarUrl,
  } = useAgentWallet();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all");
  const [sortKey, setSortKey] = useState<AgentSortKey>("updated");
  const [sortOrder, setSortOrder] = useState<AgentSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, ownershipFilter, pageSize, sortKey, sortOrder]);

  const onSort = useCallback((key: AgentSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
        return prev;
      }
      setSortOrder(defaultSortOrder(key));
      return key;
    });
  }, []);

  const connectedWalletKeys = useMemo(() => {
    const keys = new Set<string>();
    if (address) keys.add(address.toLowerCase());
    return keys;
  }, [address]);

  const mineWallets = useMemo(() => {
    const list: string[] = [];
    if (address) list.push(address);
    return list;
  }, [address]);

  const apiChain = "solana" as const;
  const useClientPagination = ownershipFilter === "mine" && mineWallets.length > 0;
  const serverOffset = (page - 1) * pageSize;

  const listQ = useQuery({
    queryKey: [
      "agent-wallet-list",
      ownershipFilter,
      mineWallets.join("|"),
      debouncedSearch,
      useClientPagination ? "client" : page,
      useClientPagination ? "all" : pageSize,
      sortKey,
      sortOrder,
    ],
    queryFn: async () => {
      const q = debouncedSearch || undefined;
      const chain = apiChain;

      if (ownershipFilter === "mine" && mineWallets.length > 0) {
        const results = await Promise.all(
          mineWallets.map((walletAddress) =>
            agentWalletApi.list({ walletAddress, limit: 100, q, chain }),
          ),
        );
        const agents = results.flatMap((r) => r.agents) as AgentWalletRow[];
        const first = results[0];
        return {
          total: agents.length,
          userCount: mineWallets.length,
          totalAgents: first?.totalAgents ?? agents.length,
          totalUsers: mineWallets.length,
          solanaCount: results.reduce((n, r) => n + r.solanaCount, 0),
          baseCount: results.reduce((n, r) => n + r.baseCount, 0),
          limit: agents.length,
          offset: 0,
          agents,
        };
      }

      return agentWalletApi.list({
        limit: pageSize,
        offset: serverOffset,
        q,
        chain,
        sort: sortKey,
        order: sortOrder,
      });
    },
    staleTime: STALE_MS,
    placeholderData: (prev) => prev,
    enabled:
      ownershipFilter === "all" ||
      (syraAuthReady && syraAuthenticated && mineWallets.length > 0),
  });

  const contextLinkedAgent = useMemo((): AgentWalletRow | undefined => {
    if (!agentWalletReady || !contextAnonymousId || !contextAgentAddress || !address) return undefined;
    return {
      anonymousId: contextAnonymousId,
      walletAddress: address,
      chain: "solana",
      agentAddress: contextAgentAddress,
      avatarUrl: contextAvatarUrl,
      createdAt: null,
      updatedAt: null,
    };
  }, [agentWalletReady, contextAnonymousId, contextAgentAddress, contextAvatarUrl, address]);

  const agents = (listQ.data?.agents ?? []).filter(isSolanaAgent) as AgentWalletRow[];
  const agentsWithFallback = useMemo(() => {
    if (ownershipFilter !== "mine" || !contextLinkedAgent) return agents;
    if (agents.some((agent) => agent.anonymousId === contextLinkedAgent.anonymousId)) return agents;
    return [contextLinkedAgent, ...agents];
  }, [agents, contextLinkedAgent, ownershipFilter]);
  const sortedForClient = useMemo(
    () => (useClientPagination ? sortAgentRows(agentsWithFallback, sortKey, sortOrder) : agentsWithFallback),
    [agentsWithFallback, sortKey, sortOrder, useClientPagination],
  );

  const clientPagination = useTablePagination(sortedForClient, pageSize);
  const displayAgents = useClientPagination ? clientPagination.slice : sortedForClient;
  const paginationTotal = useClientPagination ? clientPagination.totalItems : (listQ.data?.total ?? 0);
  const paginationPage = useClientPagination ? clientPagination.page : page;

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (debouncedSearch) n += 1;
    if (ownershipFilter === "mine") n += 1;
    return n;
  }, [debouncedSearch, ownershipFilter]);

  const stats = useMemo(
    () => ({
      totalAgents: listQ.data?.totalAgents ?? listQ.data?.total ?? 0,
      userCount: listQ.data?.totalUsers ?? listQ.data?.userCount ?? 0,
      solana: listQ.data?.solanaCount ?? 0,
    }),
    [listQ.data],
  );

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setOwnershipFilter("all");
    setPage(1);
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const authBlocked =
    ownershipFilter === "mine" &&
    mineWallets.length > 0 &&
    syraAuthReady &&
    !syraAuthenticated;

  const isEmpty = !listQ.isLoading && !authBlocked && displayAgents.length === 0;

  return (
    <div className={cn("relative flex flex-col min-h-0", embedded ? "flex-1 min-h-0" : "min-h-screen")}>
      <OverviewPageBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "relative flex-1 space-y-6",
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
        )}
      >
        <AgentsPageHero
          stats={stats}
          isLoading={listQ.isLoading && !listQ.data}
          isFetching={listQ.isFetching}
        />

        <div className={cn(overviewCardShell, "overflow-hidden")}>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{ background: overviewAccentBackground("marketplace") }}
            aria-hidden
          />

          <div className="relative border-b border-border/45 px-4 py-4 sm:px-5 sm:py-5">
            <div className="mb-4 flex items-start gap-2">
              <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">Filters</h2>
                <p className="text-xs text-muted-foreground/90">Solana agents only — narrow the roster before sorting.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-6">
                <Label htmlFor="agents-search" className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
                  Search
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="agents-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Wallet, agent, or ID…"
                    className="h-10 border-border/80 bg-background/80 pl-10 font-mono text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary/25"
                  />
                </div>
              </div>

              <div className="space-y-1.5 lg:col-span-3">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">Ownership</Label>
                <Select
                  value={ownershipFilter}
                  onValueChange={(v) => setOwnershipFilter(v as OwnershipFilter)}
                  disabled={mineWallets.length === 0}
                >
                  <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60">
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="mine" disabled={mineWallets.length === 0}>
                      My wallets
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3 lg:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 flex-1 gap-2 rounded-xl border-border/80 sm:flex-none"
                  disabled={listQ.isFetching}
                  onClick={() => listQ.refetch()}
                >
                  {listQ.isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden />
                  )}
                  Refresh
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 flex-1 rounded-xl border-dashed border-border/80 text-muted-foreground hover:text-foreground sm:flex-none"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            {activeFilterCount > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={overviewKickerClass}>Active</span>
                {debouncedSearch ? (
                  <FilterChip
                    label={`Search: ${debouncedSearch.slice(0, 24)}${debouncedSearch.length > 24 ? "…" : ""}`}
                    onRemove={() => setSearch("")}
                  />
                ) : null}
                {ownershipFilter === "mine" ? (
                  <FilterChip label="My wallets" onRemove={() => setOwnershipFilter("all")} />
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "relative transition-opacity duration-200",
              listQ.isFetching && listQ.data ? "opacity-60 pointer-events-none" : "",
            )}
          >
            {listQ.isLoading && !listQ.data ? (
              <div className="space-y-2 p-4 sm:p-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : listQ.isError ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {!syraAuthenticated
                    ? "Connect your wallet and approve the Syra sign-in message to load agents."
                    : listErrorMessage(listQ.error, ownershipFilter)}
                </p>
                {!syraAuthenticated ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-4 rounded-xl"
                    onClick={() => requestConnect("solana")}
                  >
                    Connect wallet
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => listQ.refetch()}>
                    Retry
                  </Button>
                )}
              </div>
            ) : authBlocked ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Approve the Syra sign-in message in your wallet to load your agent wallets.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-4 rounded-xl"
                  onClick={() => void requestSyraAuth()}
                >
                  Sign in with wallet
                </Button>
              </div>
            ) : isEmpty ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
                  <Bot className="h-6 w-6 text-muted-foreground" aria-hidden />
                </div>
                <p className="mt-4 font-medium text-foreground">No agents match</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  {ownershipFilter === "mine"
                    ? "Connect a wallet and fund an agent from chat."
                    : debouncedSearch
                      ? "Try clearing filters or a different search."
                      : "Solana agent wallets appear when users connect wallets and create agent keys."}
                </p>
                {activeFilterCount > 0 ? (
                  <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button className="mt-4 rounded-xl" asChild>
                    <Link to="/">Open agent chat</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/45 bg-muted/[0.14] hover:bg-muted/[0.14]">
                      <AgentsSortableHeader
                        label="Agent"
                        sortKey="agent"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        className="min-w-[200px]"
                      />
                      <AgentsSortableHeader
                        label="User wallet"
                        sortKey="wallet"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        className="min-w-[140px]"
                      />
                      <TableHead className="h-10 min-w-[120px] px-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
                        Balance
                      </TableHead>
                      <AgentsSortableHeader
                        label="Updated"
                        sortKey="updated"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        className="w-[130px]"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayAgents.map((agent) => {
                      const isMine = connectedWalletKeys.has(agent.walletAddress.toLowerCase());
                      const agentExplorer = explorerUrl("solana", agent.agentAddress);
                      const userExplorer = explorerUrl("solana", agent.walletAddress);

                      return (
                        <TableRow
                          key={agent.anonymousId}
                          className={cn(
                            "group/row cursor-pointer border-border/35 transition-colors",
                            isMine ? "bg-primary/[0.04] hover:bg-primary/[0.08]" : "hover:bg-muted/30",
                          )}
                          onClick={() => navigate(agentDetailPath(agent.anonymousId))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              navigate(agentDetailPath(agent.anonymousId));
                            }
                          }}
                          tabIndex={0}
                          role="link"
                          aria-label={`View agent ${shortenAddress(agent.agentAddress)}`}
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 shrink-0 rounded-lg border border-border/50">
                                {agent.avatarUrl ? (
                                  <AvatarImage src={agent.avatarUrl} alt="" className="object-cover" />
                                ) : null}
                                <AvatarFallback className="rounded-lg bg-muted/50">
                                  <Bot className="h-4 w-4 text-muted-foreground" aria-hidden />
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <AddressCell
                                  address={agent.agentAddress}
                                  isEvm={false}
                                  onCopy={handleCopy}
                                  explorer={agentExplorer}
                                />
                                {isMine ? (
                                  <Badge className="mt-1 h-4 rounded px-1 text-[9px] font-semibold uppercase tracking-wider text-primary">
                                    Yours
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <AddressCell
                              address={agent.walletAddress}
                              isEvm={false}
                              onCopy={handleCopy}
                              explorer={userExplorer}
                            />
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <BalanceCell anonymousId={agent.anonymousId} chain="solana" />
                          </TableCell>
                          <TableCell className="py-3 font-mono text-xs tabular-nums text-muted-foreground">
                            {formatRelativeTime(agent.updatedAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {!isEmpty && paginationTotal > 0 ? (
            <PremiumTablePagination
              page={paginationPage}
              pageSize={pageSize}
              totalItems={paginationTotal}
              onPageChange={(next) => {
                if (useClientPagination) clientPagination.setPage(next);
                else setPage(next);
              }}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
                if (useClientPagination) clientPagination.setPageSize(size);
              }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              loading={listQ.isFetching}
              itemLabel="agents"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
