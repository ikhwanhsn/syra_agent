import { useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CoingeckoBatchImageContext } from "@/contexts/CoingeckoBatchImageContext";
import { coinGeckoLookupKey, fetchCoinGeckoImagesBatch } from "@/lib/coingeckoCoinImages";
import { cryptoIconPngUrl, swatchStyleFromKey } from "@/lib/cryptoIconCdn";
import { cn } from "@/lib/utils";

const sizeClass = {
  xs: "h-4 w-4 min-h-4 min-w-4",
  sm: "h-5 w-5 min-h-5 min-w-5",
  md: "h-8 w-8 min-h-8 min-w-8",
  lg: "h-10 w-10 min-h-10 min-w-10",
} as const;

export type CoinLogoSize = keyof typeof sizeClass;

export type CoinLogoProps = {
  symbol: string;
  size?: CoinLogoSize;
  className?: string;
  /** Seed for deterministic gradient when no image loads */
  fallbackSeed?: string;
};

export function CoinLogo({ symbol, size = "md", className, fallbackSeed }: CoinLogoProps) {
  const batch = useContext(CoingeckoBatchImageContext);
  const key = coinGeckoLookupKey(symbol);
  const cdnUrl = cryptoIconPngUrl(symbol);
  const seed = fallbackSeed ?? symbol;

  const soloQuery = useQuery({
    queryKey: ["coingecko-coin-image", "v3", key] as const,
    queryFn: () => fetchCoinGeckoImagesBatch([key]).then((m) => m[key] ?? null),
    enabled: batch == null && key.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const coingeckoUrl =
    batch != null ? (batch.isLoading ? undefined : batch.map[key]) : soloQuery.data ?? undefined;

  const primarySrc = coingeckoUrl ?? cdnUrl;
  const [src, setSrc] = useState(primarySrc);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setSrc(primarySrc);
    setBroken(false);
  }, [primarySrc]);

  if (broken) {
    return (
      <span
        className={cn("inline-block shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-white/10", sizeClass[size], className)}
        style={swatchStyleFromKey(seed)}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={cn("shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-white/10", sizeClass[size], className)}
      loading="lazy"
      decoding="async"
      aria-hidden
      onError={() => {
        if (coingeckoUrl != null && coingeckoUrl !== "" && src === coingeckoUrl) {
          setSrc(cdnUrl);
          return;
        }
        setBroken(true);
      }}
    />
  );
}
