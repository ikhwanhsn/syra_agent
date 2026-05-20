import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bot,
  Copy,
  Droplets,
  ExternalLink,
  FlaskConical,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useWalletContext } from "@/contexts/WalletContext";
import { agentWalletApi } from "@/lib/chatApi";
import {
  chainBadgeClass,
  chainLabel,
  explorerUrl,
  formatRelativeTime,
  formatTimestamp,
  shortenAddress,
  userWalletExplorerUrl,
} from "@/lib/agentWalletUi";
import { formatCompactUsd, formatSol } from "@/lib/dashboardOverviewAggregates";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewAccentBackground, overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const STALE_MS = 45_000;

export interface DashboardAgentDetailProps {
  embedded?: boolean;
}

function DetailRow({
  label,
  value,
  mono,
  onCopy,
  href,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
  href?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">{label}</span>
      <div className="flex min-w-0 items-center gap-1.5 sm:max-w-[70%] sm:justify-end">
        <span
          className={cn(
            "min-w-0 truncate text-sm text-foreground",
            mono && "font-mono text-xs tabular-nums sm:text-[13px]",
          )}
          title={value}
        >
          {value}
        </span>
        {onCopy ? (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onCopy} aria-label={`Copy ${label}`}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        ) : null}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            aria-label={`Open ${label} in explorer`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function ComingSoonPanel({
  icon: Icon,
  title,
  description,
  items,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <Card className={cn(overviewCardShell, "overflow-hidden")}>
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/30">
            <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              <Badge variant="secondary" className="rounded-md text-[10px] font-semibold uppercase tracking-wider">
                Coming soon
              </Badge>
            </div>
            <CardDescription className="mt-1.5 text-pretty">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2.5 rounded-lg border border-dashed border-border/50 bg-muted/[0.12] px-3 py-2.5 text-sm text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function DashboardAgentDetail({ embedded = false }: DashboardAgentDetailProps) {
  const { anonymousId: idParam } = useParams<{ anonymousId: string }>();
  const anonymousId = idParam ? decodeURIComponent(idParam) : "";
  const { address, baseAddress } = useWalletContext();
  const { toast } = useToast();

  const profileQ = useQuery({
    queryKey: ["agent-wallet-profile", anonymousId],
    queryFn: () => agentWalletApi.getProfile(anonymousId),
    enabled: Boolean(anonymousId),
    staleTime: STALE_MS,
  });

  const balanceQ = useQuery({
    queryKey: ["agent-wallet-balance", anonymousId],
    queryFn: () => agentWalletApi.getBalance(anonymousId),
    enabled: Boolean(anonymousId) && profileQ.data?.chain === "solana",
    staleTime: STALE_MS,
  });

  const profile = profileQ.data;
  const isMine =
    !!profile?.walletAddress &&
    ((address && profile.walletAddress.toLowerCase() === address.toLowerCase()) ||
      (baseAddress && profile.walletAddress.toLowerCase() === baseAddress.toLowerCase()));

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const isEvm = profile?.chain === "base" || profile?.agentAddress.startsWith("0x");

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
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 rounded-xl px-2 text-muted-foreground hover:text-foreground" asChild>
            <Link to="/dashboard/agents">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Agents
            </Link>
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <span className="truncate font-mono text-sm text-foreground">
            {profile ? shortenAddress(profile.agentAddress, isEvm) : "…"}
          </span>
          {isMine ? (
            <Badge className="ml-auto rounded-md bg-primary/15 text-[10px] font-semibold uppercase tracking-wider text-primary hover:bg-primary/15">
              Your agent
            </Badge>
          ) : null}
        </div>

        {profileQ.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-3xl" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : profileQ.isError || !profile ? (
          <Card className={cn(overviewCardShell, "border-destructive/20")}>
            <CardContent className="space-y-4 p-8 text-center">
              <p className="font-medium text-foreground">Agent not found</p>
              <p className="text-sm text-muted-foreground">This wallet may not exist or the link is invalid.</p>
              <Button variant="outline" className="rounded-xl" asChild>
                <Link to="/dashboard/agents">Back to agents</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className={cn(overviewCardShell, "overflow-hidden rounded-3xl")}>
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.45]"
                style={{ background: overviewAccentBackground("experiment") }}
                aria-hidden
              />
              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4 sm:gap-5">
                    <Avatar className="h-16 w-16 shrink-0 rounded-2xl border-2 border-border/50 shadow-lg sm:h-20 sm:w-20">
                      {profile.avatarUrl ? (
                        <AvatarImage src={profile.avatarUrl} alt="" className="object-cover" />
                      ) : null}
                      <AvatarFallback className="rounded-2xl bg-muted/50">
                        <Bot className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" aria-hidden />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-foreground/75" aria-hidden />
                        Agent profile
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn("rounded-md text-[10px] font-semibold uppercase", chainBadgeClass(profile.chain))}>
                          {chainLabel(profile.chain)}
                        </Badge>
                        {profile.updatedAt ? (
                          <span className="text-xs text-muted-foreground">Updated {formatRelativeTime(profile.updatedAt)}</span>
                        ) : null}
                      </div>
                      <h1 className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        {shortenAddress(profile.agentAddress, isEvm)}
                      </h1>
                      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        Command center for this agent&apos;s treasury, performance stats, and experiment activity. Soon you&apos;ll
                        deploy capital from this wallet into trading and LP experiments.
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2"
                      disabled={profileQ.isFetching}
                      onClick={() => {
                        void profileQ.refetch();
                        if (profile.chain === "solana") void balanceQ.refetch();
                      }}
                    >
                      {profileQ.isFetching ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <RefreshCw className="h-4 w-4" aria-hidden />
                      )}
                      Refresh
                    </Button>
                    {explorerUrl(profile.chain, profile.agentAddress) ? (
                      <Button variant="outline" size="sm" className="rounded-xl gap-2" asChild>
                        <a href={explorerUrl(profile.chain, profile.agentAddress)!} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" aria-hidden />
                          Explorer
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className={cn(overviewKickerClass, "mb-3 px-0.5")}>Treasury</p>
              {profile.chain === "solana" ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className={cn(overviewCardShell, "ring-1 ring-primary/10")}>
                    <CardHeader className="pb-2">
                      <CardDescription className={overviewKickerClass}>SOL</CardDescription>
                      <CardTitle className="font-mono text-2xl tabular-nums tracking-tight">
                        {balanceQ.isLoading ? <Skeleton className="h-8 w-28" /> : formatSol(balanceQ.data?.solBalance ?? 0)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">Available for gas and experiment allocation</p>
                    </CardContent>
                  </Card>
                  <Card className={cn(overviewCardShell, "ring-1 ring-primary/10")}>
                    <CardHeader className="pb-2">
                      <CardDescription className={overviewKickerClass}>USDC</CardDescription>
                      <CardTitle className="font-mono text-2xl tabular-nums tracking-tight">
                        {balanceQ.isLoading ? <Skeleton className="h-8 w-28" /> : formatCompactUsd(balanceQ.data?.usdcBalance ?? 0)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">Primary capital for trading &amp; LP follow</p>
                    </CardContent>
                  </Card>
                  <Card className={cn(overviewCardShell, "sm:col-span-2 lg:col-span-1")}>
                    <CardHeader className="pb-2">
                      <CardDescription className={overviewKickerClass}>Deploy status</CardDescription>
                      <CardTitle className="text-lg font-semibold tracking-tight text-muted-foreground">Idle</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">No active experiment allocation yet</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className={overviewCardShell}>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Base agent treasury metrics will appear here when on-chain balances are wired.
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <ComingSoonPanel
                icon={BarChart3}
                title="Statistics"
                description="Performance and risk metrics for this agent wallet — PnL, win rate, drawdown, and capital efficiency."
                items={[
                  "Realized & unrealized PnL",
                  "Trade and LP follow performance",
                  "Capital utilization vs. idle balance",
                  "Benchmark vs. experiment agents",
                ]}
              />
              <ComingSoonPanel
                icon={Activity}
                title="Activity"
                description="A live feed of trades, LP actions, and experiment events funded from this wallet."
                items={[
                  "Trade executions & fills",
                  "LP deposits, withdrawals, and fees",
                  "Experiment agent follow / copy signals",
                  "On-chain transaction history",
                ]}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className={cn(overviewCardShell, "overflow-hidden")}>
                <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="text-base font-semibold">Experiment labs</CardTitle>
                  <CardDescription>
                    Browse experiment desks you&apos;ll be able to fund from this agent wallet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 pt-5 sm:grid-cols-2">
                  {[
                    { to: "/dashboard/trading-experiment", label: "Trading agents", icon: FlaskConical },
                    { to: "/dashboard/lp-experiment", label: "LP agents", icon: Droplets },
                    { to: "/dashboard/arbitrage-experiment", label: "Arbitrage", icon: TrendingUp },
                  ].map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className="group flex items-center gap-3 rounded-xl border border-border/45 bg-background/40 px-3 py-3 transition-colors hover:border-border/70 hover:bg-muted/25"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/25 group-hover:bg-muted/40">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" aria-hidden />
                      </span>
                      <span className="text-sm font-medium text-foreground">{label}</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              <Card className={cn(overviewCardShell, "overflow-hidden")}>
                <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="text-base font-semibold">Record</CardTitle>
                  <CardDescription>Wallet lifecycle and identifiers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/45 bg-background/40 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">Created</p>
                      <p className="mt-1 font-mono text-xs tabular-nums text-foreground">{formatTimestamp(profile.createdAt)}</p>
                    </div>
                    <div className="rounded-xl border border-border/45 bg-background/40 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">Last updated</p>
                      <p className="mt-1 font-mono text-xs tabular-nums text-foreground">{formatTimestamp(profile.updatedAt)}</p>
                    </div>
                  </div>
                  <Separator className="bg-border/40" />
                  <DetailRow
                    label="Agent address"
                    value={profile.agentAddress}
                    mono
                    onCopy={() => copy(profile.agentAddress, "Agent address")}
                    href={explorerUrl(profile.chain, profile.agentAddress)}
                  />
                  {profile.walletAddress ? (
                    <>
                      <Separator className="bg-border/40" />
                      <DetailRow
                        label="User wallet"
                        value={profile.walletAddress}
                        mono
                        onCopy={() => copy(profile.walletAddress!, "User wallet")}
                        href={userWalletExplorerUrl(profile.walletAddress)}
                      />
                    </>
                  ) : null}
                  <Separator className="bg-border/40" />
                  <DetailRow
                    label="Agent ID"
                    value={profile.anonymousId}
                    mono
                    onCopy={() => copy(profile.anonymousId, "Agent ID")}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
