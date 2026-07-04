import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Fixed logo boxes — same outer size for icon and monogram fallback (no layout shift). */
const LOGO_SIZE = {
  /** Swap card token picker button */
  sm: "h-7 w-7 min-h-7 min-w-7",
  /** Token list rows, skeletons */
  md: "h-9 w-9 min-h-9 min-w-9",
} as const;

const MONOGRAM_SIZE = {
  sm: "text-[10px]",
  md: "text-xs",
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
 * Jupiter token icon when available. Uses a neutral monogram (not CoinGecko/CDN)
 * when the icon is missing or broken so the logo never flashes a different brand.
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
  const monogram = (symbol.trim() || mint.slice(0, 2) || "?").slice(0, 2).toUpperCase();

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
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-semibold tracking-tight text-muted-foreground",
            MONOGRAM_SIZE[size],
          )}
        >
          {monogram}
        </span>
      )}
    </div>
  );
}
