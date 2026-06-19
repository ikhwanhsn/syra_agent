import type { ReactNode } from "react";
import { Layers, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  walletKickerClass,
  walletPageSegmentedRoot,
  walletPageSegmentedTrigger,
} from "@/components/wallet/walletPageStyles";

export type WalletPageView = "treasuries" | "portfolio";

type WalletPageHeaderProps = {
  view: WalletPageView;
  onViewChange: (view: WalletPageView) => void;
  connectedLabel?: string | null;
  showTabs?: boolean;
  actions?: ReactNode;
};

const VIEW_COPY: Record<
  WalletPageView,
  { title: string; description: string }
> = {
  treasuries: {
    title: "Agent treasuries",
    description:
      "Operational SOL and USDC your agents use to pay for tools, deposits, and policy-governed spend.",
  },
  portfolio: {
    title: "Full holdings",
    description:
      "Every SPL token across your agent wallets — spot prices, balances, and allocation at a glance.",
  },
};

export function WalletPageHeader({
  view,
  onViewChange,
  connectedLabel,
  showTabs = true,
  actions,
}: WalletPageHeaderProps) {
  const copy = VIEW_COPY[view];

  return (
    <header className="flex flex-col gap-5 border-b border-border/40 pb-6 sm:gap-6 sm:pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className={walletKickerClass}>Wallets</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {copy.title}
          </h1>
          <p className={cn("max-w-2xl text-sm leading-relaxed text-muted-foreground")}>
            {copy.description}
          </p>
          {connectedLabel ? (
            <p className="inline-flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/55 bg-muted/25 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9945FF]" aria-hidden />
                <span className="font-mono text-[11px] text-foreground/90">{connectedLabel}</span>
              </span>
              <span>Signer wallet · agent treasuries are separate</span>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          {showTabs ? (
            <div
              className={walletPageSegmentedRoot(2)}
              role="tablist"
              aria-label="Wallet page sections"
            >
              <button
                type="button"
                role="tab"
                aria-selected={view === "treasuries"}
                id="wallet-view-treasuries"
                aria-controls="wallet-panel-treasuries"
                onClick={() => onViewChange("treasuries")}
                className={walletPageSegmentedTrigger(view === "treasuries")}
              >
                <Layers className="h-3.5 w-3.5 opacity-70" aria-hidden />
                Treasuries
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "portfolio"}
                id="wallet-view-portfolio"
                aria-controls="wallet-panel-portfolio"
                onClick={() => onViewChange("portfolio")}
                className={walletPageSegmentedTrigger(view === "portfolio")}
              >
                <PieChart className="h-3.5 w-3.5 opacity-70" aria-hidden />
                Portfolio
              </button>
            </div>
          ) : null}
          {actions}
        </div>
      </div>
    </header>
  );
}
