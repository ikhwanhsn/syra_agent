import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { SectionHeader } from "@/components/btc2-experiment/shared/SectionHeader";

export function PanelShell({
  kicker,
  title,
  description,
  children,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <SectionHeader kicker={kicker} title={title} description={description} />
      <div className={cn(overviewCardShell, "relative rounded-2xl p-5 sm:p-6")}>
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: overviewAccentBackground("internal") }}
          aria-hidden
        />
        <div className="relative">{children}</div>
      </div>
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{message}</p>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl" />
      ))}
    </div>
  );
}

export { overviewKickerClass };
