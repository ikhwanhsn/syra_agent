import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Check,
  Copy,
  ExternalLink,
  Droplets,
  FlaskConical,
  KeyRound,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  User,
  Wallet2,
  Zap,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewAccentBackground, overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { useWalletContext } from "@/contexts/WalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useToast } from "@/hooks/use-toast";
import { agentWalletApi } from "@/lib/chatApi";
import { agentDetailPath } from "@/lib/agentWalletUi";
import { formatCompactUsd, formatSol } from "@/lib/dashboardOverviewAggregates";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import {
  LS_AGENT_DISPLAY_NAME,
  LS_AGENT_SYSTEM_PROMPT,
  LS_PREF_COMPACT,
  LS_PREF_PRODUCT_UPDATES,
  LS_PREF_USAGE_INSIGHTS,
  readAgentSetupBool,
  readAgentSetupString,
  writeAgentSetupBool,
  writeAgentSetupString,
} from "@/lib/agentSetupStorage";
import { useLpExperimentUiMode } from "@/hooks/useLpExperimentUiMode";
import { LpUiModePicker } from "@/components/settings/LpUiModePicker";
import { FuelAgentModal } from "@/components/chat/FuelAgentModal";
const STALE_MS = 45_000;

type SetupChain = "solana";

interface AgentSetupRecord {
  anonymousId: string;
  agentAddress: string;
  avatarUrl: string | null;
  chain: SetupChain;
  walletAddress: string;
}

function maskAnonymousId(id: string): string {
  if (!id) return "—";
  if (id.startsWith("wallet:")) {
    const pubkey = id.slice(7).replace(":base", "").trim();
    if (pubkey.length <= 8) return pubkey;
    return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
  }
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function shortenAddress(addr: string, chain: SetupChain): string {
  if (!addr) return "—";
  if (chain === "base" || addr.startsWith("0x")) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  }
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function FieldShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-10 w-full items-center rounded-xl border border-border/80 bg-muted/20 px-3.5 py-2.5 text-[13px] text-muted-foreground/90",
        className,
      )}
    >
      {children}
    </div>
  );
}

async function fetchAgentSetup(walletAddress: string, chain: SetupChain): Promise<AgentSetupRecord> {
  const res = await agentWalletApi.getOrCreateByWallet(walletAddress, chain);
  return {
    anonymousId: res.anonymousId,
    agentAddress: res.agentAddress,
    avatarUrl: res.avatarUrl ?? null,
    chain,
    walletAddress,
  };
}

export interface DashboardSettingsProps {
  embedded?: boolean;
}

