import { useState, useEffect } from "react";
import { useLocation } from "@/lib/navigation";
import type { ReactNode } from "react";
import {
  FlaskConical,
  Scale,
  Telescope,
  Droplets,
  Rocket,
  Crosshair,
  FileSearch,
  LayoutDashboard,
  UsersRound,
  TrendingUp,
  Search,
  Bitcoin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarPanelToggle } from "@/components/layout/SidebarPanelToggle";
import {
  DASHBOARD_SIDEBAR_COLLAPSED_WIDTH,
  DASHBOARD_SIDEBAR_TRANSITION,
  DASHBOARD_SIDEBAR_WIDTH,
} from "@/lib/layoutConstants";
import {
  SidebarCollapseHeader,
  SidebarDivider,
  SidebarExperimentsNav,
  SidebarIconRail,
  SidebarMobileDrawerHeader,
  SidebarNavLink,
  SidebarNavShell,
  type SidebarExperimentItem,
} from "@/components/dashboard/SidebarPrimitives";
import { useWalletContext } from "@/contexts/WalletContext";
import { isInternalTeamMonitorWallet } from "@/constants/internalTeamMonitorWallet";
import { INTERNAL_BASE_PATH } from "@/lib/internalRoutes";
import { getInternalAgentMeta, isInternalAgentSlug } from "@/lib/internalAgentsCatalog";

const EXPERIMENT_NAV_ITEMS: readonly SidebarExperimentItem[] = [
  {
    id: "trading",
    label: "Trading agents",
    description: "Multi-agent spot trading",
    icon: FlaskConical,
    to: "/trading-experiment",
    isActive: (pathname) => pathname.startsWith("/trading-experiment"),
  },
  {
    id: "arbitrage",
    label: "Arbitrage",
    description: "Cross-venue spread scanner",
    icon: Scale,
    to: "/arbitrage-experiment",
    isActive: (pathname) => pathname.startsWith("/arbitrage-experiment"),
  },
  {
    id: "lp",
    label: "LP agents",
    description: "Meteora DLMM agents",
    icon: Droplets,
    to: "/lp-experiment",
    isActive: (pathname) => pathname.startsWith("/lp-experiment"),
    badge: { label: "Beta" },
  },
  {
    id: "pumpfun",
    label: "Pumpfun",
    description: "225-cell graduate sniper",
    icon: Rocket,
    to: "/pumpfun-experiment",
    isActive: (pathname) => pathname.startsWith("/pumpfun-experiment"),
  },
  {
    id: "rise",
    label: "Rise",
    description: "Vault borrow + dual sniper",
    icon: Crosshair,
    to: "/rise-experiment",
    isActive: (pathname) => pathname.startsWith("/rise-experiment"),
  },
  {
    id: "spcx",
    label: "SpaceX IPO",
    description: "SPCX spread & venues",
    icon: TrendingUp,
    to: "/spcx",
    isActive: (pathname) => pathname.startsWith("/spcx"),
  },
];

function isAlphaIntelActive(pathname: string, _search: string): boolean {
  return pathname.startsWith("/alpha");
}

function dashboardPageTitle(pathname: string, search: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "about") return "About Syra";
  if (parts[0] === "trading-experiment" && parts[1] === "agent") return "Agent profile";
  if (parts[0] === "overview") return "Overview";
  if (parts[0] === "agents" && parts[1]) return "Agent detail";
  if (parts[0] === "agents") return "Agents";
  if (parts[0] === "agent-setup") return "Agent setup";
  if (parts[0] === "alpha" && parts[1] === "x" && parts[2]) return "Alpha · Intel";
  if (parts[0] === "alpha") return "Alpha";
  if (parts[0] === "assets" && parts[1]) return "Asset detail";
  if (parts[0] === "assets") return "Assets";
  if (parts[0] === "pumpfun") return "Pumpfun Alpha";
  if (parts[0] === "pumpfun-experiment") return "Pumpfun experiment";
  if (parts[0] === "rise-experiment") return "Rise experiment";
  if (parts[0] === "trading-experiment") return "Trading experiment";
  if (parts[0] === "arbitrage-experiment") return "Arbitrage experiment";
  if (parts[0] === "lp-experiment") return "LP agent experiment";
  if (parts[0] === "spcx") return "SpaceX IPO Agent";
  if (parts[0] === "btc") return "Bitcoin";
  if (parts[0] === "internal") {
    if (parts[1]) {
      const slug = parts[1];
      if (isInternalAgentSlug(slug)) {
        const meta = getInternalAgentMeta(slug);
        if (meta) return meta.name;
      }
      return "Internal agent";
    }
    return "Internal";
  }
  return "Overview";
}

