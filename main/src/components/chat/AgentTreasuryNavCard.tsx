import { ArrowDownToLine, ArrowUpFromLine, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import {
  AGENT_WALLET_ACCENT,
  getAgentWalletSlot,
  shortenAgentAddress,
  type AgentWalletPurpose,
} from "@/lib/agentWalletCatalog";
import { cn } from "@/lib/utils";

export interface AgentTreasuryNavCardProps {
  purpose: AgentWalletPurpose;
  address: string | null;
  shortAddress?: string | null;
  usdc: number | null;
  sol: number | null;
  loading?: boolean;
  formatUsdc: (value: number | null | undefined) => string;
  onCopy: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  /** Show deposit / withdraw row (mobile wallet menu). */
  showActions?: boolean;
  className?: string;
}

export function AgentTreasuryNavCard({
  purpose,
  address,
  shortAddress,
  usdc,
  sol,
  loading,
  formatUsdc,
  onCopy,
  onDeposit,
  onWithdraw,
  showActions = false,
  className,
}: AgentTreasuryNavCardProps) {
  const slot = getAgentWalletSlot(purpose);
  const accent = AGENT_WALLET_ACCENT[purpose];
  const Icon = slot.icon;
  const hasUsdc = usdc != null && usdc > 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card/90 shadow-sm ring-1 ring-inset ring-white/[0.04]",
        accent.border,
        className,
      )}
    >
      <div className={cn("px-3.5 py-3", accent.bg)}>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
              accent.bgActive,
              accent.border,
            )}
          >
            <Icon className={cn("h-4 w-4", accent.icon)} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold tracking-tight text-foreground">{slot.label}</p>
            <p className="text-[11px] leading-snug text-muted-foreground">{slot.description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 px-3.5 py-3">
        {loading ? (
          <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            Creating…
          </div>
        ) : address ? (
          <>
            <button
              type="button"
              onClick={onCopy}
              className="group flex min-h-[40px] w-full items-center justify-between gap-2 rounded-xl border border-border/40 bg-muted/15 px-2.5 py-2 text-left transition-colors hover:bg-muted/30"
            >
              <span className="min-w-0 truncate font-mono text-[13px] text-foreground" title={address}>
                {shortAddress ?? shortenAgentAddress(address)}
              </span>
              <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70 group-hover:opacity-100" />
            </button>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/40 bg-muted/10 p-2.5 font-mono text-xs tabular-nums">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                  <CoinLogo symbol="USDC" size="xs" />
                  USDC
                </span>
                <span className={hasUsdc ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                  ${formatUsdc(usdc)}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                  <CoinLogo symbol="SOL" size="xs" />
                  SOL
                </span>
                <span className="text-foreground/90">{sol != null ? sol.toFixed(4) : "—"}</span>
              </div>
            </div>

            {showActions ? (
              <div className="flex gap-2 pt-0.5">
                <Button
                  type="button"
                  size="sm"
                  className="h-9 min-h-0 flex-1 gap-1.5 rounded-xl text-xs font-semibold touch-manipulation"
                  onClick={onDeposit}
                >
                  <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Deposit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 min-h-0 flex-1 gap-1.5 rounded-xl text-xs font-semibold touch-manipulation"
                  onClick={onWithdraw}
                >
                  <ArrowUpFromLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Withdraw
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full gap-1.5 rounded-xl text-xs font-semibold touch-manipulation"
                onClick={onDeposit}
              >
                <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Manage treasury
              </Button>
            )}
          </>
        ) : (
          <p className="py-1 text-xs text-muted-foreground">Failed to load</p>
        )}
      </div>
    </div>
  );
}
