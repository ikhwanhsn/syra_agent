import { useCallback, useState } from "react";
import { Check, Copy, ExternalLink, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MARKETPLACE_FILTER_DESCRIPTIONS,
  MARKETPLACE_FILTER_LABELS,
  type MarketplaceFilter,
} from "@/lib/marketplaceCatalog";
import { MARKETPLACE_NAV_BUILD } from "@/lib/playgroundRoute";
import { resolveApiBaseUrl } from "@/lib/resolveApiBaseUrl";
import { Link } from "@/lib/navigation";
import {
  playgroundSearchClass,
  playgroundSegmentedRoot,
  playgroundSegmentedTrigger,
  playgroundWalletChipClass,
} from "@/components/playground/playgroundStyles";
import { cn } from "@/lib/utils";

type TierFilter = MarketplaceFilter;

interface MarketplaceBrowseHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeTier: TierFilter;
  onTierChange: (tier: TierFilter) => void;
  showingCount: number;
  catalogLive: boolean;
  walletConnected?: boolean;
  walletBalance?: string;
  onConnectWallet?: () => void;
}

const TIER_ORDER: TierFilter[] = ["core", "partner", "all"];

const TIER_SHORT_LABELS: Record<TierFilter, string> = {
  core: "Core",
  partner: "Partners",
  all: "All",
};

function AgentDiscoveryStrip() {
  const apiBase = resolveApiBaseUrl().replace(/\/$/, "");
  const links = [
    { label: "x402 discovery", href: `${apiBase}/.well-known/x402` },
    { label: "OpenAPI", href: `${apiBase}/openapi.json` },
    { label: "Agent tools", href: `${apiBase}/agent/tools` },
    { label: "MCP docs", href: "https://docs.syraa.fun/docs/build/mcp" },
  ] as const;
  const [copiedHref, setCopiedHref] = useState<string | null>(null);

  const copyHref = useCallback(async (href: string) => {
    try {
      await navigator.clipboard.writeText(href);
      setCopiedHref(href);
      window.setTimeout(() => setCopiedHref(null), 1600);
    } catch {
      /* clipboard blocked */
    }
  }, []);

  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 px-3.5 py-3 sm:px-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Agent discovery
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Prefer machine-readable indexes over browsing cards.{" "}
            <Link
              to={MARKETPLACE_NAV_BUILD}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              Wire via Integrate
            </Link>
            .
          </p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map(({ label, href }) => (
          <li key={href} className="inline-flex items-center gap-0.5">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-background/70 px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:border-border hover:bg-background"
            >
              {label}
              <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden />
            </a>
            <button
              type="button"
              onClick={() => void copyHref(href)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              aria-label={`Copy ${label} URL`}
            >
              {copiedHref === href ? (
                <Check className="h-3.5 w-3.5 text-success" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketplaceBrowseHeader({
  search,
  onSearchChange,
  activeTier,
  onTierChange,
  showingCount,
  catalogLive,
  walletConnected,
  walletBalance,
  onConnectWallet,
}: MarketplaceBrowseHeaderProps) {
  const tierDescription = MARKETPLACE_FILTER_DESCRIPTIONS[activeTier];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {activeTier === "core" ? "Syra Core APIs" : MARKETPLACE_FILTER_LABELS[activeTier]}
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">{showingCount} APIs</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                catalogLive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground",
              )}
            >
              {catalogLive ? "Live" : "Cached"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Preview routes in the browser. Agents should use Integrate / MCP — {tierDescription}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {walletConnected ? (
            <span className={playgroundWalletChipClass}>
              <Wallet className="h-4 w-4 text-primary" aria-hidden />
              {walletBalance || "0 USDC"}
            </span>
          ) : onConnectWallet ? (
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl px-3.5"
              onClick={onConnectWallet}
            >
              <Wallet className="mr-1.5 h-4 w-4" aria-hidden />
              Connect wallet
            </Button>
          ) : null}
        </div>
      </div>

      <AgentDiscoveryStrip />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or path…"
            className={playgroundSearchClass}
            aria-label="Search API catalog"
          />
        </div>

        <div
          className={cn(
            playgroundSegmentedRoot(TIER_ORDER.length),
            "h-11 w-full shrink-0 sm:w-auto sm:min-w-[13rem]",
          )}
          role="group"
          aria-label="Filter by API tier"
        >
          {TIER_ORDER.map((tier) => {
            const active = activeTier === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => onTierChange(tier)}
                className={cn(playgroundSegmentedTrigger(active), "min-h-9 px-2 text-xs sm:text-sm")}
              >
                {TIER_SHORT_LABELS[tier]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
