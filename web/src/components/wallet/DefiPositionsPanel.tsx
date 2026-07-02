import { Landmark, Layers3, LineChart, PiggyBank, Sparkles, TrendingUp } from "lucide-react";
import { formatTreasuryUsd } from "@/lib/agentWalletBalanceDisplay";
import type { WalletDefiPositions } from "@/lib/agentWalletPortfolioApi";
import { cn } from "@/lib/utils";
import { walletTableShell, walletSectionStack } from "@/components/wallet/walletPageStyles";

type DefiPositionsPanelProps = {
  defi?: WalletDefiPositions | null;
  className?: string;
};

type DefiRow = {
  id: string;
  label: string;
  valueUsd: number | null;
  detail?: string;
  icon: typeof Landmark;
};

function formatProtocolList(protocols: Array<{ protocol: string }>, max = 3): string {
  if (!protocols.length) return "None";
  const names = protocols.map((p) => p.protocol.replace(/_/g, " "));
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} +${names.length - max}`;
}

function buildRows(defi: WalletDefiPositions): DefiRow[] {
  return [
    {
      id: "lending",
      label: "Lending",
      valueUsd: defi.lending.netUsd,
      detail: `Deposits ${formatTreasuryUsd(defi.lending.depositUsd)} · Borrows ${formatTreasuryUsd(defi.lending.borrowUsd)} · ${formatProtocolList(defi.lending.protocols)}`,
      icon: Landmark,
    },
    {
      id: "perps",
      label: "Perpetuals",
      valueUsd: defi.perps.collateralUsd,
      detail: `${defi.perps.positions} position${defi.perps.positions === 1 ? "" : "s"} · PnL ${formatTreasuryUsd(defi.perps.pnlUsd)}`,
      icon: LineChart,
    },
    {
      id: "lp",
      label: "Liquidity",
      valueUsd: defi.lp.valueUsd,
      detail: `${defi.lp.positions} LP position${defi.lp.positions === 1 ? "" : "s"} · ${formatProtocolList(defi.lp.protocols)}`,
      icon: Layers3,
    },
    {
      id: "staking",
      label: "Staking",
      valueUsd: defi.staking.valueUsd,
      detail: formatProtocolList(defi.staking.protocols),
      icon: TrendingUp,
    },
    {
      id: "yield",
      label: "Yield vaults",
      valueUsd: defi.yield.valueUsd,
      detail: formatProtocolList(defi.yield.protocols),
      icon: PiggyBank,
    },
    {
      id: "rewards",
      label: "Pending rewards",
      valueUsd: defi.rewards.pendingUsd,
      detail: formatProtocolList(defi.rewards.protocols),
      icon: Sparkles,
    },
  ];
}

function hasDefiActivity(defi: WalletDefiPositions): boolean {
  const rows = buildRows(defi);
  return (
    rows.some((row) => row.valueUsd != null && row.valueUsd > 0) ||
    (defi.activeProtocols?.length ?? 0) > 0
  );
}

export function DefiPositionsPanel({ defi, className }: DefiPositionsPanelProps) {
  if (!defi || !hasDefiActivity(defi)) return null;

  const rows = buildRows(defi).filter((row) => row.valueUsd != null && row.valueUsd > 0);

  return (
    <section className={cn(walletSectionStack, className)} aria-label="DeFi positions">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-sm font-semibold text-foreground">DeFi positions</h3>
          <p className="text-[11px] text-muted-foreground">
            {defi.activeProtocols.length} protocol{defi.activeProtocols.length === 1 ? "" : "s"} ·
            TopLedger
          </p>
        </div>
        {defi.netWorthUsd != null ? (
          <p className="text-sm font-medium text-foreground">
            {formatTreasuryUsd(defi.netWorthUsd)}
          </p>
        ) : null}
      </div>

      <ul className={cn(walletTableShell, "divide-y divide-border/40")}>
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/40">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  {row.detail ? (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {row.detail}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                {formatTreasuryUsd(row.valueUsd)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
