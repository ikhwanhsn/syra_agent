import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import type { ImperativePanelHandle } from "react-resizable-panels";
import {
  FlaskConical,
  Scale,
  Telescope,
  Moon,
  Sun,
  PanelLeft,
  Menu,
  Twitter,
  BookOpen,
  ExternalLink,
  LayoutDashboard,
  Bot,
  Settings2,
  Mail,
  Send,
  UsersRound,
  Droplets,
  Rocket,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletNav } from "@/components/chat/WalletNav";
import { AppTopNavLinks } from "@/components/chat/AppTopNavLinks";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { SIDEBAR_PANEL, MAIN_PANEL, SIDEBAR_AUTO_SAVE_ID } from "@/lib/layoutConstants";
import {
  SidebarBrandHeader,
  SidebarConnectFooter,
  SidebarExperimentsNav,
  SidebarIconRail,
  SidebarNavLink,
  SidebarNavShell,
  SidebarSectionLabel,
  type SidebarConnectLink,
  type SidebarExperimentItem,
} from "@/components/dashboard/SidebarPrimitives";
import { useWalletContext } from "@/contexts/WalletContext";
import { isInternalTeamMonitorWallet } from "@/constants/internalTeamMonitorWallet";
import { getInternalAgentMeta, isInternalAgentSlug } from "@/lib/internalAgentsCatalog";

const EXPERIMENT_NAV_ITEMS: readonly SidebarExperimentItem[] = [
  {
    id: "trading",
    label: "Trading agents",
    description: "Multi-agent spot trading",
    icon: FlaskConical,
    to: "/dashboard/trading-experiment",
    isActive: (pathname) => pathname.startsWith("/dashboard/trading-experiment"),
  },
  {
    id: "arbitrage",
    label: "Arbitrage",
    description: "Cross-venue spread scanner",
    icon: Scale,
    to: "/dashboard/arbitrage-experiment",
    isActive: (pathname) => pathname.startsWith("/dashboard/arbitrage-experiment"),
  },
  {
    id: "lp",
    label: "LP agents",
    description: "Meteora DLMM agents",
    icon: Droplets,
    to: "/dashboard/lp-experiment",
    isActive: (pathname) => pathname.startsWith("/dashboard/lp-experiment"),
  },
  {
    id: "pumpfun",
    label: "Pumpfun",
    description: "225-cell graduate sniper",
    icon: Rocket,
    to: "/dashboard/pumpfun-experiment",
    isActive: (pathname) => pathname.startsWith("/dashboard/pumpfun-experiment"),
  },
  {
    id: "rise",
    label: "Rise",
    description: "Vault borrow + dual sniper",
    icon: Crosshair,
    to: "/dashboard/rise-experiment",
    isActive: (pathname) => pathname.startsWith("/dashboard/rise-experiment"),
  },
];

function isAlphaIntelActive(pathname: string, _search: string): boolean {
  return pathname.startsWith("/dashboard/alpha");
}

/** Same community links as chat `Sidebar.tsx` footer. */
const SYRA_TELEGRAM = "https://t.me/syra_ai";
const SYRA_SUPPORT_EMAIL = "support@syraa.fun";

const CONNECT_LINKS: SidebarConnectLink[] = [
  { href: "https://x.com/syra_agent", icon: Twitter, ariaLabel: "Official X", title: "Official X" },
  { href: SYRA_TELEGRAM, icon: Send, ariaLabel: "Telegram community", title: "Telegram community" },
  { href: "https://docs.syraa.fun", icon: BookOpen, ariaLabel: "Docs", title: "Documentation" },
  {
    href: `mailto:${SYRA_SUPPORT_EMAIL}`,
    icon: Mail,
    ariaLabel: `Email ${SYRA_SUPPORT_EMAIL}`,
    title: `Email ${SYRA_SUPPORT_EMAIL}`,
    openInNewTab: false,
  },
  { href: "https://syraa.fun", icon: ExternalLink, ariaLabel: "Website", title: "Website" },
];

