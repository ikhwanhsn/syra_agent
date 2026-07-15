import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { NavLink, useLocation, useNavLinkActive } from "@/lib/navigation";
import {
  ChevronRight,
  FileSearch,
  FlaskConical,
  Layers,
  LayoutDashboard,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DrawerDismissButton } from "@/components/ui/drawer-dismiss-button";
import { SidebarPanelToggle } from "@/components/layout/SidebarPanelToggle";
import { cn } from "@/lib/utils";
import { INTERNAL_BASE_PATH } from "@/lib/internalRoutes";
import { useMachineMoneyPreview } from "@/contexts/MachineMoneyPreviewContext";
import { DASHBOARD_PILLAR_NAV, isPillarGated, MACHINE_MONEY_SOON_BADGE } from "@/lib/dashboardPillarNav";
import { DASHBOARD_MARKET_INTEL_NAV } from "@/lib/dashboardMarketIntelNav";
import { DASHBOARD_EXPERIMENT_NAV } from "@/lib/dashboardExperimentNav";

export const INTERNAL_TEAM_SIDEBAR_BADGE = {
  label: "Team",
  className:
    "border-violet-500/35 bg-violet-500/10 text-violet-800 dark:text-violet-300",
} as const;

const EXPERIMENTS_STORAGE_KEY = "syra.dashboard.experimentsOpen";
const MACHINE_MONEY_STORAGE_KEY = "syra.dashboard.machineMoneyOpen";
const MARKET_INTEL_STORAGE_KEY = "syra.dashboard.marketIntelOpen";

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

export function SidebarDivider({ className }: { className?: string }) {
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
  const { isActive: routerActive } = useNavLinkActive(to, end);
  const isActive = matchActive ? matchActive(pathname, search) : routerActive;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          end={end}
          className="flex outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar rounded-xl"
        >
          <span className={navItemClasses(isActive, true)}>
            {isActive ? <ActiveIndicator compact /> : null}
            <span className={navIconClasses(isActive, true)}>
              <Icon className="h-[17px] w-[17px]" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
            </span>
            <span className="sr-only">{label}</span>
          </span>
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
  showAdminDashboard,
  onExpand,
}: {
  showAdminDashboard: boolean;
  onExpand: () => void;
}) {
  const { pathname } = useLocation();
  const { machineMoneyUnlocked } = useMachineMoneyPreview();
  const marketIntelActive = DASHBOARD_MARKET_INTEL_NAV.some((item) => item.isActive(pathname));
  const experimentsActive = DASHBOARD_EXPERIMENT_NAV.some((item) => item.isActive(pathname));

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(SIDEBAR_SHELL, "items-center supports-[backdrop-filter]:bg-sidebar/98")}>
        <SidebarAmbientGlow />

        <SidebarExpandRailHeader onExpand={onExpand} />

        <nav className="relative z-10 flex min-h-0 flex-1 flex-col items-center gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-3 scrollbar-thin">
          <SidebarIconNavLink to="/overview" icon={LayoutDashboard} label="Overview" end />
          <SidebarDivider className="my-2 w-8" />
          <div
            className={cn(
              "mb-1 flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
              DASHBOARD_PILLAR_NAV.some((item) => item.isActive(pathname))
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/40",
            )}
            aria-hidden
          >
            <Layers className="h-3.5 w-3.5" strokeWidth={2} />
          </div>
          {DASHBOARD_PILLAR_NAV.map((item) => (
            <SidebarIconNavLink
              key={item.id}
              to={item.to}
              icon={item.icon}
              label={
                isPillarGated(item.id, machineMoneyUnlocked)
                  ? `${item.label} (${MACHINE_MONEY_SOON_BADGE.label})`
                  : item.label
              }
              end
              matchActive={item.isActive}
            />
          ))}
          <SidebarDivider className="my-2 w-8" />
          <div
            className={cn(
              "mb-1 flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
              marketIntelActive ? "bg-primary/10 text-primary" : "text-muted-foreground/40",
            )}
            aria-hidden
          >
            <FileSearch className="h-3.5 w-3.5" strokeWidth={2} />
          </div>
          {DASHBOARD_MARKET_INTEL_NAV.map((item) => (
            <SidebarIconNavLink
              key={item.id}
              to={item.to}
              icon={item.icon}
              label={item.label}
              end
              matchActive={item.isActive}
            />
          ))}
          {showAdminDashboard ? (
            <>
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
              {DASHBOARD_EXPERIMENT_NAV.map((item) => (
                <SidebarIconNavLink
                  key={item.id}
                  to={item.to}
                  icon={item.icon}
                  label={item.badge ? `${item.label} (${item.badge.label})` : item.label}
                  matchActive={item.isActive}
                />
              ))}
              <SidebarDivider className="my-2 w-8" />
              <SidebarIconNavLink
                to={INTERNAL_BASE_PATH}
                icon={UsersRound}
                label={`Internal (${INTERNAL_TEAM_SIDEBAR_BADGE.label})`}
              />
            </>
          ) : null}
        </nav>
      </div>
    </TooltipProvider>
  );
}

