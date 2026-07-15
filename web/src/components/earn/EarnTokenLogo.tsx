import { Coins } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type EarnTokenLogoProps = {
  src?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
};

/** Token logo with graceful fallback when URL is missing or fails to load. */
export function EarnTokenLogo({ src, alt, className, iconClassName }: EarnTokenLogoProps) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src?.trim()) && !failed;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted/40 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.35)]",
        className,
      )}
    >
      {showImg ? (
        <img
          src={src!.trim()}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <Coins className={cn("text-muted-foreground", iconClassName ?? "h-4 w-4")} aria-hidden />
      )}
    </div>
  );
}
