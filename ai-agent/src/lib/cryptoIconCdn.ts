import type { CSSProperties } from "react";

import { coinGeckoLookupKey } from "@/lib/coingeckoCoinImages";

/** Pinned npm release for stable jsDelivr URLs (MIT: spothq/cryptocurrency-icons). */
const CRYPTOCURRENCY_ICONS_VERSION = "0.18.1";

const CDN_BASE = `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@${CRYPTOCURRENCY_ICONS_VERSION}/128/color`;

/** Nonstandard tickers → icon pack slug (lowercase filename without .png). */
const CDN_SLUG_ALIASES: Record<string, string> = {
  wbtc: "wbtc",
};

/**
 * Lowercase slug for cryptocurrency-icons CDN (best-effort; many newer memecoins are absent).
 */
export function cryptoIconCdnSlug(raw: string): string {
  const key = coinGeckoLookupKey(raw).toLowerCase();
  return CDN_SLUG_ALIASES[key] ?? key;
}

export function cryptoIconPngUrl(raw: string): string {
  const slug = cryptoIconCdnSlug(raw).replace(/[^a-z0-9-]/gi, "") || "btc";
  return `${CDN_BASE}/${slug}.png`;
}

export function swatchStyleFromKey(key: string): CSSProperties {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const hue2 = (hue + 48) % 360;
  return {
    background: `linear-gradient(145deg, hsl(${hue} 58% 50%), hsl(${hue2} 64% 40%))`,
  };
}
