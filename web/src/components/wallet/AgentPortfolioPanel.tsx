import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Coins,
  ExternalLink,
  Info,
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
} from "@/lib/agentWalletPortfolioApi";
import { cn } from "@/lib/utils";
import { WalletSectionHeader } from "@/components/wallet/WalletSectionHeader";
import {
  walletHeroCard,
  walletInfoCallout,
  walletKickerClass,
  walletPageSegmentedRoot,
  walletPageSegmentedTrigger,
  walletPortfolioAssetCell,
  walletPortfolioMetricCell,
  walletPortfolioMetricLabel,
  walletPortfolioMetricSub,
  walletPortfolioMetricValue,
  walletPortfolioRow,
  walletPurposePill,
  walletSectionStack,
  walletStatHint,
  walletStatLabel,
  walletStatTile,
  walletStatValue,
  walletTableHeader,
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
  balanceLabel: string;
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
      balanceLabel: token.symbol,
    };
  }

  if (hasRealName) {
    return {
      title: token.name,
      subtitle: shortenMintDisplay(token.mint),
      balanceLabel: token.name.length > 16 ? token.name.slice(0, 16) : token.name,
    };
  }

  return {
    title: "Unknown token",
    subtitle: token.mint,
    balanceLabel: "tokens",
  };
}

type AgentPortfolioPanelProps = {
  chatAddress?: string | null;
  lpAddress?: string | null;
  enabled?: boolean;
};

