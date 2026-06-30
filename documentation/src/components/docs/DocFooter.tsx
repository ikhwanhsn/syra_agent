import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getAdjacentPages } from "@/data/docsNav";
import { cn } from "@/lib/utils";

interface DocFooterProps {
  className?: string;
}

export function DocFooter({ className }: DocFooterProps) {
  const { pathname } = useLocation();
  const { prev, next } = getAdjacentPages(pathname);

  if (!prev && !next) return null;

  return (
    <nav
      className={cn(
        "mt-12 pt-8 border-t border-border/60 grid gap-4 sm:grid-cols-2",
        className
      )}
      aria-label="Documentation pagination"
    >
      {prev ? (
        <Link
          to={prev.href}
          className="group flex flex-col gap-1 rounded-lg border border-border/60 p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous
          </span>
          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={next.href}
          className="group flex flex-col gap-1 rounded-lg border border-border/60 p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors sm:text-right sm:items-end"
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
            {next.title}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