function dashboardPageTitle(pathname: string, search: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "dashboard") return "Overview";
  if (parts[1] === "trading-experiment" && parts[2] === "agent") return "Agent profile";
  if (parts[1] === "overview") return "Overview";
  if (parts[1] === "agents" && parts[2]) return "Agent detail";
  if (parts[1] === "agents") return "Agents";
  if (parts[1] === "agent-setup") return "Agent setup";
  if (parts[1] === "alpha" && parts[2] === "x" && parts[3]) return "Alpha · Intel";
  if (parts[1] === "alpha") return "Alpha";
  if (parts[1] === "pumpfun-experiment") return "Pumpfun experiment";
  if (parts[1] === "rise-experiment") return "Rise experiment";
  if (parts[1] === "trading-experiment") return "Trading experiment";
  if (parts[1] === "arbitrage-experiment") return "Arbitrage experiment";
  if (parts[1] === "lp-experiment") return "LP agent experiment";
  if (parts[1] === "internal-team-agents") {
    if (parts[2]) {
      const slug = parts[2];
      if (isInternalAgentSlug(slug)) {
        const meta = getInternalAgentMeta(slug);
        if (meta) return meta.name;
      }
      return "Internal agent";
    }
    return "Internal agents";
  }
  return "Overview";
}

interface DashboardSidebarContentProps {
  onNavigate?: () => void;
  showHeader?: boolean;
  currentSection?: string;
  onCollapse?: () => void;
  /** Mobile drawer: show close control in header */
  onCloseDrawer?: () => void;
}

function DashboardSidebarContent({
  onNavigate,
  showHeader = true,
  currentSection = "Overview",
  onCollapse,
  onCloseDrawer,
}: DashboardSidebarContentProps) {
  const { address } = useWalletContext();
  const showInternalTeamMonitor = isInternalTeamMonitorWallet(address);

  return (
    <SidebarNavShell>
      {showHeader ? (
        <SidebarBrandHeader
          currentSection={currentSection}
          onCollapse={onCollapse}
          onCloseDrawer={onCloseDrawer}
        />
      ) : null}
      <nav
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 scrollbar-thin"
        onClick={onNavigate}
      >
        <div className="space-y-0.5 px-1 pb-3 pt-2 sm:px-1.5">
          <SidebarSectionLabel>Workspace</SidebarSectionLabel>
          <div className="space-y-1">
            <SidebarNavLink to="/dashboard/overview" icon={LayoutDashboard} end>
              Overview
            </SidebarNavLink>
            <SidebarNavLink to="/dashboard/agents" icon={Bot} end>
              Agents
            </SidebarNavLink>
            <SidebarNavLink to="/dashboard/agent-setup" icon={Settings2} end>
              Agent setup
            </SidebarNavLink>
          </div>

          <SidebarSectionLabel>Intelligence</SidebarSectionLabel>
          <div className="space-y-1">
            <SidebarNavLink to="/dashboard/alpha" icon={Telescope} end matchActive={isAlphaIntelActive}>
              Alpha
            </SidebarNavLink>
          </div>

          <SidebarSectionLabel>Experiment</SidebarSectionLabel>
          <div className="space-y-1">
            <SidebarExperimentsNav items={EXPERIMENT_NAV_ITEMS} />
            {showInternalTeamMonitor ? (
              <SidebarNavLink to="/dashboard/internal-team-agents" icon={UsersRound}>
                Internal agents
              </SidebarNavLink>
            ) : null}
          </div>
        </div>
      </nav>
      <SidebarConnectFooter links={CONNECT_LINKS} />
    </SidebarNavShell>
  );
}

