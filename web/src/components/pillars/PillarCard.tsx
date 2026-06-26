import { Link } from "@/lib/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Lock } from "lucide-react";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { cn } from "@/lib/utils";
import type { PillarId } from "@/lib/pillarsApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

type PillarCardProps = {
  id: PillarId;
  label: string;
  description: string;
  href: string;
  icon?: LucideIcon;
  accent?: {
    accent: string;
    iconRing: string;
    borderHover: string;
  };
  step?: number;
  comingSoon?: boolean;
  balance?: { usdc: number | null; sol: number | null };
  balanceLoading?: boolean;
  className?: string;
};

function formatUsdc(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PillarCard({
  label,
  description,
  href,
  icon: Icon,
  accent,
  step,
  comingSoon = false,
  balance,
  balanceLoading,
  className,
}: PillarCardProps) {
  const content = (
  <>
      <div className="relative flex items-start gap-4">
        {Icon ? (
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
              accent?.iconRing ?? "border-border/60 bg-muted/30",
            )}
          >
            <Icon className={cn("h-5 w-5", accent?.accent ?? "text-foreground/80")} aria-hidden />
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {step != null ? (
              <span
                className={cn(
                  "text-[10px] font-bold tabular-nums",
                  accent?.accent ?? "text-muted-foreground",
                )}
              >
                {String(step).padStart(2, "0")}
              </span>
            ) : null}
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{label}</h3>
            {comingSoon ? (
              <span className="rounded-md border border-border/50 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Soon
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>

          {balanceLoading ? (
            <div className="mt-3 h-6 w-24 animate-pulse rounded-md bg-muted/50" />
          ) : balance && (balance.usdc != null || balance.sol != null) ? (
            <p className="mt-3 font-mono text-lg font-semibold tabular-nums tracking-tight text-foreground">
              {balance.usdc != null ? (
                <AnimatedMetric value={balance.usdc} format={(n) => `$${formatUsdc(n)}`} />
              ) : (
                "—"
              )}
            </p>
          ) : null}
        </div>

        <span
          className={cn(
            "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background/50 text-muted-foreground transition-all",
            !comingSoon && "group-hover:border-border/70 group-hover:text-foreground",
          )}
        >
          {comingSoon ? (
            <Lock className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          )}
        </span>
      </div>
    </>
  );

  if (comingSoon) {
    return (
      <div
        className={cn(
          overviewCardShell,
          "flex h-full flex-col p-5 opacity-80",
          className,
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={href}
      className={cn(
        overviewCardShell,
        "group flex h-full flex-col p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        accent?.borderHover,
        className,
      )}
    >
      {content}
    </Link>
  );
}
