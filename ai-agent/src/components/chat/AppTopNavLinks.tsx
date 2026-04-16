import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bot, Check, ChevronDown, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const linkBase =
  "rounded-lg px-2.5 py-1.5 text-[13px] font-medium tracking-tight transition-colors duration-200 sm:px-3";

const sections = [
  { id: "agent" as const, label: "Agent", to: "/", icon: Bot },
  { id: "dashboard" as const, label: "Dashboard", to: "/dashboard/overview", icon: LayoutDashboard },
] as const;

function sectionActive(pathname: string, id: (typeof sections)[number]["id"]): boolean {
  if (id === "dashboard") return pathname.startsWith("/dashboard");
  return !pathname.startsWith("/dashboard");
}

/**
 * Primary app sections in the top bar (Agent chat vs Dashboard). Extend here when adding routes.
 */
export function AppTopNavLinks() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDashboard = pathname.startsWith("/dashboard");
  const isAgent = !isDashboard;
  const currentLabel = isDashboard ? "Dashboard" : "Agent";

  return (
    <>
      {/* Mobile: compact section picker */}
      <div className="min-w-0 md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              aria-label="Main sections, open menu"
              className={cn(
                "h-auto min-h-[44px] max-w-full touch-manipulation gap-1.5 rounded-full bg-muted/60 px-3.5 py-2 text-[13px] font-semibold tracking-tight text-foreground ring-1 ring-inset ring-border/60",
                "hover:bg-muted/75 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-0",
              )}
            >
              <span className="min-w-0 truncate">{currentLabel}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="w-[min(17rem,calc(100vw-2rem))] rounded-xl border-border/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-popover/90"
          >
            <DropdownMenuLabel className="px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
              Workspace
            </DropdownMenuLabel>
            {sections.map(({ id, label, to, icon: Icon }) => {
              const active = sectionActive(pathname, id);
              return (
                <DropdownMenuItem
                  key={id}
                  className={cn(
                    "min-h-[44px] cursor-pointer gap-2 rounded-lg px-2.5 py-2.5 text-[13px] font-medium",
                    active && "bg-muted/55 text-foreground focus:bg-muted/55",
                  )}
                  onSelect={() => {
                    navigate(to);
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  <span className="flex-1">{label}</span>
                  {active ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tablet/desktop: inline links */}
      <nav className="hidden min-w-0 items-center gap-0.5 sm:gap-1 md:flex" aria-label="Main sections">
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
    </>
  );
}
