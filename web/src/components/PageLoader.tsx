import { cn } from "@/lib/utils";

export type PageLoaderVariant = "page" | "section" | "compact";

export interface PageLoaderProps {
  /** Primary status line */
  label?: string;
  /** Secondary hint below the label */
  sublabel?: string;
  variant?: PageLoaderVariant;
  className?: string;
}

/**
 * Exact Syra boot loader: logo orb + dual spinning rings + glow + bouncing dots.
 * Markup/timing match the original Index.tsx ready-gate loader.
 */
export function PageLoader({
  label = "Loading",
  sublabel,
  variant = "page",
  className,
}: PageLoaderProps) {
  const isCompact = variant === "compact";
  const isSection = variant === "section";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center overflow-hidden bg-background px-4",
        variant === "page" && "min-h-dvh w-full",
        isSection && "min-h-[min(28rem,60dvh)] w-full py-16",
        isCompact && "min-h-[40vh] w-full py-10",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {/* Animated rings — same structure as original Index boot loader */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          isCompact ? "h-20 w-20" : isSection ? "h-28 w-28 sm:h-32 sm:w-32" : "h-32 w-32 sm:h-40 sm:w-40",
        )}
      >
        <div className="absolute inset-0 rounded-full border-2 border-primary/25 loader-app-glow" aria-hidden />
        <div
          className="absolute h-full w-full rounded-full border-2 border-dashed border-primary/30 loader-app-ring"
          aria-hidden
        />
        <div
          className="absolute h-[70%] w-[70%] rounded-full border border-primary/20 loader-app-ring-slow"
          aria-hidden
        />
        {/* Center orb with logo */}
        <div
          className={cn(
            "relative z-10 flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-card shadow-xl loader-app-orb",
            isCompact
              ? "h-10 w-10 rounded-xl"
              : isSection
                ? "h-14 w-14 sm:h-16 sm:w-16"
                : "h-16 w-16 sm:h-20 sm:w-20",
          )}
        >
          <img
            src="/logo.jpg"
            alt="Syra"
            className="h-full w-full object-cover"
            width={80}
            height={80}
            decoding="async"
          />
        </div>
      </div>

      <p
        className={cn(
          "text-sm font-medium text-foreground loader-text-fade",
          isCompact ? "mt-5" : "mt-8",
        )}
      >
        {label}
      </p>
      {sublabel ? <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p> : null}
      <div
        className={cn(
          "flex items-center gap-1.5 text-muted-foreground",
          isCompact ? "mt-4" : "mt-6",
        )}
        aria-hidden
      >
        <span className="loader-dot" />
        <span className="loader-dot" />
        <span className="loader-dot" />
      </div>
    </div>
  );
}

/** Suspense fallback for lazy route chunks — same orb/rings effect as boot loader. */
export function RoutePageLoader() {
  return (
    <PageLoader
      label="Loading"
      sublabel="Just a moment"
      variant="section"
      className="min-h-[min(28rem,60dvh)]"
    />
  );
}
