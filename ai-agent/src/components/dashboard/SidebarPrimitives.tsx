import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Bot,
  ChevronRight,
  FileText,
  FlaskConical,
  LayoutDashboard,
  PanelLeftClose,
  Telescope,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { DrawerDismissButton } from "@/components/ui/drawer-dismiss-button";
import { cn } from "@/lib/utils";

const EXPERIMENTS_STORAGE_KEY = "syra.dashboard.experimentsOpen";

const SIDEBAR_SHELL =
  "relative flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground";

function SidebarAmbientGlow() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_-20%,hsl(var(--primary)/0.07),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-sidebar-border/90 to-transparent"
        aria-hidden
      />
    </>
  );
}

function SidebarDivider({ className }: { className?: string }) {
  return <div className={cn("mx-3 h-px bg-gradient-to-r from-transparent via-border/55 to-transparent", className)} />;
}

export function SidebarSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-3 pb-1 pt-6 first:pt-1">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/45">
        {children}
      </span>
      <span className="h-px min-w-0 flex-1 bg-gradient-to-r from-border/40 to-transparent" aria-hidden />
    </div>
  );
}

type ActiveMatcher = (pathname: string, search: string) => boolean;

function navItemClasses(isActive: boolean, compact?: boolean) {
  return cn(
    "group relative flex items-center rounded-xl transition-[background,box-shadow,color,transform] duration-200 ease-out",
    compact ? "h-10 w-10 justify-center" : "gap-3 px-2.5 py-2",
    isActive
      ? "bg-gradient-to-r from-primary/[0.14] via-primary/[0.08] to-transparent text-foreground shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.12),0_1px_2px_hsl(0_0%_0%/0.04)] ring-1 ring-primary/15"
      : "text-muted-foreground hover:bg-muted/45 hover:text-foreground active:scale-[0.98]",
  );
}

function navIconClasses(isActive: boolean, compact?: boolean) {
  return cn(
    "flex shrink-0 items-center justify-center rounded-[10px] transition-all duration-200",
    compact ? "h-9 w-9" : "h-8 w-8",
    isActive
      ? "bg-primary/15 text-primary shadow-[0_0_20px_-6px_hsl(var(--primary)/0.55)] ring-1 ring-primary/25"
      : "bg-muted/25 text-muted-foreground group-hover:bg-muted/50 group-hover:text-foreground",
  );
}

function ActiveIndicator({ compact }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "absolute top-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_14px_2px_hsl(var(--primary)/0.35)]",
        compact ? "left-0 h-4 w-[2px]" : "left-0 h-6 w-[3px]",
      )}
      aria-hidden
    />
  );
}