function formatTokenPrice(price: number | null): string {
  if (price == null || !Number.isFinite(price)) return "—";
  if (price >= 1000) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  }
  if (price >= 1) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(price);
}

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
      className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-white/10"
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
  totalValueUsd,
  showWalletPills,
}: {
  token: MergedPortfolioHolding;
  totalValueUsd: number | null;
  showWalletPills: boolean;
}) {
  const pct =
    totalValueUsd != null && totalValueUsd > 0 && token.valueUsd != null
      ? Math.min(100, (token.valueUsd / totalValueUsd) * 100)
      : null;

  const solscanUrl =
    token.mint === WRAPPED_SOL_MINT
      ? undefined
      : `https://solscan.io/token/${token.mint}`;

  const display = resolveTokenDisplay(token);
  const balance = formatPortfolioTokenAmount(token.amount);

  return (
    <li className={cn(walletPortfolioRow, "group")}>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden bg-primary/[0.04] transition-all duration-300 group-hover:bg-primary/[0.07] lg:block"
        style={{ width: pct != null ? `${Math.max(pct, 1.5)}%` : "0%" }}
        aria-hidden
      />

      <div className={walletPortfolioAssetCell}>
        <TokenMintLogo mint={token.mint} symbol={display.title} imageUrl={token.imageUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              {display.title}
            </p>
            {showWalletPills ? <WalletPurposePills wallets={token.wallets} /> : null}
          </div>
          <p className="truncate text-xs text-muted-foreground" title={token.mint}>
            {display.subtitle}
          </p>
          {pct != null ? (
            <p className="mt-1 text-[11px] tabular-nums text-muted-foreground/80 lg:hidden">
              {pct.toFixed(1)}% of portfolio
            </p>
          ) : null}
        </div>
      </div>

      <div className={walletPortfolioMetricCell}>
        <span className={walletPortfolioMetricLabel}>Price</span>
        <span className={walletPortfolioMetricValue}>{formatTokenPrice(token.priceUsd)}</span>
        {pct != null ? (
          <span className="hidden text-[11px] tabular-nums text-muted-foreground/75 lg:inline">
            {pct.toFixed(1)}% alloc
          </span>
        ) : null}
      </div>

      <div className={walletPortfolioMetricCell}>
        <span className={walletPortfolioMetricLabel}>Balance</span>
        <span
          className={walletPortfolioMetricSub}
          title={balance.full}
          aria-label={`${balance.ariaLabel} ${display.balanceLabel}`}
        >
          {balance.display}
        </span>
        <span className="text-[11px] text-muted-foreground/75">{display.balanceLabel}</span>
      </div>

      <div className={walletPortfolioMetricCell}>
        <span className={walletPortfolioMetricLabel}>Est. value</span>
        <span className={walletPortfolioMetricValue}>{formatTreasuryUsd(token.valueUsd)}</span>
      </div>

      <div className="flex justify-end lg:items-center">
        {solscanUrl ? (
          <a
            href={solscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label={`View ${display.title} on Solscan`}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        ) : (
          <span className="hidden h-8 w-8 lg:block" aria-hidden />
        )}
      </div>
    </li>
  );
}

function PortfolioSkeleton() {
  return (
    <div className={walletSectionStack} aria-busy="true" aria-label="Loading portfolio">
      <div className="h-44 animate-pulse rounded-2xl bg-muted/30" />
      <div className="h-64 animate-pulse rounded-2xl bg-muted/25" />
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
        "flex min-h-[260px] flex-col items-center justify-center px-6 py-14 text-center",
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40 ring-1 ring-inset ring-border/50">
        <Coins className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-foreground">No holdings to show</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Fund your {label} with SOL or USDC, or let your agent trade — tokens appear here automatically
        with live estimates.
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

  const totalValueUsd = useMemo(
    () => sumPortfolioTokenValues(mergedTokens ?? []),
    [mergedTokens],
  );

  const visibleValueUsd = useMemo(
    () => sumPortfolioTokenValues(tokens),
    [tokens],
  );

  const showWalletPills = walletFilter === "all" && portfolio.allTargets.length > 1;
  const tokenCount = mergedTokens?.length ?? 0;
  const visibleCount = tokens.length;
  /** Hero total = full merged portfolio (dust filter only affects the table). */
  const displayTotalUsd = totalValueUsd;

  const topHolding = tokens[0];
  const pricedCount = tokens.filter((t) => t.valueUsd != null && t.valueUsd > 0).length;

  if (!portfolio.hasWallets) {
    return <PortfolioEmptyState walletFilter="all" />;
  }

  const filterTabs = [
    { id: "all" as const, label: "All wallets", icon: Layers },
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
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className={walletKickerClass}>Estimated portfolio value</p>
            <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[2.75rem]">
              {formatTreasuryUsd(displayTotalUsd)}
            </p>
            <p className={walletStatHint}>
              {visibleCount === tokenCount
                ? `${tokenCount} token${tokenCount === 1 ? "" : "s"}`
                : `${visibleCount} of ${tokenCount} tokens shown`}
              {portfolio.allTargets.length > 1
                ? ` · ${portfolio.allTargets.length} agent wallets`
                : ""}
              {hideDust && visibleCount !== tokenCount && visibleValueUsd != null && totalValueUsd != null
                ? ` · ${formatTreasuryUsd(visibleValueUsd)} visible (${formatTreasuryUsd(totalValueUsd)} total)`
                : hideDust && visibleCount !== tokenCount && totalValueUsd != null
                  ? ` · ${formatTreasuryUsd(totalValueUsd)} incl. dust`
                  : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 self-start rounded-xl gap-2"
            disabled={portfolio.loading}
            onClick={() => void portfolio.refresh()}
          >
            {portfolio.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Refresh
          </Button>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          <div className={walletStatTile}>
            <p className={walletStatLabel}>Priced assets</p>
            <p className={walletStatValue}>{pricedCount}</p>
            <p className={walletStatHint}>Tokens with a USD estimate</p>
          </div>
          <div className={walletStatTile}>
            <p className={walletStatLabel}>Largest position</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {topHolding ? resolveTokenDisplay(topHolding).title : "—"}
            </p>
            <p className={walletStatHint}>
              {topHolding?.valueUsd != null ? formatTreasuryUsd(topHolding.valueUsd) : "No estimate"}
            </p>
          </div>
          <div className={walletStatTile}>
            <p className={walletStatLabel}>View</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {walletFilter === "all"
                ? "All agent wallets"
                : `${getAgentWalletSlot(walletFilter).label} only`}
            </p>
            <p className={walletStatHint}>Filter holdings by treasury</p>
          </div>
        </div>
      </section>

      <div className={walletInfoCallout}>
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <p>
          Values are <span className="font-medium text-foreground">estimates</span> from live market
          data (DexScreener, Jupiter, pump.fun). Memecoins can be illiquid — verify on Solscan before
          moving funds. Tags show which agent wallet holds each token.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/45 bg-muted/15 px-3 py-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-primary"
            checked={hideDust}
            onChange={(e) => setHideDust(e.target.checked)}
          />
          Hide dust (&lt; $0.01)
        </label>
      </div>

      <div>
        <WalletSectionHeader
          title="Holdings"
          description="Spot price × on-chain balance. Click the link icon to verify any token on Solscan."
        />
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
          <div className={walletTableHeader}>
            <span>Asset</span>
            <span className="text-right">Price</span>
            <span className="text-right">Balance</span>
            <span className="text-right">Est. value</span>
            <span className="sr-only">Explorer</span>
          </div>
          <ul>
            {tokens.map((token) => (
              <PortfolioTokenRow
                key={token.mint}
                token={token}
                totalValueUsd={displayTotalUsd ?? totalValueUsd ?? null}
                showWalletPills={showWalletPills}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
