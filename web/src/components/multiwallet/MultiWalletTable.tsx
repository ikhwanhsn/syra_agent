import { useCallback, useMemo, useState } from "react";
import {
  Archive,
  Copy,
  ExternalLink,
  EyeOff,
  Gift,
  KeyRound,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { notify } from "@/lib/notify";
import {
  archiveMultiWallet,
  executeMultiWalletAnsemBuy,
  type MultiWalletRow,
  type MultiWalletTierSummary,
} from "@/lib/multiWalletApi";
import { MultiWalletExportKeyDialog } from "@/components/multiwallet/MultiWalletExportKeyDialog";
import { MultiWalletTableBodySkeleton } from "@/components/multiwallet/MultiWalletSkeleton";
import { cn } from "@/lib/utils";

interface MultiWalletTableProps {
  wallets: MultiWalletRow[];
  tier: MultiWalletTierSummary | null;
  loading?: boolean;
  onChanged: () => Promise<void> | void;
}
function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatBalance(value: number | null, digits = 4): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  if (value < 0.0001) return "<0.0001";
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatBuyError(raw: string | null | undefined): string {
  if (!raw) return "Swap failed";
  if (raw.includes("Too many requests") || raw.includes("429")) {
    return "Jupiter rate limit hit. Wait a few seconds and click Buy $ANSEM again.";
  }
  if (raw.includes("insufficient_sol_for_swap")) {
    return "Not enough SOL for swap + token accounts. Retry buy (uses a smaller swap on tight balances) or re-fund the wallet with 0.015 SOL.";
  }
  if (raw.includes("wallet_underfunded")) {
    return "Wallet not funded yet. Wait for funding to confirm, then retry.";
  }
  if (raw.length > 180) return `${raw.slice(0, 180)}…`;
  return raw;
}

/** Wallet received $ANSEM above what was acquired from the Syra buy. */
function hasAnsemAirdrop(wallet: MultiWalletRow): boolean {
  return wallet.hasAnsemAirdrop === true;
}

export function MultiWalletTable({ wallets, tier, loading, onChanged }: MultiWalletTableProps) {
  const [exportKey, setExportKey] = useState<string | null>(null);
  const [exportLabel, setExportLabel] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [buyingKeys, setBuyingKeys] = useState<Set<string>>(() => new Set());
  const [retryingAll, setRetryingAll] = useState(false);
  const [hideBought, setHideBought] = useState(false);
  const [airdropOnly, setAirdropOnly] = useState(false);

  const swapSol = tier?.swapSolPerWallet ?? 0.007;

  const sorted = useMemo(
    () => [...wallets].sort((a, b) => a.walletIndex - b.walletIndex),
    [wallets],
  );

  const boughtCount = useMemo(() => sorted.filter((w) => w.ansemBought).length, [sorted]);
  const airdropCount = useMemo(() => sorted.filter(hasAnsemAirdrop).length, [sorted]);

  const visibleWallets = useMemo(() => {
    if (airdropOnly) return sorted.filter(hasAnsemAirdrop);
    if (hideBought) return sorted.filter((w) => !w.ansemBought);
    return sorted;
  }, [airdropOnly, hideBought, sorted]);

  const retryableWallets = useMemo(
    () => visibleWallets.filter((w) => !w.ansemBought),
    [visibleWallets],
  );

  const handleBuyAnsem = useCallback(
    async (publicKeys: string[]) => {
      if (publicKeys.length === 0) return;
      setBuyingKeys((prev) => {
        const next = new Set(prev);
        for (const pk of publicKeys) next.add(pk);
        return next;
      });
      try {
        const result = await executeMultiWalletAnsemBuy(publicKeys, swapSol);
        const ok = result.results.filter((r) => r.success);
        const bad = result.results.filter((r) => !r.success);

        if (ok.length > 0) {
          notify.success(
            "Buy submitted",
            `$ANSEM purchased on ${ok.length} wallet${ok.length === 1 ? "" : "s"}`,
          );
        }
        if (bad.length > 0) {
          const firstErr = formatBuyError(bad[0]?.error);
          notify.error(
            `${bad.length} buy${bad.length === 1 ? "" : "s"} failed`,
            bad.length === 1 ? firstErr : `${firstErr} (+${bad.length - 1} more)`,
          );
        }
        await onChanged();
      } catch (err) {
        notify.error("Buy failed", err instanceof Error ? err.message : "Could not buy $ANSEM");
      } finally {
        setBuyingKeys((prev) => {
          const next = new Set(prev);
          for (const pk of publicKeys) next.delete(pk);
          return next;
        });
      }
    },
    [onChanged, swapSol],
  );

  const handleRetryAllFailed = useCallback(async () => {
    const keys = retryableWallets.map((w) => w.publicKey);
    if (keys.length === 0) return;
    setRetryingAll(true);
    try {
      await handleBuyAnsem(keys);
    } finally {
      setRetryingAll(false);
    }
  }, [handleBuyAnsem, retryableWallets]);
  const copyAddress = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    notify.success("Copied", truncateAddress(addr));
  };

  const handleArchive = async (publicKey: string) => {
    setArchiving(publicKey);
    try {
      await archiveMultiWallet(publicKey);
      notify.success("Archived", "Wallet removed from your active list");
      await onChanged();
    } catch (err) {
      notify.error("Archive failed", err instanceof Error ? err.message : "Could not archive wallet");
    } finally {
      setArchiving(null);
    }
  };

  return (
    <>
      <div className={cn(overviewCardShell, "overflow-hidden")}>
        <div className="border-b border-border/40 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Your wallets</h2>
              {loading && sorted.length === 0 ? (
                <Skeleton className="mt-1 h-4 w-36" />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {visibleWallets.length === sorted.length
                    ? `${sorted.length} active wallet${sorted.length === 1 ? "" : "s"}`
                    : `Showing ${visibleWallets.length} of ${sorted.length} wallets`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={hideBought && !airdropOnly ? "default" : "outline"}
                disabled={airdropOnly || boughtCount === 0}
                onClick={() => setHideBought((v) => !v)}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Hide bought{boughtCount > 0 ? ` (${boughtCount})` : ""}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={airdropOnly ? "default" : "outline"}
                disabled={airdropCount === 0}
                onClick={() => {
                  setAirdropOnly((v) => {
                    const next = !v;
                    if (next) setHideBought(false);
                    return next;
                  });
                }}
              >
                <Gift className="mr-2 h-4 w-4" />
                Airdrop{airdropCount > 0 ? ` (${airdropCount})` : ""}
              </Button>
              {retryableWallets.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={retryingAll || buyingKeys.size > 0}
                  onClick={() => void handleRetryAllFailed()}
                >
                  {retryingAll ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-4 w-4" />
                  )}
                  Buy $ANSEM ({retryableWallets.length})
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        {sorted.length === 0 ? (
          loading ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">SOL</TableHead>
                    <TableHead className="text-right">$ANSEM</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <MultiWalletTableBodySkeleton rows={5} />
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
              No wallets yet. Generate your first batch above.
            </div>
          )
        ) : visibleWallets.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
            {airdropOnly ? (
              <>
                No wallets with extra $ANSEM airdrop yet. Airdrops appear when balance exceeds what
                was received from the buy.
              </>
            ) : hideBought ? (
              <>All wallets have bought $ANSEM. Turn off Hide bought to see them.</>
            ) : (
              <>No wallets match the current filter.</>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">SOL</TableHead>
                  <TableHead className="text-right">$ANSEM</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleWallets.map((wallet) => (
                  <TableRow key={wallet.publicKey}>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {wallet.walletIndex + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs sm:text-sm">{truncateAddress(wallet.publicKey)}</span>
                        {wallet.label ? (
                          <span className="text-xs text-muted-foreground">{wallet.label}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBalance(wallet.solBalance)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBalance(wallet.ansemBalance, 2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {wallet.ansemBought ? (
                          <Badge variant="default" className="bg-emerald-600/90 hover:bg-emerald-600/90">
                            Bought
                          </Badge>
                        ) : wallet.ansemBuyError ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="destructive">Failed</Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                {formatBuyError(wallet.ansemBuyError)}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                        {hasAnsemAirdrop(wallet) ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary">Airdrop</Badge>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">
                                +{formatBalance(wallet.ansemAirdropExtra, 4)} $ANSEM above buy
                                {wallet.ansemBalanceAtBuy != null
                                  ? ` (bought ${formatBalance(wallet.ansemBalanceAtBuy, 4)})`
                                  : ""}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {!wallet.ansemBought ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs"
                            disabled={buyingKeys.has(wallet.publicKey) || retryingAll}
                            onClick={() => void handleBuyAnsem([wallet.publicKey])}
                          >
                            {buyingKeys.has(wallet.publicKey) ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                            )}
                            Buy $ANSEM
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => void copyAddress(wallet.publicKey)}
                          aria-label="Copy address"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {wallet.ansemBuySignature ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            asChild
                          >
                            <a
                              href={`https://solscan.io/tx/${wallet.ansemBuySignature}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="View swap on Solscan"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setExportKey(wallet.publicKey);
                            setExportLabel(wallet.label);
                          }}
                          aria-label="Export private key"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={archiving === wallet.publicKey}
                          onClick={() => void handleArchive(wallet.publicKey)}
                          aria-label="Archive wallet"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <MultiWalletExportKeyDialog
        publicKey={exportKey}
        label={exportLabel}
        open={Boolean(exportKey)}
        onOpenChange={(open) => {
          if (!open) {
            setExportKey(null);
            setExportLabel(null);
          }
        }}
      />
    </>
  );
}
