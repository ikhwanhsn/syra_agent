import { Link } from "react-router-dom";
import { Settings2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export function LpExperimentModeBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        overviewCardShell,
        "flex flex-col gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Simple view</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            We hide advanced tables and jargon. Switch to Pro in settings for full lab controls.
          </p>
        </div>
      </div>
      <Link
        to="/dashboard/settings"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border/55 bg-background/60 px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
      >
        <Settings2 className="h-3.5 w-3.5" aria-hidden />
        Open settings
      </Link>
    </div>
  );
}
