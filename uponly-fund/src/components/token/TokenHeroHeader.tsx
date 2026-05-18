import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Star,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChangePill,
  GlassCard,
  LevelChip,
  RiseTradeButton,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
  shortenMint,
} from "@/components/rise/RiseShared";
import { toast } from "@/components/ui/sonner";
import { buildRiseTradeUrl, buildSolscanTokenUrl } from "@/lib/riseDashboardApi";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { useWatchlist } from "@/lib/useWatchlist";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

export function TokenHeroHeader({
  market,
  className,
}: {
  market: RiseMarketRow | null;
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;
  const tradeUrl = market ? buildRiseTradeUrl(market.mint) : null;
  const tokenUrl = market ? buildSolscanTokenUrl(market.mint) : null;
  const { has, toggle } = useWatchlist();

  const copyMint = async () => {
    if (!market?.mint) return;
    try {
      await navigator.clipboard.writeText(market.mint);
      toast.success(t.mintCopied);
    } catch {
      toast.error(t.copyMint);
    }
  };

  const shareLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t.linkCopied);
    } catch {
      toast.error(t.share);
    }
  };

  if (!market) {
    return (
      <GlassCard className={cn(className)}>
        <Skeleton className="h-20 w-full rounded-xl" />
      </GlassCard>
    );
  }

  const inWatch = has(market.mint);
  const displayName = market.name || shortenMint(market.mint);

  return (
    <GlassCard
      padded={false}
      className={cn(
        "overflow-hidden border-border/50 shadow-[0_8px_40px_-20px_hsl(0_0%_0%/0.45)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <TokenAvatar imageUrl={market.imageUrl} symbol={market.symbol} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {displayName}
              </h1>
              <span className="font-mono text-sm text-muted-foreground">${market.symbol || "—"}</span>
              <VerifiedBadge verified={market.isVerified} />
              <LevelChip level={market.level} />
            </div>
            <button
              type="button"
              onClick={() => void copyMint()}
              className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md font-mono text-[0.65rem] text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t.copyMint}
            >
              <span className="truncate">{shortenMint(market.mint, 6, 6)}</span>
              <Copy className="h-3 w-3 shrink-0 opacity-60" />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap items-baseline gap-2 sm:justify-end">
            <span className="font-display text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {formatPriceSmart(market.priceUsd)}
            </span>
            <ChangePill pct={market.priceChange24hPct} />
          </div>
          <span className="text-[0.65rem] text-muted-foreground">{t.kpiPrice} · 24h</span>
        </div>

        <div className="flex items-center gap-2 sm:ml-2">
          {tradeUrl ? (
            <Button asChild size="sm" className="h-9 gap-1.5 px-4 font-semibold">
              <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                {t.tradeOnRise}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
              </a>
            </Button>
          ) : (
            <RiseTradeButton mint={market.mint} size="md" />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-border/55"
                aria-label={t.share}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => toggle(market.mint)}>
                <Star className={cn("mr-2 h-4 w-4", inWatch && "fill-current")} />
                {inWatch ? t.watchlistRemove : t.watchlistAdd}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void shareLink()}>
                <Share2 className="mr-2 h-4 w-4" />
                {t.share}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void copyMint()}>
                <Copy className="mr-2 h-4 w-4" />
                {t.copyMint}
              </DropdownMenuItem>
              {tokenUrl ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={tokenUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t.solscan}
                    </a>
                  </DropdownMenuItem>
                </>
              ) : null}
              {market.twitterUrl ? (
                <DropdownMenuItem asChild>
                  <a href={market.twitterUrl} target="_blank" rel="noopener noreferrer">
                    <Twitter className="mr-2 h-4 w-4" />
                    Twitter
                  </a>
                </DropdownMenuItem>
              ) : null}
              {market.telegramUrl ? (
                <DropdownMenuItem asChild>
                  <a href={market.telegramUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Telegram
                  </a>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </GlassCard>
  );
}
