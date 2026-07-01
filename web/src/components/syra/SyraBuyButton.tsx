"use client";

import { ArrowUpRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { Link } from "@/lib/navigation";
import { SYRA_BUY_SWAP_URL } from "@/lib/swapNavigation";
import { cn } from "@/lib/utils";

const syraBuyVariants = cva(
  cn(
    "group relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden no-underline outline-none",
    "border font-semibold text-foreground",
    "bg-[hsl(var(--glass-bg)/0.65)] backdrop-blur-[16px] backdrop-saturate-[160%]",
    "shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.45),var(--glass-shadow)]",
    "transition-[transform,box-shadow,border-color,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "hover:border-[hsl(var(--foreground)/0.12)] hover:bg-[hsl(var(--glass-bg)/0.78)]",
    "dark:border-[hsl(0_0%_100%/0.1)] dark:bg-[hsl(var(--glass-bg)/0.42)]",
    "dark:shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.08),var(--glass-shadow)]",
    "dark:hover:border-[hsl(0_0%_100%/0.14)] dark:hover:bg-[hsl(var(--glass-bg)/0.52)]",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:scale-[0.98]",
  ),
  {
    variants: {
      variant: {
        default: cn(
          "h-8 rounded-lg border-[hsl(var(--glass-border)/0.85)] px-3.5 text-xs",
        ),
        nav: cn(
          "h-9 rounded-xl border-[hsl(var(--glass-border)/0.85)] px-2.5 text-sm sm:px-3",
        ),
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      fullWidth: false,
    },
  },
);

type SyraBuyButtonProps = VariantProps<typeof syraBuyVariants> & {
  className?: string;
  label?: string;
  /** @deprecated Nav variant uses built-in layout. */
  showIcon?: boolean;
};

export function SyraBuyButton({
  className,
  variant = "default",
  fullWidth,
  label = "Buy $SYRA",
}: SyraBuyButtonProps) {
  const showLogo = variant === "nav";

  return (
    <Link
      to={SYRA_BUY_SWAP_URL}
      className={cn(syraBuyVariants({ variant, fullWidth }), className)}
      aria-label="Swap SOL for $SYRA"
    >
      {showLogo ? (
        <img
          src="/logo.jpg"
          alt=""
          width={24}
          height={24}
          draggable={false}
          className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-inset ring-foreground/10"
        />
      ) : null}

      <span className="min-w-0 truncate">
        {variant === "nav" ? (
          <>
            <span className="hidden font-medium text-muted-foreground sm:inline">
              Buy{" "}
            </span>
            <span>$SYRA</span>
          </>
        ) : (
          label
        )}
      </span>

      {variant === "nav" ? (
        <ArrowUpRight
          className="hidden h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-[opacity,transform] group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100 sm:block"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}
