import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface ExperimentBeginnerBannerProps {
  title: string;
  description: string;
  accentIconClass?: string;
  className?: string;
}

export function ExperimentBeginnerBanner({
  title,
  description,
  accentIconClass = "text-violet-500",
  className,
}: ExperimentBeginnerBannerProps) {
  return (
    <div
      className={cn(
        overviewCardShell,
        "flex gap-4 rounded-2xl border-dashed p-4 sm:p-5",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60",
          accentIconClass,
        )}
      >
        <Info className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
