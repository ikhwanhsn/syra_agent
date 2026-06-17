import type { BtcBubblemapData, BtcExchange, BtcInterval } from "@/lib/btcApi";
import { BTC_CHART_VARIANTS, exchangeLabel, type BtcChartVariant } from "@/components/btc/chart/btcChartShared";

const SHARE_URL = "https://syraa.fun/btc";

export interface BtcChartShareCopyContext {
  exchange: BtcExchange;
  interval: BtcInterval;
  variant: BtcChartVariant;
  data: BtcBubblemapData;
}

function variantLabel(variant: BtcChartVariant): string {
  return BTC_CHART_VARIANTS.find((v) => v.id === variant)?.label ?? variant;
}

export function buildBtcChartShareText(ctx: BtcChartShareCopyContext): string {
  const ex = exchangeLabel(ctx.data.exchange);
  const style = variantLabel(ctx.variant);
  const price = ctx.data.points.at(-1)?.price;
  const priceLine =
    price != null
      ? `BTC ~$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : "BTC ratio bubblemap";

  return [
    `${priceLine} · ${ex} · ${ctx.interval} · ${style}`,
    "Price + aggressive buy/sell flow on Syra",
    "",
    SHARE_URL,
  ].join("\n");
}

export function buildBtcChartShareOnXUrl(ctx: BtcChartShareCopyContext): string {
  const text = buildBtcChartShareText(ctx);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export async function copyBtcChartShareText(ctx: BtcChartShareCopyContext): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildBtcChartShareText(ctx));
    return true;
  } catch {
    return false;
  }
}
