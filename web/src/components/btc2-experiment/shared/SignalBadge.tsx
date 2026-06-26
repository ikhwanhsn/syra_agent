import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SignalDirection } from "@/lib/btc2/types";

const styles: Record<SignalDirection, string> = {
  bullish: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  neutral: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  bearish: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

export function SignalBadge({
  signal,
  className,
}: {
  signal: SignalDirection;
  className?: string;
}) {
  const label = signal.charAt(0).toUpperCase() + signal.slice(1);
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[signal],
        className,
      )}
    >
      {label}
    </Badge>
  );
}
