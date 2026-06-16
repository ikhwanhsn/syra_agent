import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  showWordmark?: boolean;
  compact?: boolean;
  hardRefreshHome?: boolean;
};

function onHardHomeClick(e: MouseEvent<HTMLAnchorElement>) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  const path = window.location.pathname;
  const atHome = path === "/" || path === "";
  if (atHome && !window.location.hash) {
    window.location.reload();
  } else {
    window.location.assign("/");
  }
}

/** S3 Labs — geometric mark with teal gradient lockup. */
export function BrandMark({
  className,
  showWordmark = true,
  compact = false,
  hardRefreshHome = false,
}: BrandMarkProps) {
  const markClasses = cn(
    "group flex min-w-0 max-w-full items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg",
    className,
  );

  const inner = (
    <>
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/25 bg-black/80 sm:h-10 sm:w-10">
        <img
          src="/images/logo.png"
          alt=""
          className="h-full w-full object-contain p-1"
          aria-hidden
          width={40}
          height={40}
          decoding="async"
        />
      </div>
      {showWordmark ? (
        <div className="min-w-0 truncate text-left">
          <div className="text-[0.875rem] font-bold leading-tight tracking-[-0.03em] min-[400px]:text-[0.95rem] sm:text-base">
            <span className="text-gradient">S3</span>
            <span className="text-foreground"> Labs</span>
          </div>
          {!compact ? (
            <p className="mt-0.5 hidden text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80 sm:block">
              Results Over Hype
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );

  if (hardRefreshHome) {
    return (
      <a href="/" className={markClasses} aria-label="S3 Labs home" onClick={onHardHomeClick}>
        {inner}
      </a>
    );
  }

  return (
    <Link to="/" className={markClasses} aria-label="S3 Labs home">
      {inner}
    </Link>
  );
}
