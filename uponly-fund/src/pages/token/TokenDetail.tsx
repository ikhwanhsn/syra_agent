import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { ChangePill, GlassCard, StatTile, TokenAvatar, formatPriceSmart, shortenMint } from "@/components/rise/RiseShared";
import { useRiseMarketsAll, useRiseOhlc } from "@/lib/RiseDashboardContext";
import { formatInt, formatPct, formatUsd } from "@/lib/marketDisplayFormat";

export default function TokenDetailPage() {
  const { address } = useParams<{ address: string }>();
  const normalizedAddress = (address ?? "").trim();
  const markets = useRiseMarketsAll(100);
  const market =
    markets.data?.find((row) => row.mint === normalizedAddress || row.marketAddress === normalizedAddress) ?? null;
  const ohlc = useRiseOhlc(market?.marketAddress ?? market?.mint ?? null, "1h", 96);

  if (!normalizedAddress) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <DashboardPageHeader title="Token not found" description="Missing token address." eyebrow="Token" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <DashboardPageHeader
        title={market?.name || "Token detail"}
        description={market ? `Live market snapshot for ${market.symbol}` : "Loading token data..."}
        eyebrow="Token"
        right={
          <Link
            to="/terminal"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border/55 px-3 text-sm font-medium text-foreground/90 hover:bg-muted/20"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
        }
      />

      {markets.isPending ? (
        <GlassCard>
          <p className="text-sm text-muted-foreground">Loading market data...</p>
        </GlassCard>
      ) : !market ? (
        <GlassCard>
          <p className="text-sm text-muted-foreground">No token found for address `{normalizedAddress}`.</p>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <TokenAvatar imageUrl={market.imageUrl} symbol={market.symbol} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold text-foreground">{market.name}</p>
                <p className="font-mono text-sm text-muted-foreground">
                  ${market.symbol} · {shortenMint(market.mint, 8, 8)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-semibold tabular-nums text-foreground">
                    {formatPriceSmart(market.priceUsd)}
                  </span>
                  <ChangePill pct={market.priceChange24hPct} />
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile label="Market cap" value={formatUsd(market.marketCapUsd, { compact: false })} />
            <StatTile label="24h volume" value={formatUsd(market.volume24hUsd, { compact: false })} />
            <StatTile label="Holders" value={formatInt(market.holders)} />
            <StatTile label="Floor price" value={formatPriceSmart(market.floorPriceUsd)} />
            <StatTile label="Floor mcap" value={formatUsd(market.floorMarketCapUsd, { compact: false })} />
            <StatTile label="Creator fee" value={formatPct(market.creatorFeePct)} />
          </div>

          <GlassCard>
            <p className="text-sm text-muted-foreground">
              1h candles loaded: {ohlc.data?.candles?.length ?? 0}
            </p>
          </GlassCard>
        </>
      )}
    </div>
  );
}