export default function DashboardSettings({ embedded = false }: DashboardSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    address: solanaAddress,
    shortAddress,
    connectForChain,
  } = useWalletContext();
  const {
    ready: contextReady,
    anonymousId: contextAnonymousId,
    agentAddress: contextAgentAddress,
    avatarUrl: contextAvatarUrl,
    connectedChain,
    connectedWalletAddress,
    refetchBalance,
    updateAvatarUrl,
    agentSolBalance,
    agentUsdcBalance,
  } = useAgentWallet();
  const { syraAuthReady, syraAuthenticated, requestSyraAuth } = useSyraAuth();

  const hasSolana = Boolean(solanaAddress);
  const activeChain: SetupChain = "solana";

  const walletQueriesEnabled = syraAuthReady && syraAuthenticated;

  const solanaQ = useQuery({
    queryKey: ["agent-setup", "solana", solanaAddress],
    queryFn: () => fetchAgentSetup(solanaAddress!, "solana"),
    enabled: hasSolana && walletQueriesEnabled,
    staleTime: STALE_MS,
    retry: 1,
  });

  const contextLinkedAgent: AgentSetupRecord | undefined = useMemo(() => {
    if (!contextReady || !contextAnonymousId || !contextAgentAddress) return undefined;
    if (hasSolana && connectedChain === "solana" && solanaAddress) {
      return {
        anonymousId: contextAnonymousId,
        agentAddress: contextAgentAddress,
        avatarUrl: contextAvatarUrl,
        chain: "solana",
        walletAddress: solanaAddress,
      };
    }
    return undefined;
  }, [
    hasSolana,
    contextReady,
    contextAnonymousId,
    contextAgentAddress,
    contextAvatarUrl,
    connectedChain,
    solanaAddress,
  ]);

  const guestAgent: AgentSetupRecord | undefined = useMemo(() => {
    if (hasSolana || !contextReady || !contextAnonymousId || !contextAgentAddress) return undefined;
    return {
      anonymousId: contextAnonymousId,
      agentAddress: contextAgentAddress,
      avatarUrl: contextAvatarUrl,
      chain: "solana",
      walletAddress: connectedWalletAddress ?? "",
    };
  }, [
    hasSolana,
    contextReady,
    contextAnonymousId,
    contextAgentAddress,
    contextAvatarUrl,
    connectedWalletAddress,
  ]);

  const activeAgent = hasSolana ? solanaQ.data ?? contextLinkedAgent : guestAgent;
  const activeQ = hasSolana ? solanaQ : { isLoading: !contextReady, isFetching: false, isError: false };
  const authPending = hasSolana && syraAuthReady && !syraAuthenticated;
  const setupLoading =
    hasSolana
      ? !activeAgent && (!syraAuthReady || authPending || activeQ.isLoading || activeQ.isFetching)
      : !contextReady;
  const setupLoadError =
    hasSolana && syraAuthReady && syraAuthenticated && activeQ.isError && !activeAgent;

  const handleRetryLoad = useCallback(async () => {
    const ok = await requestSyraAuth();
    if (!ok) {
      toast({
        title: "Sign in required",
        description: "Approve the wallet sign-in prompt to load your agent setup.",
        variant: "destructive",
      });
      return;
    }
    await solanaQ.refetch();
  }, [requestSyraAuth, solanaQ, toast]);
  const isContextAgent =
    !!activeAgent &&
    contextReady &&
    activeAgent.anonymousId === contextAnonymousId &&
    activeAgent.chain === connectedChain;

  const balanceQ = useQuery({
    queryKey: ["agent-wallet-balance", activeAgent?.anonymousId],
    queryFn: () => agentWalletApi.getBalance(activeAgent!.anonymousId),
    enabled: Boolean(activeAgent?.anonymousId),
    staleTime: STALE_MS,
  });

  const [displayName, setDisplayName] = useState(() => readAgentSetupString(LS_AGENT_DISPLAY_NAME, ""));
  const [customPrompt, setCustomPrompt] = useState(() => readAgentSetupString(LS_AGENT_SYSTEM_PROMPT, ""));
  const [productUpdates, setProductUpdates] = useState(() => readAgentSetupBool(LS_PREF_PRODUCT_UPDATES, true));
  const [usageInsights, setUsageInsights] = useState(() => readAgentSetupBool(LS_PREF_USAGE_INSIGHTS, false));
  const [compactDensity, setCompactDensity] = useState(() => readAgentSetupBool(LS_PREF_COMPACT, false));
  const { mode: lpUiMode, setMode: setLpUiMode } = useLpExperimentUiMode();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  const [fuelOpen, setFuelOpen] = useState(false);

  const saveIdentity = useCallback(() => {
    writeAgentSetupString(LS_AGENT_DISPLAY_NAME, displayName.trim());
    writeAgentSetupString(LS_AGENT_SYSTEM_PROMPT, customPrompt.trim());
    toast({
      title: "Agent saved",
      description: "Display name and instructions are stored on this device.",
    });
  }, [displayName, customPrompt, toast]);

  const copyToClipboard = useCallback(
    (text: string, label: string) => {
      void navigator.clipboard?.writeText(text).then(
        () => {
          toast({ title: "Copied", description: `${label} copied to clipboard.` });
          setCopiedField(label);
          window.setTimeout(() => setCopiedField(null), 2000);
        },
        () => toast({ title: "Could not copy", variant: "destructive" }),
      );
    },
    [toast],
  );

  const handleGenerateAvatar = useCallback(async () => {
    if (!activeAgent?.anonymousId) {
      toast({ title: "No agent", description: "Connect a wallet to configure an agent.", variant: "destructive" });
      return;
    }
    setGeneratingAvatar(true);
    try {
      const result = await agentWalletApi.generateAvatar(activeAgent.anonymousId);
      if (isContextAgent && updateAvatarUrl && result.avatarUrl) {
        updateAvatarUrl(result.avatarUrl);
      }
      void queryClient.invalidateQueries({ queryKey: ["agent-setup", activeChain] });
      toast({ title: "Avatar updated", description: "New avatar applied to this agent." });
    } catch (err) {
      toast({
        title: "Could not generate avatar",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAvatar(false);
    }
  }, [activeAgent, activeChain, isContextAgent, queryClient, toast, updateAvatarUrl]);

  const handleRefreshBalances = useCallback(async () => {
    setRefreshingBalances(true);
    try {
      if (isContextAgent) await refetchBalance();
      if (activeAgent?.anonymousId && activeChain === "solana") {
        await balanceQ.refetch();
      }
      if (activeAgent?.anonymousId) {
        await queryClient.invalidateQueries({ queryKey: ["agent-wallet-balance", activeAgent.anonymousId] });
      }
      toast({ title: "Balances updated" });
    } finally {
      setRefreshingBalances(false);
    }
  }, [activeAgent, activeChain, balanceQ, isContextAgent, queryClient, refetchBalance, toast]);

  const handleFundAgent = useCallback(() => {
    if (connectedChain !== "solana") {
      toast({
        title: "Connect Solana wallet",
        description: "Connect your Solana wallet in the header to fund this agent treasury.",
      });
      void connectForChain("solana");
      return;
    }
    setFuelOpen(true);
  }, [connectedChain, connectForChain, toast]);

  const shell = cn(DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM, "pb-8");

  const solBalance = isContextAgent ? agentSolBalance : balanceQ.data?.solBalance ?? null;
  const usdcBalance = isContextAgent ? agentUsdcBalance : balanceQ.data?.usdcBalance ?? null;

  return (
    <div className={cn("relative flex flex-col min-h-0", embedded ? "flex-1" : "min-h-screen")}>
      {embedded ? null : <OverviewPageBackdrop />}
      <div className={cn(shell, "relative space-y-6")}>
        <header className={cn(overviewCardShell, "overflow-hidden rounded-3xl px-5 py-6 sm:px-8 sm:py-7")}>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{ background: overviewAccentBackground("neutral") }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className={overviewKickerClass}>Agent setup &amp; settings</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">Agent setup</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Configure your agent wallet — appearance, treasury, behavior, and app preferences. Link to experiment
                desks from your profile when you&apos;re ready to deploy capital.
              </p>
            </div>
            {activeAgent ? (
              <Button variant="outline" size="sm" className="shrink-0 rounded-xl gap-2" asChild>
                <Link to={agentDetailPath(activeAgent.anonymousId)}>
                  View profile
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
        </header>

        {!hasSolana && !guestAgent ? (
          <Card className={overviewCardShell}>
            <CardContent className="space-y-4 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
                <Wallet2 className="h-7 w-7 text-muted-foreground" aria-hidden />
              </div>
              <p className="font-medium text-foreground">Loading your agent session…</p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Connect a Solana wallet for a persistent agent, or continue as guest from chat.
              </p>
              <Button className="rounded-xl" onClick={() => void connectForChain("solana")}>
                Connect wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <AgentSetupSections
              activeAgent={activeAgent}
              setupLoading={setupLoading}
              setupLoadError={setupLoadError}
              onRetryLoad={handleRetryLoad}
              activeChain={activeChain}
              shortWallet={shortAddress}
              displayName={displayName}
              setDisplayName={setDisplayName}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              generatingAvatar={generatingAvatar}
              onGenerateAvatar={handleGenerateAvatar}
              onSave={saveIdentity}
              onCopy={copyToClipboard}
              copiedField={copiedField}
              solBalance={solBalance}
              usdcBalance={usdcBalance}
              refreshingBalances={refreshingBalances}
              onRefreshBalances={handleRefreshBalances}
              onFund={handleFundAgent}
              balanceLoading={balanceQ.isLoading}
            />

            <Card className={cn(overviewCardShell, "overflow-hidden")}>
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-base font-semibold">App preferences</CardTitle>
                <CardDescription>Stored locally on this device only.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <PrefRow
                  id="pref-product"
                  label="Product updates"
                  description="In-app tips and release highlights."
                  checked={productUpdates}
                  onCheckedChange={(v) => {
                    setProductUpdates(v);
                    writeAgentSetupBool(LS_PREF_PRODUCT_UPDATES, v);
                  }}
                />
                <Separator className="bg-border/40" />
                <PrefRow
                  id="pref-usage"
                  label="Usage insights"
                  description="Optional local flags for future analytics."
                  checked={usageInsights}
                  onCheckedChange={(v) => {
                    setUsageInsights(v);
                    writeAgentSetupBool(LS_PREF_USAGE_INSIGHTS, v);
                  }}
                />
                <Separator className="bg-border/40" />
                <PrefRow
                  id="pref-compact"
                  label="Compact density"
                  description="Tighter spacing in lists when supported."
                  checked={compactDensity}
                  onCheckedChange={(v) => {
                    setCompactDensity(v);
                    writeAgentSetupBool(LS_PREF_COMPACT, v);
                  }}
                />
                <Separator className="bg-border/40" />
                <LpUiModePicker value={lpUiMode} onChange={setLpUiMode} />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <FuelAgentModal open={fuelOpen} onOpenChange={setFuelOpen} initialFlowTab="deposit" />
    </div>
  );
}

function PrefRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <p id={`${id}-desc`} className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-describedby={`${id}-desc`} />
    </div>
  );
}

function AgentSetupSections({
  activeAgent,
  setupLoading,
  setupLoadError,
  onRetryLoad,
  activeChain,
  shortWallet,
  displayName,
  setDisplayName,
  customPrompt,
  setCustomPrompt,
  generatingAvatar,
  onGenerateAvatar,
  onSave,
  onCopy,
  copiedField,
  solBalance,
  usdcBalance,
  refreshingBalances,
  onRefreshBalances,
  onFund,
  balanceLoading,
}: {
  activeAgent: AgentSetupRecord | undefined;
  setupLoading: boolean;
  setupLoadError: boolean;
  onRetryLoad: () => void;
  activeChain: SetupChain;
  shortWallet: string | null;
  displayName: string;
  setDisplayName: (v: string) => void;
  customPrompt: string;
  setCustomPrompt: (v: string) => void;
  generatingAvatar: boolean;
  onGenerateAvatar: () => void;
  onSave: () => void;
  onCopy: (text: string, label: string) => void;
  copiedField: string | null;
  solBalance: number | null;
  usdcBalance: number | null;
  ethBalance: number | null;
  baseUsdc: number | null;
  refreshingBalances: boolean;
  onRefreshBalances: () => void;
  onFund: () => void;
  balanceLoading: boolean;
}) {
  if (setupLoading && !activeAgent) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl bg-muted/30" />
        <div className="h-56 animate-pulse rounded-2xl bg-muted/30" />
      </div>
    );
  }

  if (!activeAgent && setupLoadError) {
    return (
      <Card className={overviewCardShell}>
        <CardContent className="space-y-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">Could not load agent. Sign in with your wallet and try again.</p>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void onRetryLoad()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!activeAgent) {
    return (
      <Card className={overviewCardShell}>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">Could not load agent.</CardContent>
      </Card>
    );
  }

  const avatarUrl = activeAgent.avatarUrl;
  const chainLabel = "Solana";

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <Card className={cn(overviewCardShell, "overflow-hidden")}>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">Identity</CardTitle>
            <CardDescription>How this agent appears across Syra.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 shrink-0 rounded-2xl border-2 border-border/50 shadow-md">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
                <AvatarFallback className="rounded-2xl bg-muted/50">
                  <Bot className="h-9 w-9 text-muted-foreground" aria-hidden />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit rounded-xl gap-2"
                  onClick={onGenerateAvatar}
                  disabled={generatingAvatar}
                >
                  {generatingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden />
                  )}
                  Generate avatar
                </Button>
                <p className="text-xs text-muted-foreground">Unique per agent wallet on {chainLabel}.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-display-name">Display name</Label>
              <Input
                id="agent-display-name"
                placeholder="Name shown in Syra (this device)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 rounded-xl border-border/80"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Linked wallet</Label>
              <FieldShell className="font-mono text-xs text-foreground/90">
                {chainLabel} · {shortWallet ?? shortenAddress(activeAgent.walletAddress, activeChain)}
              </FieldShell>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(overviewCardShell, "overflow-hidden ring-1 ring-primary/10")}>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">Treasury</CardTitle>
            <CardDescription>Capital this agent can spend on tools and experiments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-3">
              <div className="flex justify-between font-mono text-sm tabular-nums">
                <span className="text-muted-foreground">SOL</span>
                <span className="font-medium text-foreground">
                  {balanceLoading ? "…" : solBalance != null ? formatSol(solBalance) : "—"}
                </span>
              </div>
              <div className="flex justify-between font-mono text-sm tabular-nums">
                <span className="text-muted-foreground">USDC</span>
                <span className="font-medium text-foreground">
                  {balanceLoading ? "…" : usdcBalance != null ? formatCompactUsd(usdcBalance) : "—"}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Button type="button" className="w-full rounded-xl gap-2" onClick={onFund}>
                <Zap className="h-4 w-4" aria-hidden />
                Fund agent
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-xl"
                disabled={refreshingBalances}
                onClick={onRefreshBalances}
              >
                {refreshingBalances ? "Refreshing…" : "Refresh balances"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={cn(overviewCardShell, "overflow-hidden")}>
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div>
              <CardTitle className="text-base font-semibold">Agent instructions</CardTitle>
              <CardDescription>
                Custom system prompt for new chats on this device. Leave empty to use Syra&apos;s default trader
                intelligence prompt.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={DEFAULT_SYSTEM_PROMPT.slice(0, 120) + "…"}
            className="min-h-[140px] resize-y rounded-xl border-border/80 bg-background/80 font-mono text-xs leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">
            Applies to agent chat sessions started after you save. Experiment follow and treasury deploy controls are
            coming next.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className={overviewCardShell}>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">Wallet details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <CopyField
              label="Agent address"
              value={activeAgent.agentAddress}
              display={shortenAddress(activeAgent.agentAddress, activeChain)}
              onCopy={onCopy}
              copied={copiedField === "Agent address"}
            />
            <CopyField
              label="Session ID"
              value={activeAgent.anonymousId}
              display={maskAnonymousId(activeAgent.anonymousId)}
              onCopy={onCopy}
              copied={copiedField === "Session ID"}
              breakAll
            />
            <Badge variant="outline" className="rounded-md text-[10px] font-semibold uppercase">
              {chainLabel} chain
            </Badge>
          </CardContent>
        </Card>

        <Card className={overviewCardShell}>
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">Experiment desks</CardTitle>
            <CardDescription>Where this agent will deploy capital when live.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 pt-5">
            {[
              { to: "/dashboard/trading-experiment", label: "Trading agents", icon: FlaskConical },
              { to: "/dashboard/lp-experiment#real-agent", label: "LP agents (sim + real)", icon: Droplets },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-xl border border-border/45 px-3 py-3 transition-colors hover:bg-muted/25"
              >
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium">{label}</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" aria-hidden />
              </Link>
            ))}
          </CardContent>
        </Card>

      </div>

      <AgentPrivateKeySection activeAgent={activeAgent} activeChain={activeChain} onCopy={onCopy} copiedField={copiedField} />

      <div className="flex flex-wrap gap-3">
        <Button type="button" className="rounded-xl" onClick={onSave}>
          Save agent setup
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" asChild>
          <Link to={agentDetailPath(activeAgent.anonymousId)}>Open agent profile</Link>
        </Button>
      </div>
    </div>
  );
}

