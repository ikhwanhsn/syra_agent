import { useEffect, useMemo, useRef, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  Anchor,
  Banknote,
  BarChart3,
  Calculator,
  Columns3,
  Crown,
  LayoutDashboard,
  LineChart,
  Lock,
  Menu,
  Moon,
  Newspaper,
  PanelLeft,
  PanelLeftClose,
  Repeat,
  Star,
  Sun,
  Wallet,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/utils";
import { RiseDashboardProvider } from "@/lib/RiseDashboardContext";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SidebarNavLink, SidebarSectionLabel } from "./SidebarPrimitives";
import { WalletProvider } from "@/lib/WalletContext";
import { ConnectWalletButton } from "./ConnectWalletButton";

const sidebarItems = {
  workspace: [{ to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true }],
  markets: [
    { to: "/dashboard/markets", label: "Screener", icon: BarChart3 },
    { to: "/dashboard/floor-scanner", label: "Floor scanner", icon: Anchor },
    { to: "/dashboard/compare", label: "Compare", icon: Columns3 },
    { to: "/dashboard/watchlist", label: "Watchlist", icon: Star },
  ],
  tradeTools: [
    { to: "/dashboard/quote", label: "Quote calculator", icon: Calculator },
    { to: "/dashboard/borrow", label: "Borrow simulator", icon: Banknote },
    { to: "/dashboard/dca", label: "DCA simulator", icon: Repeat },
  ],
  insights: [
    { to: "/dashboard/activity", label: "Activity feed", icon: Activity, isPremium: true },
    { to: "/dashboard/whales", label: "Whales", icon: Crown, isPremium: true },
    { to: "/dashboard/signals", label: "Signals", icon: LineChart, isPremium: true },
    { to: "/dashboard/news", label: "News", icon: Newspaper, isPremium: true },
  ],
  wallet: [{ to: "/dashboard/wallet", label: "Wallet lookup", icon: Wallet }],
};

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Overview";
  if (pathname.endsWith("/markets")) return "Market screener";
  if (pathname.endsWith("/wallet")) return "Wallet lookup";
  if (pathname.endsWith("/quote")) return "Quote calculator";
  if (pathname.endsWith("/borrow")) return "Borrow simulator";
  if (pathname.endsWith("/watchlist")) return "Watchlist";
  if (pathname.endsWith("/compare")) return "Compare markets";
  if (pathname.endsWith("/floor-scanner")) return "Floor scanner";
  if (pathname.endsWith("/activity")) return "Activity feed";
  if (pathname.endsWith("/whales")) return "Whales";
  if (pathname.endsWith("/signals")) return "Signals";
  if (pathname.endsWith("/dca")) return "DCA simulator";
  if (pathname.endsWith("/news")) return "News";
  return "Dashboard";
}

