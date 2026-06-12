import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Coins,
  ExternalLink,
  Layers,
  Loader2,
  RefreshCw,
  Wallet2,
} from "lucide-react";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { Button } from "@/components/ui/button";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { formatTreasuryUsd } from "@/lib/agentWalletBalanceDisplay";
import { getAgentWalletSlot, type AgentWalletPurpose } from "@/lib/agentWalletCatalog";
import { formatPortfolioTokenAmount } from "@/lib/format";
import {
  useAgentWalletPortfolio,
  type PortfolioWalletFilter,
} from "@/hooks/useAgentWalletPortfolio";
import type { MergedPortfolioHolding } from "@/lib/agentWalletPortfolioApi";
import { cn } from "@/lib/utils";
import {
  walletPageSegmentedRoot,
  walletPageSegmentedTrigger,
  walletPortfolioRow,
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
      className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-white/10"
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
        <span
          key={purpose}
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            purpose === "chat"
              ? "bg-primary/10 text-primary"
              : "bg-violet-500/10 text-violet-600 dark:text-violet-400",
          )}
        >
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

  return (
    <li>
      <div className={cn(walletPortfolioRow, "group")}>
        <div
          className="pointer-events-none absolute inset-y-2 left-0 rounded-r-md bg-primary/[0.05] transition-all duration-300 group-hover:bg-primary/[0.08]"
          style={{ width: pct != null ? `${Math.max(pct, 2)}%` : "0%" }}
          aria-hidden
        />
        <TokenMintLogo mint={token.mint} symbol={display.title} imageUrl={token.imageUrl} />
        <div className="relative min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              {display.title}
            </p>
            {showWalletPills ? <WalletPurposePills wallets={token.wallets} /> : null}
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground" title={token.mint}>
            {display.subtitle}
          </p>
          <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground/90">
            {formatTokenPrice(token.priceUsd)}
            {pct != null ? (
              <span className="ml-2 text-muted-foreground/70">{pct.toFixed(1)}%</span>
            ) : null}
          </p>
        </div>
        <div className="relative shrink-0 text-right">
          <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatTreasuryUsd(token.valueUsd)}
          </p>
          {(() => {
            const balance = formatPortfolioTokenAmount(token.amount);
            return (
              <p
                className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground"
                title={balance.full}
                aria-label={`${balance.ariaLabel} ${display.balanceLabel}`}
              >
                {balance.display} {display.balanceLabel}
              </p>
            );
          })()}
          {solscanUrl ? (
            <a
              href={solscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Solscan
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading portfolio">
      <div className="h-28 animate-pulse rounded-2xl bg-muted/30" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/25" />
      ))}
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
        overviewCardShell,
        "flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center",
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40 ring-1 ring-inset ring-border/50">
        <Coins className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-foreground">No tokens yet</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Fund your {label} with SOL or USDC, or let your agent trade — holdings will show up here
        automatically.
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

  const tokens = useMemo(() => {
    const rows = portfolio.merged?.tokens ?? [];
    if (!hideDust) return rows;
    return rows.filter((row) => {
      if (row.valueUsd == null) return true;
      return row.valueUsd >= DUST_USD;
    });
  }, [portfolio.merged?.tokens, hideDust]);

  const showWalletPills = walletFilter === "all" && (portfolio.targets.length ?? 0) > 1;
  const tokenCount = portfolio.merged?.tokens.length ?? 0;
  const visibleCount = tokens.length;

  if (!portfolio.hasWallets) {
    return (
      <PortfolioEmptyState walletFilter="all" />
    );
  }

  return (
    <div className="space-y-5">
      <section
        className={cn(overviewCardShell, "relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7")}
        aria-label="Portfolio value"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(480px 200px at 100% -20%, hsl(262 83% 58% / 0.14), transparent 55%), radial-gradient(420px 180px at 0% 120%, hsl(var(--primary) / 0.1), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Portfolio value
            </p>
            <div>
              <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[2.5rem]">
                {formatTreasuryUsd(portfolio.merged?.totalValueUsd)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {visibleCount === tokenCount
                  ? `${tokenCount} asset${tokenCount === 1 ? "" : "s"}`
                  : `${visibleCount} of ${tokenCount} assets`}
                {portfolio.targets.length > 1 ? ` · ${portfolio.targets.length} wallets` : null}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl gap-2 self-start sm:self-auto"
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
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className={walletPageSegmentedRoot(lpAddress ? 3 : 2)}
          role="tablist"
          aria-label="Portfolio wallet filter"
        >
          {(
            [
              { id: "all" as const, label: "All wallets", icon: Layers },
              { id: "chat" as const, label: "Chat", icon: Wallet2 },
              ...(lpAddress ? [{ id: "lp" as const, label: "LP", icon: ArrowUpRight }] : []),
            ] as const
          ).map(({ id, label, icon: Icon }) => (
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

        <label className="inline-flex cursor-pointer items-center gap-2 self-start text-sm text-muted-foreground sm:self-auto">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-primary"
            checked={hideDust}
            onChange={(e) => setHideDust(e.target.checked)}
          />
          Hide dust (&lt; $0.01)
        </label>
      </div>

      {portfolio.error ? (
        <div
          className={cn(
            overviewCardShell,
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
        <section
          className={cn(overviewCardShell, "overflow-hidden px-2 py-2 sm:px-3 sm:py-3")}
          aria-label="Token holdings"
        >
          <ul className="divide-y divide-border/40">
            {tokens.map((token) => (
              <PortfolioTokenRow
                key={token.mint}
                token={token}
                totalValueUsd={portfolio.merged?.totalValueUsd ?? null}
                showWalletPills={showWalletPills}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
