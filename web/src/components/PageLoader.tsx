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

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground" aria-hidden>
      <span className="loader-dot" />
      <span className="loader-dot" />
      <span className="loader-dot" />
    </div>
  );
}

function LoaderMark({ size }: { size: "sm" | "md" | "lg" }) {
  const wrap =
    size === "lg"
      ? "h-32 w-32 sm:h-40 sm:w-40"
      : size === "md"
        ? "h-24 w-24"
        : "h-16 w-16";
  const orb =
    size === "lg"
      ? "h-16 w-16 sm:h-20 sm:w-20 rounded-2xl"
      : size === "md"
        ? "h-12 w-12 rounded-xl"
        : "h-10 w-10 rounded-xl";

  return (
    <div className={cn("relative flex items-center justify-center", wrap)}>
      <div className="absolute inset-0 rounded-full border-2 border-accent/30 loader-app-glow" aria-hidden />
      <div
        className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 loader-app-ring"
        aria-hidden
      />
      <div
        className="absolute inset-[15%] rounded-full border border-primary/20 loader-app-ring-slow"
        aria-hidden
      />
      <div
        className={cn(
          "relative z-10 flex items-center justify-center overflow-hidden border border-border bg-card shadow-xl loader-app-orb",
          orb,
        )}
      >
        <img src="/logo.jpg" alt="" className="h-full w-full object-cover" width={80} height={80} decoding="async" />
      </div>
    </div>
  );
}

export function PageLoader({
  label = "Loading",
  sublabel,
  variant = "page",
  className,
}: PageLoaderProps) {
  const markSize = variant === "compact" ? "sm" : variant === "section" ? "md" : "lg";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 overflow-hidden bg-background px-4",
        variant === "page" && "min-h-dvh w-full",
        variant === "section" && "min-h-[min(28rem,60dvh)] w-full py-16",
        variant === "compact" && "min-h-[40vh] w-full py-10",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <LoaderMark size={markSize} />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium text-foreground loader-text-fade">{label}</p>
        {sublabel ? <p className="text-xs text-muted-foreground">{sublabel}</p> : null}
      </div>
      <LoadingDots />
    </div>
  );
}

/** Suspense fallback for lazy route chunks. */
export function RoutePageLoader() {
  return <PageLoader label="Loading" sublabel="Just a moment" variant="section" />;
}