export function SidebarIconNavLink({
  to,
  icon: Icon,
  label,
  end,
  matchActive,
}: {
  to: string;
  icon: ComponentType<LucideProps>;
  label: string;
  end?: boolean;
  matchActive?: ActiveMatcher;
}) {
  const { pathname, search } = useLocation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          end={end}
          className="flex outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar rounded-xl"
        >
          {({ isActive: routerActive }) => {
            const isActive = matchActive ? matchActive(pathname, search) : routerActive;
            return (
              <span className={navItemClasses(isActive, true)}>
                {isActive ? <ActiveIndicator compact /> : null}
                <span className={navIconClasses(isActive, true)}>
                  <Icon className="h-[17px] w-[17px]" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
                </span>
                <span className="sr-only">{label}</span>
              </span>
            );
          }}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={12}
        className="border-border/60 bg-popover/95 px-2.5 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function SidebarIconRail({
  experimentItems,
  showInternalTeamMonitor,
  matchAlphaIntel,
}: {
  experimentItems: readonly SidebarExperimentItem[];
  showInternalTeamMonitor: boolean;
  matchAlphaIntel: ActiveMatcher;
}) {
  const { pathname, search } = useLocation();
  const experimentsActive = experimentItems.some((item) => item.isActive(pathname, search));

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(SIDEBAR_SHELL, "items-center supports-[backdrop-filter]:bg-sidebar/98")}>
        <SidebarAmbientGlow />

        <div className="relative z-10 flex w-full shrink-0 flex-col items-center border-b border-sidebar-border/60 px-2 py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/dashboard/overview"
                className="group/logo relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-border/60 bg-gradient-to-br from-card via-card/90 to-muted/40 shadow-md ring-1 ring-white/[0.06] transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-lg hover:ring-primary/20"
              >
                <img
                  src="/logo.jpg"
                  alt="Syra"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover/logo:scale-105"
                  draggable={false}
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="text-xs font-medium">
              Syra Dashboard
            </TooltipContent>
          </Tooltip>
        </div>

        <nav className="relative z-10 flex min-h-0 flex-1 flex-col items-center gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-3 scrollbar-thin">
          <SidebarIconNavLink to="/dashboard/overview" icon={LayoutDashboard} label="Overview" end />
          <SidebarDivider className="my-2 w-8" />
          <SidebarIconNavLink to="/dashboard/marketplace/prompts" icon={FileText} label="Prompts" />
          <SidebarIconNavLink to="/dashboard/marketplace/agents" icon={Bot} label="Agents" />
          <SidebarDivider className="my-2 w-8" />
          <SidebarIconNavLink to="/dashboard/alpha" icon={Telescope} label="Alpha" end matchActive={matchAlphaIntel} />
          <SidebarDivider className="my-2 w-8" />
          <div
            className={cn(
              "mb-1 flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
              experimentsActive ? "bg-primary/10 text-primary" : "text-muted-foreground/40",
            )}
            aria-hidden
          >
            <FlaskConical className="h-3.5 w-3.5" strokeWidth={2} />
          </div>
          {experimentItems.map((item) => (
            <SidebarIconNavLink
              key={item.id}
              to={item.to}
              icon={item.icon}
              label={item.label}
              matchActive={item.isActive}
            />
          ))}
          {showInternalTeamMonitor ? (
            <>
              <SidebarDivider className="my-2 w-8" />
              <SidebarIconNavLink to="/dashboard/internal-team-agents" icon={UsersRound} label="Internal agents" />
            </>
          ) : null}
        </nav>
      </div>
    </TooltipProvider>
  );
}

export function SidebarNavLink({
  to,
  icon: Icon,
  children,
  end,
  matchActive,
}: {
  to: string;
  icon: ComponentType<LucideProps>;
  children: ReactNode;
  end?: boolean;
  matchActive?: ActiveMatcher;
}) {
  const { pathname, search } = useLocation();

  return (
    <NavLink
      to={to}
      end={end}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
    >
      {({ isActive: routerActive }) => {
        const isActive = matchActive ? matchActive(pathname, search) : routerActive;
        return (
          <span className={navItemClasses(isActive)}>
            {isActive ? <ActiveIndicator /> : null}
            <span className={navIconClasses(isActive)}>
              <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-tight">{children}</span>
          </span>
        );
      }}
    </NavLink>
  );
}

export type SidebarExperimentItem = {
  id: string;
  label: string;
  description?: string;
  icon: ComponentType<LucideProps>;
  to: string;
  isActive: ActiveMatcher;
};