function SidebarContent({
  currentSection,
  onNavigate,
  onCollapse,
}: {
  currentSection: string;
  onNavigate?: () => void;
  onCollapse?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-sidebar-border/90 px-3 py-3">
        <Link to="/dashboard" className="min-w-0 flex-1 rounded-lg p-1 hover:bg-muted/30" onClick={onNavigate}>
          <BrandMark compact className="max-w-full" />
        </Link>
        {onCollapse ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted/40"
            onClick={onCollapse}
            title="Hide sidebar"
            aria-label="Hide sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3" onClick={onNavigate}>
        <div className="space-y-1 px-1">
          <SidebarSectionLabel>Workspace</SidebarSectionLabel>
          {sidebarItems.workspace.map((item) => (
            <SidebarNavLink key={item.to} to={item.to} icon={item.icon} end={item.end}>
              {item.label}
            </SidebarNavLink>
          ))}
          <SidebarSectionLabel>Markets</SidebarSectionLabel>
          {sidebarItems.markets.map((item) => (
            <SidebarNavLink key={item.to} to={item.to} icon={item.icon}>
              {item.label}
            </SidebarNavLink>
          ))}
          <SidebarSectionLabel>Trade Tools</SidebarSectionLabel>
          {sidebarItems.tradeTools.map((item) => (
            <SidebarNavLink key={item.to} to={item.to} icon={item.icon}>
              {item.label}
            </SidebarNavLink>
          ))}
          <SidebarSectionLabel>Insights</SidebarSectionLabel>
          {sidebarItems.insights.map((item) => (
            <SidebarNavLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              rightAdornment={item.isPremium ? <Lock className="h-3.5 w-3.5" aria-hidden /> : null}
            >
              {item.label}
            </SidebarNavLink>
          ))}
          <SidebarSectionLabel>Wallet</SidebarSectionLabel>
          {sidebarItems.wallet.map((item) => (
            <SidebarNavLink key={item.to} to={item.to} icon={item.icon}>
              {item.label}
            </SidebarNavLink>
          ))}
        </div>
      </nav>
    </>
  );
}

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);
  const isDark = resolvedTheme !== "light";
  const contentShell = "mx-auto w-full min-w-0 max-w-[1440px] px-3.5 min-[400px]:px-4 sm:px-5 lg:px-6";

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <WalletProvider>
      <RiseDashboardProvider>
        <div className="h-dvh min-h-dvh max-h-dvh overflow-hidden bg-background">
          <div className="flex h-full min-h-0 min-w-0">
          {sidebarOpen ? (
            <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
          ) : null}
          <aside
            className={cn(
              "fixed left-0 top-0 z-40 h-dvh w-[min(290px,calc(100vw-1rem))] border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:hidden",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <SidebarContent currentSection={pageTitle} onNavigate={() => setSidebarOpen(false)} />
          </aside>

          <div className="hidden min-h-0 flex-1 lg:flex">
            <ResizablePanelGroup direction="horizontal" autoSaveId="uof-dashboard-sidebar-v1">
              <ResizablePanel
                ref={sidebarPanelRef}
                defaultSize={22}
                minSize={16}
                maxSize={32}
                collapsible
                collapsedSize={0}
                onCollapse={() => setSidebarCollapsed(true)}
                onExpand={() => setSidebarCollapsed(false)}
                className={cn(sidebarCollapsed && "min-w-0")}
              >
                <aside className="flex h-full min-w-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
                  <SidebarContent currentSection={pageTitle} onCollapse={() => sidebarPanelRef.current?.collapse()} />
                </aside>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-border" />
              <ResizablePanel defaultSize={78} minSize={68} className="min-w-0">
                <div className="flex h-full min-h-0 min-w-0 flex-col">
                  <header className="flex min-h-12 flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-b border-border/80 bg-background/85 px-3 py-2 backdrop-blur-xl sm:px-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("hidden h-9 w-9 lg:inline-flex", sidebarCollapsed ? "opacity-100" : "opacity-0")}
                        onClick={() => sidebarPanelRef.current?.expand()}
                        title="Show sidebar"
                        aria-label="Show sidebar"
                      >
                        <PanelLeft className="h-4 w-4" />
                      </Button>
                      <p className="truncate text-sm font-semibold text-foreground sm:text-base">{pageTitle}</p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        title={isDark ? "Light mode" : "Dark mode"}
                        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                      >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                      <ConnectWalletButton />
                    </div>
                  </header>
                  <div className="min-h-0 flex-1 overflow-auto overflow-x-hidden">
                    <div className={cn(contentShell, "py-4 sm:py-5 lg:py-6")}>
                      <Outlet />
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:hidden">
            <header className="flex min-h-12 items-center justify-between gap-2 border-b border-border/80 bg-background/85 px-2 py-2 backdrop-blur-xl">
              <div className="flex min-w-0 items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSidebarOpen(true)}
                  title="Open menu"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <p className="truncate text-sm font-semibold text-foreground">{pageTitle}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  title={isDark ? "Light mode" : "Dark mode"}
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <ConnectWalletButton />
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-auto overflow-x-hidden">
              <div className={cn(contentShell, "py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]")}>
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
      </RiseDashboardProvider>
    </WalletProvider>
  );
}
