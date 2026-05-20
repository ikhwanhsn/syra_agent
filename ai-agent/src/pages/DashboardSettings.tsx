import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bot,
  Check,
  Copy,
  ExternalLink,
  FlaskConical,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  User,
  Wallet2,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewAccentBackground, overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { useWalletContext } from "@/contexts/WalletContext";
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
import { FuelAgentModal } from "@/components/chat/FuelAgentModal";

const STALE_MS = 45_000;

type SetupChain = "solana" | "base";

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
  layout?: "dashboard" | "agent";
  embedded?: boolean;
}

export default function DashboardSettings({ layout = "dashboard", embedded = false }: DashboardSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    address: solanaAddress,
    shortAddress,
    baseAddress,
    baseShortAddress,
    baseConnected,
    effectiveChain,
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
    agentBaseEthBalance,
    agentBaseUsdcBalance,
  } = useAgentWallet();

  const hasSolana = Boolean(solanaAddress);
  const hasBase = Boolean(baseAddress);
  const chainTabs: SetupChain[] = useMemo(() => {
    const tabs: SetupChain[] = [];
    if (hasSolana) tabs.push("solana");
    if (hasBase) tabs.push("base");
    return tabs;
  }, [hasSolana, hasBase]);

  const [activeChain, setActiveChain] = useState<SetupChain>(() => {
    if (effectiveChain === "base" && hasBase) return "base";
    if (hasSolana) return "solana";
    return "base";
  });

  useEffect(() => {
    if (chainTabs.length === 0) return;
    if (!chainTabs.includes(activeChain)) {
      setActiveChain(chainTabs[0] ?? "solana");
    }
  }, [chainTabs, activeChain]);

  const solanaQ = useQuery({
    queryKey: ["agent-setup", "solana", solanaAddress],
    queryFn: () => fetchAgentSetup(solanaAddress!, "solana"),
    enabled: hasSolana,
    staleTime: STALE_MS,
  });

  const baseQ = useQuery({
    queryKey: ["agent-setup", "base", baseAddress],
    queryFn: () => fetchAgentSetup(baseAddress!, "base"),
    enabled: hasBase,
    staleTime: STALE_MS,
  });

  const guestAgent: AgentSetupRecord | undefined = useMemo(() => {
    if (hasSolana || hasBase || !contextReady || !contextAnonymousId || !contextAgentAddress) return undefined;
    return {
      anonymousId: contextAnonymousId,
      agentAddress: contextAgentAddress,
      avatarUrl: contextAvatarUrl,
      chain: "solana",
      walletAddress: connectedWalletAddress ?? "",
    };
  }, [
    hasSolana,
    hasBase,
    contextReady,
    contextAnonymousId,
    contextAgentAddress,
    contextAvatarUrl,
    connectedWalletAddress,
  ]);

  const activeAgent =
    chainTabs.length > 0
      ? activeChain === "base"
        ? baseQ.data
        : solanaQ.data
      : guestAgent;
  const activeQ = chainTabs.length > 0 ? (activeChain === "base" ? baseQ : solanaQ) : { isLoading: !contextReady, isFetching: false };
  const isContextAgent =
    !!activeAgent &&
    contextReady &&
    activeAgent.anonymousId === contextAnonymousId &&
    activeAgent.chain === connectedChain;

  const balanceQ = useQuery({
    queryKey: ["agent-wallet-balance", activeAgent?.anonymousId],
    queryFn: () => agentWalletApi.getBalance(activeAgent!.anonymousId),
    enabled: Boolean(activeAgent?.anonymousId) && activeChain === "solana",
    staleTime: STALE_MS,
  });

  const [displayName, setDisplayName] = useState(() => readAgentSetupString(LS_AGENT_DISPLAY_NAME, ""));
  const [customPrompt, setCustomPrompt] = useState(() => readAgentSetupString(LS_AGENT_SYSTEM_PROMPT, ""));
  const [productUpdates, setProductUpdates] = useState(() => readAgentSetupBool(LS_PREF_PRODUCT_UPDATES, true));
  const [usageInsights, setUsageInsights] = useState(() => readAgentSetupBool(LS_PREF_USAGE_INSIGHTS, false));
  const [compactDensity, setCompactDensity] = useState(() => readAgentSetupBool(LS_PREF_COMPACT, false));
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
    if (activeChain !== connectedChain) {
      toast({
        title: `Switch to ${activeChain === "base" ? "Base" : "Solana"}`,
        description: "Connect the matching wallet in the header to fund this agent treasury.",
      });
      void connectForChain?.(activeChain);
      return;
    }
    setFuelOpen(true);
  }, [activeChain, connectedChain, connectForChain, toast]);

  const topPadding = layout === "agent" && !embedded ? PAGE_PADDING_TOP_STANDARD : PAGE_PADDING_TOP_MEDIUM;
  const shell = cn(DASHBOARD_CONTENT_SHELL, topPadding, PAGE_SAFE_AREA_BOTTOM, "pb-8");

  const solBalance =
    isContextAgent && activeChain === "solana"
      ? agentSolBalance
      : balanceQ.data?.solBalance ?? null;
  const usdcBalance =
    isContextAgent && activeChain === "solana"
      ? agentUsdcBalance
      : balanceQ.data?.usdcBalance ?? null;
  const ethBalance = isContextAgent && activeChain === "base" ? agentBaseEthBalance : null;
  const baseUsdc = isContextAgent && activeChain === "base" ? agentBaseUsdcBalance : null;

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
              <p className={overviewKickerClass}>Configuration</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">Agent setup</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Configure each agent wallet tied to your addresses — appearance, treasury, behavior, and links to
                experiment desks. Soon you&apos;ll deploy capital from here into trading and LP follows.
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

        {!hasSolana && !hasBase && !guestAgent ? (
          <Card className={overviewCardShell}>
            <CardContent className="space-y-4 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
                <Wallet2 className="h-7 w-7 text-muted-foreground" aria-hidden />
              </div>
              <p className="font-medium text-foreground">Loading your agent session…</p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Connect a wallet for a persistent agent per chain, or continue as guest from chat.
              </p>
              <Button className="rounded-xl" onClick={() => void connectForChain("solana")}>
                Connect wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {chainTabs.length > 1 ? (
              <Tabs value={activeChain} onValueChange={(v) => setActiveChain(v as SetupChain)}>
                <TabsList className="h-10 w-full max-w-md rounded-xl border border-border/60 bg-muted/30 p-1">
                  {hasSolana ? (
                    <TabsTrigger value="solana" className="flex-1 rounded-lg text-sm font-medium">
                      Solana agent
                    </TabsTrigger>
                  ) : null}
                  {hasBase ? (
                    <TabsTrigger value="base" className="flex-1 rounded-lg text-sm font-medium">
                      Base agent
                    </TabsTrigger>
                  ) : null}
                </TabsList>
                <TabsContent value={activeChain} className="mt-6 space-y-6">
                  <AgentSetupSections
                    activeAgent={activeAgent}
                    activeQ={activeQ}
                    activeChain={activeChain}
                    shortWallet={activeChain === "base" ? baseShortAddress : shortAddress}
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
                    ethBalance={ethBalance}
                    baseUsdc={baseUsdc}
                    refreshingBalances={refreshingBalances}
                    onRefreshBalances={handleRefreshBalances}
                    onFund={handleFundAgent}
                    balanceLoading={balanceQ.isLoading && activeChain === "solana"}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <AgentSetupSections
                activeAgent={activeAgent}
                activeQ={activeQ}
                activeChain={activeChain}
                shortWallet={activeChain === "base" ? baseShortAddress : shortAddress}
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
                ethBalance={ethBalance}
                baseUsdc={baseUsdc}
                refreshingBalances={refreshingBalances}
                onRefreshBalances={handleRefreshBalances}
                onFund={handleFundAgent}
                balanceLoading={balanceQ.isLoading && activeChain === "solana"}
              />
            )}

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
  activeQ,
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
  ethBalance,
  baseUsdc,
  refreshingBalances,
  onRefreshBalances,
  onFund,
  balanceLoading,
}: {
  activeAgent: AgentSetupRecord | undefined;
  activeQ: { isLoading: boolean; isFetching: boolean };
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
  if (activeQ.isLoading && !activeAgent) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl bg-muted/30" />
        <div className="h-56 animate-pulse rounded-2xl bg-muted/30" />
      </div>
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
  const chainLabel = activeChain === "base" ? "Base" : "Solana";

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
            {activeChain === "solana" ? (
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
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between font-mono text-sm tabular-nums">
                  <span className="text-muted-foreground">ETH</span>
                  <span className="font-medium text-foreground">
                    {ethBalance != null ? ethBalance.toFixed(4) : "—"}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-sm tabular-nums">
                  <span className="text-muted-foreground">USDC</span>
                  <span className="font-medium text-foreground">
                    {baseUsdc != null ? formatCompactUsd(baseUsdc) : "—"}
                  </span>
                </div>
              </div>
            )}
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
            <p className="pt-2 text-xs text-muted-foreground">
              LP follow and copy-trade allocation from your agent treasury — coming soon.
            </p>
          </CardContent>
        </Card>
      </div>

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