export type SidebarNavBadge = {
  label: string;
  className?: string;
};

export function SidebarNavLink({
  to,
  icon: Icon,
  children,
  end,
  matchActive,
  badge,
}: {
  to: string;
  icon: ComponentType<LucideProps>;
  children: ReactNode;
  end?: boolean;
  matchActive?: ActiveMatcher;
  badge?: SidebarNavBadge;
}) {
  const { pathname, search } = useLocation();
  const { isActive: routerActive } = useNavLinkActive(to, end);
  const isActive = matchActive ? matchActive(pathname, search) : routerActive;

  return (
    <NavLink
      to={to}
      end={end}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
    >
      <span className={navItemClasses(isActive)}>
        {isActive ? <ActiveIndicator /> : null}
        <span className={navIconClasses(isActive)}>
          <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-tight">
          <span className="flex items-center gap-1.5">
            <span className="truncate">{children}</span>
            {badge ? <SidebarNavBadge badge={badge} /> : null}
          </span>
        </span>
      </span>
    </NavLink>
  );
}

export type SidebarExperimentBadge = SidebarNavBadge;

export type SidebarCollapsibleNavItem = {
  id: string;
  label: string;
  description?: string;
  icon: ComponentType<LucideProps>;
  to: string;
  isActive: (pathname: string, search?: string) => boolean;
  badge?: SidebarNavBadge;
};

/** @deprecated Use SidebarCollapsibleNavItem */
export type SidebarExperimentItem = SidebarCollapsibleNavItem;

function SidebarNavBadge({ badge }: { badge: SidebarNavBadge }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md border border-amber-500/35 bg-amber-500/10 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300",
        badge.className,
      )}
    >
      {badge.label}
    </span>
  );
}

