import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  /** When false, only the symbol (for compact mobile). */
  showWordmark?: boolean;
  /** Shorter lockup: hides the “Tech utility program” subline (e.g. navbar). */
  compact?: boolean;
};

/**
 * Up Only Fund — primary mark. Distinct from Syra; infrastructure partner is called out elsewhere.
 */
export function BrandMark({ className, showWordmark = true, compact = false }: BrandMarkProps) {
  return (
    <Link
      to="/"
      className={cn(
        "group flex min-w-0 max-w-full items-center gap-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-uof/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg sm:gap-3",
        className,
      )}
      aria-label="Up Only Fund home"
    >
      <motion.div
        className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-black shadow-[0_1px_0_0_hsl(0_0%_100%_/_0.06)_inset,0_8px_32px_-8px_hsl(0_0%_0%_/_0.5),0_0_0_1px_hsl(var(--uof)/0.2)] sm:h-10 sm:w-10"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <img
          src="/images/experiment/rise_uponly.png"
          alt=""
          className="h-full w-full object-contain p-0.5"
          aria-hidden
          width={40}
          height={40}
          decoding="async"
        />
      </motion.div>
      {showWordmark ? (
        <div className="min-w-0 truncate text-left">
          <div className="text-[0.875rem] font-semibold leading-tight tracking-[-0.02em] min-[400px]:text-[0.95rem] sm:text-base">
            <span className="uof-wordmark">Up Only</span>
            <span className="text-muted-foreground/90"> Fund</span>
          </div>
          {!compact ? (
            <p className="mt-0.5 hidden text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/80 sm:block">
              Tech utility program
            </p>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
