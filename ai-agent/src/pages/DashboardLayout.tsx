import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, NavLink } from "react-router-dom";
import type { ImperativePanelHandle } from "react-resizable-panels";
import {
  LayoutDashboard,
  Trophy,
  FlaskConical,
  Scale,
  ArrowLeft,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Twitter,
  BookOpen,
  ExternalLink,
  FileText,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletNav } from "@/components/chat/WalletNav";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { SIDEBAR_PANEL, MAIN_PANEL, SIDEBAR_AUTO_SAVE_ID } from "@/lib/layoutConstants";

const MARKETPLACE_SECTIONS = [
  { path: "prompts", label: "Prompts", icon: FileText },
  { path: "agents", label: "Agents", icon: Bot },
] as const;

const DASHBOARD_SECTIONS = [
  { path: "leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "trading-experiment", label: "Trading experiment", icon: FlaskConical },
  { path: "arbitrage-experiment", label: "Arbitrage experiment", icon: Scale },
] as const;

const MARKETPLACE_PAGE_TITLES: Record<string, string> = {
  prompts: "Prompts",
  agents: "Agents",
};

const CONNECT_LINKS = [
  { href: "https://x.com/syra_agent", icon: Twitter, label: "X" },
  { href: "https://docs.syraa.fun", icon: BookOpen, label: "Docs" },
  { href: "https://syraa.fun", icon: ExternalLink, label: "Website" },
];

function dashboardPageTitle(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "dashboard") return "Overview";
  if (parts[1] === "marketplace") {
    const key = parts[2] ?? "prompts";
    return MARKETPLACE_PAGE_TITLES[key] ?? "Prompts";
  }
  if (parts[1] === "trading-experiment" && parts[2] === "agent") return "Agent profile";
  if (parts[1] === "overview") return "Overview";
  if (parts[1] === "leaderboard") return "Leaderboard";
  if (parts[1] === "trading-experiment") return "Trading experiment";
  if (parts[1] === "arbitrage-experiment") return "Arbitrage experiment";
  return "Overview";
}

interface DashboardSidebarContentProps {
  onNavigate?: () => void;
  showHeader?: boolean;
  currentSection?: string;
  onCollapse?: () => void;
}

function DashboardSidebarContent({
  onNavigate,
  showHeader = true,
  currentSection = "Overview",
  onCollapse,
}: DashboardSidebarContentProps) {
  return (
    <>
      {showHeader && (
        <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-border shrink-0">
          <Link
            to="/dashboard/overview"
            className="flex items-center gap-2 flex-1 min-w-0 no-underline text-inherit hover:opacity-90 transition-opacity"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-card shrink-0 border border-border">
              <LayoutDashboard className="w-5 h-5 text-primary" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-foreground truncate">Dashboard</h1>
              <p className="text-xs text-muted-foreground truncate">{currentSection}</p>
            </div>
          </Link>
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onCollapse}
              title="Hide sidebar"
              aria-label="Hide sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
      <nav className="flex-1 overflow-y-auto min-h-0 px-2" onClick={onNavigate}>
        <div className="p-2 sm:p-3 space-y-1">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium",
              "text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            )}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back to agent
          </Link>
          <div className="pt-3 pb-0.5">
            <p className="px-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Marketplace</p>
          </div>
          <div className="space-y-0.5">
            {MARKETPLACE_SECTIONS.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={`/dashboard/marketplace/${path}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium text-left transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
          <div className="pt-3 pb-0.5">
            <p className="px-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sections</p>
          </div>
          <div className="space-y-0.5">
            {DASHBOARD_SECTIONS.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={`/dashboard/${path}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium text-left transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <div className="p-2 sm:p-3 border-t border-border shrink-0">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Connect</p>
        <div className="flex flex-wrap gap-1 px-1">
          {CONNECT_LINKS.map(({ href, icon: Icon, label: ariaLabel }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title={ariaLabel}
              aria-label={ariaLabel}
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const location = useLocation();
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

  const pageTitle = dashboardPageTitle(location.pathname);

  const handleToggleSidebar = () => {
    if (sidebarCollapsed) {
      sidebarPanelRef.current?.expand();
    } else {
      setSidebarOpen(true);
    }
  };

  const topbar = (
    <header className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-b border-border bg-background/80 backdrop-blur-xl min-h-[52px] sm:min-h-0 shrink-0 pt-[max(0.25rem,env(safe-area-inset-top))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
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
          title="Show sidebar"
          aria-label="Show sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1 sm:flex-none">
          <h1 className="text-sm font-semibold text-foreground truncate">Dashboard</h1>
          <p className="text-xs text-muted-foreground truncate">{pageTitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0 flex-wrap sm:flex-nowrap justify-end max-w-full">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? "Light mode" : "Dark mode"}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <WalletNav />
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
            "fixed left-0 top-0 z-40 w-[min(280px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1rem))] max-w-[min(320px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1rem))] h-dvh max-h-dvh flex flex-col border-r border-border bg-card transition-transform duration-300 ease-out safe-area-top safe-area-bottom overflow-x-hidden overflow-y-auto lg:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <DashboardSidebarContent
            onNavigate={() => setSidebarOpen(false)}
            showHeader={true}
            currentSection={pageTitle}
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
              collapsedSize={0}
              onCollapse={() => setSidebarCollapsed(true)}
              onExpand={() => setSidebarCollapsed(false)}
              className={cn(sidebarCollapsed && "min-w-0")}
            >
              <aside className="flex flex-col h-full min-w-0 bg-card border-r border-border">
                <DashboardSidebarContent
                  showHeader={true}
                  currentSection={pageTitle}
                  onCollapse={() => sidebarPanelRef.current?.collapse()}
                />
              </aside>
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border" />
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