export function SidebarCollapsibleNav({
  items,
  groupBadge,
  storageKey,
  title,
  icon: GroupIcon,
  openHint,
  closedHint,
  defaultOpen = false,
}: {
  items: readonly SidebarCollapsibleNavItem[];
  groupBadge?: SidebarNavBadge;
  storageKey: string;
  title: string;
  icon: ComponentType<LucideProps>;
  openHint: string;
  closedHint: string;
  /** Used when no localStorage preference exists yet. */
  defaultOpen?: boolean;
}) {
  const { pathname, search } = useLocation();
  const childActive = items.some((item) => item.isActive(pathname, search));

  const [open, setOpen] = useState(() => {
    if (childActive) return true;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "1") return true;
      if (stored === "0") return false;
    } catch {
      /* private mode */
    }
    return defaultOpen;
  });

  useEffect(() => {
    if (childActive) {
      setOpen(true);
      return;
    }
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "1") {
        setOpen(true);
      } else if (stored === "0") {
        setOpen(false);
      } else {
        setOpen(defaultOpen);
      }
    } catch {
      setOpen(defaultOpen);
    }
  }, [childActive, storageKey, defaultOpen]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* private mode */
      }
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
          <GroupIcon className="h-4 w-4" strokeWidth={childActive ? 2.25 : 2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold tracking-tight">{title}</span>
            {groupBadge ? <SidebarNavBadge badge={groupBadge} /> : null}
          </span>
          <span className="mt-0.5 block truncate text-[10px] font-medium text-muted-foreground/70">
            {open ? openHint : closedHint}
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
                    <span className="flex items-center gap-1.5">
                      <span className="block truncate text-[12px] font-semibold leading-tight tracking-tight">
                        {item.label}
                      </span>
                      {item.badge ? <SidebarNavBadge badge={item.badge} /> : null}
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

export function SidebarMachineMoneyNav({
  items,
}: {
  items: readonly SidebarCollapsibleNavItem[];
}) {
  return (
    <SidebarCollapsibleNav
      items={items}
      storageKey={MACHINE_MONEY_STORAGE_KEY}
      title="Machine Money"
      icon={Layers}
      openHint={`${items.length} pillars`}
      closedHint="Expand pillars"
      defaultOpen
    />
  );
}

export function SidebarMarketIntelNav({
  items,
}: {
  items: readonly SidebarCollapsibleNavItem[];
}) {
  return (
    <SidebarCollapsibleNav
      items={items}
      storageKey={MARKET_INTEL_STORAGE_KEY}
      title="Market Intel"
      icon={FileSearch}
      openHint={`${items.length} desks`}
      closedHint="Expand desks"
      defaultOpen
    />
  );
}

export function SidebarExperimentsNav({
  items,
  groupBadge,
}: {
  items: readonly SidebarCollapsibleNavItem[];
  groupBadge?: SidebarNavBadge;
}) {
  return (
    <SidebarCollapsibleNav
      items={items}
      groupBadge={groupBadge}
      storageKey={EXPERIMENTS_STORAGE_KEY}
      title="Experiment"
      icon={FlaskConical}
      openHint={`${items.length} trading desks`}
      closedHint="Expand desks"
    />
  );
}

export type SidebarConnectLink = {
  href: string;
  icon: LucideIcon;
  ariaLabel: string;
  title?: string;
  openInNewTab?: boolean;
};

type SidebarNavHeaderProps = {
  onDismiss: () => void;
  /** Mobile drawer uses close; desktop expanded uses panel collapse */
  dismissVariant: "close" | "collapse";
};

/** Top chrome for dashboard sidebar — label balances the dismiss control. */
function SidebarNavHeader({ onDismiss, dismissVariant }: SidebarNavHeaderProps) {
  return (
    <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-sidebar-border/60 bg-gradient-to-b from-muted/20 to-transparent px-3 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span
          className={cn(
            navIconClasses(false),
            "h-8 w-8 shrink-0 shadow-none ring-0",
          )}
          aria-hidden
        >
          <LayoutDashboard className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50">
            Dashboard
          </p>
          <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">
            Navigation
          </p>
        </div>
      </div>
      {dismissVariant === "close" ? (
        <DrawerDismissButton label="Close menu" onClick={onDismiss} className="h-10 w-10 shrink-0" />
      ) : (
        <SidebarPanelToggle
          mode="collapse"
          layout="icon"
          onClick={onDismiss}
          className="shrink-0 shadow-none"
        />
      )}
    </div>
  );
}

export function SidebarMobileDrawerHeader({ onClose }: { onClose: () => void }) {
  return <SidebarNavHeader onDismiss={onClose} dismissVariant="close" />;
}

export function SidebarCollapseHeader({ onCollapse }: { onCollapse: () => void }) {
  return <SidebarNavHeader onDismiss={onCollapse} dismissVariant="collapse" />;
}

/** Collapsed icon rail — compact expand control at top. */
export function SidebarExpandRailHeader({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="relative z-10 flex w-full shrink-0 justify-center border-b border-sidebar-border/60 bg-gradient-to-b from-muted/20 to-transparent px-2 py-2.5">
      <SidebarPanelToggle mode="expand" layout="rail" onClick={onExpand} />
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
