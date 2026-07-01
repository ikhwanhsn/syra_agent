import type { ReactNode } from "react";
import { Layers, PieChart } from "lucide-react";
import {
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

export function WalletPageHeader({
  view,
  onViewChange,
  connectedLabel,
  showTabs = true,
  actions,
}: WalletPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
          Wallet
        </h1>
        {connectedLabel ? (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            <span className="font-mono text-[11px] text-foreground/80">{connectedLabel}</span>
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
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
              <Layers className="h-3.5 w-3.5 opacity-60" aria-hidden />
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
              <PieChart className="h-3.5 w-3.5 opacity-60" aria-hidden />
              Portfolio
            </button>
          </div>
        ) : null}
        {actions}
      </div>
    </header>
  );
}
