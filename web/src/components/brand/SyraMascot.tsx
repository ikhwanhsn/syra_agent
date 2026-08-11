import { cn } from "@/lib/utils";

export const SYRA_MASCOT_SRC = "/images/mascot.png";

type SyraMascotProps = {
  size?: number;
  alt?: string;
  className?: string;
  /** Hide from assistive tech when nearby copy already names Syra. */
  decorative?: boolean;
};

export function SyraMascot({
  size = 96,
  alt = "Syra mascot",
  className,
  decorative = false,
}: SyraMascotProps) {
  return (
    <img
      src={SYRA_MASCOT_SRC}
      alt={decorative ? "" : alt}
      width={size}
      height={size}
      className={cn("pointer-events-none select-none object-contain", className)}
      draggable={false}
      {...(decorative ? { "aria-hidden": true } : {})}
    />
  );
}
