import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
 * LOADER STORYBOARD (page variant)
 *
 *    0ms   container fades in
 *  100ms   rings scale + fade in
 *  150ms   logo orb springs into place
 *  350ms   label slides up
 *  500ms   dots begin stagger pulse
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  container: 0,
  rings: 0.1,
  logo: 0.15,
  text: 0.35,
  dots: 0.5,
} as const;

const SPRING_SOFT = { type: "spring" as const, stiffness: 260, damping: 26 };
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export type PageLoaderVariant = "page" | "studio" | "section" | "inline";

export interface PageLoaderProps {
  /** Primary status line */
  label?: string;
  /** Secondary hint below the label */
  sublabel?: string;
  variant?: PageLoaderVariant;
  className?: string;
}

function LoadingDots({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div
      className="flex items-center justify-center gap-1.5"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-primary/70",
            !reduceMotion && "s3-loader-dot",
          )}
          style={!reduceMotion ? { animationDelay: `${i * 0.18}s` } : undefined}
        />
      ))}
    </div>
  );
}

function LoaderMark({
  size,
  reduceMotion,
}: {
  size: "sm" | "md" | "lg";
  reduceMotion: boolean;
}) {
  const dims = size === "lg" ? "h-32 w-32 sm:h-36 sm:w-36" : size === "md" ? "h-24 w-24" : "h-14 w-14";
  const logo =
    size === "lg"
      ? "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]"
      : size === "md"
        ? "h-12 w-12"
        : "h-8 w-8";
  const ringOuter = size === "sm" ? "inset-0" : "inset-0";
  const ringMid = size === "lg" ? "inset-[14%]" : size === "md" ? "inset-[12%]" : "inset-[10%]";

  return (
    <div className={cn("relative flex items-center justify-center", dims)}>
      <div
        className={cn(
          "absolute rounded-full border border-primary/20",
          ringOuter,
          !reduceMotion && "s3-loader-glow",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "absolute rounded-full border-2 border-dashed border-primary/25",
          ringOuter,
          !reduceMotion && "s3-loader-ring",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "absolute rounded-full border border-primary/15",
          ringMid,
          !reduceMotion && "s3-loader-ring-reverse",
        )}
        aria-hidden
      />
      <motion.div
        className={cn(
          "relative z-10 flex items-center justify-center rounded-2xl border border-primary/25 bg-card shadow-elevated overflow-hidden",
          logo,
          !reduceMotion && "s3-loader-orb",
        )}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { ...SPRING_SOFT, delay: TIMING.logo }
        }
      >
        <img
          src="/images/logo.png"
          alt=""
          className="h-full w-full object-contain p-1.5"
          width={72}
          height={72}
          decoding="async"
          aria-hidden
        />
      </motion.div>
    </div>
  );
}

export function PageLoader({
  label = "Loading",
  sublabel,
  variant = "page",
  className,
}: PageLoaderProps) {
  const reduceMotion = useReducedMotion() ?? false;

  const isFullPage = variant === "page" || variant === "studio";
  const markSize = variant === "inline" ? "sm" : variant === "section" ? "md" : "lg";

  const content = (
    <>
      <LoaderMark size={markSize} reduceMotion={reduceMotion} />
      <motion.div
        className={cn(
          "flex flex-col items-center text-center",
          variant === "inline" ? "items-start text-left" : "gap-1",
        )}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.45, delay: TIMING.text, ease: EASE_OUT }
        }
      >
        <p
          className={cn(
            "font-medium text-foreground",
            variant === "inline"
              ? "text-sm"
              : "text-sm sm:text-[0.9375rem] tracking-tight",
          )}
        >
          {label}
        </p>
        {sublabel ? (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        ) : null}
      </motion.div>
      {variant !== "inline" ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.35, delay: TIMING.dots }
          }
        >
          <LoadingDots reduceMotion={reduceMotion} />
        </motion.div>
      ) : null}
    </>
  );

  if (variant === "inline") {
    return (
      <div
        className={cn("inline-flex items-center gap-3", className)}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoaderMark size="sm" reduceMotion={reduceMotion} />
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.3 }}
        >
          <p className="text-sm text-muted-foreground">{label}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center gap-6 px-4",
        isFullPage && "min-h-[100dvh] w-full",
        variant === "section" && "py-20",
        variant === "page" && "bg-background bg-gradient-mesh",
        variant === "studio" && "post-hub-s3 relative min-h-[100dvh] w-full overflow-hidden",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.35, ease: EASE_OUT }
      }
    >
      {variant === "studio" ? (
        <>
          <div className="post-hub-s3-ribbons pointer-events-none absolute inset-0 opacity-40" aria-hidden>
            <div className="post-hub-s3-ribbon post-hub-s3-ribbon--a" />
            <div className="post-hub-s3-ribbon post-hub-s3-ribbon--b" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-6">{content}</div>
        </>
      ) : (
        content
      )}
    </motion.div>
  );
}

/** Suspense / route-chunk fallback for lazy-loaded pages. */
export function RoutePageLoader() {
  return <PageLoader label="Loading page" sublabel="Just a moment" variant="page" />;
}

/** Post studio routes — dark ribbon backdrop. */
export function StudioPageLoader({ label = "Loading studio" }: { label?: string }) {
  return <PageLoader label={label} sublabel="Preparing workspace" variant="studio" />;
}
