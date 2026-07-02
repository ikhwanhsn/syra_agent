import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Coins,
  Layers,
  Loader2,
  RefreshCw,
  Wallet2,
} from "lucide-react";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { Button } from "@/components/ui/button";
import { overviewAccentBackground, overviewCardGlow } from "@/components/dashboard/overview/overviewStyles";
import { formatTreasuryUsd } from "@/lib/agentWalletBalanceDisplay";
import { getAgentWalletSlot, type AgentWalletPurpose } from "@/lib/agentWalletCatalog";
import { formatPortfolioTokenAmount } from "@/lib/format";
import {
  useAgentWalletPortfolio,
  type PortfolioWalletFilter,
} from "@/hooks/useAgentWalletPortfolio";
import {
  sumPortfolioTokenValues,
  type MergedPortfolioHolding,
  type WalletDefiPositions,
} from "@/lib/agentWalletPortfolioApi";
import { DefiPositionsPanel } from "@/components/wallet/DefiPositionsPanel";
import { cn } from "@/lib/utils";
import {
  walletHeroCard,
  walletHeroValue,
  walletPageSegmentedRoot,
  walletPageSegmentedTrigger,
  walletPortfolioAssetCell,
  walletPortfolioBalanceSub,
  walletPortfolioRow,
  walletPortfolioValueCell,
  walletPurposePill,
  walletSectionStack,
  walletStatHint,
  walletTableShell,
} from "@/components/wallet/walletPageStyles";

const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";
const DUST_USD = 0.01;

function shortenMintDisplay(mint: string): string {
  if (mint.length <= 12) return mint;
  return `${mint.slice(0, 4)}…${mint.slice(-4)}`;
}

function looksLikeMintLabel(value: string): boolean {
  const text = value.trim();
  return text.includes("…") || (text.length >= 32 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(text));
}

function resolveTokenDisplay(token: MergedPortfolioHolding): {
  title: string;
  subtitle: string;
} {
  const hasRealSymbol = Boolean(token.symbol) && !looksLikeMintLabel(token.symbol);
  const hasRealName =
    Boolean(token.name) &&
    !looksLikeMintLabel(token.name) &&
    token.name !== token.symbol &&
    !token.name.startsWith("Token ");

  if (hasRealSymbol) {
    return {
      title: token.symbol,
      subtitle: hasRealName ? token.name : shortenMintDisplay(token.mint),
    };
  }

  if (hasRealName) {
    return {
      title: token.name,
      subtitle: shortenMintDisplay(token.mint),
    };
  }

  return {
    title: "Unknown token",
    subtitle: token.mint,
  };
}

type AgentPortfolioPanelProps = {
  chatAddress?: string | null;
  lpAddress?: string | null;
  enabled?: boolean;
};

