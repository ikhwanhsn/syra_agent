import { useState, useEffect } from "react";
import { useLocation } from "@/lib/navigation";
import type { ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
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
  SidebarMachineMoneyNav,
  SidebarMarketIntelNav,
  SidebarMobileDrawerHeader,
  SidebarNavLink,
  SidebarNavShell,
  SidebarTeamNav,
  INTERNAL_TEAM_SIDEBAR_BADGE,
} from "@/components/dashboard/SidebarPrimitives";
import { useWalletContext } from "@/contexts/WalletContext";
import { MachineMoneyPreviewProvider, useMachineMoneyPreview } from "@/contexts/MachineMoneyPreviewContext";
import { isAdminWallet } from "@/constants/adminWallet";
import { DASHBOARD_PILLAR_NAV, isPillarGated, MACHINE_MONEY_SOON_BADGE } from "@/lib/dashboardPillarNav";
import { DASHBOARD_MARKET_INTEL_NAV } from "@/lib/dashboardMarketIntelNav";
import { DASHBOARD_EXPERIMENT_NAV } from "@/lib/dashboardExperimentNav";
import { DASHBOARD_TEAM_NAV } from "@/lib/dashboardTeamNav";
import { dashboardPageTitle } from "@/lib/dashboardPageTitle";

interface DashboardSidebarContentProps {
  pageTitle: string;
  onNavigate?: () => void;
  onCollapse?: () => void;
  onCloseDrawer?: () => void;
}

function DashboardSidebarContent({
  pageTitle,
  onNavigate,
  onCollapse,
  onCloseDrawer,
}: DashboardSidebarContentProps) {
  const { address, connected } = useWalletContext();
  const showAdminDashboard = isAdminWallet(connected, address);
  const { machineMoneyUnlocked } = useMachineMoneyPreview();

  return (
    <SidebarNavShell>
      {onCloseDrawer ? (
        <SidebarMobileDrawerHeader onClose={onCloseDrawer} pageTitle={pageTitle} />
      ) : onCollapse ? (
        <SidebarCollapseHeader onCollapse={onCollapse} pageTitle={pageTitle} />
      ) : null}
      <nav
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
        onClick={onNavigate}
      >
        <div className="space-y-1 px-1 pb-3 pt-2 sm:px-1.5">
          <SidebarNavLink to="/overview" icon={LayoutDashboard} end>
            Overview
          </SidebarNavLink>

          <SidebarDivider className="my-2" />

          <SidebarMachineMoneyNav
            items={DASHBOARD_PILLAR_NAV.map((item) => ({
              id: item.id,
              label: item.label,
              description: item.description,
              icon: item.icon,
              to: item.to,
              isActive: item.isActive,
              badge: isPillarGated(item.id, machineMoneyUnlocked) ? MACHINE_MONEY_SOON_BADGE : undefined,
            }))}
          />

          <SidebarDivider className="my-2" />

          <SidebarMarketIntelNav items={DASHBOARD_MARKET_INTEL_NAV} />

          <SidebarDivider className="my-2" />

          {showAdminDashboard ? (
            <>
              <SidebarExperimentsNav
                items={DASHBOARD_EXPERIMENT_NAV}
                groupBadge={INTERNAL_TEAM_SIDEBAR_BADGE}
              />
              <SidebarTeamNav
                items={DASHBOARD_TEAM_NAV}
                groupBadge={INTERNAL_TEAM_SIDEBAR_BADGE}
              />
            </>
          ) : null}
        </div>
      </nav>
    </SidebarNavShell>
  );
}

export default function DashboardLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const { address, connected } = useWalletContext();
  const showAdminDashboard = isAdminWallet(connected, address);
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

  const scrollableContent = (
    <div
      data-dashboard-scroll-root
      className="flex-1 min-h-0 min-w-0 overflow-auto overflow-x-hidden scrollbar-thin flex flex-col"
    >
      {children}
    </div>
  );

  return (
    <MachineMoneyPreviewProvider>
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
              pageTitle={pageTitle}
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
                <DashboardSidebarContent
                  pageTitle={pageTitle}
                  onCollapse={() => setSidebarCollapsed(true)}
                />
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
                  showAdminDashboard={showAdminDashboard}
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
              {scrollableContent}
            </div>
          </div>

          <div className="flex flex-1 flex-col min-h-0 min-w-0 lg:hidden">
            {/* Mobile-only: open sidebar (page title lives in the drawer header). */}
            <header className="flex shrink-0 items-center gap-2 border-b border-border/80 bg-background/85 px-3 py-2 backdrop-blur-xl pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))]">
              <SidebarPanelToggle mode="menu" onClick={() => setSidebarOpen(true)} />
              <p className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground">
                {pageTitle}
              </p>
            </header>
            {scrollableContent}
          </div>
        </div>
      </div>
    </MachineMoneyPreviewProvider>
  );
}