interface DashboardSidebarContentProps {
  onNavigate?: () => void;
  onCollapse?: () => void;
  onCloseDrawer?: () => void;
}

function DashboardSidebarContent({
  onNavigate,
  onCollapse,
  onCloseDrawer,
}: DashboardSidebarContentProps) {
  const { address } = useWalletContext();
  const showInternalTeamMonitor = isInternalTeamMonitorWallet(address);

  return (
    <SidebarNavShell>
      {onCloseDrawer ? (
        <SidebarMobileDrawerHeader onClose={onCloseDrawer} />
      ) : onCollapse ? (
        <SidebarCollapseHeader onCollapse={onCollapse} />
      ) : null}
      <nav
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 scrollbar-thin"
        onClick={onNavigate}
      >
        <div className="space-y-1 px-1 pb-3 pt-2 sm:px-1.5">
          <SidebarNavLink to="/overview" icon={LayoutDashboard} end>
            Overview
          </SidebarNavLink>

          <SidebarDivider className="my-2" />

          <SidebarNavLink to="/alpha" icon={Telescope} end matchActive={isAlphaIntelActive}>
            Alpha
          </SidebarNavLink>
          <SidebarNavLink
            to="/assets"
            icon={FileSearch}
            end
            matchActive={(pathname) => pathname.startsWith("/assets")}
          >
            Assets
          </SidebarNavLink>
          <SidebarNavLink
            to="/pumpfun"
            icon={Search}
            end
            matchActive={(pathname) => pathname.startsWith("/pumpfun") && !pathname.startsWith("/pumpfun-experiment")}
          >
            Pumpfun Alpha
          </SidebarNavLink>
          <SidebarNavLink
            to="/btc"
            icon={Bitcoin}
            end
            matchActive={(pathname) => pathname.startsWith("/btc")}
          >
            Bitcoin
          </SidebarNavLink>

          <SidebarDivider className="my-2" />

          <SidebarExperimentsNav items={EXPERIMENT_NAV_ITEMS} />
          {showInternalTeamMonitor ? (
            <SidebarNavLink to={INTERNAL_BASE_PATH} icon={UsersRound}>
              Internal
            </SidebarNavLink>
          ) : null}
        </div>
      </nav>
    </SidebarNavShell>
  );
}

