import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { AGENT_WALLET_ACCENT, type AgentWalletPurpose } from "@/lib/agentWalletCatalog";

export interface AgentTreasuryBalanceRailProps {
  flowTab: "deposit" | "withdraw";
  purpose: AgentWalletPurpose;
  agentUsdc: number | null;
  agentSol: number | null;
  walletUsdc: number | null;
  walletSol: number | null;
  nativeLabel?: string;
  /** Bumps when user switches deposit / withdraw to replay motion. */
  flowAnimKey?: number;
}

function formatUsdc(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `$${v.toFixed(2)}`;
}

function formatSol(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(4);
}

function BalanceColumn({
  label,
  usdc,
  sol,
  nativeLabel,
  highlighted,
  accent,
}: {
  label: string;
  usdc: number | null;
  sol: number | null;
  nativeLabel: string;
  highlighted: boolean;
  accent: (typeof AGENT_WALLET_ACCENT)[AgentWalletPurpose];
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-xl px-3 py-2.5 transition-colors duration-300 sm:px-3.5 sm:py-3",
        highlighted ? cn(accent.bgActive, "ring-1 ring-inset", accent.border) : "bg-background/30",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">{label}</p>
      <div className="mt-2 space-y-1.5 font-mono text-sm tabular-nums">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CoinLogo symbol="USDC" size="xs" />
            USDC
          </span>
          <span
            className={cn(
              "text-[13px] font-medium sm:text-sm",
              usdc != null && usdc > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
            )}
          >
            {formatUsdc(usdc)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CoinLogo symbol={nativeLabel} size="xs" />
            {nativeLabel}
          </span>
          <span className="text-[13px] font-medium text-foreground sm:text-sm">{formatSol(sol)}</span>
        </div>
      </div>
    </div>
  );
}

export function AgentTreasuryBalanceRail({
  flowTab,
  purpose,
  agentUsdc,
  agentSol,
  walletUsdc,
  walletSol,
  nativeLabel = "SOL",
  flowAnimKey = 0,
}: AgentTreasuryBalanceRailProps) {
  const accent = AGENT_WALLET_ACCENT[purpose];
  const deposit = flowTab === "deposit";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-sm ring-1 ring-inset ring-white/[0.04]",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-80",
          deposit
            ? "bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent"
            : "bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-transparent",
        )}
      />
      <div className="relative grid min-w-0 grid-cols-1 gap-2 p-2 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:gap-0 sm:p-2.5">
        <BalanceColumn
          label="Agent treasury"
          usdc={agentUsdc}
          sol={agentSol}
          nativeLabel={nativeLabel}
          highlighted={deposit}
          accent={accent}
        />
        <div
          className="flex items-center justify-center px-1 py-1 sm:flex-col sm:px-2"
          aria-hidden
        >
          <span
            key={flowAnimKey}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-background/90 shadow-sm",
              deposit ? "animate-deposit-flow-up sm:animate-deposit-flow-left" : "animate-withdraw-flow-down sm:animate-withdraw-flow-right",
            )}
          >
            {deposit ? (
              <>
                <ArrowUp className="h-4 w-4 text-primary sm:hidden" strokeWidth={2.25} />
                <ArrowLeft className="hidden h-4 w-4 text-primary sm:block" strokeWidth={2.25} />
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400 sm:hidden" strokeWidth={2.25} />
                <ArrowRight className="hidden h-4 w-4 text-emerald-600 dark:text-emerald-400 sm:block" strokeWidth={2.25} />
              </>
            )}
          </span>
        </div>
        <BalanceColumn
          label="Your wallet"
          usdc={walletUsdc}
          sol={walletSol}
          nativeLabel={nativeLabel}
          highlighted={!deposit}
          accent={accent}
        />
      </div>
    </div>
  );
}
