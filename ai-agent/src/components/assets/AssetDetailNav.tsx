import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AssetDetailNavProps {
  symbol?: string;
  name?: string;
  className?: string;
}

export function AssetDetailNav({ symbol, name, className }: AssetDetailNavProps) {
  const crumb = symbol?.toUpperCase() || name || "Asset";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 -mx-1 mb-4 border-b border-border/40 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      <div className="flex h-12 items-center gap-1 sm:h-14">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          asChild
        >
          <Link to="/assets" aria-label="Back to assets">
            <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </Link>
        </Button>

        <nav
          className="flex min-w-0 flex-1 items-center gap-1.5 text-sm leading-none"
          aria-label="Breadcrumb"
        >
          <Link
            to="/assets"
            className="shrink-0 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Assets
          </Link>
          <span className="select-none text-muted-foreground/40" aria-hidden>
            /
          </span>
          <span className="truncate font-semibold tracking-tight text-foreground">{crumb}</span>
        </nav>
      </div>
    </header>
  );
}