function exportKeyStatusMessage(reason: string | undefined): string {
  switch (reason) {
    case "privy_custody_not_exportable":
      return "This agent wallet is custodied by Privy (TEE). Private keys cannot be exported.";
    case "base_not_exportable":
      return "Base agent wallets do not support private key export.";
    case "auth_required":
      return "Approve the wallet signature prompt to verify ownership before export.";
    case "wallet_mismatch":
      return "Switch to the wallet linked to this agent to export its key.";
    case "no_exportable_key":
      return "No exportable private key is stored for this agent.";
    default:
      return "Private key export is not available for this agent.";
  }
}

function AgentPrivateKeySection({
  activeAgent,
  activeChain,
  onCopy,
  copiedField,
}: {
  activeAgent: AgentSetupRecord;
  activeChain: SetupChain;
  onCopy: (text: string, label: string) => void;
  copiedField: string | null;
}) {
  const { toast } = useToast();
  const { requestSyraAuthForWallet, syraAuthReady, syraAuthenticated } = useSyraAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [exportable, setExportable] = useState<boolean | null>(null);
  const [statusReason, setStatusReason] = useState<string | undefined>();
  const [requiresWalletAuth, setRequiresWalletAuth] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatusLoading(true);
    void agentWalletApi
      .getExportKeyStatus(activeAgent.anonymousId)
      .then((status) => {
        if (cancelled) return;
        setExportable(status.exportable);
        setStatusReason(status.reason);
        setRequiresWalletAuth(Boolean(status.requiresWalletAuth));
      })
      .catch(() => {
        if (cancelled) return;
        setExportable(false);
        setStatusReason(undefined);
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeAgent.anonymousId, syraAuthenticated]);

  const handleModalOpenChange = useCallback((open: boolean) => {
    setModalOpen(open);
    if (!open) setPrivateKey(null);
  }, []);

  const handleShowPrivateKey = useCallback(async () => {
    if (activeChain !== "solana") {
      toast({
        title: "Not available",
        description: "Private key export is only supported for Solana agents.",
        variant: "destructive",
      });
      return;
    }
    const hardBlock = exportable === false && statusReason !== "auth_required";
    if (hardBlock) {
      toast({
        title: "Cannot export",
        description: exportKeyStatusMessage(statusReason),
        variant: "destructive",
      });
      return;
    }
    if (privateKey) {
      setModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const linkedWallet = activeAgent.walletAddress?.trim();
      if (requiresWalletAuth || statusReason === "auth_required") {
        if (!linkedWallet) return;
        const signIn = await requestSyraAuthForWallet(linkedWallet);
        if (!signIn) return;
      }
      const result = await agentWalletApi.exportPrivateKey(activeAgent.anonymousId);
      setPrivateKey(result.privateKeyBase58);
      setModalOpen(true);
    } catch (err) {
      toast({
        title: "Could not export key",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    activeAgent.anonymousId,
    activeChain,
    requestSyraAuthForWallet,
    exportable,
    privateKey,
    requiresWalletAuth,
    statusReason,
    toast,
  ]);

  if (activeChain !== "solana") return null;

  return (
    <>
      <Card className={cn(overviewCardShell, "overflow-hidden border-amber-500/20 ring-1 ring-amber-500/10")}>
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
            <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold">Agent private key</CardTitle>
            <CardDescription>
              Export the Solana keypair for this agent wallet. Anyone with this key controls the treasury.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <p>
            Never share your agent private key. Store it securely if you import this wallet elsewhere. Syra cannot
            recover a key you lose after export.
          </p>
        </div>

        {statusLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Checking export availability…
          </div>
        ) : exportable === false ? (
          <p className="text-sm text-muted-foreground">{exportKeyStatusMessage(statusReason)}</p>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2 border-amber-500/30"
            disabled={loading || !syraAuthReady}
            onClick={() => void handleShowPrivateKey()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <KeyRound className="h-4 w-4" aria-hidden />
            )}
            Show private key
          </Button>
        )}
      </CardContent>
    </Card>

    <Dialog open={modalOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agent private key</DialogTitle>
          <DialogDescription>
            Base58 secret for{" "}
            <span className="font-mono text-foreground/90">{shortenAddress(activeAgent.agentAddress, activeChain)}</span>.
            Anyone with this key can control the agent treasury.
          </DialogDescription>
        </DialogHeader>
        {privateKey ? (
          <div className="space-y-3">
            <div className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <p>Do not share this key or paste it into untrusted sites.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Private key (base58)</Label>
              <FieldShell className="max-h-32 overflow-y-auto font-mono text-xs leading-relaxed text-foreground/90 [&_span]:break-all">
                <span>{privateKey}</span>
              </FieldShell>
            </div>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleModalOpenChange(false)}>
            Close
          </Button>
          {privateKey ? (
            <Button
              type="button"
              className="rounded-xl gap-2"
              onClick={() => onCopy(privateKey, "Agent private key")}
            >
              {copiedField === "Agent private key" ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )}
              Copy private key
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

function CopyField({
  label,
  value,
  display,
  onCopy,
  copied,
  breakAll,
}: {
  label: string;
  value: string;
  display: string;
  onCopy: (text: string, label: string) => void;
  copied: boolean;
  breakAll?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <FieldShell className={cn("min-w-0 flex-1 font-mono text-xs text-foreground/90", breakAll && "[&_span]:break-all")}>
          <span className="truncate">{display}</span>
        </FieldShell>
        <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-xl" onClick={() => onCopy(value, label)}>
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        </Button>
      </div>
    </div>
  );
}
