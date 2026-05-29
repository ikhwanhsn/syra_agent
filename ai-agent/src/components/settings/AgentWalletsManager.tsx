import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
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
import { agentWalletApi } from "@/lib/chatApi";
import { AGENT_WALLET_ACCENT, getAgentWalletSlot } from "@/lib/agentWalletCatalog";
import { clearAgentWalletLocalSession } from "@/lib/agentWalletSession";
import { formatCompactUsd, formatSol } from "@/lib/dashboardOverviewAggregates";
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
  onRefreshBalance,
  refreshingBalance,
  onCopy,
  copiedField,
  onRemove,
  removing,
}: {
  kind: "chat" | "lp";
  wallet: ManagedAgentWallet;
  solBalance: number | null;
  usdcBalance: number | null;
  balanceLoading: boolean;
  onFund: () => void;
  onRefreshBalance: () => void;
  refreshingBalance: boolean;
  onCopy: (text: string, label: string) => void;
  copiedField: string | null;
  onRemove: () => void;
  removing: boolean;
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

  const addressLabel = kind === "chat" ? "Agent address" : "LP agent address";
  const sessionLabel = kind === "chat" ? "Session ID" : "LP session ID";

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
                  {balanceLoading ? "…" : usdcBalance != null ? formatCompactUsd(usdcBalance) : "—"}
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
  chatWallet,
  lpWallet,
  chatSolBalance,
  chatUsdcBalance,
  lpSolBalance,
  lpUsdcBalance,
  chatBalanceLoading,
  lpBalanceLoading,
  refreshingChatBalances,
  refreshingLpBalances,
  hasLinkedWallet,
  syraAuthenticated,
  onCopy,
  copiedField,
  onFundChat,
  onFundLp,
  onRefreshChatBalances,
  onRefreshLpBalances,
  onCreateChatWallet,
  onCreateLpWallet,
  creatingChat,
  creatingLp,
}: {
  chatWallet: ManagedAgentWallet | undefined;
  lpWallet: ManagedAgentWallet | undefined;
  chatSolBalance: number | null;
  chatUsdcBalance: number | null;
  lpSolBalance: number | null;
  lpUsdcBalance: number | null;
  chatBalanceLoading: boolean;
  lpBalanceLoading: boolean;
  refreshingChatBalances: boolean;
  refreshingLpBalances: boolean;
  hasLinkedWallet: boolean;
  syraAuthenticated: boolean;
  onCopy: (text: string, label: string) => void;
  copiedField: string | null;
  onFundChat: () => void;
  onFundLp: () => void;
  onRefreshChatBalances: () => void;
  onRefreshLpBalances: () => void;
  onCreateChatWallet: () => void;
  onCreateLpWallet: () => void;
  creatingChat: boolean;
  creatingLp: boolean;
}) {
  const { toast } = useToast();
  const { requestSyraAuth } = useSyraAuth();
  const [removeTarget, setRemoveTarget] = useState<{ wallet: ManagedAgentWallet; kind: "chat" | "lp" } | null>(null);
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
        includeSibling: removeTarget.kind === "chat",
      });
      clearAgentWalletLocalSession();
      toast({
        title: "Wallet removed",
        description:
          removeTarget.kind === "chat"
            ? "Chat and LP agent wallets were retired. Reloading to provision fresh wallets."
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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Agent wallets</h2>
          <p className="text-sm text-muted-foreground">
            Create, fund, export keys, or remove Syra agent treasuries. Withdraw funds before removing a wallet.
          </p>
        </div>
      </div>

      {chatWallet ? (
        <AgentWalletManageCard
          kind="chat"
          wallet={chatWallet}
          solBalance={chatSolBalance}
          usdcBalance={chatUsdcBalance}
          balanceLoading={chatBalanceLoading}
          onFund={onFundChat}
          onRefreshBalance={onRefreshChatBalances}
          refreshingBalance={refreshingChatBalances}
          onCopy={onCopy}
          copiedField={copiedField}
          removing={removing && removeTarget?.kind === "chat"}
          onRemove={() => setRemoveTarget({ wallet: chatWallet, kind: "chat" })}
        />
      ) : (
        <Card className={cn(overviewCardShell, "overflow-hidden border-dashed")}>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
              <Wallet2 className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">No chat agent wallet</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Create a chat agent wallet to pay for tools, x402 API calls, and research.
              </p>
            </div>
            <Button type="button" className="rounded-xl gap-2" disabled={creatingChat} onClick={onCreateChatWallet}>
              {creatingChat ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
              Create chat wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {lpWallet ? (
        <AgentWalletManageCard
          kind="lp"
          wallet={lpWallet}
          solBalance={lpSolBalance}
          usdcBalance={lpUsdcBalance}
          balanceLoading={lpBalanceLoading}
          onFund={onFundLp}
          onRefreshBalance={onRefreshLpBalances}
          refreshingBalance={refreshingLpBalances}
          onCopy={onCopy}
          copiedField={copiedField}
          removing={removing && removeTarget?.kind === "lp"}
          onRemove={() => setRemoveTarget({ wallet: lpWallet, kind: "lp" })}
        />
      ) : chatWallet ? (
        <Card className={cn(overviewCardShell, "overflow-hidden border-dashed")}>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/5">
              <Droplets className="h-6 w-6 text-violet-500" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">No LP agent wallet</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Create a dedicated LP treasury before enabling the real Meteora LP agent.
              </p>
            </div>
            <Button type="button" className="rounded-xl gap-2" disabled={creatingLp} onClick={onCreateLpWallet}>
              {creatingLp ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
              Create LP wallet
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && !removing && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove agent wallet?</DialogTitle>
            <DialogDescription>
              {removeTarget?.kind === "chat"
                ? "This retires your chat agent wallet and its LP sibling. Withdraw any remaining SOL or USDC first — Syra cannot recover funds after removal."
                : "This retires your LP agent wallet only. Withdraw any remaining funds first."}
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
