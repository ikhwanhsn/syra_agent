import { useEffect, useState } from "react";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { cn } from "@/lib/utils";

export interface SwapTokenLogoProps {
  symbol: string;
  mint: string;
  icon?: string | null;
  className?: string;
}

/**
 * Jupiter token icon when available; falls back to CoinLogo (CoinGecko + CDN pack).
 */
export function SwapTokenLogo({ symbol, mint, icon, className }: SwapTokenLogoProps) {
  const [broken, setBroken] = useState(false);
  const trimmed = typeof icon === "string" ? icon.trim() : "";
  const isHttpIcon =
    trimmed.length > 0 &&
    (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//"));

  useEffect(() => {
    setBroken(false);
  }, [trimmed]);

  const src = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;

  if (isHttpIcon && !broken) {
    return (
      <img
        src={src}
        alt=""
        className={cn(
          "h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border/50",
          className,
        )}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <CoinLogo
      symbol={symbol}
      size="md"
      fallbackSeed={mint}
      className={cn("rounded-full ring-1 ring-border/50", className)}
    />
  );
}
