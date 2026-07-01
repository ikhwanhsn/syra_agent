import { useEffect, useState } from "react";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { cn } from "@/lib/utils";

/** Fixed logo boxes — same outer size for Jupiter img and CoinLogo fallback (no layout shift). */
const LOGO_SIZE = {
  /** Swap card token picker button */
  sm: "h-7 w-7 min-h-7 min-w-7",
  /** Token list rows, skeletons */
  md: "h-9 w-9 min-h-9 min-w-9",
} as const;

export type SwapTokenLogoSize = keyof typeof LOGO_SIZE;

export interface SwapTokenLogoProps {
  symbol: string;
  mint: string;
  icon?: string | null;
  size?: SwapTokenLogoSize;
  className?: string;
}

/**
 * Jupiter token icon when available; falls back to CoinLogo (CoinGecko + CDN pack).
 * Uses a fixed-size wrapper so icons never resize when the Jupiter URL arrives.
 */
export function SwapTokenLogo({
  symbol,
  mint,
  icon,
  size = "md",
  className,
}: SwapTokenLogoProps) {
  const [broken, setBroken] = useState(false);
  const trimmed = typeof icon === "string" ? icon.trim() : "";
  const isHttpIcon =
    trimmed.length > 0 &&
    (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//"));

  useEffect(() => {
    setBroken(false);
  }, [trimmed]);

  const src = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  const showJupiterIcon = isHttpIcon && !broken;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-muted/25 ring-1 ring-border/50",
        LOGO_SIZE[size],
        className,
      )}
      aria-hidden
    >
      {showJupiterIcon ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <CoinLogo
          symbol={symbol}
          size="xs"
          fallbackSeed={mint}
          className="absolute inset-0 h-full w-full min-h-0 min-w-0 rounded-none shadow-none ring-0"
        />
      )}
    </div>
  );
}
