import { cn } from "@/lib/utils";
import {
  AGENT_WALLET_SLOTS,
  AGENT_WALLET_ACCENT,
  getAgentWalletSlot,
  type AgentWalletPurpose,
} from "@/lib/agentWalletCatalog";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { formatTreasuryUsd } from "@/lib/agentWalletBalanceDisplay";
import { formatSol } from "@/lib/dashboardOverviewAggregates";

export interface AgentWalletBalances {
  sol: number | null;
  usdc: number | null;
}

export interface AgentWalletSwitcherProps {
  value: AgentWalletPurpose;
  onChange: (purpose: AgentWalletPurpose) => void;
  available: AgentWalletPurpose[];
  balances?: Partial<Record<AgentWalletPurpose, AgentWalletBalances>>;
  className?: string;
}

export function AgentWalletSwitcher({ value, onChange, available, balances, className }: AgentWalletSwitcherProps) {
  if (available.length <= 1) return null;

  return (
    <div
      className={cn(
        "rounded-2xl bg-muted/30 p-1 ring-1 ring-inset ring-border/50 backdrop-blur-sm",
        className,
      )}
      role="tablist"
      aria-label="Agent treasury"
    >
      <div className="grid grid-cols-2 gap-1">
        {AGENT_WALLET_SLOTS.filter((slot) => available.includes(slot.id)).map((slot) => {
          const meta = getAgentWalletSlot(slot.id);
          const accent = AGENT_WALLET_ACCENT[slot.id];
          const Icon = meta.icon;
          const active = value === slot.id;
          const bal = balances?.[slot.id];

          return (
            <button
              key={slot.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(slot.id)}
              className={cn(
                "relative flex min-h-[4.25rem] flex-col items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? cn(accent.borderActive, accent.bgActive, accent.glow, "shadow-sm")
                  : "border-transparent bg-transparent hover:bg-background/60",
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                      active ? cn(accent.bgActive, accent.border) : "bg-muted/40 ring-border/40",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? accent.icon : "text-muted-foreground")} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold tracking-tight text-foreground">
                      {meta.shortLabel}
                    </span>
                    <span className="block text-[10px] leading-snug text-muted-foreground">{meta.description}</span>
                  </span>
                </span>
                {active ? (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      slot.id === "chat" ? "bg-primary" : "bg-violet-500",
                    )}
                    aria-hidden
                  />
                ) : null}
              </span>
              {bal ? (
                <span className="flex w-full items-center gap-3 border-t border-border/40 pt-2 font-mono text-[11px] tabular-nums">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <CoinLogo symbol="USDC" size="xs" />
                    <span className={bal.usdc != null && bal.usdc > 0 ? "font-medium text-foreground" : ""}>
                      {formatTreasuryUsd(bal.usdc)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <CoinLogo symbol="SOL" size="xs" />
                    {bal.sol != null && Number.isFinite(bal.sol) ? formatSol(bal.sol) : "—"}
                  </span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