export function SidebarExperimentsNav({ items }: { items: readonly SidebarExperimentItem[] }) {
  const { pathname, search } = useLocation();
  const childActive = items.some((item) => item.isActive(pathname, search));

  const [open, setOpen] = useState(() => {
    if (childActive) return true;
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(EXPERIMENTS_STORAGE_KEY) === "1";
  });

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(EXPERIMENTS_STORAGE_KEY, next ? "1" : "0");
    }
  };

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange} className="px-1">
      <CollapsibleTrigger
        type="button"
        className={cn(
          "group/trigger flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left outline-none transition-all duration-200",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          childActive
            ? "bg-gradient-to-r from-primary/[0.12] via-primary/[0.06] to-transparent text-foreground ring-1 ring-primary/12"
            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
        )}
        aria-expanded={open}
      >
        <span className={navIconClasses(childActive)}>
          <FlaskConical className="h-4 w-4" strokeWidth={childActive ? 2.25 : 2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[13px] font-semibold tracking-tight">Experiment</span>
          <span className="mt-0.5 block truncate text-[10px] font-medium text-muted-foreground/70">
            {open ? `${items.length} trading desks` : "Expand desks"}
          </span>
        </span>
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200 ease-out",
            open && "rotate-90",
            childActive && "text-primary/80",
          )}
          aria-hidden
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="relative mt-2 overflow-hidden rounded-2xl border border-border/35 bg-gradient-to-b from-muted/30 to-muted/10 p-1 shadow-inner">
          <div
            className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent"
            aria-hidden
          />
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.isActive(pathname, search);
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                <span
                  className={cn(
                    "group/item relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all duration-200",
                    active
                      ? "bg-background/90 text-foreground shadow-sm ring-1 ring-primary/15"
                      : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      active
                        ? "bg-primary/12 text-primary"
                        : "bg-muted/30 text-muted-foreground group-hover/item:bg-muted/50 group-hover/item:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={active ? 2.25 : 2} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold leading-tight tracking-tight">
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="mt-0.5 block truncate text-[10px] leading-snug text-muted-foreground/65">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </span>
              </NavLink>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export type SidebarConnectLink = {
  href: string;
  icon: LucideIcon;
  ariaLabel: string;
  title?: string;
  openInNewTab?: boolean;
};

export function SidebarBrandHeader({
  currentSection,
  onCollapse,
  onCloseDrawer,
}: {
  currentSection: string;
  onCollapse?: () => void;
  onCloseDrawer?: () => void;
}) {
  return (
    <div className="relative z-10 flex shrink-0 items-center gap-2 border-b border-sidebar-border/60 px-3 py-3.5 sm:px-4">
      <Link
        to="/dashboard/overview"
        className="group/brand flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 no-underline text-inherit transition-colors hover:bg-muted/35"
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-border/55 bg-gradient-to-br from-card to-muted/35 shadow-md ring-1 ring-white/[0.05] transition-all duration-300 group-hover/brand:border-primary/25 group-hover/brand:shadow-lg">
          <img src="/logo.jpg" alt="Syra" className="h-full w-full object-cover" draggable={false} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50">Syra</p>
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground/75">{currentSection}</p>
        </div>
      </Link>
      {onCloseDrawer ? <DrawerDismissButton label="Close menu" onClick={onCloseDrawer} /> : null}
      {onCollapse ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          onClick={onCollapse}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

export function SidebarConnectFooter({ links }: { links: readonly SidebarConnectLink[] }) {
  return (
    <div className="relative z-10 shrink-0 border-t border-sidebar-border/60 bg-gradient-to-t from-muted/20 to-transparent px-3 py-4 sm:px-4">
      <p className="px-1 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/45">
        Connect
      </p>
      <div className="flex flex-wrap gap-1">
        {links.map(({ href, icon: Icon, ariaLabel, title, openInNewTab = true }) => (
          <a
            key={href}
            href={href}
            {...(openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent",
              "text-muted-foreground transition-all duration-200",
              "hover:border-border/50 hover:bg-background/70 hover:text-foreground hover:shadow-sm",
            )}
            title={title ?? ariaLabel}
            aria-label={ariaLabel}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </a>
        ))}
      </div>
    </div>
  );
}

export function SidebarNavShell({ children }: { children: ReactNode }) {
  return (
    <div className={cn(SIDEBAR_SHELL, "supports-[backdrop-filter]:bg-sidebar/98")}>
      <SidebarAmbientGlow />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