export default function DashboardLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const { address } = useWalletContext();
  const showInternalTeamMonitor = isInternalTeamMonitorWallet(address);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setIsDarkMode(!document.documentElement.classList.contains("light"));
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const pageTitle = dashboardPageTitle(location.pathname, location.search);
  const hideTopbarRule = location.pathname.startsWith("/pumpfun-experiment");

  const topbar = (
    <header
      className={cn(
        "flex shrink-0 items-center gap-3 bg-background/85 px-3 py-2.5 backdrop-blur-xl backdrop-saturate-150 sm:gap-4 sm:px-4 sm:py-3 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))]",
        !hideTopbarRule && "border-b border-border/80 shadow-[0_1px_0_0_hsl(var(--border)/0.5)]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <div className="flex shrink-0 items-center lg:hidden">
          <SidebarPanelToggle mode="menu" onClick={() => setSidebarOpen(true)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/55">
            Dashboard
          </p>
          <h1 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
            {pageTitle}
          </h1>
        </div>
      </div>
    </header>
  );

  const scrollableContent = (
    <div
      data-dashboard-scroll-root
      className="flex-1 min-h-0 min-w-0 overflow-auto overflow-x-hidden scrollbar-thin flex flex-col"
    >
      {children}
    </div>
  );

  return (
    <div className="h-dvh max-h-dvh flex flex-col overflow-hidden bg-background min-h-0 overscroll-none">
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* Mobile: dimmed backdrop */}
        <div
          aria-hidden={!sidebarOpen}
          className={cn(
            "fixed inset-x-0 bottom-0 top-[var(--syra-global-nav-height,3.5rem)] z-30 lg:hidden",
            "bg-black/45 backdrop-blur-[1px] transition-opacity",
            DASHBOARD_SIDEBAR_TRANSITION,
            sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Mobile: slide-in drawer */}
        <aside
          aria-hidden={!sidebarOpen}
          className={cn(
            "fixed left-0 z-40 flex flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/92 lg:hidden",
            "top-[var(--syra-global-nav-height,3.5rem)] h-[calc(100dvh-var(--syra-global-nav-height,3.5rem))]",
            "w-[min(280px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1rem))] max-w-[min(320px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1rem))]",
            "transition-[transform,box-shadow,visibility]",
            DASHBOARD_SIDEBAR_TRANSITION,
            sidebarOpen
              ? "visible translate-x-0 shadow-[4px_0_28px_-6px_rgba(0,0,0,0.22)] dark:shadow-[4px_0_36px_-8px_rgba(0,0,0,0.55)]"
              : "invisible -translate-x-full shadow-none",
          )}
        >
          <DashboardSidebarContent
            onNavigate={() => setSidebarOpen(false)}
            onCloseDrawer={() => setSidebarOpen(false)}
          />
        </aside>

        {/* Desktop: animated width + crossfade (matches agent chat sidebar) */}
        <div className="hidden h-full min-h-0 min-w-0 flex-1 lg:flex">
          <div
            aria-hidden={sidebarCollapsed}
            className={cn(
              "relative flex shrink-0 flex-col overflow-hidden border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/98",
              "transition-[width,opacity,border-color]",
              DASHBOARD_SIDEBAR_TRANSITION,
              sidebarCollapsed ? "border-transparent" : "opacity-100",
            )}
            style={{
              width: sidebarCollapsed ? DASHBOARD_SIDEBAR_COLLAPSED_WIDTH : DASHBOARD_SIDEBAR_WIDTH,
            }}
          >
            <div
              className={cn(
                "absolute inset-y-0 left-0 z-0 flex flex-col overflow-hidden",
                "transition-[opacity,transform,visibility]",
                DASHBOARD_SIDEBAR_TRANSITION,
                sidebarCollapsed
                  ? "pointer-events-none invisible -translate-x-3 opacity-0"
                  : "visible translate-x-0 opacity-100",
              )}
              style={{ width: DASHBOARD_SIDEBAR_WIDTH }}
            >
              <DashboardSidebarContent onCollapse={() => setSidebarCollapsed(true)} />
            </div>

            <div
              className={cn(
                "absolute inset-0 z-[1] flex flex-col overflow-hidden",
                "transition-[opacity,transform,visibility]",
                DASHBOARD_SIDEBAR_TRANSITION,
                sidebarCollapsed
                  ? "visible translate-x-0 opacity-100"
                  : "pointer-events-none invisible translate-x-3 opacity-0",
              )}
            >
              <SidebarIconRail
                experimentItems={EXPERIMENT_NAV_ITEMS}
                showInternalTeamMonitor={showInternalTeamMonitor}
                matchAlphaIntel={isAlphaIntelActive}
                onExpand={() => setSidebarCollapsed(false)}
              />
            </div>
          </div>

          <div
            className={cn(
              "flex h-full min-h-0 min-w-0 flex-1 flex-col transition-[flex-grow]",
              DASHBOARD_SIDEBAR_TRANSITION,
            )}
          >
            {topbar}
            {scrollableContent}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 min-w-0 lg:hidden">
          {topbar}
          {scrollableContent}
        </div>
      </div>
    </div>
  );
}
