"use client";

import { ArrowUpRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { QWERTI_MAGIC_LINK } from "@/data/qwerti";
import { cn } from "@/lib/utils";

const syraBuyVariants = cva("", {
  variants: {
    variant: {
      default: cn(
        "group relative inline-flex h-8 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-lg px-3.5 no-underline outline-none",
        "border border-[hsl(var(--glass-border)/0.85)] text-xs font-semibold text-foreground",
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
      nav: "",
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
});

type SyraBuyButtonProps = VariantProps<typeof syraBuyVariants> & {
  className?: string;
  label?: string;
  /** @deprecated Nav variant uses built-in layout. */
  showIcon?: boolean;
};

function SyraNavBuyLink({ className }: { className?: string }) {
  return (
    <a
      href={QWERTI_MAGIC_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("syra-nav-buy-cta", className)}
      aria-label="Buy $SYRA on Qwerti"
    >
      <span className="syra-nav-buy-bloom" aria-hidden />
      <span className="syra-nav-buy-shine" aria-hidden />

      <span className="syra-nav-buy-logo-ring">
        <img
          src="/logo.jpg"
          alt=""
          width={18}
          height={18}
          draggable={false}
          className="syra-nav-buy-logo"
        />
      </span>

      <span className="relative flex min-w-0 items-center gap-1.5">
        <span className="syra-nav-buy-label hidden sm:inline">Buy</span>
        <span className="syra-nav-buy-ticker">$SYRA</span>
        <span className="syra-nav-buy-live" aria-hidden>
          <span className="syra-nav-buy-live-dot" />
          Live
        </span>
      </span>

      <ArrowUpRight className="syra-nav-buy-arrow" aria-hidden />
    </a>
  );
}

export function SyraBuyButton({
  className,
  variant = "default",
  fullWidth,
  label = "Buy $SYRA",
}: SyraBuyButtonProps) {
  if (variant === "nav") {
    return (
      <span
        className={cn(
          "syra-nav-buy-shell group/shell",
          fullWidth && "flex w-full",
          !fullWidth && "inline-flex",
          className,
        )}
      >
        <SyraNavBuyLink className={cn(fullWidth && "w-full justify-center")} />
      </span>
    );
  }

  return (
    <a
      href={QWERTI_MAGIC_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(syraBuyVariants({ variant, fullWidth }), className)}
    >
      <span>{label}</span>
    </a>
  );
}
