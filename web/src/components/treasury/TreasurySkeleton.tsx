import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function BalanceCardSkeleton() {
  return (
    <section
      className={cn(
        overviewCardShell,
        "relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl sm:rounded-3xl",
      )}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(520px 220px at 8% -10%, hsl(var(--primary) / 0.1), transparent 55%), radial-gradient(420px 180px at 100% 110%, hsl(var(--muted-foreground) / 0.06), transparent 50%)",
        }}
      />
      <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-6 p-5 sm:gap-8 sm:p-7 lg:p-8">
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-11 w-44 rounded-xl sm:h-14 sm:w-56" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="hidden h-3 w-14 sm:block" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full sm:h-3" />
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpendCardSkeleton({
  className,
  labelled = false,
}: {
  className?: string;
  labelled?: boolean;
}) {
  return (
    <section
      className={cn("flex h-full min-h-0 flex-col", className)}
      aria-busy={labelled || undefined}
      aria-label={labelled ? "Loading spend" : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <div
        className={cn(
          overviewCardShell,
          "relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl sm:rounded-3xl",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(360px 160px at 100% 0%, hsl(var(--primary) / 0.08), transparent 55%), radial-gradient(280px 140px at 0% 100%, hsl(160 55% 42% / 0.08), transparent 50%)",
          }}
        />
        <div className="relative z-[1] flex h-full min-h-0 flex-1 flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:p-7">
          <div className="shrink-0 space-y-2">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-8 w-28 rounded-lg sm:h-9" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex min-h-[4.5rem] flex-1 items-end gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-md"
                style={{ height: `${35 + ((i * 13) % 45)}%` }}
              />
            ))}
          </div>
          <div className="shrink-0 space-y-2 border-t border-border/40 pt-3 sm:pt-4">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

function WalletCardSkeleton() {
  return (
    <div className={cn(overviewCardShell, "rounded-2xl p-3.5 sm:p-5")}>
      <div className="flex items-center gap-3.5 sm:block">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl sm:mb-5 sm:h-9 sm:w-9" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-5 w-24 sm:h-6" />
          <Skeleton className="mt-3 hidden h-1 w-full rounded-full sm:block" />
        </div>
      </div>
    </div>
  );
}

/** Full treasury panel skeleton — balance, spend, and wallets. */
export function TreasuryPanelSkeleton() {
  return (
    <div
      className="w-full space-y-5 sm:space-y-6 lg:space-y-8"
      aria-busy="true"
      aria-label="Loading treasury"
    >
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-stretch">
        <BalanceCardSkeleton />
        <SpendCardSkeleton />
      </div>

      <section className="space-y-3 sm:space-y-4" aria-hidden>
        <Skeleton className="h-4 w-16" />
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <WalletCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

/** Compact spend card skeleton (billing dashboard). */
export function TreasurySpendSkeleton({ className }: { className?: string }) {
  return <SpendCardSkeleton className={className} labelled />;
}
