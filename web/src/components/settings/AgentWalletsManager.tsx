import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  ChevronDown,
  Copy,
  Droplets,
  KeyRound,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Trash2,
  Wallet2,
  Zap,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import {
  walletAgentCard,
  walletStatHint,
} from "@/components/wallet/walletPageStyles";
import { agentWalletApi } from "@/lib/chatApi";
import {
  AGENT_WALLET_ACCENT,
  AGENT_WALLET_SLOTS,
  getAgentWalletSlot,
  PILLAR_WALLET_PURPOSES,
  type AgentWalletPurpose,
} from "@/lib/agentWalletCatalog";
import { isAdminWallet } from "@/constants/adminWallet";
import { useWalletContext } from "@/contexts/WalletContext";
import { clearAgentWalletLocalSession } from "@/lib/agentWalletSession";
import { formatTreasuryUsd } from "@/lib/agentWalletBalanceDisplay";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import { useToast } from "@/hooks/use-toast";
import { useSyraAuth } from "@/contexts/SyraAuthContext";

export interface ManagedAgentWallet {
  anonymousId: string;
  agentAddress: string;
  walletAddress: string;
}

function shortenAddress(addr: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function maskAnonymousId(id: string): string {
  if (!id) return "—";
  if (id.startsWith("wallet:")) {
    const pubkey = id.slice(7).replace(":lp", "").trim();
    if (pubkey.length <= 8) return pubkey;
    return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}${id.endsWith(":lp") ? ":lp" : ""}`;
  }
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
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

function exportKeyStatusMessage(reason: string | undefined): string {
  switch (reason) {
    case "privy_custody_not_exportable":
      return "This wallet is custodied by Privy. Private keys cannot be exported.";
    case "base_not_exportable":
      return "Base agent wallets do not support private key export.";
    case "auth_required":
      return "Approve the wallet signature prompt to verify ownership before export.";
    case "wallet_mismatch":
      return "Switch to the wallet linked to this agent to export its key.";
    case "no_exportable_key":
      return "No exportable private key is stored for this agent.";
    default:
      return "Private key export is not available for this wallet.";
  }
}

function AgentWalletManageCard({
  kind,
  wallet,
  solBalance,
  usdcBalance,
  balanceLoading,
  onFund,
  onWithdraw,
  onRefreshBalance,
  refreshingBalance,
  onCopy,
  copiedField,
  onRemove,
  removing,
  layout = "default",
}: {
  kind: AgentWalletPurpose;
  wallet: ManagedAgentWallet;
  solBalance: number | null;
  usdcBalance: number | null;
  balanceLoading: boolean;
  onFund: () => void;
  onWithdraw?: () => void;
  onRefreshBalance: () => void;
  refreshingBalance: boolean;
  onCopy: (text: string, label: string) => void;
  copiedField: string | null;
  onRemove: () => void;
  removing: boolean;
  layout?: "default" | "simple";
}) {
  const { toast } = useToast();
  const { requestSyraAuthForWallet, syraAuthReady, syraAuthenticated } = useSyraAuth();
  const [exportOpen, setExportOpen] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [exportable, setExportable] = useState<boolean | null>(null);
  const [statusReason, setStatusReason] = useState<string | undefined>();
  const [requiresWalletAuth, setRequiresWalletAuth] = useState(false);

  const slot = getAgentWalletSlot(kind);
  const accent = AGENT_WALLET_ACCENT[kind];
  const Icon = slot.icon;

  useEffect(() => {
    let cancelled = false;
    setStatusLoading(true);
    void agentWalletApi
      .getExportKeyStatus(wallet.anonymousId)
      .then((status) => {
        if (cancelled) return;
        setExportable(status.exportable);
        setStatusReason(status.reason);
        setRequiresWalletAuth(Boolean(status.requiresWalletAuth));
      })
      .catch(() => {
        if (cancelled) return;
        setExportable(false);
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wallet.anonymousId, syraAuthenticated]);

  const handleExportOpenChange = useCallback((open: boolean) => {
    setExportOpen(open);
    if (!open) setPrivateKey(null);
  }, []);

  const handleShowPrivateKey = useCallback(async () => {
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
      setExportOpen(true);
      return;
    }
    setExportLoading(true);
    try {
      const linkedWallet = wallet.walletAddress?.trim();
      if (requiresWalletAuth || statusReason === "auth_required") {
        if (!linkedWallet) {
          toast({
            title: "Sign in required",
            description: "Connect your linked wallet to export this key.",
            variant: "destructive",
          });
          return;
        }
        const signIn = await requestSyraAuthForWallet(linkedWallet);
        if (!signIn) return;
      }
      const result = await agentWalletApi.exportPrivateKey(wallet.anonymousId);
      setPrivateKey(result.privateKeyBase58);
      setExportOpen(true);
    } catch (err) {
      toast({
        title: "Could not export key",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  }, [
    exportable,
    privateKey,
    requestSyraAuthForWallet,
    requiresWalletAuth,
    statusReason,
    toast,
    wallet.anonymousId,
    wallet.walletAddress,
  ]);

  const addressLabel = kind === "lp" ? "LP agent address" : `${slot.shortLabel} agent address`;
  const sessionLabel = kind === "lp" ? "LP session ID" : `${slot.shortLabel} session ID`;

  if (layout === "simple") {
    return (
      <>
        <Card
          className={cn(
            layout === "simple" ? walletAgentCard : overviewCardShell,
            layout !== "simple" && "overflow-hidden ring-1 ring-inset transition-shadow hover:shadow-md",
            accent.border,
          )}
        >
          <CardContent className={cn(layout === "simple" ? "p-5" : "p-5")}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                    accent.bgActive,
                    accent.border,
                  )}
                >
                  <Icon className={cn("h-4 w-4", accent.icon)} aria-hidden />
                </span>
                <p className="font-semibold tracking-tight text-foreground">{slot.label}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full text-muted-foreground"
                disabled={refreshingBalance}
                aria-label={`Refresh ${slot.shortLabel} balance`}
                onClick={onRefreshBalance}
              >
                {refreshingBalance ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                )}
              </Button>
            </div>

            <div className="mt-4">
              <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {balanceLoading ? "…" : formatTreasuryUsd(usdcBalance)}
              </p>
              <p className={walletStatHint}>
                {balanceLoading ? "…" : solBalance != null ? `${formatSol(solBalance)} SOL` : "— SOL"}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button type="button" className="h-10 rounded-xl gap-1.5 text-sm font-medium" onClick={onFund}>
                <Zap className="h-3.5 w-3.5" aria-hidden />
                Deposit
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl gap-1.5 text-sm font-medium"
                onClick={onWithdraw ?? onFund}
              >
                <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden />
                Withdraw
              </Button>
            </div>

            <Collapsible className="mt-3">
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                Details
                <ChevronDown
                  className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
                  aria-hidden
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <CopyField
                  label={addressLabel}
                  value={wallet.agentAddress}
                  display={shortenAddress(wallet.agentAddress)}
                  onCopy={onCopy}
                  copied={copiedField === addressLabel}
                />
                <CopyField
                  label={sessionLabel}
                  value={wallet.anonymousId}
                  display={maskAnonymousId(wallet.anonymousId)}
                  onCopy={onCopy}
                  copied={copiedField === sessionLabel}
                  breakAll
                />
                <div className="flex flex-wrap gap-2">
                  {!statusLoading && exportable !== false ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2 border-amber-500/30"
                      disabled={exportLoading || !syraAuthReady}
                      onClick={() => void handleShowPrivateKey()}
                    >
                      {exportLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <KeyRound className="h-4 w-4" aria-hidden />
                      )}
                      Export key
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={removing}
                    onClick={onRemove}
                  >
                    {removing ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden />
                    )}
                    Remove
                  </Button>
                </div>
                {!statusLoading && exportable === false ? (
                  <p className="text-xs text-muted-foreground">{exportKeyStatusMessage(statusReason)}</p>
                ) : null}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
        <Dialog open={exportOpen} onOpenChange={handleExportOpenChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{slot.label} — private key</DialogTitle>
              <DialogDescription>
                Base58 secret for{" "}
                <span className="font-mono text-foreground/90">{shortenAddress(wallet.agentAddress)}</span>. Anyone
                with this key controls the treasury.
              </DialogDescription>
            </DialogHeader>
            {privateKey ? (
              <div className="space-y-3">
                <div className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <p>
                    Never share this key or paste it into untrusted sites. Syra cannot recover it after you close this
                    dialog.
                  </p>
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
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleExportOpenChange(false)}>
                Close
              </Button>
              {privateKey ? (
                <Button
                  type="button"
                  className="rounded-xl gap-2"
                  onClick={() => onCopy(privateKey, `${slot.label} private key`)}
                >
                  {copiedField === `${slot.label} private key` ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                  Copy key
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card className={cn(overviewCardShell, "overflow-hidden ring-1 ring-inset", accent.border)}>
        <CardHeader className={cn("border-b border-border/40 pb-4", accent.bg)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                  accent.bgActive,
                  accent.border,
                )}
              >
                <Icon className={cn("h-4 w-4", accent.icon)} aria-hidden />
              </span>
              <div>
                <CardTitle className="text-base font-semibold tracking-tight">{slot.label}</CardTitle>
                <CardDescription className="text-[13px]">{slot.description}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={cn("shrink-0 rounded-full border-0 text-[10px] font-semibold uppercase", accent.pill)}>
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <CopyField
              label={addressLabel}
              value={wallet.agentAddress}
              display={shortenAddress(wallet.agentAddress)}
              onCopy={onCopy}
              copied={copiedField === addressLabel}
            />
            <CopyField
              label={sessionLabel}
              value={wallet.anonymousId}
              display={maskAnonymousId(wallet.anonymousId)}
              onCopy={onCopy}
              copied={copiedField === sessionLabel}
              breakAll
            />
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/15 px-4 py-3">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Treasury</p>
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-sm tabular-nums">
                <span className="text-muted-foreground">SOL</span>
                <span className="font-medium text-foreground">
                  {balanceLoading ? "…" : solBalance != null ? formatSol(solBalance) : "—"}
                </span>
              </div>
              <div className="flex justify-between font-mono text-sm tabular-nums">
                <span className="text-muted-foreground">USDC</span>
                <span className="font-medium text-foreground">
                  {balanceLoading ? "…" : formatTreasuryUsd(usdcBalance)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" className="rounded-xl gap-2" onClick={onFund}>
              <Zap className="h-4 w-4" aria-hidden />
              Fund
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2"
              disabled={refreshingBalance}
              onClick={onRefreshBalance}
            >
              {refreshingBalance ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              Refresh
            </Button>
            {!statusLoading && exportable !== false ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl gap-2 border-amber-500/30"
                disabled={exportLoading || !syraAuthReady}
                onClick={() => void handleShowPrivateKey()}
              >
                {exportLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <KeyRound className="h-4 w-4" aria-hidden />
                )}
                Private key
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={removing}
              onClick={onRemove}
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
              Remove
            </Button>
          </div>

          {!statusLoading && exportable === false ? (
            <p className="text-xs text-muted-foreground">{exportKeyStatusMessage(statusReason)}</p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={exportOpen} onOpenChange={handleExportOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{slot.label} — private key</DialogTitle>
            <DialogDescription>
              Base58 secret for{" "}
              <span className="font-mono text-foreground/90">{shortenAddress(wallet.agentAddress)}</span>. Anyone with
              this key controls the treasury.
            </DialogDescription>
          </DialogHeader>
          {privateKey ? (
            <div className="space-y-3">
              <div className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                <p>
                  Never share this key or paste it into untrusted sites. Syra cannot recover it after you close this
                  dialog.
                </p>
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
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleExportOpenChange(false)}>
              Close
            </Button>
            {privateKey ? (
              <Button type="button" className="rounded-xl gap-2" onClick={() => onCopy(privateKey, `${slot.label} private key`)}>
                {copiedField === `${slot.label} private key` ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden />
                )}
                Copy key
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AgentWalletsManager({
  spendWallet,
  chatWallet,
  lpWallet,
  pillarEntries,
  spendSolBalance,
  spendUsdcBalance,
  chatSolBalance,
  chatUsdcBalance,
  lpSolBalance,
  lpUsdcBalance,
  spendBalanceLoading,
  chatBalanceLoading,
  lpBalanceLoading,
  refreshingBalances,
  refreshingChatBalances,
  refreshingLpBalances,
  hasLinkedWallet,
  syraAuthenticated,
  onCopy,
  copiedField,
  onFundSpend,
  onFundChat,
  onFundLp,
  onFundPillar,
  onWithdrawSpend,
  onWithdrawChat,
  onWithdrawLp,
  onWithdrawPillar,
  onRefreshBalances,
  onRefreshChatBalances,
  onRefreshLpBalances,
  onCreateSpendWallet,
  onCreateChatWallet,
  creatingSpend,
  creatingChat,
  pillarLoading,
  pillarSetComplete,
  pillarProvisionError,
  onRetryProvision,
  embedded = false,
  layout = "default",
}: {
  spendWallet?: ManagedAgentWallet;
  chatWallet?: ManagedAgentWallet;
  lpWallet: ManagedAgentWallet | undefined;
  pillarEntries?: Array<{
    purpose: AgentWalletPurpose;
    wallet: ManagedAgentWallet;
    balances: { solBalance: number | null; usdcBalance: number | null };
  }>;
  spendSolBalance: number | null;
  spendUsdcBalance: number | null;
  chatSolBalance?: number | null;
  chatUsdcBalance?: number | null;
  lpSolBalance: number | null;
  lpUsdcBalance: number | null;
  spendBalanceLoading?: boolean;
  chatBalanceLoading?: boolean;
  lpBalanceLoading: boolean;
  refreshingBalances?: boolean;
  refreshingChatBalances?: boolean;
  refreshingLpBalances?: boolean;
  hasLinkedWallet: boolean;
  syraAuthenticated: boolean;
  onCopy: (text: string, label: string) => void;
  copiedField: string | null;
  onFundSpend?: () => void;
  onFundChat?: () => void;
  onFundLp: () => void;
  onFundPillar?: (purpose: AgentWalletPurpose) => void;
  onWithdrawSpend?: () => void;
  onWithdrawChat?: () => void;
  onWithdrawLp?: () => void;
  onWithdrawPillar?: (purpose: AgentWalletPurpose) => void;
  onRefreshBalances?: () => void;
  onRefreshChatBalances?: () => void;
  onRefreshLpBalances?: () => void;
  onCreateSpendWallet?: () => void;
  onCreateChatWallet?: () => void;
  creatingSpend?: boolean;
  creatingChat?: boolean;
  pillarLoading?: boolean;
  pillarSetComplete?: boolean;
  pillarProvisionError?: boolean;
  onRetryProvision?: () => void;
  embedded?: boolean;
  layout?: "default" | "simple";
}) {
  const primaryWallet = spendWallet ?? chatWallet;
  const primarySol = spendSolBalance ?? chatSolBalance ?? null;
  const primaryUsdc = spendUsdcBalance ?? chatUsdcBalance ?? null;
  const primaryLoading = spendBalanceLoading ?? chatBalanceLoading ?? false;
  const primaryRefreshing = refreshingBalances ?? refreshingChatBalances ?? false;
  const onFundPrimary = onFundSpend ?? onFundChat ?? (() => {});
  const onWithdrawPrimary = onWithdrawSpend ?? onWithdrawChat;
  const onRefreshPrimary = onRefreshBalances ?? onRefreshChatBalances ?? (() => {});
  const onCreatePrimary = onCreateSpendWallet ?? onCreateChatWallet ?? (() => {});
  const creatingPrimary = creatingSpend ?? creatingChat ?? false;

  const { connected, address } = useWalletContext();
  const showLp = isAdminWallet(connected, address);

  const expectFullPillarSet = hasLinkedWallet && syraAuthenticated;

  const entries = expectFullPillarSet
    ? pillarSetComplete
      ? (pillarEntries ?? [])
      : []
    : pillarEntries && pillarEntries.length > 0
      ? pillarEntries
      : primaryWallet
        ? [
            {
              purpose: "spend" as const,
              wallet: primaryWallet,
              balances: { solBalance: primarySol, usdcBalance: primaryUsdc },
            },
          ]
        : [];

  const showWalletProvisioning =
    entries.length === 0 &&
    (pillarLoading ||
      creatingPrimary ||
      pillarProvisionError ||
      (expectFullPillarSet && !pillarSetComplete));

  const { toast } = useToast();
  const { requestSyraAuth } = useSyraAuth();
  const [removeTarget, setRemoveTarget] = useState<{ wallet: ManagedAgentWallet; kind: AgentWalletPurpose } | null>(null);
  const [removing, setRemoving] = useState(false);

  const handleConfirmRemove = useCallback(async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      if (hasLinkedWallet && !syraAuthenticated) {
        const ok = await requestSyraAuth();
        if (!ok) return;
      }
      await agentWalletApi.retire(removeTarget.wallet.anonymousId, {
        includeSibling: removeTarget.kind === "spend",
      });
      clearAgentWalletLocalSession();
      toast({
        title: "Wallet removed",
        description:
          removeTarget.kind === "spend"
            ? "All pillar agent wallets were retired. Reloading to provision fresh wallets."
            : "LP agent wallet was retired.",
      });
      window.setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      toast({
        title: "Could not remove wallet",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  }, [hasLinkedWallet, removeTarget, requestSyraAuth, syraAuthenticated, toast]);

  return (
    <div className="space-y-4">
      {!embedded ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Agent wallets</h2>
            <p className="text-sm text-muted-foreground">
              Create, fund, export keys, or remove Syra agent treasuries. Withdraw funds before removing a wallet.
            </p>
          </div>
        </div>
      ) : null}

      <div className={cn(layout === "simple" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 sm:grid-cols-2")}>
        {showWalletProvisioning ? (
            <Card className={cn(overviewCardShell, "overflow-hidden border-dashed sm:col-span-2")}>
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                {pillarProvisionError ? (
                  <>
                    <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Could not set up agent wallets</p>
                      <p className="max-w-md text-sm text-muted-foreground">
                        The server returned an error while creating your treasuries. Try again in a moment.
                      </p>
                    </div>
                    <Button type="button" variant="outline" className="rounded-xl gap-2" onClick={onRetryProvision}>
                      <RefreshCw className="h-4 w-4" aria-hidden />
                      Retry
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Setting up agent wallets</p>
                      <p className="max-w-md text-sm text-muted-foreground">
                        Creating earn, treasury, invest, spend, and grow treasuries for your connected wallet…
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : entries.length > 0
          ? entries.map((entry) => (
              <AgentWalletManageCard
                key={entry.purpose}
                kind={entry.purpose}
                layout={layout}
                wallet={entry.wallet}
                solBalance={entry.balances.solBalance}
                usdcBalance={entry.balances.usdcBalance}
                balanceLoading={primaryLoading}
                onFund={() =>
                  entry.purpose === "spend"
                    ? onFundPrimary()
                    : onFundPillar?.(entry.purpose)
                }
                onWithdraw={() =>
                  entry.purpose === "spend"
                    ? onWithdrawPrimary?.()
                    : onWithdrawPillar?.(entry.purpose)
                }
                onRefreshBalance={onRefreshPrimary}
                refreshingBalance={primaryRefreshing}
                onCopy={onCopy}
                copiedField={copiedField}
                removing={removing && removeTarget?.kind === entry.purpose}
                onRemove={() => setRemoveTarget({ wallet: entry.wallet, kind: entry.purpose })}
              />
            ))
          : (
            <Card className={cn(overviewCardShell, "overflow-hidden border-dashed sm:col-span-2")}>
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
                  <Wallet2 className="h-6 w-6 text-muted-foreground" aria-hidden />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Pillar agent wallets</p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Earn, treasury, invest, spend, and grow treasuries power the five-pillar stack. Spend pays for chat and x402.
                  </p>
                </div>
                <Button type="button" className="rounded-xl gap-2" disabled={creatingPrimary} onClick={onCreatePrimary}>
                  {creatingPrimary ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                  Create agent wallets
                </Button>
              </CardContent>
            </Card>
          )}

        {showLp && lpWallet ? (
          <AgentWalletManageCard
            kind="lp"
            layout={layout}
            wallet={lpWallet}
            solBalance={lpSolBalance}
            usdcBalance={lpUsdcBalance}
            balanceLoading={lpBalanceLoading}
            onFund={onFundLp}
            onWithdraw={onWithdrawLp}
            onRefreshBalance={onRefreshLpBalances ?? onRefreshPrimary}
            refreshingBalance={refreshingLpBalances ?? primaryRefreshing}
            onCopy={onCopy}
            copiedField={copiedField}
            removing={removing && removeTarget?.kind === "lp"}
            onRemove={() => setRemoveTarget({ wallet: lpWallet, kind: "lp" })}
          />
        ) : null}
      </div>

      <Dialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && !removing && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove agent wallet?</DialogTitle>
            <DialogDescription>
              {removeTarget?.kind === "spend"
                ? "This retires your spend agent wallet and all pillar siblings. Withdraw any remaining SOL or USDC first — Syra cannot recover funds after removal."
                : "This retires this agent wallet. Withdraw any remaining funds first."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <p>You can create new agent wallets afterward, but they will have new addresses and session IDs.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" disabled={removing} onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl gap-2"
              disabled={removing}
              onClick={() => void handleConfirmRemove()}
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
              Remove wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