function TokenMintLogo({
  mint,
  symbol,
  imageUrl,
}: {
  mint: string;
  symbol: string;
  imageUrl?: string | null;
}) {
  const [broken, setBroken] = useState(false);
  const primarySrc = imageUrl?.trim() || `https://token.jup.ag/strict/${mint}`;

  if (broken || mint === WRAPPED_SOL_MINT) {
    return <CoinLogo symbol={symbol} size="md" fallbackSeed={mint} />;
  }

  return (
    <img
      src={primarySrc}
      alt=""
      className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border/40"
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

function WalletPurposePills({ wallets }: { wallets: AgentWalletPurpose[] }) {
  if (wallets.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {wallets.map((purpose) => (
        <span key={purpose} className={walletPurposePill(purpose)}>
          {getAgentWalletSlot(purpose).shortLabel}
        </span>
      ))}
    </span>
  );
}

function PortfolioTokenRow({
  token,
  showWalletPills,
}: {
  token: MergedPortfolioHolding;
  showWalletPills: boolean;
}) {
  const display = resolveTokenDisplay(token);
  const balance = formatPortfolioTokenAmount(token.amount);

  return (
    <li className={walletPortfolioRow}>
      <div className={walletPortfolioAssetCell}>
        <TokenMintLogo mint={token.mint} symbol={display.title} imageUrl={token.imageUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{display.title}</p>
            {showWalletPills ? <WalletPurposePills wallets={token.wallets} /> : null}
          </div>
          <p className={walletPortfolioBalanceSub} title={balance.full}>
            {balance.display}
          </p>
        </div>
      </div>

      <p className={walletPortfolioValueCell}>{formatTreasuryUsd(token.valueUsd)}</p>
    </li>
  );
}

function PortfolioSkeleton() {
  return (
    <div className={walletSectionStack} aria-busy="true" aria-label="Loading portfolio">
      <div className="h-28 animate-pulse rounded-2xl bg-muted/30" />
      <div className="h-48 animate-pulse rounded-2xl bg-muted/25" />
    </div>
  );
}

function PortfolioEmptyState({ walletFilter }: { walletFilter: PortfolioWalletFilter }) {
  const label =
    walletFilter === "all"
      ? "agent wallets"
      : `${getAgentWalletSlot(walletFilter).shortLabel} wallet`;

  return (
    <div
      className={cn(
        walletTableShell,
        "flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center",
      )}
    >
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted/40">
        <Coins className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="text-sm font-semibold text-foreground">No holdings yet</h3>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
        Fund your {label} or let your agent trade — tokens show up here automatically.
      </p>
    </div>
  );
}

export function AgentPortfolioPanel({
  chatAddress,
  lpAddress,
  enabled = true,
}: AgentPortfolioPanelProps) {
  const [walletFilter, setWalletFilter] = useState<PortfolioWalletFilter>("all");
  const [hideDust, setHideDust] = useState(true);

  const portfolio = useAgentWalletPortfolio({
    chatAddress,
    lpAddress,
    enabled,
    walletFilter,
  });

  const mergedTokens = portfolio.merged?.tokens;

  const tokens = useMemo(() => {
    const rows = mergedTokens ?? [];
    if (!hideDust) return rows;
    return rows.filter((row) => {
      if (row.valueUsd == null) return false;
      return row.valueUsd >= DUST_USD;
    });
  }, [mergedTokens, hideDust]);

  const totalValueUsd = useMemo(() => {
    const primaryDefi = portfolio.primaryDefi;
    if (primaryDefi?.netWorthUsd != null && Number.isFinite(primaryDefi.netWorthUsd)) {
      return primaryDefi.netWorthUsd;
    }
    return sumPortfolioTokenValues(mergedTokens ?? []);
  }, [mergedTokens, portfolio.primaryDefi]);

  const showWalletPills = walletFilter === "all" && portfolio.allTargets.length > 1;
  const tokenCount = tokens.length;

  if (!portfolio.hasWallets) {
    return <PortfolioEmptyState walletFilter="all" />;
  }

  const filterTabs = [
    { id: "all" as const, label: "All", icon: Layers },
    { id: "spend" as const, label: "Spend", icon: Wallet2 },
    ...(lpAddress ? [{ id: "lp" as const, label: "LP", icon: ArrowUpRight }] : []),
  ] as const;

  return (
    <div className={walletSectionStack}>
      <section className={walletHeroCard} aria-label="Portfolio value">
        <div
          className={overviewCardGlow}
          style={{ background: overviewAccentBackground("marketplace") }}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={walletHeroValue}>{formatTreasuryUsd(totalValueUsd)}</p>
            <p className={walletStatHint}>
              {tokenCount} token{tokenCount === 1 ? "" : "s"}
              {hideDust && (mergedTokens?.length ?? 0) > tokenCount
                ? ` · dust hidden`
                : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-muted-foreground"
            disabled={portfolio.loading}
            aria-label="Refresh portfolio"
            onClick={() => void portfolio.refresh()}
          >
            {portfolio.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>
      </section>

      <DefiPositionsPanel defi={portfolio.primaryDefi} />

      <div className="flex items-center justify-between gap-3">
        <div
          className={walletPageSegmentedRoot(filterTabs.length === 3 ? 3 : 2)}
          role="tablist"
          aria-label="Portfolio wallet filter"
        >
          {filterTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={walletFilter === id}
              onClick={() => setWalletFilter(id)}
              className={walletPageSegmentedTrigger(walletFilter === id)}
            >
              <Icon className="h-3 w-3 opacity-60" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setHideDust((v) => !v)}
          className={cn(
            "shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground",
            !hideDust && "text-foreground",
          )}
        >
          {hideDust ? "Show dust" : "Hide dust"}
        </button>
      </div>

      {portfolio.error ? (
        <div
          className={cn(
            walletTableShell,
            "border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive",
          )}
          role="alert"
        >
          {portfolio.error}
        </div>
      ) : portfolio.loading && !portfolio.merged ? (
        <PortfolioSkeleton />
      ) : tokens.length === 0 ? (
        <PortfolioEmptyState walletFilter={walletFilter} />
      ) : (
        <section className={walletTableShell} aria-label="Token holdings">
          <ul>
            {tokens.map((token) => (
              <PortfolioTokenRow
                key={token.mint}
                token={token}
                showWalletPills={showWalletPills}
              />
            ))}
          </ul>
        </section>
      )}

      <p className="px-1 text-center text-[11px] text-muted-foreground/70">
        Values are estimates from live market data. Verify on-chain before moving funds.
      </p>
    </div>
  );
}
