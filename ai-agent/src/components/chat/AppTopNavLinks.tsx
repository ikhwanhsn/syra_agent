import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const linkBase =
  "rounded-lg px-2.5 py-1.5 text-[13px] font-medium tracking-tight transition-colors duration-200 sm:px-3";

/**
 * Primary app sections in the top bar (Agent chat vs Dashboard). Extend here when adding routes.
 */
export function AppTopNavLinks() {
  const { pathname } = useLocation();
  const isDashboard = pathname.startsWith("/dashboard");
  const isAgent = !isDashboard;

  return (
    <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1" aria-label="Main sections">
      <Link
        to="/"
        className={cn(
          linkBase,
          "no-underline",
          isAgent
            ? "bg-muted/60 text-foreground shadow-sm ring-1 ring-border/60"
            : "text-muted-foreground hover:bg-muted/35 hover:text-foreground",
        )}
      >
        Agent
      </Link>
      <Link
        to="/dashboard/overview"
        className={cn(
          linkBase,
          "no-underline",
          isDashboard
            ? "bg-muted/60 text-foreground shadow-sm ring-1 ring-border/60"
            : "text-muted-foreground hover:bg-muted/35 hover:text-foreground",
        )}
      >
        Dashboard
      </Link>
    </nav>
  );
}