export default function DashboardLayout() {
  const location = useLocation();
  const { address } = useWalletContext();
  const showInternalTeamMonitor = isInternalTeamMonitorWallet(address);
  const [isDarkMode, setIsDarkMode] = useState(() => !document.documentElement.classList.contains("light"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  const pageTitle = dashboardPageTitle(location.pathname, location.search);

  const handleToggleSidebar = () => {
    if (sidebarCollapsed) {
      sidebarPanelRef.current?.expand();
    } else {
      setSidebarOpen(true);
    }
  };

  const topbar = (
    <header className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-b border-border/80 bg-background/85 backdrop-blur-xl backdrop-saturate-150 min-h-[52px] sm:min-h-0 shrink-0 pt-[max(0.25rem,env(safe-area-inset-top))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 shrink-0 touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9"
          onClick={() => setSidebarOpen(true)}
          title="Open menu"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9 shrink-0 hidden min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9", sidebarCollapsed && "lg:flex")}
          onClick={handleToggleSidebar}
          title="Expand sidebar"
          aria-label="Expand sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>
        <AppTopNavLinks />
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0 flex-wrap sm:flex-nowrap justify-end max-w-full">
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-9 w-9 shrink-0 lg:inline-flex"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? "Light mode" : "Dark mode"}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <WalletNav isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
      </div>
    </header>
  );

  const scrollableContent = (
    <div className="flex-1 min-h-0 min-w-0 overflow-auto overflow-x-hidden scrollbar-thin flex flex-col">
      <Outlet />
    </div>
  );

  return (
    <div className="h-dvh min-h-dvh max-h-dvh flex flex-col overflow-hidden bg-background min-h-0 overscroll-none">
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={cn(
            "fixed left-0 top-0 z-40 w-[min(280px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1rem))] max-w-[min(320px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1rem))] h-dvh max-h-dvh flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/92 transition-transform duration-300 ease-out safe-area-top safe-area-bottom overflow-x-hidden overflow-y-auto lg:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <DashboardSidebarContent
            onNavigate={() => setSidebarOpen(false)}
            showHeader={true}
            currentSection={pageTitle}
            onCloseDrawer={() => setSidebarOpen(false)}
          />
        </aside>

        <div className="hidden lg:flex flex-1 min-h-0 min-w-0">
          <ResizablePanelGroup
            direction="horizontal"
            autoSaveId={SIDEBAR_AUTO_SAVE_ID}
            className="h-full w-full"
          >
            <ResizablePanel
              ref={sidebarPanelRef}
              defaultSize={SIDEBAR_PANEL.defaultSize}
              minSize={SIDEBAR_PANEL.minSize}
              maxSize={SIDEBAR_PANEL.maxSize}
              collapsible
              collapsedSize={SIDEBAR_PANEL.collapsedSize}
              onCollapse={() => setSidebarCollapsed(true)}
              onExpand={() => setSidebarCollapsed(false)}
              className={cn(sidebarCollapsed && "min-w-[4.5rem]")}
            >
              <aside className="flex h-full min-h-0 min-w-0 flex-col bg-sidebar text-sidebar-foreground">
                {sidebarCollapsed ? (
                  <SidebarIconRail
                    experimentItems={EXPERIMENT_NAV_ITEMS}
                    showInternalTeamMonitor={showInternalTeamMonitor}
                    matchAlphaIntel={isAlphaIntelActive}
                  />
                ) : (
                  <DashboardSidebarContent
                    showHeader={true}
                    currentSection={pageTitle}
                    onCollapse={() => sidebarPanelRef.current?.collapse()}
                  />
                )}
              </aside>
            </ResizablePanel>
            {!sidebarCollapsed ? <ResizableHandle withHandle className="bg-border" /> : null}
            <ResizablePanel defaultSize={MAIN_PANEL.defaultSize} minSize={MAIN_PANEL.minSize} className="min-w-0">
              <div className="h-full flex flex-col min-h-0 min-w-0">
                {topbar}
                {scrollableContent}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <div className="flex-1 flex flex-col min-h-0 min-w-0 lg:hidden">
          {topbar}
          {scrollableContent}
        </div>
      </div>
    </div>
  );
}
